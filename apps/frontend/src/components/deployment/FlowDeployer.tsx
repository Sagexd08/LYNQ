import { useState } from 'react';
import { fcl } from '../../config/flow';
import toast from 'react-hot-toast';

export default function FlowDeployer() {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<string>('');
  const [deployedAddress, setDeployedAddress] = useState<string>('');

  const CONTRACT_CODE = `
pub contract LoanPlatform {

    pub struct Loan {
        pub let id: UInt64
        pub let borrower: Address
        pub let amount: UFix64
        pub let interestBps: UInt64
        pub let durationSeconds: UFix64
        pub let createdAt: UFix64
        pub let dueDate: UFix64
        pub var repaidAmount: UFix64
        pub var isActive: Bool
        pub var isRepaid: Bool
        pub let purpose: String

        init(id: UInt64, borrower: Address, amount: UFix64, interestBps: UInt64, durationSeconds: UFix64, createdAt: UFix64, dueDate: UFix64, purpose: String) {
            self.id = id
            self.borrower = borrower
            self.amount = amount
            self.interestBps = interestBps
            self.durationSeconds = durationSeconds
            self.createdAt = createdAt
            self.dueDate = dueDate
            self.repaidAmount = 0.0
            self.isActive = true
            self.isRepaid = false
            self.purpose = purpose
        }
    }

    pub event LoanCreated(id: UInt64, borrower: Address, amount: UFix64, interestBps: UInt64, durationSeconds: UFix64, purpose: String)
    pub event LoanRepaid(id: UInt64, borrower: Address, amount: UFix64, fullyRepaid: Bool)

    pub var nextLoanId: UInt64
    access(self) var loans: {UInt64: Loan}

    pub fun getLoan(id: UInt64): Loan? {
        return self.loans[id]
    }

    pub fun calculateTotalOwed(id: UInt64): UFix64 {
        let loan = self.loans[id] ?? panic("loan missing")
        let interest: UFix64 = loan.amount * UFix64(loan.interestBps) / 10000.0
        return loan.amount + interest
    }

    pub fun createLoan(borrower: Address, amount: UFix64, interestBps: UInt64, durationSeconds: UFix64, purpose: String) {
        let id = self.nextLoanId
        self.nextLoanId = id + 1

        let now: UFix64 = getCurrentBlock().timestamp
        let due: UFix64 = now + durationSeconds

        let loan = Loan(id: id, borrower: borrower, amount: amount, interestBps: interestBps, durationSeconds: durationSeconds, createdAt: now, dueDate: due, purpose: purpose)
        self.loans[id] = loan
        emit LoanCreated(id: id, borrower: loan.borrower, amount: amount, interestBps: interestBps, durationSeconds: durationSeconds, purpose: purpose)
    }

    pub fun applyRepayment(id: UInt64, amount: UFix64) {
        let loanRef = &self.loans[id] as &Loan?
        if loanRef == nil { panic("loan missing") }
        let loan = loanRef!
        if !loan.isActive || loan.isRepaid { panic("inactive") }

        loan.repaidAmount = loan.repaidAmount + amount
        let total = self.calculateTotalOwed(id: id)
        let fully = loan.repaidAmount >= total
        if fully {
            loan.isActive = false
            loan.isRepaid = true
        }
        emit LoanRepaid(id: id, borrower: loan.borrower, amount: amount, fullyRepaid: fully)
    }

    init() {
        self.nextLoanId = 1
        self.loans = {}
    }
}`;

  const handleDeploy = async () => {
    try {
      setIsDeploying(true);
      setDeploymentStatus('Connecting to Flow wallet...');
      
      const user = await fcl.currentUser.snapshot();
      if (!user?.loggedIn) {
        setDeploymentStatus('Please authenticate with Flow wallet first');
        await fcl.authenticate();
        setDeploymentStatus('Authenticated');
      }

      const currentUser = await fcl.currentUser.snapshot();
      if (!currentUser?.addr) {
        throw new Error('Wallet connection failed');
      }

      setDeploymentStatus('Preparing deployment transaction...');

      const cadenceCode = `
          transaction(name: String) {
            prepare(signer: AuthAccount) {
              signer.contracts.add(name: name, code: "CONTRACT_PLACEHOLDER".utf8)
            }
            log("Contract deployed successfully!")
          }
        `.replace('CONTRACT_PLACEHOLDER', CONTRACT_CODE);

      setDeploymentStatus('Signing transaction...');
      const txId = await fcl.mutate({
        cadence: cadenceCode,
        args: (arg: any, t: any) => [arg('LoanPlatform', t.String)],
        limit: 1000,
      });

      setDeploymentStatus('Waiting for confirmation...');
      await fcl.tx(txId).onceSealed();
      
      setDeployedAddress(currentUser.addr);
      toast.success('Contract deployed successfully!');
      
    } catch (error: any) {
      console.error('Deployment error:', error);
      setDeploymentStatus(`Error: ${error.message}`);
      toast.error('Deployment failed: ' + error.message);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Deploy to Flow Testnet</h2>
      
      <p className="text-gray-300 mb-6">
        Connect with a Flow wallet (Blocto, Ledger, or Flow Wallet) to deploy the LoanPlatform contract to Flow testnet.
      </p>

      <div className="space-y-4">
        <button
          onClick={handleDeploy}
          disabled={isDeploying}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition"
        >
          {isDeploying ? 'Deploying...' : 'Deploy LoanPlatform Contract'}
        </button>

        {deploymentStatus && (
          <div className="bg-gray-900 p-4 rounded-lg">
            <p className="text-sm text-gray-300">{deploymentStatus}</p>
          </div>
        )}

        {deployedAddress && (
          <div className="bg-green-900/20 border border-green-700 p-4 rounded-lg">
            <p className="text-green-400 font-semibold mb-2">✅ Deployment Successful!</p>
            <p className="text-sm text-gray-300">Contract deployed to: <code className="text-green-400">{deployedAddress}</code></p>
          </div>
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-700">
        <p className="text-sm text-gray-400">
          💡 Need a Flow wallet? <a href="https://port.onflow.org/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Create one here</a>
        </p>
        <p className="text-sm text-gray-400 mt-2">
          💧 Need testnet FLOW? <a href="https://testnet-faucet.onflow.org/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Get free tokens</a>
        </p>
      </div>
    </div>
  );
}

