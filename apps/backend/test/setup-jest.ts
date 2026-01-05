// Global test setup
jest.setTimeout(30000); // 30 seconds timeout

// Suppress ethers JsonRpcProvider warnings in tests
const originalConsoleLog = console.log;
console.log = (...args: any[]) => {
  const message = args[0]?.toString() || '';
  if (message.includes('JsonRpcProvider failed to detect network')) {
    return; // Suppress this specific warning
  }
  originalConsoleLog(...args);
};

// Clean up after all tests
afterAll(async () => {
  // Give time for async operations to complete
  await new Promise(resolve => setTimeout(resolve, 1000));
});

export {};
