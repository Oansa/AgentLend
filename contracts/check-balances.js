const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deployer:', deployer.address);

  // Check ETH balance
  const ethBal = await ethers.provider.getBalance(deployer.address);
  console.log('ETH balance:', ethers.formatEther(ethBal));

  // USDC on Base Sepolia - try different address format
  const usdcAddr = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
  const usdcAbi = ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)', 'function symbol() view returns (string)'];

  try {
    const usdc = new ethers.Contract(usdcAddr, usdcAbi, ethers.provider);
    const [usdcBal, usdcDec, usdcSym] = await Promise.all([
      usdc.balanceOf(deployer.address),
      usdc.decimals(),
      usdc.symbol()
    ]);
    console.log(`${usdcSym} balance:`, ethers.formatUnits(usdcBal, usdcDec));
  } catch (e) {
    console.log('USDC error:', e.message);
  }

  // WETH on Base Sepolia
  const wethAddr = '0x4200000000000000000000000000000000000006';
  const wethAbi = ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)', 'function symbol() view returns (string)'];

  try {
    const weth = new ethers.Contract(wethAddr, wethAbi, ethers.provider);
    const [wethBal, wethDec, wethSym] = await Promise.all([
      weth.balanceOf(deployer.address),
      weth.decimals(),
      weth.symbol()
    ]);
    console.log(`${wethSym} balance:`, ethers.formatUnits(wethBal, wethDec));
  } catch (e) {
    console.log('WETH error:', e.message);
  }
}

main().catch(console.error);