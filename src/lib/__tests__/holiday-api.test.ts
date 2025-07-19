import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { HolidayApiClient } from '../holiday-api';
import { CalendarificResponse, NagerDateResponse } from '../../types';

// axios 모킹
vi.mock('axios', () => ({
  default: {
    create: vi.fn()
  }
}));
const mockedAxios = vi.mocked(axios);

describe('HolidayApiClient', () => {
  let client: HolidayApiClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // axios.create 모킹
    mockAxiosInstance = {
      get: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    };
    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    
    client = new HolidayApiClient('test-api-key', 'calendarific');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('Calendarific API로 클라이언트를 생성해야 합니다', () => {
      const calendarificClient = new HolidayApiClient('test-key', 'calendarific');
      
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://calendarific.com/api/v2',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('Nager API로 클라이언트를 생성해야 합니다', () => {
      const nagerClient = new HolidayApiClient(undefined, 'nager');
      
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://date.nager.at/api/v3',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });
  });

  describe('fetchHolidaysByCountryYear', () => {
    it('Calendarific API에서 공휴일 데이터를 성공적으로 가져와야 합니다', async () => {
      const mockResponse: CalendarificResponse = {
        meta: { code: 200 },
        response: {
          holidays: [
            {
              name: 'New Year\'s Day',
              description: 'New Year\'s Day is celebrated on January 1st',
              country: { id: 'us', name: 'United States' },
              date: {
                iso: '2024-01-01',
                datetime: { year: 2024, month: 1, day: 1 }
              },
              type: ['National holiday'],
              primary_type: 'Public Holiday',
              canonical_url: 'https://calendarific.com/holiday/us/new-year-day',
              urlid: 'us/new-year-day',
              locations: 'All',
              states: 'All'
            }
          ]
        }
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockResponse });

      const result = await client.fetchHolidaysByCountryYear('US', 2024);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/holidays', {
        params: {
          api_key: 'test-api-key',
          country: 'US',
          year: 2024,
          type: 'national'
        }
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: 'New Year\'s Day',
        date: '2024-01-01',
        countryCode: 'US',
        type: 'public',
        global: true
      });
    });

    it('Nager API에서 공휴일 데이터를 성공적으로 가져와야 합니다', async () => {
      const nagerClient = new HolidayApiClient(undefined, 'nager');
      
      const mockResponse: NagerDateResponse = [
        {
          date: '2024-01-01',
          localName: 'New Year\'s Day',
          name: 'New Year\'s Day',
          countryCode: 'US',
          fixed: true,
          global: true,
          counties: null,
          launchYear: null,
          types: ['Public']
        }
      ];

      mockAxiosInstance.get.mockResolvedValue({ data: mockResponse });

      const result = await nagerClient.fetchHolidaysByCountryYear('US', 2024);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/PublicHolidays/2024/US');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: 'New Year\'s Day',
        date: '2024-01-01',
        countryCode: 'US',
        type: 'public',
        global: true
      });
    });

    it('API 호출 실패 시 재시도해야 합니다', async () => {
      const error = new Error('Network error');
      mockAxiosInstance.get
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({
          data: {
            meta: { code: 200 },
            response: { holidays: [] }
          }
        });

      const result = await client.fetchHolidaysByCountryYear('US', 2024);

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(3);
      expect(result).toEqual([]);
    });

    it('최대 재시도 횟수 초과 시 에러를 던져야 합니다', async () => {
      const error = new Error('Network error');
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(client.fetchHolidaysByCountryYear('US', 2024))
        .rejects.toThrow('Failed to fetch holidays for US 2024');

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(3);
    });

    it('Calendarific API 키가 없으면 에러를 던져야 합니다', async () => {
      const clientWithoutKey = new HolidayApiClient(undefined, 'calendarific');

      await expect(clientWithoutKey.fetchHolidaysByCountryYear('US', 2024))
        .rejects.toThrow('Calendarific API key is required');
    });
  });

  describe('normalizeApiResponse', () => {
    it('빈 Calendarific 응답을 처리해야 합니다', async () => {
      const mockResponse = {
        meta: { code: 200 },
        response: { holidays: [] }
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockResponse });

      const result = await client.fetchHolidaysByCountryYear('US', 2024);
      expect(result).toEqual([]);
    });

    it('빈 Nager 응답을 처리해야 합니다', async () => {
      const nagerClient = new HolidayApiClient(undefined, 'nager');
      mockAxiosInstance.get.mockResolvedValue({ data: [] });

      const result = await nagerClient.fetchHolidaysByCountryYear('US', 2024);
      expect(result).toEqual([]);
    });

    it('잘못된 응답 형식을 처리해야 합니다', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: null });

      await expect(client.fetchHolidaysByCountryYear('US', 2024))
        .rejects.toThrow('Failed to normalize API response');
    });
  });

  describe('mapHolidayType', () => {
    it('공휴일 타입을 올바르게 매핑해야 합니다', async () => {
      const testCases = [
        { input: ['Public Holiday'], expected: 'public' },
        { input: ['National Holiday'], expected: 'public' },
        { input: ['Bank Holiday'], expected: 'bank' },
        { input: ['School Holiday'], expected: 'school' },
        { input: ['Optional Holiday'], expected: 'optional' },
        { input: [], expected: 'optional' }
      ];

      for (const testCase of testCases) {
        const mockResponse = {
          meta: { code: 200 },
          response: {
            holidays: [{
              name: 'Test Holiday',
              description: 'Test',
              country: { id: 'us', name: 'United States' },
              date: { iso: '2024-01-01', datetime: { year: 2024, month: 1, day: 1 } },
              type: testCase.input,
              primary_type: 'Test',
              canonical_url: 'test',
              urlid: 'test',
              locations: 'All',
              states: 'All'
            }]
          }
        };

        mockAxiosInstance.get.mockResolvedValue({ data: mockResponse });

        const result = await client.fetchHolidaysByCountryYear('US', 2024);
        expect(result[0].type).toBe(testCase.expected);
      }
    });
  });

  describe('testConnection', () => {
    it('연결 테스트가 성공해야 합니다', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          meta: { code: 200 },
          response: { holidays: [] }
        }
      });

      const result = await client.testConnection();
      expect(result).toBe(true);
    });

    it('연결 테스트가 실패해야 합니다', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Connection failed'));

      const result = await client.testConnection();
      expect(result).toBe(false);
    });
  });
});