'use client';

import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { createAsset, listAssetTypes } from '@/lib/actions/asset-actions/assetActions';
import { AssetType, CreateAssetRequest } from '@/interfaces/asset.interfaces';
import { SelectOption } from '@/components/ui/CustomSelect';
import { CompanyPicker } from '@/components/companies/CompanyPicker';
import { ICompany } from '@/interfaces';
import { getAllCompanies } from '@/lib/actions/companyActions';

interface QuickAddAssetProps {
  companyId?: string;
  onAssetAdded: () => void;
}

type NetworkDeviceType = 'switch' | 'router' | 'firewall' | 'access_point' | 'load_balancer';
type AssetStatus = 'active' | 'inactive' | 'maintenance';

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'maintenance', label: 'Maintenance' }
];

interface FormData {
  name: string;
  asset_tag: string;
  type_id: string;
  status: AssetStatus;
  serial_number: string;
  workstation: {
    os_type: string;
    os_version: string;
  };
  networkDevice: {
    device_type: NetworkDeviceType;
    management_ip: string;
  };
  server: {
    os_type: string;
    os_version: string;
  };
  mobileDevice: {
    os_type: string;
    model: string;
    is_supervised: boolean;
  };
  printer: {
    model: string;
  };
}

export function QuickAddAsset({ companyId, onAssetAdded }: QuickAddAssetProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [companies, setCompanies] = useState<ICompany[]>([]);
  const [selectedType, setSelectedType] = useState<AssetType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(companyId || null);

  // Initialize with minimum required fields
  const [formData, setFormData] = useState<FormData>({
    name: '',
    asset_tag: '',
    type_id: '',
    status: 'active',
    serial_number: '',
    // Type-specific fields will be added conditionally
    workstation: {
      os_type: '',
      os_version: ''
    },
    networkDevice: {
      device_type: 'switch',
      management_ip: ''
    },
    server: {
      os_type: '',
      os_version: ''
    },
    mobileDevice: {
      os_type: '',
      model: '',
      is_supervised: false
    },
    printer: {
      model: ''
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [types, companiesData] = await Promise.all([
          listAssetTypes(),
          !companyId ? getAllCompanies(false) : Promise.resolve([])
        ]);
        setAssetTypes(types);
        if (!companyId) {
          setCompanies(companiesData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch required data');
      }
    };
    if (open) {
      fetchData();
    }
  }, [open, companyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const effectiveCompanyId = companyId || selectedCompanyId;
      if (!effectiveCompanyId) {
        throw new Error('Please select a company');
      }

      if (!formData.type_id) {
        throw new Error('Please select an asset type');
      }

      const assetData: CreateAssetRequest = {
        type_id: formData.type_id,
        company_id: effectiveCompanyId,
        asset_tag: formData.asset_tag,
        name: formData.name,
        status: formData.status,
        serial_number: formData.serial_number || undefined
      };

      // Add type-specific data based on the selected type's name
      if (selectedType) {
        switch (selectedType.type_name.toLowerCase()) {
          case 'workstation':
            assetData.workstation = {
              os_type: formData.workstation.os_type,
              os_version: formData.workstation.os_version,
              cpu_model: '',
              cpu_cores: 0,
              ram_gb: 0,
              storage_type: '',
              storage_capacity_gb: 0,
              installed_software: []
            };
            break;
          case 'network_device':
            assetData.networkDevice = {
              device_type: formData.networkDevice.device_type,
              management_ip: formData.networkDevice.management_ip,
              port_count: 0,
              firmware_version: '',
              supports_poe: false,
              power_draw_watts: 0,
              vlan_config: {},
              port_config: {}
            };
            break;
          case 'server':
            assetData.server = {
              os_type: formData.server.os_type,
              os_version: formData.server.os_version,
              cpu_model: '',
              cpu_cores: 0,
              ram_gb: 0,
              storage_config: [],
              is_virtual: false,
              network_interfaces: [],
              installed_services: []
            };
            break;
          case 'mobile_device':
            assetData.mobileDevice = {
              os_type: formData.mobileDevice.os_type,
              os_version: '',
              model: formData.mobileDevice.model,
              is_supervised: formData.mobileDevice.is_supervised,
              installed_apps: []
            };
            break;
          case 'printer':
            assetData.printer = {
              model: formData.printer.model,
              is_network_printer: false,
              supports_color: false,
              supports_duplex: false,
              supported_paper_types: [],
              supply_levels: {}
            };
            break;
        }
      }

      await createAsset(assetData);
      onAssetAdded();
      setOpen(false);
      // Reset form
      setFormData({
        name: '',
        asset_tag: '',
        type_id: '',
        status: 'active',
        serial_number: '',
        workstation: { os_type: '', os_version: '' },
        networkDevice: { device_type: 'switch', management_ip: '' },
        server: { os_type: '', os_version: '' },
        mobileDevice: { os_type: '', model: '', is_supervised: false },
        printer: { model: '' }
      });
      setSelectedType(null);
      if (!companyId) {
        setSelectedCompanyId(null);
      }
    } catch (error) {
      console.error('Error creating asset:', error);
      setError(error instanceof Error ? error.message : 'Failed to create asset');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTypeSpecificFields = () => {
    if (!selectedType) return null;

    switch (selectedType.type_name.toLowerCase()) {
      case 'workstation':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">OS Type</label>
              <Input
                value={formData.workstation.os_type}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  workstation: { ...prev.workstation, os_type: e.target.value }
                }))}
                placeholder="e.g., Windows, macOS, Linux"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">OS Version</label>
              <Input
                value={formData.workstation.os_version}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  workstation: { ...prev.workstation, os_version: e.target.value }
                }))}
                placeholder="e.g., 11, Monterey, Ubuntu 22.04"
                required
              />
            </div>
          </>
        );

      case 'network_device':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">Device Type</label>
              <Select
                options={[
                  { value: 'switch', label: 'Switch' },
                  { value: 'router', label: 'Router' },
                  { value: 'firewall', label: 'Firewall' },
                  { value: 'access_point', label: 'Access Point' },
                  { value: 'load_balancer', label: 'Load Balancer' }
                ]}
                value={formData.networkDevice.device_type}
                onChange={(value) => setFormData(prev => ({
                  ...prev,
                  networkDevice: { ...prev.networkDevice, device_type: value as NetworkDeviceType }
                }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Management IP</label>
              <Input
                value={formData.networkDevice.management_ip}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  networkDevice: { ...prev.networkDevice, management_ip: e.target.value }
                }))}
                placeholder="e.g., 192.168.1.1"
                required
              />
            </div>
          </>
        );

      case 'server':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">OS Type</label>
              <Input
                value={formData.server.os_type}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  server: { ...prev.server, os_type: e.target.value }
                }))}
                placeholder="e.g., Windows Server, Ubuntu Server"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">OS Version</label>
              <Input
                value={formData.server.os_version}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  server: { ...prev.server, os_version: e.target.value }
                }))}
                placeholder="e.g., 2022, 22.04 LTS"
                required
              />
            </div>
          </>
        );

      case 'mobile_device':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">OS Type</label>
              <Select
                options={[
                  { value: 'ios', label: 'iOS' },
                  { value: 'android', label: 'Android' }
                ]}
                value={formData.mobileDevice.os_type}
                onChange={(value) => setFormData(prev => ({
                  ...prev,
                  mobileDevice: { ...prev.mobileDevice, os_type: value }
                }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Model</label>
              <Input
                value={formData.mobileDevice.model}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  mobileDevice: { ...prev.mobileDevice, model: e.target.value }
                }))}
                placeholder="e.g., iPhone 14 Pro, Galaxy S23"
                required
              />
            </div>
          </>
        );

      case 'printer':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">Model</label>
            <Input
              value={formData.printer.model}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                printer: { ...prev.printer, model: e.target.value }
              }))}
              placeholder="e.g., HP LaserJet Pro M404n"
              required
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button>Add Asset</Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg w-[480px]">
          <Dialog.Title className="text-lg font-bold mb-4">Add New Asset</Dialog.Title>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!companyId && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Company</label>
                <CompanyPicker
                  companies={companies}
                  selectedCompanyId={selectedCompanyId}
                  onSelect={setSelectedCompanyId}
                  filterState="active"
                  onFilterStateChange={() => {}}
                  clientTypeFilter="all"
                  onClientTypeFilterChange={() => {}}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Asset Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter asset name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Asset Tag</label>
              <Input
                value={formData.asset_tag}
                onChange={(e) => setFormData(prev => ({ ...prev, asset_tag: e.target.value }))}
                placeholder="Enter asset tag"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <Select
                options={assetTypes.map((type): SelectOption => ({
                  value: type.type_id,
                  label: type.type_name
                }))}
                value={formData.type_id}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, type_id: value }));
                  setSelectedType(assetTypes.find(t => t.type_id === value) || null);
                }}
                placeholder="Select type"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <Select
                options={STATUS_OPTIONS}
                value={formData.status}
                onChange={(value) => setFormData(prev => ({ ...prev, status: value as AssetStatus }))}
                placeholder="Select status"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Serial Number</label>
              <Input
                value={formData.serial_number}
                onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
                placeholder="Enter serial number"
              />
            </div>

            {selectedType && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Type-specific Details</h3>
                {renderTypeSpecificFields()}
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Asset'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
