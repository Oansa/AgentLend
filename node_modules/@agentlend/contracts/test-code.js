const { ethers } = require('hardhat');

async function main() {
  const provider = ethers.provider;
  const code = await provider.getCode('0x0165878A594ca255338adfa4d48449f69242Eb8F');
  console.log('WETH code length:', code.length);
  const code2 = await provider.getCode('0x5FbDB2315678afecb367f032d93F642f64180aa3');
  console.log('USDC code length:', code2.length);

  // Also check LendingPool
  const code3 = await provider.getCode('0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9');
  console.log('LendingPool code length:', code3.length);

  // ACSOracle
  const code4 = await provider.getCode('0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0');
  console.log('ACSOracle code length:', code4.length);

  // CollateralManager
  const code5 = await provider.getCode('0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9');
  console.log('CollateralManager code length:', code5.length);
}

main().catch(console.error);