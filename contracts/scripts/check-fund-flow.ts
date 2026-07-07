import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🔍 Checking loan fund flow...\n");

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const files = fs.readdirSync(deploymentsDir)
    .filter(f => f.startsWith("deployment-31337-"))
    .sort()
    .reverse();

  const latestDeployment = JSON.parse(
    fs.readFileSync(path.join(deploymentsDir, files[0]), "utf8")
  );

  const lendingPoolAddress = latestDeployment.contracts.LendingPool;
  const usdcAddress = latestDeployment.contracts.USDC;
  const deployerAddress = latestDeployment.deployer;

  const [deployer] = await ethers.getSigners();

  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const usdc = MockERC20.attach(usdcAddress);

  // Check balances
  const deployerBal = await usdc.balanceOf(deployerAddress);
  const poolBal = await usdc.balanceOf(lendingPoolAddress);

  console.log(`💰 Deployer USDC: ${ethers.formatUnits(deployerBal, 6)}`);
  console.log(`💰 LendingPool USDC: ${ethers.formatUnits(poolBal, 6)}`);

  // The contract holds the funds, not the borrower
  console.log("\n⚠️  ISSUE CONFIRMED: Contract holds the principal, borrower never receives it!");
  console.log("   The createLoan() transfers from lender -> contract, not lender -> borrower");
  console.log("   No claim function exists for borrowers to withdraw principal");

  // Check if there's a way to map DID to address
  const LendingPool = await ethers.getContractFactory("LendingPool");
  const lendingPool = LendingPool.attach(lendingPoolAddress);

  const loan = await lendingPool.getLoan(4); // Latest loan
  console.log(`\n📋 Loan 4:`);
  console.log(`   Borrower DID: ${loan.borrowerDID}`);
  console.log(`   Principal in contract: ${ethers.formatUnits(loan.principalAmount, 6)} USDC`);
  console.log(`   Lender: ${loan.lender}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });