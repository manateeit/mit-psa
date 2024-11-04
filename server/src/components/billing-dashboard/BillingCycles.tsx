// BillingCycles.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { RefreshCw, Info } from 'lucide-react';
import { getAllBillingCycles, updateBillingCycle } from '@/lib/actions/billingCycleActions';
import { getAllCompanies } from '@/lib/actions/companyActions';
import { ICompany } from '@/interfaces';
import { ColumnDefinition } from '@/interfaces/dataTable.interfaces';

const BillingCycles: React.FC = () => {
  const [billingCycles, setBillingCycles] = useState<{ [companyId: string]: string }>({});
  const [companies, setCompanies] = useState<Partial<ICompany>[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cycles, fetchedCompanies] = await Promise.all([
        getAllBillingCycles(),
        getAllCompanies()
      ]);
      setBillingCycles(cycles);
      setCompanies(fetchedCompanies);
      setError(null);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleBillingCycleChange = async (companyId: string, cycle: string) => {
    // Optimistic update
    setBillingCycles(prev => ({ ...prev, [companyId]: cycle }));

    try {
      await updateBillingCycle(companyId, cycle);
      setError(null);
    } catch (error) {
      console.error('Error updating billing cycle:', error);
      // Revert the optimistic update
      setBillingCycles(prev => ({ ...prev, [companyId]: prev[companyId] }));
      setError('Failed to update billing cycle. Please try again.');
    }
  };

  const columns: ColumnDefinition<Partial<ICompany>>[] = [
    {
      title: 'Company',
      dataIndex: 'company_name',
    },
    {
      title: 'Current Billing Cycle',
      dataIndex: 'company_id',
      render: (value, record) => billingCycles[value as string] || 'Not set',
    },
    {
      title: 'Actions',
      dataIndex: 'company_id',
      render: (value) => (
        <Select
          options={[
            { value: 'weekly', label: 'Weekly' },
            { value: 'bi-weekly', label: 'Bi-Weekly' },
            { value: 'monthly', label: 'Monthly' },
            { value: 'quarterly', label: 'Quarterly' },
            { value: 'semi-annually', label: 'Semi-Annually' },
            { value: 'annually', label: 'Annually' },
          ]}
          onChange={(selectedValue) => handleBillingCycleChange(value as string, selectedValue)}
          value={billingCycles[value as string] || ''}
        />
      ),
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center">
          <h3 className="text-lg font-semibold">Billing Cycles</h3>
          <Tooltip content="Billing cycles determine how often a company is billed for services.">
            <Info className="ml-2 h-4 w-4 text-gray-500" />
          </Tooltip>
        </div>
        <Button onClick={fetchData} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}
        {loading ? (
          <div className="text-center py-4">Loading billing cycles...</div>
        ) : (
          <DataTable
            data={companies}
            columns={columns}
            pagination={true}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default BillingCycles;
