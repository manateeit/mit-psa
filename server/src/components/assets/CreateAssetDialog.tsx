'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import CustomSelect, { SelectOption } from '@/components/ui/CustomSelect';
import { Asset, CreateAssetRequest, AssetType, WorkstationAsset, NetworkDeviceAsset } from '@/interfaces/asset.interfaces';
import { ICompany } from '@/interfaces';
import { createAsset, listAssetTypes } from '@/lib/actions/asset-actions/assetActions';
import { getAllCompanies } from '@/lib/actions/companyActions';
import { CompanyPicker } from '@/components/companies/CompanyPicker';

interface CreateAssetDialogProps {
  onClose: () => void;
  onAssetCreated: (asset: Asset) => void;
}

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'retired', label: 'Retired' },
];

type WorkstationFields = Required<Omit<WorkstationAsset, 'tenant' | 'asset_id'>>;
type NetworkDeviceFields = Required<Omit<NetworkDeviceAsset, 'tenant' | 'asset_id'>>;

const INITIAL_WORKSTATION: WorkstationFields = {
  os_type: '',
  os_version: '',
  cpu_model: '',
  cpu_cores: 0,
  ram_gb: 0,
  storage_type: '',
  storage_capacity_gb: 0,
  gpu_model: '',
  installed_software: [],
  last_login: new Date().toISOString()
};

const INITIAL_NETWORK_DEVICE: NetworkDeviceFields = {
  device_type: 'switch',
  management_ip: '',
  port_count: 0,
  firmware_version: '',
  supports_poe: false,
  power_draw_watts: 0,
  vlan_config: {},
  port_config: {}
};

const INITIAL_FORM_DATA: CreateAssetRequest = {
  type_id: '',
  company_id: '',
  asset_tag: '',
  name: '',
  status: 'active',
  workstation: INITIAL_WORKSTATION,
  networkDevice: INITIAL_NETWORK_DEVICE
};

export default function CreateAssetDialog({ onClose, onAssetCreated }: CreateAssetDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [companies, setCompanies] = useState<ICompany[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [formData, setFormData] = useState<CreateAssetRequest>(INITIAL_FORM_DATA);
  const [selectedType, setSelectedType] = useState<AssetType | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [types, companiesList] = await Promise.all([
          listAssetTypes(),
          getAllCompanies(false)
        ]);
        setAssetTypes(types);
        setCompanies(companiesList);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoadingTypes(false);
        setIsLoadingCompanies(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newAsset = await createAsset(formData);
      onAssetCreated(newAsset);
      onClose();
    } catch (error) {
      console.error('Error creating asset:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof CreateAssetRequest, value: string): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Update selected type when type_id changes
    if (field === 'type_id') {
      const type = assetTypes.find(t => t.type_id === value);
      setSelectedType(type || null);
    }
  };

  const updateWorkstationField = <K extends keyof WorkstationFields>(
    field: K,
    value: WorkstationFields[K]
  ): void => {
    setFormData(prev => ({
      ...prev,
      workstation: {
        ...INITIAL_WORKSTATION,
        ...prev.workstation,
        [field]: value
      }
    }));
  };

  const updateNetworkDeviceField = <K extends keyof NetworkDeviceFields>(
    field: K,
    value: NetworkDeviceFields[K]
  ): void => {
    setFormData(prev => ({
      ...prev,
      networkDevice: {
        ...INITIAL_NETWORK_DEVICE,
        ...prev.networkDevice,
        [field]: value
      }
    }));
  };

  // Render type-specific fields based on the selected asset type
  const renderTypeSpecificFields = () => {
    if (!selectedType) return null;

    switch (selectedType.type_name.toLowerCase()) {
      case 'workstation':
        return (
          <>
            <div>
              <Label>OS Type</Label>
              <Input
                value={formData.workstation?.os_type || ''}
                onChange={(e) => updateWorkstationField('os_type', e.target.value)}
              />
            </div>
            <div>
              <Label>CPU Model</Label>
              <Input
                value={formData.workstation?.cpu_model || ''}
                onChange={(e) => updateWorkstationField('cpu_model', e.target.value)}
              />
            </div>
            <div>
              <Label>RAM (GB)</Label>
              <Input
                type="number"
                value={formData.workstation?.ram_gb || ''}
                onChange={(e) => updateWorkstationField('ram_gb', parseInt(e.target.value) || 0)}
              />
            </div>
          </>
        );
      case 'network_device':
        return (
          <>
            <div>
              <Label>Device Type</Label>
              <CustomSelect
                options={[
                  { value: 'switch', label: 'Switch' },
                  { value: 'router', label: 'Router' },
                  { value: 'firewall', label: 'Firewall' },
                  { value: 'access_point', label: 'Access Point' },
                  { value: 'load_balancer', label: 'Load Balancer' }
                ]}
                value={formData.networkDevice?.device_type || 'switch'}
                onValueChange={(value) => updateNetworkDeviceField('device_type', value as NetworkDeviceFields['device_type'])}
              />
            </div>
            <div>
              <Label>Management IP</Label>
              <Input
                value={formData.networkDevice?.management_ip || ''}
                onChange={(e) => updateNetworkDeviceField('management_ip', e.target.value)}
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      title="Create New Asset"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Base fields */}
        <div>
          <Label htmlFor="name">Name</Label>
          <div className="mt-1">
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="asset_tag">Asset Tag</Label>
          <div className="mt-1">
            <Input
              id="asset_tag"
              value={formData.asset_tag}
              onChange={(e) => handleChange('asset_tag', e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="type_id">Asset Type</Label>
          <div className="mt-1">
            <CustomSelect
              options={assetTypes.map((type): SelectOption => ({
                value: type.type_id,
                label: type.type_name
              }))}
              value={formData.type_id}
              onValueChange={(value) => handleChange('type_id', value)}
              placeholder={isLoadingTypes ? "Loading asset types..." : "Select Asset Type"}
            />
          </div>
        </div>

        {/* Type-specific fields */}
        {renderTypeSpecificFields()}

        {/* Common fields */}
        <div>
          <Label htmlFor="company_id">Client</Label>
          <div className="mt-1">
            <CompanyPicker
              companies={companies}
              selectedCompanyId={formData.company_id || null}
              onSelect={(companyId) => handleChange('company_id', companyId)}
              filterState="active"
              onFilterStateChange={() => {}}
              clientTypeFilter="all"
              onClientTypeFilterChange={() => {}}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <div className="mt-1">
            <CustomSelect
              options={STATUS_OPTIONS}
              value={formData.status}
              onValueChange={(value) => handleChange('status', value)}
              placeholder="Select Status"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="location">Location</Label>
          <div className="mt-1">
            <Input
              id="location"
              value={formData.location || ''}
              onChange={(e) => handleChange('location', e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="serial_number">Serial Number</Label>
          <div className="mt-1">
            <Input
              id="serial_number"
              value={formData.serial_number || ''}
              onChange={(e) => handleChange('serial_number', e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isLoadingTypes || isLoadingCompanies}
          >
            Create Asset
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
