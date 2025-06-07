
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
  const [useMetaMask, setUseMetaMask] = useState(true);

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

  const connectMetaMask = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Switch to Sepolia network
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }], // Sepolia chainId
          });
        } catch (switchError: any) {
          // If Sepolia is not added, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0xaa36a7',
                chainName: 'Sepolia Test Network',
                nativeCurrency: {
                  name: 'SepoliaETH',
                  symbol: 'ETH',
                  decimals: 18
                },
                rpcUrls: ['https://sepolia.infura.io/v3/'],
                blockExplorerUrls: ['https://sepolia.etherscan.io']
              }]
            });
          }
        }
        
        setConfig(prev => ({
          ...prev,
          account_address: accounts[0],
          rpc_url: 'https://sepolia.infura.io/v3/' // MetaMask handles RPC
        }));
        
        alert('MetaMask connected successfully! Please enter your private key and contract address.');
      } else {
        alert('MetaMask is not installed. Please install MetaMask extension.');
      }
    } catch (error) {
      console.error('Failed to connect MetaMask:', error);
      alert('Failed to connect to MetaMask. Please try again.');
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

        {/* MetaMask Connection */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">MetaMask Integration</h3>
          <p className="text-blue-700 mb-3">
            Connect your MetaMask wallet to automatically configure Sepolia testnet settings.
          </p>
          <button
            type="button"
            onClick={connectMetaMask}
            className="px-6 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
          >
            Connect MetaMask
          </button>
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
            <p className="text-xs text-gray-500 mt-1">Deploy your smart contract on Sepolia testnet using Remix IDE and enter the address here</p>
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
              placeholder="https://sepolia.infura.io/v3/ (MetaMask handles this)"
              required
              disabled={useMetaMask}
            />
            <p className="text-xs text-gray-500 mt-1">
              {useMetaMask ? 'MetaMask will handle the RPC connection' : 'Sepolia testnet RPC endpoint'}
            </p>
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
            <p className="text-xs text-red-500 mt-1">⚠️ Export from MetaMask: Account Details → Export Private Key</p>
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
            <p className="text-xs text-gray-500 mt-1">Your MetaMask wallet address (should have Sepolia ETH for gas)</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Setup Instructions:</h4>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Install MetaMask browser extension</li>
              <li>Switch to Sepolia testnet in MetaMask</li>
              <li>Get Sepolia ETH from a faucet (sepolia-faucet.pk910.de)</li>
              <li>Deploy the smart contract on Sepolia using Remix IDE</li>
              <li>Connect MetaMask above to auto-fill wallet details</li>
              <li>Enter your contract address and private key</li>
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
