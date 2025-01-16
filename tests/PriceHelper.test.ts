import { fetchZapperTotal } from '../src/utils/PriceHelper';
import axios from 'axios';
import * as dotenv from 'dotenv';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PriceHelper', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Load environment variables
    dotenv.config();
  });

  test('fetchZapperTotal should return sum of balances', async () => {
    // Mock the GraphQL response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        data: {
          portfolio: {
            tokenBalances: [
              {
                address: '0x123',
                network: 'ETHEREUM_MAINNET',
                token: {
                  balance: '100',
                  balanceUSD: 1000,
                  baseToken: {
                    name: 'Test Token',
                    symbol: 'TEST'
                  }
                }
              },
              {
                address: '0x456',
                network: 'ETHEREUM_MAINNET',
                token: {
                  balance: '200',
                  balanceUSD: 2000,
                  baseToken: {
                    name: 'Test Token 2',
                    symbol: 'TEST2'
                  }
                }
              }
            ]
          }
        }
      }
    });

    const result = await fetchZapperTotal('0xTestAddress');
    expect(result).toBe(3000); // 1000 + 2000
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://public.zapper.xyz/graphql',
      expect.any(Object),
      expect.any(Object)
    );
  });

  test('fetchZapperTotal should handle errors', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('API Error'));

    const result = await fetchZapperTotal('0xTestAddress');
    expect(result).toBe(0);
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  test('fetchZapperTotal should make successful GraphQL request with correct structure', async () => {
    // Mock successful GraphQL response with minimal data
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        data: {
          portfolio: {
            tokenBalances: []  // Empty balances but valid structure
          }
        }
      }
    });

    const result = await fetchZapperTotal('0xTestAddress');
    
    // Verify the request was made
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    
    // Verify the request URL
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://public.zapper.xyz/graphql',
      {
        query: expect.stringContaining('providerPorfolioQuery'),
        variables: expect.objectContaining({
          addresses: [expect.any(String)],
          networks: ['ETHEREUM_MAINNET']
        })
      },
      expect.any(Object)
    );

    // Verify we get 0 for empty balances
    expect(result).toBe(0);
  });
});