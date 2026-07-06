import { config } from 'dotenv';
import { AgentClient } from '@croo-network/sdk';
import { z } from 'zod';

// Load environment variables
config();

// Configuration from env
const REQUESTER_API_KEY = process.env.CROO_API_KEY!;
const CROO_API_URL = process.env.CROO_API_URL!;
const CROO_WS_URL = process.env.CROO_WS_URL!;
const REQUESTER_DID = process.env.CROO_AGENT_DID!;
const PROVIDER_DID = process.env.PROVIDER_AGENT_DID!;
const BORROWER_DID = process.env.TEST_BORROWER_DID!;
const WALLET_ADDRESS = process.env.TEST_WALLET_ADDRESS!;

const SERVICE_CALCULATE = process.env.SERVICE_CALCULATE_SCORE!;
const SERVICE_ENQUEUE = process.env.SERVICE_ENQUEUE_SCORE!;
const SERVICE_GET = process.env.SERVICE_GET_SCORE!;

// Validate required config
if (!REQUESTER_API_KEY) throw new Error('CROO_API_KEY not set');
if (!REQUESTER_DID) throw new Error('CROO_AGENT_DID not set');
if (!PROVIDER_DID) throw new Error('PROVIDER_AGENT_DID not set');

// Initialize CROO SDK AgentClient
const client = new AgentClient(
  { baseURL: CROO_API_URL, wsURL: CROO_WS_URL },
  REQUESTER_API_KEY
);

// Test borrower data
const BORROWER_DATA = {
  agentDID: BORROWER_DID,
  walletAddress: WALLET_ADDRESS,
  onChainData: {
    walletAddress: WALLET_ADDRESS,
    transactionCount: 150,
    totalVolumeUSD: 50000,
    uniqueCounterparties: 25,
    avgTransactionSizeUSD: 333.33,
    daysActive: 180,
    tokenDiversity: 8,
    defiInteractions: 45,
  },
  offChainData: {
    reputationScore: 85,
    kycVerified: true,
    twitterFollowers: 1500,
    githubContributions: 200,
    domainExpertise: ['DeFi', 'Lending', 'Risk'],
  },
};

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCalculateScore() {
  console.log('\n🧪 TEST 1: Calculate Credit Score (Sync)');
  console.log('='.repeat(50));

  // 1. Negotiate for the service
  console.log('📋 Creating negotiation...');
  const negotiation = await client.negotiateOrder({
    serviceId: SERVICE_CALCULATE,
    requirements: JSON.stringify(BORROWER_DATA),
    requesterAgentId: REQUESTER_DID,
  });

  console.log(`✅ Negotiation created: ${negotiation.negotiationId}`);
  console.log(`   Status: ${negotiation.status}`);
  console.log(`   Service: ${negotiation.serviceId}`);

  // 2. Wait for provider to accept
  console.log('\n⏳ Waiting for provider to accept...');
  let acceptedNegotiation = null;
  for (let i = 0; i < 15; i++) {
    await sleep(2000);
    try {
      const neg = await client.getNegotiation(negotiation.negotiationId);
      if (neg.status === 'accepted') {
        acceptedNegotiation = neg;
        break;
      }
      console.log(`   Poll ${i + 1}: Status = ${neg.status}`);
    } catch (e) {
      console.log(`   Poll ${i + 1}: Error checking status`);
    }
  }

  if (!acceptedNegotiation) {
    console.log('❌ Timeout: Provider did not accept negotiation');
    return;
  }

  console.log(`\n✅ Negotiation accepted!`);
  console.log(`   Order ID: ${acceptedNegotiation.metadata || 'N/A'}`);

  // 3. Pay for the order (if order was created)
  // The provider's acceptNegotiation should create an order
  console.log('\n🔍 Checking for order...');
  let orderId: string | null = null;

  // Try to list orders to find the one from this negotiation
  try {
    const orders = await client.listOrders({ status: 'paid' });
    const matchingOrder = orders.find(o => o.negotiationId === negotiation.negotiationId);
    if (matchingOrder) {
      orderId = matchingOrder.orderId;
      console.log(`   Found order: ${orderId}`);
    }
  } catch (e) {
    console.log('   No orders found yet');
  }

  // If no order yet, try to pay (this might create it)
  // For demo, we'll just wait and check delivery
  console.log('\n⏳ Waiting for delivery...');
  for (let i = 0; i < 10; i++) {
    await sleep(3000);
    try {
      // Check if there's a delivery for this order
      if (orderId) {
        const delivery = await client.getDelivery(orderId);
        if (delivery && delivery.deliverableText) {
          console.log('\n📦 SCORE DELIVERED!');
          console.log('='.repeat(50));
          console.log(delivery.deliverableText);
          return;
        }
      }
    } catch (e) {
      // Delivery not ready yet
    }
  }

  console.log('\n⚠️  Delivery not received within timeout');
  console.log('   Check provider logs for status');
}

async function testEnqueueScore() {
  console.log('\n🧪 TEST 2: Enqueue Async Score Calculation');
  console.log('='.repeat(50));

  const negotiation = await client.negotiateOrder({
    serviceId: SERVICE_ENQUEUE,
    requirements: JSON.stringify({
      ...BORROWER_DATA,
      priority: 'high',
    }),
    requesterAgentId: REQUESTER_DID,
  });

  console.log(`✅ Negotiation created: ${negotiation.negotiationId}`);

  // Wait for acceptance
  for (let i = 0; i < 10; i++) {
    await sleep(2000);
    const neg = await client.getNegotiation(negotiation.negotiationId);
    if (neg.status === 'accepted') {
      console.log('✅ Negotiation accepted!');
      break;
    }
  }
}

async function testGetScore() {
  console.log('\n🧪 TEST 3: Get Existing Credit Score');
  console.log('='.repeat(50));

  const negotiation = await client.negotiateOrder({
    serviceId: SERVICE_GET,
    requirements: JSON.stringify({
      agentDID: BORROWER_DID,
    }),
    requesterAgentId: REQUESTER_DID,
  });

  console.log(`✅ Negotiation created: ${negotiation.negotiationId}`);

  for (let i = 0; i < 10; i++) {
    await sleep(2000);
    const neg = await client.getNegotiation(negotiation.negotiationId);
    if (neg.status === 'accepted') {
      console.log('✅ Negotiation accepted!');
      break;
    }
  }
}

async function main() {
  console.log('🚀 AgentLend Requester Agent - Test Suite');
  console.log('='.repeat(50));
  console.log(`Requester: ${REQUESTER_DID}`);
  console.log(`Provider:  ${PROVIDER_DID}`);
  console.log(`Borrower:  ${BORROWER_DID}`);
  console.log(`Wallet:    ${WALLET_ADDRESS}`);

  try {
    // Test all three services
    await testCalculateScore();
    await testEnqueueScore();
    await testGetScore();

    console.log('\n✅ All tests completed!');
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

main();