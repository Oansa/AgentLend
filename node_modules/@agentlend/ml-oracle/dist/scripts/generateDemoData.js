"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDemoScores = generateDemoScores;
exports.generateDemoOrders = generateDemoOrders;
const scoringEngine_js_1 = require("../services/scoringEngine.js");
// Sample agent profiles for demo
const DEMO_AGENTS = [
    {
        agentDID: 'did:croo:research-orchestrator',
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD6E',
        description: 'Orchestrator Agent for complex research reports',
        metrics: {
            transactionCount: 500,
            totalVolumeUSD: 800000,
            uniqueCounterparties: 80,
            daysActive: 365,
            tokenDiversity: 15,
            defiInteractions: 120,
            lendingHistory: { loansCount: 15, repaidOnTime: 15, defaulted: 0 },
            reputationScore: 95,
            kycVerified: true,
        },
    },
    {
        agentDID: 'did:croo:data-scraper',
        walletAddress: '0x388C818caE5e8fC5Aa73470d7418cBF6821Cf67C',
        description: 'Specialized web scraping micro-agent',
        metrics: {
            transactionCount: 300,
            totalVolumeUSD: 450000,
            uniqueCounterparties: 40,
            daysActive: 200,
            tokenDiversity: 8,
            defiInteractions: 60,
            lendingHistory: { loansCount: 8, repaidOnTime: 7, defaulted: 1 },
            reputationScore: 82,
            kycVerified: false,
        },
    },
    {
        agentDID: 'did:croo:image-generator',
        walletAddress: '0x53d281C8727578878d2a8C5617c5F7742C59b73C',
        description: 'AI image generation micro-agent',
        metrics: {
            transactionCount: 450,
            totalVolumeUSD: 650000,
            uniqueCounterparties: 65,
            daysActive: 300,
            tokenDiversity: 12,
            defiInteractions: 90,
            lendingHistory: { loansCount: 12, repaidOnTime: 11, defaulted: 0 },
            reputationScore: 91,
            kycVerified: true,
        },
    },
    {
        agentDID: 'did:croo:translator',
        walletAddress: '0x68260495B46aE1c4dF0b9A87E3C883dD96FcDD6c',
        description: 'Multi-language translation agent',
        metrics: {
            transactionCount: 200,
            totalVolumeUSD: 250000,
            uniqueCounterparties: 30,
            daysActive: 150,
            tokenDiversity: 5,
            defiInteractions: 40,
            lendingHistory: { loansCount: 5, repaidOnTime: 4, defaulted: 1 },
            reputationScore: 75,
            kycVerified: false,
        },
    },
    {
        agentDID: 'did:croo:fact-checker',
        walletAddress: '0x9531E7Dc4B860724729d9b54472428DdE8C71A2C',
        description: 'Cross-reference and fact-checking agent',
        metrics: {
            transactionCount: 600,
            totalVolumeUSD: 1000000,
            uniqueCounterparties: 100,
            daysActive: 400,
            tokenDiversity: 18,
            defiInteractions: 150,
            lendingHistory: { loansCount: 20, repaidOnTime: 20, defaulted: 0 },
            reputationScore: 98,
            kycVerified: true,
        },
    },
];
// Generate demo data for all sample agents
async function generateDemoScores() {
    const scores = [];
    for (const agent of DEMO_AGENTS) {
        const input = {
            agentDID: agent.agentDID,
            walletAddress: agent.walletAddress,
            onChainData: {
                walletAddress: agent.walletAddress,
                transactionCount: agent.metrics.transactionCount,
                totalVolumeUSD: agent.metrics.totalVolumeUSD,
                uniqueCounterparties: agent.metrics.uniqueCounterparties,
                avgTransactionSizeUSD: agent.metrics.totalVolumeUSD / agent.metrics.transactionCount,
                daysActive: agent.metrics.daysActive,
                tokenDiversity: agent.metrics.tokenDiversity,
                defiInteractions: agent.metrics.defiInteractions,
                lendingHistory: {
                    loansCount: agent.metrics.lendingHistory.loansCount,
                    repaidOnTime: agent.metrics.lendingHistory.repaidOnTime,
                    defaulted: agent.metrics.lendingHistory.defaulted,
                    totalBorrowedUSD: agent.metrics.lendingHistory.loansCount * 50000,
                    totalRepaidUSD: agent.metrics.lendingHistory.repaidOnTime * 52500,
                },
                collateralHistory: {
                    totalDepositedUSD: agent.metrics.lendingHistory.loansCount * 75000,
                    liquidationsCount: agent.metrics.lendingHistory.defaulted,
                    currentCollateralUSD: agent.metrics.lendingHistory.loansCount * 25000,
                },
            },
            offChainData: {
                reputationScore: agent.metrics.reputationScore,
                kycVerified: agent.metrics.kycVerified,
            },
        };
        const score = await scoringEngine_js_1.scoringEngine.calculateScore(input);
        scores.push({
            ...score,
            description: agent.description,
        });
    }
    return scores;
}
// Generate sample CAP orders for demo
function generateDemoOrders() {
    return DEMO_AGENTS.map((agent, index) => ({
        orderId: `order-demo-${index + 1}`,
        agentDID: agent.agentDID,
        principalUSD: 10000 + index * 10000, // $10k to $50k
        rateBps: 1000 + index * 200, // 10% to 18% APR
        durationDays: 30 + index * 15, // 30-75 days
        status: 'completed',
        timestamp: Date.now() - (5 - index) * 86400000, // Last 5 days
    }));
}
// Run demo data generation if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('🚀 Generating AgentLend Demo Data...\n');
    generateDemoScores()
        .then((scores) => {
        console.log('📊 Generated ACS Scores:');
        scores.forEach((s) => {
            console.log(`  - ${s.agentDID}: ${s.score} (${s.description})`);
        });
        console.log('\n🔗 Demo Orders:');
        const orders = generateDemoOrders();
        orders.forEach((o) => {
            console.log(`  - Order ${o.orderId}: $${o.principalUSD} to ${o.agentDID}`);
        });
    })
        .catch(console.error);
}
//# sourceMappingURL=generateDemoData.js.map