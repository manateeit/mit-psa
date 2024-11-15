'use client';

import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import CustomSelect from '@/components/ui/CustomSelect';
import { createAsset, listAssetTypes } from '@/lib/actions/asset-actions/assetActions';
import { TextArea } from '@/components/ui/TextArea';
import { CreateAssetRequest, AssetType } from '@/interfaces/asset.interfaces';
import { Switch } from '@/components/ui/Switch';


interface FormData {
  // Common fields
  name: string;
  asset_tag: string;
  type_id: string;
  status: 'active' | 'inactive' | 'maintenance';
  serial_number: string;
  location: string;
  purchase_date: string;
  warranty_end_date: string;
  notes: string;

  // Workstation fields
  os_type?: string;
  os_version?: string;
  cpu_model?: string;
  cpu_cores?: number;
  ram_gb?: number;
  storage_type?: string;
  storage_capacity_gb?: number;
  gpu_model?: string;

  // Network Device fields
  device_type?: 'switch' | 'router' | 'firewall' | 'access_point' | 'load_balancer';
  management_ip?: string;
  port_count?: number;
  firmware_version?: string;
  supports_poe?: boolean;
  power_draw_watts?: number;

  // Server fields
  server_os_type?: string;
  server_os_version?: string;
  server_cpu_model?: string;
  server_cpu_cores?: number;
  server_ram_gb?: number;
  raid_config?: string;
  is_virtual?: boolean;
  hypervisor?: string;
  primary_ip?: string;

  // Mobile Device fields
  mobile_os_type?: string;
  mobile_os_version?: string;
  model?: string;
  imei?: string;
  phone_number?: string;
  carrier?: string;
  is_supervised?: boolean;

  // Printer fields
  printer_model?: string;
  ip_address?: string;
  is_network_printer?: boolean;
  supports_color?: boolean;
  supports_duplex?: boolean;
  monthly_duty_cycle?: number;
}

const NewAssetPage = () => {
  const searchParams = useSearchParams();
  const companyId = searchParams?.get('company') || '';
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [assetTypes, setAssetTypes] = React.useState<AssetType[]>([]);
  const [selectedType, setSelectedType] = React.useState<AssetType | null>(null);
  const [formData, setFormData] = React.useState<FormData>({
    name: '',
    asset_tag: '',
    type_id: '',
    status: 'active',
    serial_number: '',
    location: '',
    purchase_date: '',
    warranty_end_date: '',
    notes: ''
  });

  // Fetch asset types on component mount
  React.useEffect(() => {
    const fetchAssetTypes = async () => {
      try {
        const types = await listAssetTypes();
        setAssetTypes(types);
      } catch (error) {
        console.error('Error fetching asset types:', error);
      }
    };
    fetchAssetTypes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
  
    try {
      if (!companyId) {
        throw new Error('Company ID is required');
      }
  
      if (!formData.type_id) {
        throw new Error('Please select an asset type');
      }
  
      // Helper function to safely convert date string to ISO format
      const convertToISODate = (dateString: string | undefined): string | undefined => {
        if (!dateString || dateString.trim() === '') {
          return undefined;
        }
        return new Date(dateString).toISOString();
      };
  
      const assetData: CreateAssetRequest = {
        type_id: formData.type_id,
        company_id: companyId,
        asset_tag: formData.asset_tag,
        name: formData.name,
        status: formData.status,
        location: formData.location || undefined,
        serial_number: formData.serial_number || undefined,
        purchase_date: convertToISODate(formData.purchase_date),
        warranty_end_date: convertToISODate(formData.warranty_end_date)
      };
  
      // Add type-specific data based on the selected type's name
      if (selectedType) {
        switch (selectedType.type_name.toLowerCase()) {
          case 'workstation':
            assetData.workstation = {
              os_type: formData.os_type || '',
              os_version: formData.os_version || '',
              cpu_model: formData.cpu_model || '',
              cpu_cores: Number(formData.cpu_cores) || 0,
              ram_gb: Number(formData.ram_gb) || 0,
              storage_type: formData.storage_type || '',
              storage_capacity_gb: Number(formData.storage_capacity_gb) || 0,
              gpu_model: formData.gpu_model || undefined,
              installed_software: [] // Initialize as empty array
            };
            break;
          case 'network_device':
            assetData.networkDevice = {
              device_type: formData.device_type || 'switch',
              management_ip: formData.management_ip || '',
              port_count: Number(formData.port_count) || 0,
              firmware_version: formData.firmware_version || '',
              supports_poe: formData.supports_poe || false,
              power_draw_watts: Number(formData.power_draw_watts) || 0,
              vlan_config: {},
              port_config: {}
            };
            break;
          case 'server':
            assetData.server = {
              os_type: formData.server_os_type || '',
              os_version: formData.server_os_version || '',
              cpu_model: formData.server_cpu_model || '',
              cpu_cores: Number(formData.server_cpu_cores) || 0,
              ram_gb: Number(formData.server_ram_gb) || 0,
              storage_config: [],
              raid_config: formData.raid_config,
              is_virtual: formData.is_virtual || false,
              hypervisor: formData.hypervisor,
              network_interfaces: [],
              primary_ip: formData.primary_ip,
              installed_services: []
            };
            break;
          case 'mobile_device':
            assetData.mobileDevice = {
              os_type: formData.mobile_os_type || '',
              os_version: formData.mobile_os_version || '',
              model: formData.model || '',
              imei: formData.imei,
              phone_number: formData.phone_number,
              carrier: formData.carrier,
              is_supervised: formData.is_supervised || false,
              installed_apps: []
            };
            break;
          case 'printer':
            assetData.printer = {
              model: formData.printer_model || '',
              ip_address: formData.ip_address,
              is_network_printer: formData.is_network_printer || false,
              supports_color: formData.supports_color || false,
              supports_duplex: formData.supports_duplex || false,
              monthly_duty_cycle: Number(formData.monthly_duty_cycle) || 0,
              supported_paper_types: [],
              supply_levels: {}
            };
            break;
        }
      }

      const asset = await createAsset(assetData);
      router.push(`/msp/companies/${companyId}?tab=assets`);
    } catch (error) {
      console.error('Error creating asset:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => {
      // Handle date fields
      if (e.target.type === 'date') {
        // Store as ISO string internally but keep the input format as YYYY-MM-DD
        return {
          ...prev,
          [field]: e.target.value // Store the YYYY-MM-DD format directly
        };
      }
  
      // Handle empty string values for optional fields
      if (e.target.value === '') {
        return {
          ...prev,
          [field]: undefined
        };
      }
  
      // Handle all other fields normally
      return {
        ...prev,
        [field]: e.target.value
      };
    });
  };

  const handleSelectChange = (field: keyof FormData) => (value: string) => {
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

  const handleSwitchChange = (field: keyof FormData) => (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked
    }));
  };

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'maintenance', label: 'Maintenance' }
  ];

  const networkDeviceTypeOptions = [
    { value: 'switch', label: 'Switch' },
    { value: 'router', label: 'Router' },
    { value: 'firewall', label: 'Firewall' },
    { value: 'access_point', label: 'Access Point' },
    { value: 'load_balancer', label: 'Load Balancer' }
  ];

  const renderTypeSpecificFields = () => {
    if (!selectedType) return null;

    switch (selectedType.type_name.toLowerCase()) {
      case 'workstation':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Operating System
                </label>
                <Input
                  value={formData.os_type || ''}
                  onChange={handleInputChange('os_type')}
                  placeholder="e.g., Windows, macOS, Linux"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OS Version
                </label>
                <Input
                  value={formData.os_version || ''}
                  onChange={handleInputChange('os_version')}
                  placeholder="e.g., 11, Monterey, Ubuntu 22.04"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPU Model
                </label>
                <Input
                  value={formData.cpu_model || ''}
                  onChange={handleInputChange('cpu_model')}
                  placeholder="e.g., Intel i7-12700K"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPU Cores
                </label>
                <Input
                  type="number"
                  value={formData.cpu_cores || ''}
                  onChange={handleInputChange('cpu_cores')}
                  placeholder="Number of CPU cores"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RAM (GB)
                </label>
                <Input
                  type="number"
                  value={formData.ram_gb || ''}
                  onChange={handleInputChange('ram_gb')}
                  placeholder="RAM in gigabytes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Storage Type
                </label>
                <Input
                  value={formData.storage_type || ''}
                  onChange={handleInputChange('storage_type')}
                  placeholder="e.g., SSD, HDD"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Storage Capacity (GB)
                </label>
                <Input
                  type="number"
                  value={formData.storage_capacity_gb || ''}
                  onChange={handleInputChange('storage_capacity_gb')}
                  placeholder="Storage capacity in gigabytes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GPU Model (optional)
                </label>
                <Input
                  value={formData.gpu_model || ''}
                  onChange={handleInputChange('gpu_model')}
                  placeholder="e.g., NVIDIA RTX 3080"
                />
              </div>
            </div>
          </div>
        );

      case 'network_device':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Device Type
                </label>
                <CustomSelect
                  options={networkDeviceTypeOptions}
                  value={formData.device_type || 'switch'}
                  onValueChange={handleSelectChange('device_type')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Management IP
                </label>
                <Input
                  value={formData.management_ip || ''}
                  onChange={handleInputChange('management_ip')}
                  placeholder="e.g., 192.168.1.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Port Count
                </label>
                <Input
                  type="number"
                  value={formData.port_count || ''}
                  onChange={handleInputChange('port_count')}
                  placeholder="Number of ports"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Firmware Version
                </label>
                <Input
                  value={formData.firmware_version || ''}
                  onChange={handleInputChange('firmware_version')}
                  placeholder="Current firmware version"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Power Draw (Watts)
                </label>
                <Input
                  type="number"
                  value={formData.power_draw_watts || ''}
                  onChange={handleInputChange('power_draw_watts')}
                  placeholder="Power consumption in watts"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="supports-poe"
                  checked={formData.supports_poe || false}
                  onCheckedChange={handleSwitchChange('supports_poe')}
                />
                <label htmlFor="supports-poe" className="text-sm font-medium text-gray-700">
                  Supports PoE
                </label>
              </div>
            </div>
          </div>
        );

      case 'server':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Operating System
                </label>
                <Input
                  value={formData.server_os_type || ''}
                  onChange={handleInputChange('server_os_type')}
                  placeholder="e.g., Windows Server, Ubuntu Server"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OS Version
                </label>
                <Input
                  value={formData.server_os_version || ''}
                  onChange={handleInputChange('server_os_version')}
                  placeholder="e.g., 2022, 22.04 LTS"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPU Model
                </label>
                <Input
                  value={formData.server_cpu_model || ''}
                  onChange={handleInputChange('server_cpu_model')}
                  placeholder="e.g., Intel Xeon E5-2680"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPU Cores
                </label>
                <Input
                  type="number"
                  value={formData.server_cpu_cores || ''}
                  onChange={handleInputChange('server_cpu_cores')}
                  placeholder="Number of CPU cores"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RAM (GB)
                </label>
                <Input
                  type="number"
                  value={formData.server_ram_gb || ''}
                  onChange={handleInputChange('server_ram_gb')}
                  placeholder="RAM in gigabytes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RAID Configuration
                </label>
                <Input
                  value={formData.raid_config || ''}
                  onChange={handleInputChange('raid_config')}
                  placeholder="e.g., RAID 1, RAID 5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary IP
                </label>
                <Input
                  value={formData.primary_ip || ''}
                  onChange={handleInputChange('primary_ip')}
                  placeholder="e.g., 192.168.1.10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hypervisor
                </label>
                <Input
                  value={formData.hypervisor || ''}
                  onChange={handleInputChange('hypervisor')}
                  placeholder="e.g., VMware ESXi, Hyper-V"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-virtual"
                  checked={formData.is_virtual || false}
                  onCheckedChange={handleSwitchChange('is_virtual')}
                />
                <label htmlFor="is-virtual" className="text-sm font-medium text-gray-700">
                  Virtual Machine
                </label>
              </div>
            </div>
          </div>
        );

      case 'mobile_device':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Operating System
                </label>
                <Input
                  value={formData.mobile_os_type || ''}
                  onChange={handleInputChange('mobile_os_type')}
                  placeholder="e.g., iOS, Android"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OS Version
                </label>
                <Input
                  value={formData.mobile_os_version || ''}
                  onChange={handleInputChange('mobile_os_version')}
                  placeholder="e.g., 16.5, 13"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <Input
                  value={formData.model || ''}
                  onChange={handleInputChange('model')}
                  placeholder="e.g., iPhone 14 Pro, Galaxy S23"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IMEI
                </label>
                <Input
                  value={formData.imei || ''}
                  onChange={handleInputChange('imei')}
                  placeholder="Device IMEI number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <Input
                  value={formData.phone_number || ''}
                  onChange={handleInputChange('phone_number')}
                  placeholder="Associated phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Carrier
                </label>
                <Input
                  value={formData.carrier || ''}
                  onChange={handleInputChange('carrier')}
                  placeholder="e.g., Verizon, AT&T"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-supervised"
                  checked={formData.is_supervised || false}
                  onCheckedChange={handleSwitchChange('is_supervised')}
                />
                <label htmlFor="is-supervised" className="text-sm font-medium text-gray-700">
                  Supervised Device
                </label>
              </div>
            </div>
          </div>
        );

      case 'printer':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Printer Model
                </label>
                <Input
                  value={formData.printer_model || ''}
                  onChange={handleInputChange('printer_model')}
                  placeholder="e.g., HP LaserJet Pro M404n"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IP Address
                </label>
                <Input
                  value={formData.ip_address || ''}
                  onChange={handleInputChange('ip_address')}
                  placeholder="e.g., 192.168.1.100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Duty Cycle
                </label>
                <Input
                  type="number"
                  value={formData.monthly_duty_cycle || ''}
                  onChange={handleInputChange('monthly_duty_cycle')}
                  placeholder="Pages per month"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-network-printer"
                  checked={formData.is_network_printer || false}
                  onCheckedChange={handleSwitchChange('is_network_printer')}
                />
                <label htmlFor="is-network-printer" className="text-sm font-medium text-gray-700">
                  Network Printer
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="supports-color"
                  checked={formData.supports_color || false}
                  onCheckedChange={handleSwitchChange('supports_color')}
                />
                <label htmlFor="supports-color" className="text-sm font-medium text-gray-700">
                  Color Support
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="supports-duplex"
                  checked={formData.supports_duplex || false}
                  onCheckedChange={handleSwitchChange('supports_duplex')}
                />
                <label htmlFor="supports-duplex" className="text-sm font-medium text-gray-700">
                  Duplex Printing
                </label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // If no company ID is provided, show an error
  if (!companyId) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="p-6">
          <h1 className="text-2xl font-semibold mb-6 text-red-600">Error</h1>
          <p>Company ID is required to create an asset.</p>
          <div className="mt-4">
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Add New Asset</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Common Fields */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asset Name
              </label>
              <Input
                required
                value={formData.name}
                onChange={handleInputChange('name')}
                placeholder="Enter asset name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asset Tag
              </label>
              <Input
                required
                value={formData.asset_tag}
                onChange={handleInputChange('asset_tag')}
                placeholder="Enter asset tag"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <CustomSelect
                options={assetTypes.map((type): { label: string; value: string } => ({
                  value: type.type_id,
                  label: type.type_name
                }))}
                value={formData.type_id}
                onValueChange={handleSelectChange('type_id')}
                placeholder="Select type"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <CustomSelect
                options={statusOptions}
                value={formData.status}
                onValueChange={handleSelectChange('status')}
                placeholder="Select status"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Serial Number
              </label>
              <Input
                value={formData.serial_number}
                onChange={handleInputChange('serial_number')}
                placeholder="Enter serial number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <Input
                value={formData.location}
                onChange={handleInputChange('location')}
                placeholder="Enter location"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Date
              </label>
              <Input
                type="date"
                value={formData.purchase_date}
                onChange={handleInputChange('purchase_date')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Warranty End Date
              </label>
              <Input
                type="date"
                value={formData.warranty_end_date}
                onChange={handleInputChange('warranty_end_date')}
              />
            </div>
          </div>

          {/* Type-specific Fields */}
          {selectedType && (
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold mb-4">Additional Details</h2>
              {renderTypeSpecificFields()}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <TextArea
              value={formData.notes}
              onChange={handleInputChange('notes')}
              placeholder="Enter notes"
              className="h-24"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.type_id}
            >
              {isSubmitting ? 'Creating...' : 'Create Asset'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default NewAssetPage;
