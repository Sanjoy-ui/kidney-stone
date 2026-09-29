

import Queue from "bull";

// Create the queue
export const reportQueue = new Queue("report-queue", {
  redis: {
    host: "127.0.0.1",
    port: 6379,
  },
});

// Optional: Error listeners
reportQueue.on('error', (error) => {
  console.error('Queue Connection Error:', error);
});