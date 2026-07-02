import type { ScoreInput, ScoreResponse, HealthResponse, MetricsData } from '../types/index.js';
export declare class OracleService {
    calculateScore(input: ScoreInput): Promise<ScoreResponse>;
    enqueueScore(input: ScoreInput, priority?: 'low' | 'normal' | 'high'): Promise<{
        requestId: string;
        jobId: string;
    }>;
    getJobStatus(jobId: string): Promise<{
        status: string;
        progress: number;
        result?: import("../types/index.js").ScoreJobResult;
    }>;
    getHealth(): Promise<HealthResponse>;
    getMetrics(): Promise<MetricsData>;
    getQueueStats(): Promise<{
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
    }>;
}
export declare const oracleService: OracleService;
//# sourceMappingURL=oracleService.d.ts.map