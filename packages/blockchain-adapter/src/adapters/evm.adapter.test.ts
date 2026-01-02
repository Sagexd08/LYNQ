import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EVMAdapter } from './EVMAdapter';
import { ethers } from 'ethers';
const getBalanceMock = vi.fn().mockResolvedValue(1_000_000_000_000_000_000n);
const getBlockNumberMock = vi.fn().mockResolvedValue(123);
const sendTransactionMock = vi.fn().mockResolvedValue({ hash: '0xhash' });
vi.mock('ethers', () => ({
  ethers: {
    JsonRpcProvider: vi.fn().mockImplementation(() => ({
      getBalance: getBalanceMock,
      getTransaction: vi.fn(),
      getTransactionReceipt: vi.fn(),
      getBlockNumber: getBlockNumberMock,
    })),
    Wallet: vi.fn().mockImplementation(() => ({
      sendTransaction: sendTransactionMock,
    })),
    formatEther: (value: bigint) => (Number(value) / 1e18).toString(),
    parseEther: (value: string) => BigInt(Math.floor(Number(value) * 1e18)),
    Contract: vi.fn(),
  },
}));
describe('EVMAdapter', () => {
  beforeEach(() => {
    getBalanceMock.mockClear();
    getBlockNumberMock.mockClear();
    sendTransactionMock.mockClear();
    process.env.PRIVATE_KEY = '0x'.padEnd(66, '1');
  });
  it('formats balance via provider', async () => {
    const adapter = new EVMAdapter('http:
    const balance = await adapter.getBalance('0xabc');
    expect(balance).toBe('1');
    expect(getBalanceMock).toHaveBeenCalledWith('0xabc');
    expect((ethers.JsonRpcProvider as unknown as vi.Mock).mock.calls[0][0]).toBe('http:
  });
  it('returns current block number', async () => {
    const adapter = new EVMAdapter('http:
    const blockNumber = await adapter.getBlockNumber();
    expect(blockNumber).toBe(123);
    expect(getBlockNumberMock).toHaveBeenCalled();
  });
  it('sends a transaction with wallet signer', async () => {
    const adapter = new EVMAdapter('http:
    const hash = await adapter.sendTransaction({ to: '0xdef', value: '1' });
    expect(hash).toBe('0xhash');
    expect(sendTransactionMock).toHaveBeenCalled();
  });
});
