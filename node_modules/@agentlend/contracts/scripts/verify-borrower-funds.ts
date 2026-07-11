import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🔍 Checking borrower received funds...\n");

  // Get the latest deployment for Base Sepolia
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const files = fs.readdirSync(deploymentsDir)
    .filter(f => f.startsWith("deployment-84532-"))
    .sort()
    .reverse();

  const latestDeployment = JSON.parse(
    fs.readFileSync(path.join(deploymentsDir, files[0]), "utf8")
  );

  const lendingPoolAddress = latestDeployment.contracts.LendingPool;
  const usdcAddress = latestDeployment.contracts.USDC;
  const deployerAddress = latestDeployment.deployer;
  const borrowerAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

  const [deployer] = await ethers.getSigners();

  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const usdc = MockERC20.attach(usdcAddress);

  // Check balances
  const deployerBal = await usdc.balanceOf(deployerAddress);
  const poolBal = await usdc.balanceOf(lendingPoolAddress);
  const borrowerBal = await usdc.balanceOf(borrowerAddress);

  console.log(`💰 Deployer USDC: ${ethers.formatUnits(deployerBal, 6)}`);
  console.log(`💰 LendingPool USDC: ${ethers.formatUnits(poolBal, 6)}`);
  console.log(`💰 Borrower USDC: ${ethers.formatUnits(borrowerBal, 6)}`);

  // Also check with the lending pool
  const LendingPool = await ethers.getContractFactory("LendingPool");
  const lendingPool = LendingPool.attach(lendingPoolAddress);

  const loan = await lendingPool.getLoan(1);
  console.log(`\n📋 Loan 1:`);
  console.log(`   Borrower DID: ${loan.borrowerDID}`);
  console.log(`   Principal: ${ethers.formatUnits(loan.principalAmount, 6)} USDC`);
  console.log(`   Lender: ${loan.lender}`);

  // Check if borrower address is stored
  const storedBorrowerAddr = await lendingPool.getBorrowerAddress(loan.borrowerDID);
  console.log(`   Stored Borrower Address: ${storedBorrowerAddr}`);

  console.log("\n✅ VERIFICATION:");
  console.log(`   Deployer sent: 1,500 USDC`);
  console.log(`   Borrower received: ${ethers.formatUnits(borrowerBal, 6)} USDC`);
  console.log(`   Contract holds: ${ethers.formatUnits(poolBal, 6)} USDC`);

  if (borrowerBal >= ethers.parseUnits("1500", 6)) {
    console.log("\n🎉 SUCCESS: Borrower received the full principal!");
  } else {
    console.log("\n❌ ISSUE: Borrower did not receive funds");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });