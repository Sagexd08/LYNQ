import { describe, expect, it, afterEach } from 'vitest';
import { getApiBaseUrl } from './client';
const ORIGINAL_ENV = { ...process.env };
afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});
describe('getApiBaseUrl', () => {
  it('prefers VITE_API_BASE_URL when set', () => {
    process.env.VITE_API_BASE_URL = 'https:
    expect(getApiBaseUrl()).toBe('https:
  });
  it('falls back to local default when unset', () => {
    delete process.env.VITE_API_BASE_URL;
    expect(getApiBaseUrl()).toBe('http:
  });
});
