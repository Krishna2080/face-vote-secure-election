
import { useState, useEffect } from 'react';
import { blockchainApi } from '../services/blockchainApi';

interface BlockchainConfigProps {
  onConfigured: () => void;
}

const BlockchainConfig = ({ onConfigured }: BlockchainConfigProps) => {
  const [config, setConfig] = useState({
    contract_address: '',
    rpc_url: 'https://sepolia.infura.io/v3/',
    private_key: '',
    account_address: ''
  });
  
  const [status, setStatus] = useState({
    connected: false,
    contract_configured: false,
    contract_address: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadBlockchainStatus();
  }, []);

  const loadBlockchainStatus = async () => {
    try {
      const statusResult = await blockchainApi.getBlockchainStatus();
      setStatus(statusResult);
    } catch (error) {
      console.error('Failed to load blockchain status:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await blockchainApi.configureBlockchain(config);
      
      if (result.success) {
        alert('Blockchain configured successfully!');
        await loadBlockchainStatus();
        onConfigured();
      } else {
        alert(`Configuration failed: ${result.message}`);
      }
    } catch (error) {
      alert('Failed to configure blockchain. Please check your settings.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Blockchain Configuration</h2>
        
        {/* Status Display */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Current Status</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${status.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">Network Connection: {status.connected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${status.contract_configured ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">Smart Contract: {status.contract_configured ? 'Configured' : 'Not Configured'}</span>
            </div>
            {status.contract_address && (
              <div className="text-xs text-gray-600">
                Contract: {status.contract_address}
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Smart Contract Address
            </label>
            <input
              type="text"
              value={config.contract_address}
              onChange={(e) => setConfig(prev => ({ ...prev, contract_address: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0x..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">Deploy your smart contract on Sepolia testnet and enter the address here</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              RPC URL
            </label>
            <input
              type="text"
              value={config.rpc_url}
              onChange={(e) => setConfig(prev => ({ ...prev, rpc_url: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://sepolia.infura.io/v3/YOUR_PROJECT_ID"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Infura or Alchemy RPC endpoint for Sepolia testnet</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Private Key
            </label>
            <input
              type="password"
              value={config.private_key}
              onChange={(e) => setConfig(prev => ({ ...prev, private_key: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your wallet private key"
              required
            />
            <p className="text-xs text-red-500 mt-1">⚠️ Keep this secure! Never share your private key</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Address
            </label>
            <input
              type="text"
              value={config.account_address}
              onChange={(e) => setConfig(prev => ({ ...prev, account_address: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0x..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">Your wallet address (should have Sepolia ETH for gas)</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Setup Instructions:</h4>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Deploy the smart contract on Sepolia testnet using Remix IDE</li>
              <li>Get Sepolia ETH from a faucet for gas fees</li>
              <li>Configure your Infura/Alchemy project for Sepolia</li>
              <li>Enter your contract address and wallet details above</li>
            </ol>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Configuring...' : 'Configure Blockchain'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BlockchainConfig;
