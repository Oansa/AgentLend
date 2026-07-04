import type { ACSScore } from '../types/index.js';
export declare function loadDemoScores(): Promise<void>;
export declare function getDemoScore(agentDID: string): ACSScore | null;
export declare function getAllDemoScores(): ACSScore[];
export declare const DEMO_ORDERS: {
    orderId: string;
    agentDID: string;
    principalUSD: number;
    rateBps: number;
    duration: number;
    status: string;
    repaymentAmount: number;
}[];
//# sourceMappingURL=demoService.d.ts.map