const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deployer:', deployer.address);

  // Check ETH balance
  const ethBal = await ethers.provider.getBalance(deployer.address);
  console.log('ETH balance:', ethers.formatEther(ethBal));

  // WETH on Base Sepolia
  const wethAddr = '0x4200000000000000000000000000000000000006';
  const wethAbi = [
    'function balanceOf(address) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function deposit() payable returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)'
  ];

  const weth = new ethers.Contract(wethAddr, wethAbi, deployer);
  const [wethBal, wethDec, wethSym] = await Promise.all([
    weth.balanceOf(deployer.address),
    weth.decimals(),
    weth.symbol()
  ]);
  console.log(`${wethSym} balance:`, ethers.formatUnits(wethBal, wethDec));

  // Wrap 0.1 ETH to WETH
  console.log('\n🔄 Wrapping 0.1 ETH to WETH...');
  const wrapAmount = ethers.parseEther('0.1');
  const wrapTx = await weth.deposit({ value: wrapAmount });
  console.log('Tx hash:', wrapTx.hash);
  await wrapTx.wait();
  console.log('✅ Wrapped!');

  // Check new WETH balance
  const newWethBal = await weth.balanceOf(deployer.address);
  console.log(`${wethSym} balance:`, ethers.formatUnits(newWethBal, wethDec));

  // Now try to fund lending pool with WETH
  const lendingPoolAddr = '0xF3d04FFce06d4b6801882e7ECC25715dec6B4FE2';
  const collateralManagerAddr = '0x76040edf9c212E6AC06a841AC00873483deC1C5c';

  console.log('\n📤 Transferring 0.05 WETH to LendingPool...');
  const transferAmount = ethers.parseEther('0.05');
  const transferTx = await weth.transfer(lendingPoolAddr, transferAmount);
  console.log('Tx hash:', transferTx.hash);
  await transferTx.wait();
  console.log('✅ Transferred!');

  // Check LendingPool WETH balance
  const poolWethBal = await weth.balanceOf(lendingPoolAddr);
  console.log(`LendingPool ${wethSym} balance:`, ethers.formatUnits(poolWethBal, wethDec));

  // Approve CollateralManager
  console.log('\n✅ Approving CollateralManager...');
  const approveTx = await weth.connect(deployer).approve(collateralManagerAddr, transferAmount);
  console.log('Tx hash:', approveTx.hash);
  await approveTx.wait();
  console.log('✅ Approved!');

  // Check allowance
  const allowance = await weth.allowance(lendingPoolAddr, collateralManagerAddr);
  console.log('Allowance:', ethers.formatUnits(allowance, wethDec));

  // Check USDC
  const usdcAddr = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
  const usdcAbi = ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)', 'function symbol() view returns (string)', 'function transfer(address to, uint256 amount) returns (bool)'];

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
}

main().catch(console.error);