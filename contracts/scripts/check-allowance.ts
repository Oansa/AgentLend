// Check USDC allowance for LendingPool
import { ethers } from "hardhat";

async function main() {
  const USDC_ADDRESS = "0x158d291D8b47F056751cfF47d1eEcd19FDF9B6f8";
  const LENDING_POOL_ADDRESS = "0xa4E00CB342B36eC9fDc4B50b3d527c3643D4C49e";
  const OWNER_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);

  // Check current allowance
  const allowance = await usdc.allowance(OWNER_ADDRESS, LENDING_POOL_ADDRESS);
  console.log(`USDC Allowance for LendingPool: ${ethers.formatUnits(allowance, 6)} USDC`);

  // Check USDC balance
  const balance = await usdc.balanceOf(OWNER_ADDRESS);
  console.log(`USDC Balance: ${ethers.formatUnits(balance, 6)} USDC`);

  // Check if WETH is active in CollateralManager
  const COLLATERAL_MANAGER_ADDRESS = "0x9849832a1d8274aaeDb1112ad9686413461e7101";
  const collateralManager = await ethers.getContractAt("CollateralManager", COLLATERAL_MANAGER_ADDRESS);

  const WETH_ADDRESS = "0x325c8Df4CFb5B068675AFF8f62aA668D1dEc3C4B";
  const OLD_WETH_ADDRESS = "0xdc64a140aa3e981100a9beca4e685f962f0cf6c9";

  const wethConfig = await collateralManager.collateralTokens(WETH_ADDRESS);
  const oldWethConfig = await collateralManager.collateralTokens(OLD_WETH_ADDRESS);

  console.log(`\nCollateralManager WETH (${WETH_ADDRESS}):`);
  console.log(`  Active: ${wethConfig.active}`);
  console.log(`  Decimals: ${wethConfig.decimals}`);

  console.log(`\nCollateralManager OLD WETH (${OLD_WETH_ADDRESS}):`);
  console.log(`  Active: ${oldWethConfig.active}`);

  // Check ACS score for testagent
  const ACS_ORACLE_ADDRESS = "0xF342E904702b1D021F03f519D6D9614916b03f37";
  const acsOracle = await ethers.getContractAt("ACSOracle", ACS_ORACLE_ADDRESS);

  const testAgentDID = ethers.keccak256(ethers.toUtf8Bytes("did:croo:testagent"));
  const [score, timestamp, expiry] = await acsOracle.getScore(testAgentDID);
  const currentBlock = await ethers.provider.getBlock("latest");
  const currentTime = currentBlock?.timestamp || 0;

  console.log(`\nACS Score for did:croo:testagent:`);
  console.log(`  Score: ${score}`);
  console.log(`  Timestamp: ${timestamp}`);
  console.log(`  Expiry: ${expiry}`);
  console.log(`  Current time: ${currentTime}`);
  console.log(`  Valid: ${score > 0 && expiry > currentTime}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });