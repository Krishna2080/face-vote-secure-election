
const API_BASE_URL = 'http://localhost:8000';

export interface BlockchainConfig {
  contract_address: string;
  rpc_url: string;
  private_key: string;
  account_address: string;
}

export interface BlockchainStatus {
  connected: boolean;
  contract_configured: boolean;
  contract_address: string;
}

export interface BlockchainResults {
  success: boolean;
  results?: Record<string, number>;
  total_votes?: number;
  message?: string;
}

export const blockchainApi = {
  async configureBlockchain(config: BlockchainConfig): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/configure-blockchain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      
      return await response.json();
    } catch (error) {
      console.error('Blockchain configuration failed:', error);
      throw new Error('Failed to configure blockchain');
    }
  },

  async getBlockchainStatus(): Promise<BlockchainStatus> {
    try {
      const response = await fetch(`${API_BASE_URL}/blockchain-status`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get blockchain status:', error);
      return {
        connected: false,
        contract_configured: false,
        contract_address: ''
      };
    }
  },

  async getBlockchainResults(): Promise<BlockchainResults> {
    try {
      const response = await fetch(`${API_BASE_URL}/blockchain-results`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get blockchain results:', error);
      return {
        success: false,
        message: 'Failed to fetch blockchain results'
      };
    }
  }
};
