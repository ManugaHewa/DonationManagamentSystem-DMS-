import Queue from 'bull';
import Redis from 'ioredis';

const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const queues = new Map<string, Queue.Queue>();

export function getQueue(name: string): Queue.Queue {
  if (!queues.has(name)) {
    const queue = new Queue(name, {
      createClient: () => redisConnection,
    });
    queues.set(name, queue);
  }
  return queues.get(name)!;
}

export async function queueJob(jobName: string, data: any, options?: Queue.JobOptions): Promise<Queue.Job> {
  const queue = getQueue(jobName);
  return queue.add(data, options);
}
