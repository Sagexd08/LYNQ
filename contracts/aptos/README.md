# LYNQ Aptos Smart Contracts

This directory contains the Move smart contracts for the LYNQ lending platform on Aptos.

## Prerequisites

Install the Aptos CLI:
```bash
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3
```

## Project Structure

```
contracts/aptos/
├── sources/           # Move source files
│   ├── loan_platform.move
│   ├── trust_score.move
│   └── collateral_manager.move
├── tests/            # Test files
├── scripts/          # Deployment scripts
└── Move.toml        # Move package configuration
```

## Build

```bash
aptos move build
```

## Test

```bash
aptos move test
```

## Deploy to Devnet

1. Generate a new account:
```bash
aptos init --profile devnet
```

2. Compile and publish:
```bash
aptos move publish --profile devnet --named-addresses lynq_lending=0x$(aptos config show-profiles --profile devnet | grep -i "account" | awk '{print $2}')
```

## Deploy to Testnet

Similar to devnet, but use the `--profile testnet` flag.

## Deploy to Mainnet

Use `--profile mainnet` and ensure you have sufficient APT for deployment.

## Module Addresses

Update the `Move.toml` file with your deployed module addresses.

## Resources

- [Aptos Move Documentation](https://aptos.dev/move/move-on-aptos/)
- [Aptos CLI Guide](https://aptos.dev/tools/aptos-cli/)

