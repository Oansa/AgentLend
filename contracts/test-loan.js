const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deployer:', deployer.address);

  // Contract addresses
  const lendingPoolAddr = '0xF3d04FFce06d4b6801882e7ECC25715dec6B4FE2';
  const acsOracleAddr = '0xbE7f1dfA8e1C8DD726cd8646f4A8a372b930bD52';
  const wethAddr = '0x4200000000000000000000000000000000000006';
  const usdcAddr = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

  // LendingPool ABI (minimal for createLoan)
  const lendingPoolAbi = [
    'function createLoan(bytes32 borrowerDID, address borrowerAddress, uint256 principalAmount, uint256 interestRateBps, uint256 duration, address collateralToken) returns (uint256)',
    'function getLoan(uint256 loanId) view returns (tuple(uint256 id, bytes32 borrowerDID, address lender, address principalToken, uint256 principalAmount, uint256 interestRateBps, uint256 startTime, uint256 maturity, address collateralToken, uint256 collateralAmount, uint8 status, uint256 repaidAmount, uint256 liquidatedAmount))',
    'function loanCounter() view returns (uint256)'
  ];

  const lendingPool = new ethers.Contract(lendingPoolAddr, lendingPoolAbi, deployer);

  // ACSOracle ABI
  const acsOracleAbi = [
    'function getScore(bytes32 agentDID) view returns (uint256 score, uint256 timestamp, uint256 expiry)',
    'function setScore(bytes32 agentDID, uint256 score, uint256 timestamp, uint256 expiry, bytes signature) returns (bool)'
  ];
  const acsOracle = new ethers.Contract(acsOracleAddr, acsOracleAbi, deployer);

  // Check if we have a valid score for test DID
  const testDID = "did:croo:agent001";
  const didBytes32 = ethers.keccak256(ethers.toUtf8Bytes(testDID));

  console.log('🔍 Checking ACS score for:', testDID);
  try {
    const [score, timestamp, expiry] = await acsOracle.getScore(didBytes32);
    console.log('Score:', score.toString(), 'Expiry:', expiry.toString(), 'Valid:', expiry > Math.floor(Date.now()/1000));
  } catch (e) {
    console.log('Error reading score:', e.message);
  }

  // Check loan counter
  try {
    const counter = await lendingPool.loanCounter();
    console.log('\n📊 Loan counter:', counter.toString());
  } catch (e) {
    console.log('Error reading loan counter:', e.message);
  }

  // Try to create a small loan
  console.log('\n🚀 Attempting to create test loan...');
  const borrowerAddress = deployer.address;
  const principalAmount = ethers.parseUnits('10', 6); // 10 USDC
  const interestRateBps = 1000; // 10% APR
  const duration = 30 * 24 * 60 * 60; // 30 days
  const collateralToken = wethAddr;

  // We need USDC - let's check if we have any or if we can use the base token
  // The base token is USDC on Base Sepolia
  console.log('Principal:', ethers.formatUnits(principalAmount, 6), 'USDC');
  console.log('Interest Rate:', interestRateBps, 'bps (', (interestRateBps/100), '%)');
  console.log('Duration:', duration/86400, 'days');
  console.log('Collateral Token:', collateralToken);
  console.log('Borrower DID:', testDID);
  console.log('Borrower Address:', borrowerAddress);

  try {
    // We need to approve USDC first - but we don't have USDC
    // Let's check what the base token is
    const baseTokenAbi = ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'];
    const usdc = new ethers.Contract(usdcAddr, baseTokenAbi, ethers.provider);

    try {
      const bal = await usdc.balanceOf(deployer.address);
      const dec = await usdc.decimals();
      console.log('Deployer USDC balance:', ethers.formatUnits(bal, dec));
    } catch (e) {
      console.log('Could not check USDC balance:', e.message);
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}

main().catch(console.error);