import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Deploying AgentLend Protocol to CROO Network...\n");

  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);
  console.log(`Account balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // Configuration
  const BASE_TOKEN = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC on Base Sepolia
  const ORACLE_SIGNER = deployer.address; // In production, use a dedicated oracle signer

  // 1. Deploy ACS Oracle
  console.log("📝 Deploying ACSOracle...");
  const ACSOracle = await ethers.getContractFactory("ACSOracle");
  const acsOracle = await ACSOracle.deploy(ORACLE_SIGNER);
  await acsOracle.waitForDeployment();
  const acsOracleAddress = await acsOracle.getAddress();
  console.log(`✅ ACSOracle deployed to: ${acsOracleAddress}\n`);

  // 2. Deploy Collateral Manager
  console.log("📝 Deploying CollateralManager...");
  const CollateralManager = await ethers.getContractFactory("CollateralManager");
  const collateralManager = await CollateralManager.deploy();
  await collateralManager.waitForDeployment();
  const collateralManagerAddress = await collateralManager.getAddress();
  console.log(`✅ CollateralManager deployed to: ${collateralManagerAddress}\n`);

  // 3. Deploy Lending Pool
  console.log("📝 Deploying LendingPool...");
  const LendingPool = await ethers.getContractFactory("LendingPool");
  const lendingPool = await LendingPool.deploy(BASE_TOKEN, acsOracleAddress, collateralManagerAddress);
  await lendingPool.waitForDeployment();
  const lendingPoolAddress = await lendingPool.getAddress();
  console.log(`✅ LendingPool deployed to: ${lendingPoolAddress}\n`);

  // 4. Configure Collateral Manager with Lending Pool
  console.log("⚙️ Configuring CollateralManager with LendingPool...");
  await collateralManager.setLendingPool(lendingPoolAddress);
  console.log("✅ LendingPool set in CollateralManager\n");

  // 5. Add supported collateral tokens (example: WETH, cbETH)
  // These would be actual token addresses on Base Sepolia
  const WETH_SEPOLIA = "0x4200000000000000000000000000000000000006"; // WETH on Base Sepolia
  const CBETH_SEPOLIA = "0x..."; // cbETH on Base Sepolia (placeholder)

  console.log("⚙️ Adding supported collateral tokens...");
  await collateralManager.setCollateralToken(WETH_SEPOLIA, true);
  console.log(`✅ Added WETH (${WETH_SEPOLIA}) as collateral token`);

  // 6. Verify ACS Oracle has correct signer
  console.log("\n🔍 Verifying deployments...");
  const oracleSigner = await acsOracle.oracleSigner();
  console.log(`ACSOracle signer: ${oracleSigner}`);

  const poolLendingPool = await collateralManager.lendingPool();
  console.log(`CollateralManager lendingPool: ${poolLendingPool}`);

  const poolBaseToken = await lendingPool.baseToken();
  console.log(`LendingPool baseToken: ${poolBaseToken}`);

  // 7. Save deployment addresses
  const deployment = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      ACSOracle: acsOracleAddress,
      CollateralManager: collateralManagerAddress,
      LendingPool: lendingPoolAddress,
      BaseToken: BASE_TOKEN,
    },
    configuration: {
      oracleSigner: ORACLE_SIGNER,
      collateralTokens: [WETH_SEPOLIA],
    },
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `deployment-${deployment.chainId}-${Date.now()}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));
  console.log(`\n💾 Deployment saved to: ${deploymentFile}`);

  console.log("\n✅ AgentLend Protocol deployed successfully!");
  console.log("\n📋 Summary:");
  console.log(`   ACSOracle: ${acsOracleAddress}`);
  console.log(`   CollateralManager: ${collateralManagerAddress}`);
  console.log(`   LendingPool: ${lendingPoolAddress}`);
  console.log(`   Base Token (USDC): ${BASE_TOKEN}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });