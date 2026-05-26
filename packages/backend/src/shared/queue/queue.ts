import { Queue, Worker, type Job, type JobsOptions } from 'bullmq';
import Redis from 'ioredis';
import { env } from '@/config/env';
import { logger } from '@/shared/logger/logger';


const redisConnection = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redisConnection.on('connect', () => {
  logger.info('Redis connected');
});

redisConnection.on('error', (error) => {
  logger.error({ error }, 'Redis connection error');
});

export interface QueueConfig<T = unknown> {
  name: string;
  defaultJobOptions?: JobsOptions;
  processor: (job: Job<T>) => Promise<void>;
}

export class QueueManager<T = unknown> {
  public queue: Queue<T>;
  private worker: Worker<T>;
  private queueName: string;

  constructor(config: QueueConfig<T>) {
    this.queueName = config.name;

    this.queue = new Queue<T>(config.name, {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: {
          count: 100,
          age: 24 * 3600,
        },
        removeOnFail: {
          count: 1000,
        },
        ...config.defaultJobOptions,
      },
    });

    this.worker = new Worker<T>(
      config.name,
      async (job: Job<T>) => {
        const startTime = Date.now();
        try {
          logger.info({ jobId: job.id, jobName: job.name }, 'Processing job');
          await config.processor(job);
        } catch (error) {
          logger.error({ error, jobId: job.id, jobName: job.name }, 'Job processing failed');
          throw error;
        } finally {
          const duration = (Date.now() - startTime) / 1000;
        }
      },
      {
        connection: redisConnection,
        concurrency: 5,
      }
    );

    this.worker.on('completed', (job: Job<T>) => {
      logger.info({ jobId: job.id, jobName: job.name }, 'Job completed');
    });

    this.worker.on('failed', (job: Job<T> | undefined, error: Error) => {
      logger.error({ jobId: job?.id, jobName: job?.name, error }, 'Job failed');
    });

    logger.info({ queueName: config.name }, 'Queue initialized');
  }

  async addJob(name: string, data: T, options?: JobsOptions): Promise<string> {
    // @ts-expect-error - BullMQ v5 type inference issue with dynamic job names
    const job = await this.queue.add(name, data, options);
    logger.info({ jobName: name, jobId: job.id }, 'Job added to queue');
    return job.id || '';
  }


  async close(): Promise<void> {
    await this.worker.close();
    await this.queue.close();
    logger.info({ queueName: this.queueName }, 'Queue closed');
  }

  getQueue(): Queue<T> {
    return this.queue;
  }

  getWorker(): Worker<T> {
    return this.worker;
  }
}

export async function closeAllQueues(): Promise<void> {
  await redisConnection.quit();
  logger.info('Redis connection closed');
}