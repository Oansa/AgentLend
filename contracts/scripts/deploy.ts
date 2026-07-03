import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Deploying AgentLend Protocol to CROO Network...\n");

  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);
  console.log(`Account balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // Configuration
  const BASE_TOKEN = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC on Base Sepolia
  const ORACLE_SIGNER = deployer.address; // In production, use a dedicated oracle signer

  // Check if we're on a local network (hardhat/anvil)
  const network = await ethers.provider.getNetwork();
  const isLocalNetwork = network.chainId === 31337n || network.chainId === 1337n;

  // 1. Deploy ACS Oracle
  console.log("📝 Deploying ACSOracle...");
  const ACSOracle = await ethers.getContractFactory("ACSOracle");
  const acsOracle = await ACSOracle.deploy(ORACLE_SIGNER);
  await acsOracle.waitForDeployment();
  const acsOracleAddress = await acsOracle.getAddress();
  console.log(`✅ ACSOracle deployed to: ${acsOracleAddress}\n`);

  // 2. Deploy Collateral Manager
  console.log("📝 Deploying CollateralManager...");
  const CollateralManager = await ethers.getContractFactory("CollateralManager");
  const collateralManager = await CollateralManager.deploy();
  await collateralManager.waitForDeployment();
  const collateralManagerAddress = await collateralManager.getAddress();
  console.log(`✅ CollateralManager deployed to: ${collateralManagerAddress}\n`);

  // 3. Deploy Lending Pool
  console.log("📝 Deploying LendingPool...");
  const LendingPool = await ethers.getContractFactory("LendingPool");
  const lendingPool = await LendingPool.deploy(BASE_TOKEN, acsOracleAddress, collateralManagerAddress);
  await lendingPool.waitForDeployment();
  const lendingPoolAddress = await lendingPool.getAddress();
  console.log(`✅ LendingPool deployed to: ${lendingPoolAddress}\n`);

  // 4. Configure Collateral Manager with Lending Pool
  console.log("⚙️ Configuring CollateralManager with LendingPool...");
  await collateralManager.setLendingPool(lendingPoolAddress);
  console.log("✅ LendingPool set in CollateralManager\n");

  // 5. Add supported collateral tokens
  let wethAddress: string;
  let mockWethDeployed = false;

  if (isLocalNetwork) {
    // Deploy MockWETH for local testing
    console.log("📝 Deploying MockWETH for local testing...");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockWeth = await MockERC20.deploy("Wrapped Ether", "WETH", 18);
    await mockWeth.waitForDeployment();
    wethAddress = await mockWeth.getAddress();
    mockWethDeployed = true;
    console.log(`✅ MockWETH deployed to: ${wethAddress}\n`);

    // Mint some WETH to deployer for testing
    await mockWeth.mint(deployer.address, ethers.parseEther("1000"));
    console.log("✅ Minted 1000 WETH to deployer\n");
  } else {
    // Use real WETH on Base Sepolia/Mainnet
    wethAddress = "0x4200000000000000000000000000000000000006"; // WETH on Base
  }

  console.log("⚙️ Adding supported collateral tokens...");
  await collateralManager.setCollateralToken(wethAddress, true);
  console.log(`✅ Added WETH (${wethAddress}) as collateral token`);

  // Also add a mock USDC if local
  let usdcAddress = BASE_TOKEN;
  if (isLocalNetwork) {
    console.log("📝 Deploying MockUSDC for local testing...");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockUsdc = await MockERC20.deploy("USD Coin", "USDC", 6);
    await mockUsdc.waitForDeployment();
    usdcAddress = await mockUsdc.getAddress();
    console.log(`✅ MockUSDC deployed to: ${usdcAddress}\n`);

    // Mint some USDC to deployer for testing
    await mockUsdc.mint(deployer.address, ethers.parseUnits("1000000", 6));
    console.log("✅ Minted 1,000,000 USDC to deployer\n");

    // Add USDC as collateral token
    await collateralManager.setCollateralToken(usdcAddress, true);
    console.log(`✅ Added USDC (${usdcAddress}) as collateral token`);
  }

  // 6. Verify deployments
  console.log("\n🔍 Verifying deployments...");
  const oracleSigner = await acsOracle.oracleSigner();
  console.log(`ACSOracle signer: ${oracleSigner}`);

  const poolLendingPool = await collateralManager.lendingPool();
  console.log(`CollateralManager lendingPool: ${poolLendingPool}`);

  const poolBaseToken = await lendingPool.baseToken();
  console.log(`LendingPool baseToken: ${poolBaseToken}`);

  // 7. Save deployment addresses
  const deployment = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      ACSOracle: acsOracleAddress,
      CollateralManager: collateralManagerAddress,
      LendingPool: lendingPoolAddress,
      BaseToken: isLocalNetwork ? usdcAddress : BASE_TOKEN,
      WETH: wethAddress,
      USDC: isLocalNetwork ? usdcAddress : BASE_TOKEN,
    },
    configuration: {
      oracleSigner: ORACLE_SIGNER,
      collateralTokens: [wethAddress, ...(isLocalNetwork ? [usdcAddress] : [])],
      mockTokensDeployed: mockWethDeployed,
    },
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `deployment-${deployment.chainId}-${Date.now()}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));
  console.log(`\n💾 Deployment saved to: ${deploymentFile}`);

  console.log("\n✅ AgentLend Protocol deployed successfully!");
  console.log("\n📋 Summary:");
  console.log(`   ACSOracle: ${acsOracleAddress}`);
  console.log(`   CollateralManager: ${collateralManagerAddress}`);
  console.log(`   LendingPool: ${lendingPoolAddress}`);
  console.log(`   Base Token (USDC): ${isLocalNetwork ? usdcAddress : BASE_TOKEN}`);
  console.log(`   WETH: ${wethAddress}`);

  if (isLocalNetwork) {
    console.log("\n🔧 Local network detected - Mock Tokens:");
    console.log(`   MockUSDC (6 decimals): ${usdcAddress}`);
    console.log(`   MockWETH (18 decimals): ${wethAddress}`);
    console.log("   Both minted to deployer for testing!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });