import React, { useState } from "react";
import {
  HandCoins,
  Handshake,
  ShieldAlert,
  Wallet,
  Banknote,
  Layers,
} from "lucide-react";

interface TradeInterfaceProps {
  selectedAsset?: any;
}

const TradeInterface: React.FC<TradeInterfaceProps> = () => {
  const [tradeType, setTradeType] = useState<string>("borrow");
  const [amount, setAmount] = useState<string>("");
  const [duration, setDuration] = useState<string>("30");
  const [collateralType, setCollateralType] = useState<string>("eth");

  const durations = [
    { value: "7", label: "7 days", apr: "6.5%" },
    { value: "30", label: "30 days", apr: "8.2%" },
    { value: "90", label: "90 days", apr: "9.5%" },
    { value: "180", label: "180 days", apr: "11.0%" },
  ];

  const collateralOptions = [
    {
      value: "eth",
      label: "ETH Token",
      ltv: "80%",
      icon: <Wallet className="w-5 h-5 text-blue-400" />,
    },
    {
      value: "nft",
      label: "NFT Collection",
      ltv: "60%",
      icon: <Layers className="w-5 h-5 text-pink-400" />,
    },
    {
      value: "lp",
      label: "LP Tokens",
      ltv: "70%",
      icon: <Banknote className="w-5 h-5 text-green-400" />,
    },
  ];

  const calculateInterest = () => {
    const principal = parseFloat(amount) || 0;
    const selectedDuration = durations.find((d) => d.value === duration);
    const aprNum = parseFloat(selectedDuration?.apr || "0") || 0;
    const days = parseInt(duration);
    return (principal * (aprNum / 100) * (days / 365)).toFixed(2);
  };

  const calculateTotal = () => {
    const principal = parseFloat(amount) || 0;
    const interest = parseFloat(calculateInterest()) || 0;
    return (principal + interest).toFixed(2);
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-8 shadow-lg">
      {}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
          {tradeType === "borrow" ? (
            <HandCoins className="w-5 h-5" />
          ) : (
            <Handshake className="w-5 h-5" />
          )}
          {tradeType === "borrow" ? "Borrowing" : "Lending"} Interface
        </h3>
        <div className="flex rounded-lg bg-white/10 p-1">
          {["borrow", "lend"].map((type) => (
            <button
              key={type}
              onClick={() => setTradeType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tradeType === type
                  ? type === "borrow"
                    ? "bg-blue-600 text-white"
                    : "bg-green-600 text-white"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {type === "borrow" ? "Borrow" : "Lend"}
            </button>
          ))}
        </div>
      </div>

      {}
      <div className="flex flex-col lg:flex-row gap-8">
        {}
        <div className="flex-1 space-y-6">
          {}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              {tradeType === "borrow" ? "Borrow Amount" : "Lend Amount"} (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">
                $
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 border border-white/20 rounded-lg bg-white/5 text-white placeholder:text-white/40 focus:ring-2 focus:ring-blue-500 focus:outline-none no-spinner"
              />
            </div>
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Loan Duration
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {durations.map((dur) => (
                <button
                  key={dur.value}
                  onClick={() => setDuration(dur.value)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    duration === dur.value
                      ? "border-blue-400 bg-white/10 text-white"
                      : "border-white/10 text-white/70 hover:border-white/20"
                  }`}
                >
                  <div className="font-medium">{dur.label}</div>
                  <div className="text-xs">{dur.apr} APR</div>
                </button>
              ))}
            </div>
          </div>

          {}
          {tradeType === "borrow" && (
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Collateral Type
              </label>
              <div className="space-y-2">
                {collateralOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      collateralType === option.value
                        ? "border-blue-400 bg-white/10"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <input
                      type="radio"
                      name="collateral"
                      value={option.value}
                      checked={collateralType === option.value}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCollateralType(e.target.value)}
                      className="sr-only"
                    />
                    {option.icon}
                    <div>
                      <div className="font-medium text-white">
                        {option.label}
                      </div>
                      <div className="text-xs text-white/60">
                        Max LTV: {option.ltv}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {}
        <div className="flex-1 space-y-6">
          {}
          {amount && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-white mb-2">
                {tradeType === "borrow" ? "Loan Summary" : "Lending Summary"}
              </h4>
              <div className="text-sm text-white/80 space-y-1">
                <div className="flex justify-between">
                  <span>Principal:</span>
                  <span className="font-medium text-white">${amount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Interest:</span>
                  <span className="font-medium text-white">
                    ${calculateInterest()}
                  </span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-2">
                  <span className="font-semibold text-white">
                    Total {tradeType === "borrow" ? "Repayment" : "Return"}:
                  </span>
                  <span className="font-bold text-white">
                    ${calculateTotal()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {}
          <button
            disabled={!amount}
            className={`w-full py-3 rounded-lg font-semibold transition-all ${
              amount
                ? tradeType === "borrow"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
                : "bg-white/10 text-white/40 cursor-not-allowed"
            }`}
          >
            {tradeType === "borrow" ? "Request Loan" : "Start Lending"}
          </button>

          {}
          <div className="bg-yellow-100/10 border border-yellow-300/20 rounded-lg p-3">
            <div className="text-sm text-yellow-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              <span>
                <strong>Risk Warning:</strong>{" "}
                {tradeType === "borrow"
                  ? "Failure to repay may result in collateral liquidation."
                  : "Lending involves smart contract risks and borrower default."}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeInterface;
