// server/src/test/actions/billingCycleActions.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getBillingCycle, updateBillingCycle, getAllBillingCycles } from '../../lib/actions/billingCycleActions';
import { getServerSession } from "next-auth/next";
import { Knex } from 'knex';

// Mock the entire DB module
type MockKnex = {
  [K in keyof Knex.QueryBuilder]: ReturnType<typeof vi.fn>;
} & {
  merge: ReturnType<typeof vi.fn>;
} & ReturnType<typeof vi.fn>;

// Mock the entire DB module
vi.mock('@/lib/db', () => {
  const mockKnex: MockKnex = vi.fn(() => mockKnex) as any;
  mockKnex.where = vi.fn().mockReturnThis();
  mockKnex.first = vi.fn();
  mockKnex.insert = vi.fn().mockReturnThis();
  mockKnex.onConflict = vi.fn().mockReturnThis();
  mockKnex.merge = vi.fn().mockReturnThis();
  mockKnex.select = vi.fn();

  return {
    default: {
      getConnection: vi.fn(() => mockKnex),
    },
  };
});

vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn(),
}));

describe('Billing Cycle Actions', () => {
  let mockKnex: any;

  beforeEach(() => {
    vi.clearAllMocks();
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: 'test-user-id' } });
    
    // Get the mocked knex instance
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mockKnex = require('@/lib/lib').default.getConnection();
  });

  describe('getBillingCycle', () => {
    it('should return the billing cycle for a company', async () => {
      mockKnex.first.mockResolvedValue({ billing_cycle: 'monthly' });

      const result = await getBillingCycle('company-1');
      expect(result).toBe('monthly');
      expect(mockKnex.where).toHaveBeenCalledWith({ company_id: 'company-1' });
    });

    it('should return "monthly" if no billing cycle is set', async () => {
      mockKnex.first.mockResolvedValue(null);

      const result = await getBillingCycle('company-2');
      expect(result).toBe('monthly');
    });

    it('should throw an error if user is not authenticated', async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(getBillingCycle('company-1')).rejects.toThrow('Unauthorized');
    });
  });

  describe('updateBillingCycle', () => {
    it('should update the billing cycle for a company', async () => {
      await updateBillingCycle('company-1', 'quarterly');

      expect(mockKnex.insert).toHaveBeenCalledWith({ company_id: 'company-1', billing_cycle: 'quarterly' });
      expect(mockKnex.onConflict).toHaveBeenCalledWith('company_id');
      expect(mockKnex.merge).toHaveBeenCalled();
    });

    it('should throw an error if user is not authenticated', async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(updateBillingCycle('company-1', 'quarterly')).rejects.toThrow('Unauthorized');
    });
  });

  describe('getAllBillingCycles', () => {
    it('should return all billing cycles', async () => {
      mockKnex.select.mockResolvedValue([
        { company_id: 'company-1', billing_cycle: 'monthly' },
        { company_id: 'company-2', billing_cycle: 'quarterly' }
      ]);

      const result = await getAllBillingCycles();
      expect(result).toEqual({
        'company-1': 'monthly',
        'company-2': 'quarterly'
      });
    });

    it('should return an empty object if no billing cycles are set', async () => {
      mockKnex.select.mockResolvedValue([]);

      const result = await getAllBillingCycles();
      expect(result).toEqual({});
    });

    it('should throw an error if user is not authenticated', async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(getAllBillingCycles()).rejects.toThrow('Unauthorized');
    });
  });
});