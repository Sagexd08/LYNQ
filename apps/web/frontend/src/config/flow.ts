import * as fcl from '@onflow/fcl';
import { ENV_CONFIG } from './env';
import { FLOW_NETWORKS } from '../constants/flow';

const cfg = ENV_CONFIG.DEFAULT_NETWORK === 'mainnet' ? FLOW_NETWORKS.MAINNET : FLOW_NETWORKS.TESTNET;

export function configureFCL(): void {
  fcl.config()
    .put('app.detail.title', 'LYNQ')
    .put('flow.network', cfg.network)
    .put('accessNode.api', cfg.accessApi)
    .put('discovery.wallet', cfg.discoveryWallet);
}

export { fcl };


