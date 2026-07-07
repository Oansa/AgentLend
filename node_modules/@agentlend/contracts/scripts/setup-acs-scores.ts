import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🔧 Setting up ACS scores for test DIDs...\n");

  // Get the latest deployment
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const files = fs.readdirSync(deploymentsDir)
    .filter(f => f.startsWith("deployment-31337-"))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.error("❌ No deployment found. Run deploy first.");
    process.exit(1);
  }

  const latestDeployment = JSON.parse(
    fs.readFileSync(path.join(deploymentsDir, files[0]), "utf8")
  );

  const acsOracleAddress = latestDeployment.contracts.ACSOracle;
  const oracleSigner = latestDeployment.configuration.oracleSigner;

  console.log(`📋 Using deployment: ${files[0]}`);
  console.log(`📋 ACSOracle: ${acsOracleAddress}`);
  console.log(`📋 Oracle Signer: ${oracleSigner}\n`);

  // Get the oracle signer (first Hardhat account)
  const [deployer] = await ethers.getSigners();

  // Verify deployer is the oracle signer
  if (deployer.address.toLowerCase() !== oracleSigner.toLowerCase()) {
    console.error(`❌ Deployer (${deployer.address}) is not the oracle signer (${oracleSigner})`);
    console.error("   Run this script with the oracle signer's private key");
    process.exit(1);
  }

  // Connect to ACSOracle
  const ACSOracle = await ethers.getContractFactory("ACSOracle");
  const acsOracle = ACSOracle.attach(acsOracleAddress);

  // Test DIDs to set scores for
  const testDIDs = [
    "did:croo:agent001",
    "did:croo:agent002",
    "did:croo:agent003",
    "did:croo:borrower123",
    "did:croo:testagent",
    "did:croo:alice",
    "did:croo:bob",
  ];

  // Set a good credit score (750) for each DID
  const score = 750; // Good credit score (300-900 range)
  const block = await ethers.provider.getBlock("latest");
  // Use a timestamp 30 seconds in the past to ensure it's <= block.timestamp when mined
  const timestamp = (block?.timestamp || Math.floor(Date.now() / 1000)) - 30;
  const expiry = timestamp + 600; // 10 minutes validity (SCORE_VALIDITY)

  console.log(`📊 Setting score: ${score} for ${testDIDs.length} test DIDs`);
  console.log(`⏰ Timestamp: ${timestamp}`);
  console.log(`⏰ Expiry: ${expiry} (${expiry - timestamp}s validity)\n`);

  for (const did of testDIDs) {
    const didBytes32 = ethers.keccak256(ethers.toUtf8Bytes(did));

    // Create the digest for signing (matching ACSOracle.computeDigest)
    const digest = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
      ["bytes32", "uint256", "uint256", "uint256"],
      [didBytes32, score, timestamp, expiry]
    ));

    // Sign with the oracle signer
    const signature = await deployer.signMessage(ethers.getBytes(digest));

    console.log(`Setting score for ${did} (${didBytes32})...`);

    try {
      const tx = await acsOracle.setScore(didBytes32, score, timestamp, expiry, signature);
      await tx.wait();
      console.log(`  ✅ Success! Tx: ${tx.hash}`);
    } catch (error: any) {
      if (error.message.includes("Stale score")) {
        console.log(`  ⚠️  Score already exists and is newer, skipping`);
      } else {
        console.error(`  ❌ Failed: ${error.message}`);
      }
    }
  }

  // Verify scores were set
  console.log("\n🔍 Verifying scores...");
  for (const did of testDIDs) {
    const didBytes32 = ethers.keccak256(ethers.toUtf8Bytes(did));
    const [scoreResult, timestampResult, expiryResult] = await acsOracle.getScore(didBytes32);

    if (scoreResult > 0) {
      console.log(`  ✅ ${did}: score=${scoreResult}, expiry=${expiryResult} (valid: ${expiryResult > timestamp})`);
    } else {
      console.log(`  ❌ ${did}: No valid score`);
    }
  }

  console.log("\n✅ ACS scores setup complete!");
  console.log("\n📝 You can now create loans with these DIDs:");
  testDIDs.forEach(did => console.log(`   - ${did}`));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });