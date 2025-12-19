// Mock payment gateway function
// Simulates payment processing and randomly returns success or failure

export const processMockPayment = async ({ orderId, userId, paymentMethod }) => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Randomly determine payment success or failure
  const isSuccess = Math.random() > 0.2; // 80% success rate
  const transactionId = `TXN_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  return {
    status: isSuccess ? 'success' : 'failure',
    transactionId,
    paymentMethod,
    orderId,
    userId,
  };
};
