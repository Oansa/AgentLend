"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEMO_ORDERS = void 0;
exports.loadDemoScores = loadDemoScores;
exports.getDemoScore = getDemoScore;
exports.getAllDemoScores = getAllDemoScores;
const DEMO_SCORES = {};
// Load demo scores asynchronously
async function loadDemoScores() {
    const { generateDemoScores } = await import('../scripts/generateDemoData.js');
    const scores = await generateDemoScores();
    scores.forEach((score) => {
        DEMO_SCORES[score.agentDID] = score;
    });
}
function getDemoScore(agentDID) {
    return DEMO_SCORES[agentDID] || null;
}
function getAllDemoScores() {
    return Object.values(DEMO_SCORES);
}
// Demo orders for CAP integration
exports.DEMO_ORDERS = [
    {
        orderId: 'order-demo-1',
        agentDID: 'did:croo:research-orchestrator',
        principalUSD: 50000,
        rateBps: 1000,
        duration: 30 * 24 * 60 * 60, // 30 days
        status: 'completed',
        repaymentAmount: 52500, // With interest
    },
    {
        orderId: 'order-demo-2',
        agentDID: 'did:croo:data-scraper',
        principalUSD: 25000,
        rateBps: 1500,
        duration: 45 * 24 * 60 * 60,
        status: 'active',
        repaymentAmount: 0,
    },
    {
        orderId: 'order-demo-3',
        agentDID: 'did:croo:image-generator',
        principalUSD: 15000,
        rateBps: 1200,
        duration: 30 * 24 * 60 * 60,
        status: 'completed',
        repaymentAmount: 16800,
    },
];
//# sourceMappingURL=demoService.js.map