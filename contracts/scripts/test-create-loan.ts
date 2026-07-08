import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🧪 Testing loan creation...\n");

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

  const lendingPoolAddress = latestDeployment.contracts.LendingPool;
  const collateralManagerAddress = latestDeployment.contracts.CollateralManager;
  const wethAddress = latestDeployment.contracts.WETH;
  const usdcAddress = latestDeployment.contracts.USDC;
  const deployerAddress = latestDeployment.deployer;

  console.log(`📋 LendingPool: ${lendingPoolAddress}`);
  console.log(`📋 WETH: ${wethAddress}`);
  console.log(`📋 USDC: ${usdcAddress}`);
  console.log(`📋 Deployer: ${deployerAddress}\n`);

  const [deployer, borrower] = await ethers.getSigners();

  // Connect to contracts
  const LendingPool = await ethers.getContractFactory("LendingPool");
  const lendingPool = LendingPool.attach(lendingPoolAddress);

  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const usdc = MockERC20.attach(usdcAddress);
  const weth = MockERC20.attach(wethAddress);

  // Test borrower DID
  const borrowerDID = ethers.keccak256(ethers.toUtf8Bytes("did:croo:agent001"));
  const borrowerAddress = borrower.address;

  // Loan parameters
  const principalAmount = ethers.parseUnits("1500", 6); // 1,500 USDC
  const interestRateBps = 1250; // 12.5% APR = 1250 bps
  const duration = 90 * 24 * 60 * 60; // 90 days in seconds
  const collateralToken = wethAddress;

  console.log("📝 Loan parameters:");
  console.log(`   Borrower DID: did:croo:agent001 (${borrowerDID})`);
  console.log(`   Borrower Address: ${borrowerAddress}`);
  console.log(`   Principal: ${ethers.formatUnits(principalAmount, 6)} USDC`);
  console.log(`   Interest Rate: ${interestRateBps} bps (${interestRateBps / 100}% APR)`);
  console.log(`   Duration: ${duration / (24 * 60 * 60)} days`);
  console.log(`   Collateral Token: WETH (${wethAddress})\n`);

  // Mint WETH to borrower
  console.log("\n💰 Minting WETH to borrower...");
  const mintTx = await weth.mint(borrowerAddress, ethers.parseEther("10"));
  await mintTx.wait();
  console.log(`   Minted 10 WETH to borrower`);

  // Check balances
  const deployerUsdcBal = await usdc.balanceOf(deployerAddress);
  const borrowerWethBal = await weth.balanceOf(borrowerAddress);
  const poolUsdcBal = await usdc.balanceOf(lendingPoolAddress);
  const poolWethBal = await weth.balanceOf(lendingPoolAddress);

  console.log("💰 Balances before:");
  console.log(`   Deployer USDC: ${ethers.formatUnits(deployerUsdcBal, 6)}`);
  console.log(`   Borrower WETH: ${ethers.formatEther(borrowerWethBal)}`);
  console.log(`   LendingPool USDC: ${ethers.formatUnits(poolUsdcBal, 6)}`);
  console.log(`   LendingPool WETH: ${ethers.formatEther(poolWethBal)}`);

  // Check ACS score
  const ACSOracle = await ethers.getContractFactory("ACSOracle");
  const acsOracle = ACSOracle.attach(latestDeployment.contracts.ACSOracle);
  const [score, timestamp, expiry] = await acsOracle.getScore(borrowerDID);
  console.log(`\n📊 ACS Score for borrower: ${score} (expiry: ${expiry}, valid: ${expiry > Math.floor(Date.now() / 1000)})`);

  // Calculate required collateral
  const CollateralManager = await ethers.getContractFactory("CollateralManager");
  const collateralManager = CollateralManager.attach(collateralManagerAddress);
  const requiredCollateral = await collateralManager.calculateRequiredCollateral(principalAmount, score);
  console.log(`🔒 Required collateral: ${ethers.formatEther(requiredCollateral)} WETH`);

  // Approve LendingPool to spend USDC (from deployer)
  console.log("\n✅ Approving LendingPool to spend USDC (from deployer)...");
  const approveUsdcTx = await usdc.approve(lendingPoolAddress, principalAmount);
  await approveUsdcTx.wait();
  console.log(`   Approved USDC! Tx: ${approveUsdcTx.hash}`);

  // Approve LendingPool to spend WETH (from borrower) - LendingPool calls depositCollateral which pulls from msg.sender (LendingPool)
  console.log("\n✅ Approving LendingPool to spend WETH (from borrower)...");
  const approveWethTx = await weth.connect(borrower).approve(lendingPoolAddress, requiredCollateral);
  await approveWethTx.wait();
  console.log(`   Approved WETH! Tx: ${approveWethTx.hash}`);

  // Create loan (called by deployer, but borrower is the borrowerAddress)
  console.log("\n🚀 Creating loan...");
  const tx = await lendingPool.createLoan(
    borrowerDID,
    borrowerAddress,
    principalAmount,
    1250, // 12.5% APR
    90 * 24 * 60 * 60, // 90 days
    collateralToken
  );
  console.log(`   Tx sent: ${tx.hash}`);

  const receipt = await tx.wait();
  console.log(`   ✅ Confirmed in block ${receipt?.blockNumber}`);

  // Get loan ID from event
  const loanCreatedEvent = receipt?.logs
    .map((log: any) => {
      try {
        return lendingPool.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((event: any) => event?.name === "LoanCreated");

  const loanId = loanCreatedEvent?.args?.loanId?.toString() || "unknown";
  console.log(`\n🎉 Loan created successfully!`);
  console.log(`   Loan ID: ${loanId}`);

  // Verify loan details
  const loan = await lendingPool.getLoan(loanId);
  console.log("\n📋 Loan details:");
  console.log(`   ID: ${loan.id}`);
  console.log(`   Borrower DID: ${loan.borrowerDID}`);
  console.log(`   Lender: ${loan.lender}`);
  console.log(`   Principal: ${ethers.formatUnits(loan.principalAmount, 6)} USDC`);
  console.log(`   Interest Rate: ${loan.interestRateBps} bps`);
  console.log(`   Maturity: ${new Date(Number(loan.maturity) * 1000).toISOString()}`);
  console.log(`   Collateral Token: ${loan.collateralToken}`);
  console.log(`   Collateral Amount: ${ethers.formatEther(loan.collateralAmount)} WETH`);
  console.log(`   Status: ${["Active", "Repaid", "Liquidated", "Defaulted"][Number(loan.status)]}`);

  // Check outstanding
  const outstanding = await lendingPool.getOutstanding(loanId);
  console.log(`   Outstanding: ${ethers.formatUnits(outstanding, 6)} USDC`);

  // Check collateral balance
  const collateralBal = await collateralManager.getCollateralBalance(borrowerDID, wethAddress);
  console.log(`   Collateral balance: ${ethers.formatEther(collateralBal)} WETH`);

  console.log("\n✅ Loan creation test PASSED!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });