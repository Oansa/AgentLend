// In-memory demo data storage
import type { ACSScore } from '../types/index.js';

const DEMO_SCORES: Record<string, ACSScore> = {};

// Load demo scores asynchronously
export async function loadDemoScores(): Promise<void> {
  const { generateDemoScores } = await import('../scripts/generateDemoData.js');
  const scores = await generateDemoScores();
  scores.forEach((score) => {
    DEMO_SCORES[score.agentDID] = score;
  });
}

export function getDemoScore(agentDID: string): ACSScore | null {
  return DEMO_SCORES[agentDID] || null;
}

export function getAllDemoScores(): ACSScore[] {
  return Object.values(DEMO_SCORES);
}

// Demo orders for CAP integration
export const DEMO_ORDERS = [
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