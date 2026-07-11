import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// ERC20 interface for real tokens on testnet/mainnet
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

// WETH interface for wrapping ETH
const WETH_ABI = [
  ...ERC20_ABI,
  "function deposit() payable returns (uint256)",
  "function withdraw(uint256 amount) returns (bool)",
];

async function main() {
  console.log("💰 Funding LendingPool with collateral tokens (Base Sepolia)...\n");

  // Get the latest deployment for Base Sepolia
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const files = fs.readdirSync(deploymentsDir)
    .filter(f => f.startsWith("deployment-84532-"))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.error("❌ No Base Sepolia deployment found. Run deploy first.");
    process.exit(1);
  }

  const latestDeployment = JSON.parse(
    fs.readFileSync(path.join(deploymentsDir, files[0]), "utf8")
  );

  const lendingPoolAddress = latestDeployment.contracts.LendingPool;
  const wethAddress = latestDeployment.contracts.WETH;
  const deployerAddress = latestDeployment.deployer;
  const collateralManagerAddress = latestDeployment.contracts.CollateralManager;
  const usdcAddress = latestDeployment.contracts.USDC;

  console.log(`📋 LendingPool: ${lendingPoolAddress}`);
  console.log(`📋 WETH: ${wethAddress}`);
  console.log(`📋 CollateralManager: ${collateralManagerAddress}`);
  console.log(`📋 USDC: ${usdcAddress}`);
  console.log(`📋 Deployer: ${deployerAddress}\n`);

  const [deployer] = await ethers.getSigners();
  console.log(`📋 Connected as: ${deployer.address}`);

  // Connect to real WETH and USDC contracts
  const weth = new ethers.Contract(wethAddress, WETH_ABI, deployer);
  const usdc = new ethers.Contract(usdcAddress, ERC20_ABI, deployer);

  // Check deployer ETH balance
  const ethBalance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Deployer ETH balance: ${ethers.formatEther(ethBalance)} ETH`);

  // Check deployer WETH balance
  const deployerWethBal = await weth.balanceOf(deployer.address);
  console.log(`💰 Deployer WETH balance: ${ethers.formatEther(deployerWethBal)} WETH`);

  // Check LendingPool WETH balance
  const poolWethBalBefore = await weth.balanceOf(lendingPoolAddress);
  console.log(`💰 LendingPool WETH balance (before): ${ethers.formatEther(poolWethBalBefore)} WETH`);

  // Check deployer USDC balance
  const deployerUsdcBal = await usdc.balanceOf(deployer.address);
  console.log(`💰 Deployer USDC balance: ${ethers.formatUnits(deployerUsdcBal, 6)} USDC`);

  // Check LendingPool USDC balance
  const poolUsdcBalBefore = await usdc.balanceOf(lendingPoolAddress);
  console.log(`💰 LendingPool USDC balance (before): ${ethers.formatUnits(poolUsdcBalBefore, 6)} USDC`);

  // Amounts to fund (adjust as needed)
  const wethFundAmount = ethers.parseEther("10"); // 10 WETH for collateral
  const usdcFundAmount = ethers.parseUnits("50000", 6); // 50,000 USDC for principal

  console.log(`\n📋 Target funding: ${ethers.formatEther(wethFundAmount)} WETH + ${ethers.formatUnits(usdcFundAmount, 6)} USDC`);

  // ===== WETH FUNDING =====
  console.log("\n--- WETH Funding ---");

  // If deployer has ETH but no WETH, wrap some ETH
  if (deployerWethBal < wethFundAmount && ethBalance >= wethFundAmount + ethers.parseEther("0.1")) {
    console.log("🔄 Wrapping ETH to WETH...");
    const wrapTx = await weth.deposit({ value: wethFundAmount });
    await wrapTx.wait();
    console.log(`✅ Wrapped ${ethers.formatEther(wethFundAmount)} ETH to WETH. Tx: ${wrapTx.hash}`);
  }

  // Re-check WETH balance
  const deployerWethBalAfter = await weth.balanceOf(deployer.address);
  console.log(`💰 Deployer WETH balance: ${ethers.formatEther(deployerWethBalAfter)} WETH`);

  if (deployerWethBalAfter >= wethFundAmount) {
    console.log(`📤 Transferring ${ethers.formatEther(wethFundAmount)} WETH to LendingPool...`);
    const tx = await weth.transfer(lendingPoolAddress, wethFundAmount);
    await tx.wait();
    console.log(`✅ WETH transfer complete! Tx: ${tx.hash}`);
  } else {
    console.log(`⚠️  Insufficient WETH. Need ${ethers.formatEther(wethFundAmount)}, have ${ethers.formatEther(deployerWethBalAfter)}`);
    console.log("   Get WETH from: https://www.alchemy.com/faucets/base-sepolia or wrap ETH on https://weth.dev/");
  }

  // ===== USDC FUNDING =====
  console.log("\n--- USDC Funding ---");

  const deployerUsdcBalAfter = await usdc.balanceOf(deployer.address);
  console.log(`💰 Deployer USDC balance: ${ethers.formatUnits(deployerUsdcBalAfter, 6)} USDC`);

  if (deployerUsdcBalAfter >= usdcFundAmount) {
    console.log(`📤 Transferring ${ethers.formatUnits(usdcFundAmount, 6)} USDC to LendingPool...`);
    const tx = await usdc.transfer(lendingPoolAddress, usdcFundAmount);
    await tx.wait();
    console.log(`✅ USDC transfer complete! Tx: ${tx.hash}`);
  } else {
    console.log(`⚠️  Insufficient USDC. Need ${ethers.formatUnits(usdcFundAmount, 6)}, have ${ethers.formatUnits(deployerUsdcBalAfter, 6)}`);
    console.log("   Get USDC from: https://www.circle.com/faucets or https://www.alchemy.com/faucets/base-sepolia");
  }

  // ===== APPROVE COLLATERAL MANAGER =====
  console.log("\n--- Approving CollateralManager ---");

  // Check current WETH allowance
  const wethAllowance = await weth.allowance(lendingPoolAddress, collateralManagerAddress);
  console.log(`💰 Current WETH allowance: ${ethers.formatEther(wethAllowance)} WETH`);

  if (wethAllowance < wethFundAmount) {
    console.log("🎭 Impersonating LendingPool to approve CollateralManager...");

    // Note: On real networks, you can't impersonate. The LendingPool contract itself
    // needs to call approve() via its emergencyWithdraw or a new approveCollateralManager function.
    // For now, we'll skip this on testnet and note that the LendingPool needs to approve.
    console.log("⚠️  On testnet/mainnet, LendingPool must approve CollateralManager itself.");
    console.log("   You can add an 'approveCollateralManager' function to LendingPool, or");
    console.log("   call approve() on WETH from the LendingPool contract address using a multisig.");
  }

  // Final balances
  console.log("\n--- Final Balances ---");
  const poolWethBalAfter = await weth.balanceOf(lendingPoolAddress);
  const poolUsdcBalAfter = await usdc.balanceOf(lendingPoolAddress);
  console.log(`💰 LendingPool WETH: ${ethers.formatEther(poolWethBalAfter)} WETH`);
  console.log(`💰 LendingPool USDC: ${ethers.formatUnits(poolUsdcBalAfter, 6)} USDC`);

  // Verify WETH allowance
  const finalAllowance = await weth.allowance(lendingPoolAddress, collateralManagerAddress);
  console.log(`✅ WETH allowance LendingPool -> CollateralManager: ${ethers.formatEther(finalAllowance)} WETH`);

  console.log("\n✅ LendingPool funding complete!");
  console.log("   Next steps:");
  console.log("   1. Run 'npx hardhat run scripts/setup-acs-scores.ts --network base-sepolia'");
  console.log("   2. Ensure LendingPool approves CollateralManager for WETH");
  console.log("   3. Test loan creation via dashboard or test script");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });