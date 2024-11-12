'use client';

import { useState } from 'react';
import { Asset, AssetListResponse } from '@/interfaces/asset.interfaces';
import { IUser } from '@/interfaces/auth.interfaces';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Plus } from 'lucide-react';
import { formatDateOnly, getUserTimeZone, utcToLocal } from '@/lib/utils/dateTimeUtils';
import CreateAssetDialog from './CreateAssetDialog';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDefinition } from '@/interfaces/dataTable.interfaces';

interface AssetDashboardProps {
  initialAssets: AssetListResponse;
  user: IUser;
}

export default function AssetDashboard({ initialAssets, user }: AssetDashboardProps) {
  const [assets, setAssets] = useState<Asset[]>(initialAssets.assets);
  const [isCreating, setIsCreating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const userTimeZone = getUserTimeZone();

  const handleCreateAsset = () => {
    setIsCreating(true);
  };

  const formatAssetDate = (dateString: string | undefined): string => {
    if (!dateString) return '-';
    const localDate = utcToLocal(dateString, userTimeZone);
    return formatDateOnly(localDate);
  };

  const columns: ColumnDefinition<Asset>[] = [
    {
      title: 'Name',
      dataIndex: 'name',
    },
    {
      title: 'Tag',
      dataIndex: 'asset_tag',
    },
    {
      title: 'Type',
      dataIndex: 'type_id',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (value: string) => (
        <span className={`capitalize ${
          value === 'active' ? 'text-green-600' :
          value === 'maintenance' ? 'text-yellow-600' :
          value === 'retired' ? 'text-red-600' :
          'text-gray-600'
        }`}>
          {value}
        </span>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      render: (value: string | undefined) => value || '-',
    },
    {
      title: 'Purchase Date',
      dataIndex: 'purchase_date',
      render: (value: string | undefined) => formatAssetDate(value),
    },
    {
      title: 'Warranty End',
      dataIndex: 'warranty_end_date',
      render: (value: string | undefined) => formatAssetDate(value),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Assets</h1>
        <Button
          onClick={handleCreateAsset}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Asset
        </Button>
      </div>

      <Card className="overflow-hidden">
        <DataTable
          data={assets}
          columns={columns}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onRowClick={(asset) => {
            // TODO: Implement asset details view
            console.log('Clicked asset:', asset);
          }}
        />
      </Card>

      {isCreating && (
        <CreateAssetDialog
          onClose={() => setIsCreating(false)}
          onAssetCreated={(newAsset) => {
            setAssets([...assets, newAsset]);
            setIsCreating(false);
          }}
        />
      )}
    </div>
  );
}
