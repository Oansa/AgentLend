import { Queue, Worker } from 'bullmq';
import type { ScoreJobData, ScoreJobResult } from '../types/index.js';
declare let scoreQueue: Queue<ScoreJobData> | null;
declare let scoreWorker: Worker<ScoreJobData, ScoreJobResult> | null;
export declare function initializeQueue(): Promise<void>;
export declare function enqueueScoreCalculation(data: ScoreJobData): Promise<string>;
export declare function getJobStatus(jobId: string): Promise<{
    status: string;
    progress: number;
    result?: ScoreJobResult;
}>;
export declare function getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
}>;
export declare function shutdownQueue(): Promise<void>;
export { scoreQueue, scoreWorker };
//# sourceMappingURL=queueService.d.ts.map