'use client';

import React, { useState, useEffect } from 'react';
import { ClientMaintenanceSummary, Asset, AssetType } from '@/interfaces/asset.interfaces';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { getClientMaintenanceSummary, listAssets, listAssetTypes } from '@/lib/actions/asset-actions/assetActions';
import { 
  Boxes, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Monitor,
  Server,
  Smartphone,
  Printer,
  Network
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CustomSelect from '@/components/ui/CustomSelect';
import { SelectOption } from '@/components/ui/Select';
import { QuickAddAsset } from '@/components/assets/QuickAddAsset';

interface CompanyAssetsProps {
  companyId: string;
}

const CompanyAssets: React.FC<CompanyAssetsProps> = ({ companyId }) => {
  const [summary, setSummary] = useState<ClientMaintenanceSummary | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const router = useRouter();
  const pageSize = 10;

  const getAssetTypeIcon = (type: string) => {
    const iconProps = { className: "h-5 w-5 inline-block mr-2" };
    switch (type.toLowerCase()) {
      case 'workstation':
        return <Monitor {...iconProps} />;
      case 'server':
        return <Server {...iconProps} />;
      case 'mobile_device':
        return <Smartphone {...iconProps} />;
      case 'printer':
        return <Printer {...iconProps} />;
      case 'network_device':
        return <Network {...iconProps} />;
      default:
        return <Boxes {...iconProps} />;
    }
  };

  const loadData = async () => {
    try {
      const [summaryData, assetsData, types] = await Promise.all([
        getClientMaintenanceSummary(companyId),
        listAssets({ 
          company_id: companyId, 
          type_id: selectedType === 'all' ? undefined : selectedType,
          page: currentPage,
          limit: pageSize
        }),
        listAssetTypes()
      ]);
      setSummary(summaryData);
      setAssets(assetsData.assets);
      setTotalItems(assetsData.total);
      setAssetTypes(types);
    } catch (error) {
      console.error('Error loading asset data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [companyId, selectedType, currentPage]);

  const handleAssetAdded = () => {
    loadData();
  };

  const renderAssetDetails = (asset: Asset): string => {
    if (asset.workstation) {
      return `${asset.workstation.os_type} - ${asset.workstation.cpu_model} - ${asset.workstation.ram_gb}GB RAM`;
    }
    if (asset.networkDevice) {
      return `${asset.networkDevice.device_type} - ${asset.networkDevice.management_ip || 'No IP'}`;
    }
    if (asset.server) {
      return `${asset.server.os_type} - ${asset.server.cpu_model} - ${asset.server.ram_gb}GB RAM`;
    }
    if (asset.mobileDevice) {
      return `${asset.mobileDevice.os_type} - ${asset.mobileDevice.model}`;
    }
    if (asset.printer) {
      return `${asset.printer.model} - ${asset.printer.is_network_printer ? 'Network' : 'Local'}`;
    }
    return 'No details available';
  };

  const columns = [
    {
      title: 'Asset Tag',
      dataIndex: 'asset_tag',
      render: (value: string, record: Asset) => (
        <Link 
          href={`/msp/assets/${record.asset_id}`}
          className="text-primary-600 hover:text-primary-700"
          prefetch={false}
        >
          {value}
        </Link>
      )
    },
    {
      title: 'Name',
      dataIndex: 'name'
    },
    {
      title: 'Type',
      dataIndex: 'type_name',
      render: (value: string) => (
        <div className="flex items-center">
          {getAssetTypeIcon(value)}
          <span>{value}</span>
        </div>
      )
    },
    {
      title: 'Details',
      dataIndex: 'details',
      render: (_: unknown, record: Asset) => renderAssetDetails(record)
    },
    {
      title: 'Serial Number',
      dataIndex: 'serial_number',
      render: (value: string | null) => value || '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value === 'active' 
            ? 'bg-green-100 text-green-800'
            : value === 'inactive'
            ? 'bg-gray-100 text-gray-800'
            : 'bg-amber-100 text-amber-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      title: 'Location',
      dataIndex: 'location',
      render: (value: string | null) => value || '-'
    },
    {
      title: 'Purchase Date',
      dataIndex: 'purchase_date',
      render: (value: string | null) => value ? new Date(value).toLocaleDateString() : '-'
    },
    {
      title: 'Warranty End',
      dataIndex: 'warranty_end_date',
      render: (value: string | null) => {
        if (!value) return '-';
        const date = new Date(value);
        const isExpired = date < new Date();
        return (
          <span className={isExpired ? 'text-red-600' : 'text-gray-900'}>
            {date.toLocaleDateString()}
          </span>
        );
      }
    }
  ];

  if (isLoading) {
    return <div>Loading assets...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Assets</p>
              <p className="text-2xl font-semibold">{summary?.total_assets || 0}</p>
            </div>
            <Boxes className="h-8 w-8 text-primary-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Maintenance Rate</p>
              <p className="text-2xl font-semibold">
                {Math.round(summary?.compliance_rate || 0)}%
              </p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Overdue</p>
              <p className="text-2xl font-semibold">{summary?.overdue_maintenances || 0}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Upcoming</p>
              <p className="text-2xl font-semibold">{summary?.upcoming_maintenances || 0}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Actions and Filters */}
      <div className="flex justify-between items-center">
        <div className="w-64">
          <CustomSelect
            options={[
              { value: 'all', label: 'All Asset Types' },
              ...assetTypes.map((type): SelectOption => ({
                value: type.type_id,
                label: type.type_name
              }))
            ]}
            value={selectedType}
            onValueChange={setSelectedType}
            placeholder="Filter by type..."
          />
        </div>
        <QuickAddAsset 
          companyId={companyId} 
          onAssetAdded={handleAssetAdded} 
        />
      </div>

      {/* Assets Table */}
      <DataTable
        data={assets}
        columns={columns}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onRowClick={(asset) => router.push(`/msp/assets/${asset.asset_id}`)}
        totalItems={totalItems}
        pageSize={pageSize}
      />

      {/* Maintenance Type Breakdown */}
      {summary?.maintenance_by_type && Object.keys(summary.maintenance_by_type).length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Maintenance Types</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(summary.maintenance_by_type).map(([type, count]): JSX.Element => (
              <div key={type} className="text-center">
                <p className="text-sm text-gray-500 capitalize">{type}</p>
                <p className="text-xl font-semibold">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Asset Stats */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Asset Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Assets with Maintenance</p>
            <p className="text-xl font-semibold">{summary?.assets_with_maintenance || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Schedules</p>
            <p className="text-xl font-semibold">{summary?.total_schedules || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Active Maintenance Plans</p>
            <p className="text-xl font-semibold">
              {(summary?.assets_with_maintenance || 0) > 0
                ? Math.round(
                    ((summary?.total_schedules || 0) /
                      (summary?.assets_with_maintenance || 1)) *
                      100
                  )
                : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyAssets;
