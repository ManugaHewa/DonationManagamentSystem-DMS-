import { Queue } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const queues = new Map<string, Queue>();

export function getQueue(name: string): Queue {
  if (!queues.has(name)) {
    const queue = new Queue(name, { connection });
    queues.set(name, queue);
  }
  return queues.get(name)!;
}

export async function queueJob(jobName: string, data: any, options?: any): Promise<any> {
  const queue = getQueue(jobName);
  return queue.add(jobName, data, options);
}
