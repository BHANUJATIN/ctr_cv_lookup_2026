import PQueue from 'p-queue';

// Create a queue with concurrency of 1 to process requests one by one
const queue = new PQueue({ concurrency: 1 });

/**
 * Middleware to queue requests and process them sequentially
 * This prevents race conditions when multiple requests come in for the same company
 */
export const queueMiddleware = (handler) => {
  return async (req, res, next) => {
    try {
      // Add the request to the queue and wait for it to be processed
      const result = await queue.add(async () => {
        return await handler(req, res, next);
      });
      return result;
    } catch (error) {
      console.error('Queue processing error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  };
};

// Export queue stats for monitoring
export const getQueueStats = () => {
  return {
    size: queue.size,
    pending: queue.pending,
    isPaused: queue.isPaused,
  };
};
