import { useState } from "react";

const Transaction = () => {
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleSend = async () => {
    if (!address || !amount) {
      setStatus("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      // Simulate sending transaction (replace with Web3 call or backend API)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setStatus("✅ Transaction sent successfully!");
      setAddress("");
      setAmount("");
      setMessage("");
    } catch (err) {
      setStatus("❌ Failed to send transaction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 text-white space-y-5 transition-all">
      <h3 className="text-2xl font-semibold text-center">Crypto Transaction</h3>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Recipient Wallet Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />

        <input
          type="number"
          placeholder="Amount (ETH)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />

        <textarea
          placeholder="Message (optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
        />

        <button
          onClick={handleSend}
          disabled={loading}
          className={`w-full py-2 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition duration-300 ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Sending..." : "Send"}
        </button>

        {status && (
          <div className="text-sm text-center mt-2 text-cyan-300">{status}</div>
        )}
      </div>
    </div>
  );
};

export default Transaction;
