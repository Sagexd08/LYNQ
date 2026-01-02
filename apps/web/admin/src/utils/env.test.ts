import { describe, it, expect, afterEach } from 'vitest';
import { getApiBaseUrl } from './env';
const ORIGINAL_ENV = { ...process.env };
afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});
describe('getApiBaseUrl', () => {
  it('returns configured URL when present', () => {
    process.env.NEXT_PUBLIC_API_URL = 'https:
    expect(getApiBaseUrl()).toBe('https:
  });
  it('falls back to default when missing', () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    expect(getApiBaseUrl()).toBe('http:
  });
});
