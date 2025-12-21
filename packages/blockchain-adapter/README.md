# Blockchain Adapter

TypeScript adapters that provide a thin abstraction over multiple chains (EVM, Mantle, Aptos, Flow).

## Install & Build

```bash
pnpm install
pnpm --filter @lynq/blockchain-adapter build
```

## Usage (EVM)

```ts
import { EVMAdapter } from '@lynq/blockchain-adapter';

const adapter = new EVMAdapter(process.env.RPC_URL || 'http://localhost:8545');
const balance = await adapter.getBalance('0x...');
```

- The EVM adapter expects `process.env.PRIVATE_KEY` for `sendTransaction`.
- Use test RPC URLs in local/dev environments to avoid unintended on-chain transactions.

## Testing

```bash
pnpm --filter @lynq/blockchain-adapter test
```

Tests are lightweight and mock `ethers` to avoid live RPC calls.

## Releasing / Publishing

1. Bump the version in `packages/blockchain-adapter/package.json`.
2. Build the package: `pnpm --filter @lynq/blockchain-adapter build`.
3. Publish (if needed): `pnpm --filter @lynq/blockchain-adapter publish --access public`.
4. Tag the release in git to keep deployment pipelines aligned.
