import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("💰 Funding LendingPool with collateral tokens...\n");

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
  const wethAddress = latestDeployment.contracts.WETH;
  const deployerAddress = latestDeployment.deployer;
  const collateralManagerAddress = latestDeployment.contracts.CollateralManager;

  console.log(`📋 LendingPool: ${lendingPoolAddress}`);
  console.log(`📋 WETH: ${wethAddress}`);
  console.log(`📋 CollateralManager: ${collateralManagerAddress}`);
  console.log(`📋 Deployer: ${deployerAddress}\n`);

  const [deployer] = await ethers.getSigners();

  // Connect to WETH
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const weth = MockERC20.attach(wethAddress);

  // Check deployer balance
  const deployerBalance = await weth.balanceOf(deployer.address);
  console.log(`💰 Deployer WETH balance: ${ethers.formatEther(deployerBalance)} WETH`);

  // Check LendingPool balance
  const poolBalanceBefore = await weth.balanceOf(lendingPoolAddress);
  console.log(`💰 LendingPool WETH balance (before): ${ethers.formatEther(poolBalanceBefore)} WETH`);

  // Mint more WETH to deployer if needed
  if (deployerBalance < ethers.parseEther("100")) {
    console.log("🔄 Minting more WETH to deployer...");
    await weth.mint(deployer.address, ethers.parseEther("1000"));
    console.log("✅ Minted 1000 WETH");
  }

  // Transfer 100 WETH to LendingPool for collateral
  const fundAmount = ethers.parseEther("100");
  console.log(`\n📤 Transferring ${ethers.formatEther(fundAmount)} WETH to LendingPool...`);
  const tx = await weth.transfer(lendingPoolAddress, fundAmount);
  await tx.wait();
  console.log(`✅ Transfer complete! Tx: ${tx.hash}`);

  // Impersonate LendingPool to approve CollateralManager
  console.log(`\n🎭 Impersonating LendingPool to approve CollateralManager...`);
  await ethers.provider.send("hardhat_impersonateAccount", [lendingPoolAddress]);

  // Fund the LendingPool with ETH for gas
  await ethers.provider.send("hardhat_setBalance", [
    lendingPoolAddress,
    "0x1000000000000000000" // 1 ETH
  ]);

  const lendingPoolSigner = await ethers.getSigner(lendingPoolAddress);

  // Approve CollateralManager to spend WETH from LendingPool
  const approveCmTx = await weth.connect(lendingPoolSigner).approve(collateralManagerAddress, fundAmount);
  await approveCmTx.wait();
  console.log(`✅ Approval complete! Tx: ${approveCmTx.hash}`);

  // Stop impersonation
  await ethers.provider.send("hardhat_stopImpersonatingAccount", [lendingPoolAddress]);

  // Check balances after
  const poolBalanceAfter = await weth.balanceOf(lendingPoolAddress);
  console.log(`\n💰 LendingPool WETH balance (after): ${ethers.formatEther(poolBalanceAfter)} WETH`);

  // Also fund with USDC if needed (for principal)
  const usdcAddress = latestDeployment.contracts.USDC;
  const usdc = MockERC20.attach(usdcAddress);
  const usdcPoolBalance = await usdc.balanceOf(lendingPoolAddress);
  console.log(`\n💰 LendingPool USDC balance: ${ethers.formatUnits(usdcPoolBalance, 6)} USDC`);

  if (usdcPoolBalance < ethers.parseUnits("100000", 6)) {
    console.log("🔄 Minting USDC to deployer and transferring to LendingPool...");
    await usdc.mint(deployer.address, ethers.parseUnits("1000000", 6));
    const usdcTx = await usdc.transfer(lendingPoolAddress, ethers.parseUnits("100000", 6));
    await usdcTx.wait();
    console.log("✅ LendingPool funded with 100,000 USDC");
  }

  // Verify WETH allowance
  const allowance = await weth.allowance(lendingPoolAddress, collateralManagerAddress);
  console.log(`\n✅ WETH allowance LendingPool -> CollateralManager: ${ethers.formatEther(allowance)} WETH`);

  console.log("\n✅ LendingPool funded successfully!");
  console.log("   You can now create loans using createLoan()");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });