'use client';

import React from 'react';
import { Card, Flex, Text, Heading } from '@radix-ui/themes';
import { Asset, AssetMaintenanceReport, AssetRelationship, NetworkDeviceAsset } from '@/interfaces/asset.interfaces';
import { getAssetMaintenanceReport } from '@/lib/actions/asset-actions/assetActions';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Documents from '@/components/documents/Documents';
import {
  Edit,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Monitor,
  Network,
  Server,
  Smartphone,
  Printer as PrinterIcon,
  HardDrive,
  Cpu,
  CircuitBoard,
  Wifi,
  Gauge,
  Power,
  Database,
  Cloud,
  Signal,
  Palette,
  RotateCw,
  Router,
  Shield,
  Radio,
  Scale,
  Smartphone as PhoneIcon,
  AppWindow,
  Printer,
  FileStack,
  Layers,
  Fingerprint
} from 'lucide-react';
import CreateTicketFromAssetButton from './CreateTicketFromAssetButton';
import CustomTabs from '@/components/ui/CustomTabs';

interface AssetDetailsProps {
  asset: Asset;
}

export default function AssetDetails({ asset }: AssetDetailsProps) {
  const [maintenanceReport, setMaintenanceReport] = React.useState<AssetMaintenanceReport | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();

  React.useEffect(() => {
    const loadMaintenanceReport = async () => {
      try {
        const report = await getAssetMaintenanceReport(asset.asset_id);
        setMaintenanceReport(report);
      } catch (error) {
        console.error('Error loading maintenance report:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMaintenanceReport();
  }, [asset.asset_id]);

  const getNetworkDeviceIcon = (deviceType: NetworkDeviceAsset['device_type']) => {
    switch (deviceType) {
      case 'switch': return <Network className="h-8 w-8" />;
      case 'router': return <Router className="h-8 w-8" />;
      case 'firewall': return <Shield className="h-8 w-8" />;
      case 'access_point': return <Radio className="h-8 w-8" />;
      case 'load_balancer': return <Scale className="h-8 w-8" />;
      default: return <Network className="h-8 w-8" />;
    }
  };

  const getAssetTypeIcon = () => {
    const iconClass = "h-16 w-16 text-primary-500";

    if (asset.workstation) return <Monitor className={iconClass} />;
    if (asset.network_device) return <Network className={iconClass} />;
    if (asset.server) return <Server className={iconClass} />;
    if (asset.mobile_device) return <Smartphone className={iconClass} />;
    if (asset.printer) return <PrinterIcon className={iconClass} />;
    return null;
  };

  const renderBasicInfo = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div>
        <Text as="div" size="2" className="font-medium text-gray-700">Status</Text>
        <div className={`inline-flex px-2 py-1 rounded-full text-sm ${
          asset.status === 'active' ? 'bg-green-100 text-green-800' :
          asset.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
          'bg-amber-100 text-amber-800'
        }`}>
          {asset.status}
        </div>
      </div>
      <div>
        <Text as="div" size="2" className="font-medium text-gray-700">Serial Number</Text>
        <Text as="div" size="2">{asset.serial_number || 'Not specified'}</Text>
      </div>
      <div>
        <Text as="div" size="2" className="font-medium text-gray-700">Location</Text>
        <Text as="div" size="2">{asset.location || 'Not specified'}</Text>
      </div>
      <div>
        <Text as="div" size="2" className="font-medium text-gray-700">Company</Text>
        <Text as="div" size="2">{asset.company?.company_name || 'Unassigned'}</Text>
      </div>
      {asset.purchase_date && (
        <div>
          <Text as="div" size="2" className="font-medium text-gray-700">Purchase Date</Text>
          <Text as="div" size="2">{new Date(asset.purchase_date).toLocaleDateString()}</Text>
        </div>
      )}
      {asset.warranty_end_date && (
        <div>
          <Text as="div" size="2" className="font-medium text-gray-700">Warranty End</Text>
          <Text as="div" size="2" className={new Date(asset.warranty_end_date) < new Date() ? 'text-red-600' : ''}>
            {new Date(asset.warranty_end_date).toLocaleDateString()}
          </Text>
        </div>
      )}
    </div>
  );

  const renderTypeSpecificDetails = () => {
    if (asset.workstation) {
      return (
        <div className="space-y-6">
          <Flex align="center" gap="4" className="mb-6">
            <Monitor className="h-16 w-16 text-primary-500" />
            <div>
              <Text as="div" size="5" weight="medium">Workstation Details</Text>
              <Text as="div" size="2" color="gray">{asset.workstation.os_type} {asset.workstation.os_version}</Text>
            </div>
          </Flex>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-4">
              <Flex gap="3" align="center">
                <Cpu className="h-6 w-6 text-primary-400" />
                <div>
                  <Text as="div" size="2" weight="medium">CPU</Text>
                  <Text as="div" size="2">{asset.workstation.cpu_model} ({asset.workstation.cpu_cores} cores)</Text>
                </div>
              </Flex>
            </Card>
            <Card className="p-4">
              <Flex gap="3" align="center">
                <CircuitBoard className="h-6 w-6 text-primary-400" />
                <div>
                  <Text as="div" size="2" weight="medium">RAM</Text>
                  <Text as="div" size="2">{asset.workstation.ram_gb}GB</Text>
                </div>
              </Flex>
            </Card>
            <Card className="p-4">
              <Flex gap="3" align="center">
                <HardDrive className="h-6 w-6 text-primary-400" />
                <div>
                  <Text as="div" size="2" weight="medium">Storage</Text>
                  <Text as="div" size="2">{asset.workstation.storage_type} - {asset.workstation.storage_capacity_gb}GB</Text>
                </div>
              </Flex>
            </Card>
            {asset.workstation.gpu_model && (
              <Card className="p-4">
                <Flex gap="3" align="center">
                  <Monitor className="h-6 w-6 text-primary-400" />
                  <div>
                    <Text as="div" size="2" weight="medium">GPU</Text>
                    <Text as="div" size="2">{asset.workstation.gpu_model}</Text>
                  </div>
                </Flex>
              </Card>
            )}
            <Card className="p-4">
              <Flex gap="3" align="center">
                <Clock className="h-6 w-6 text-primary-400" />
                <div>
                  <Text as="div" size="2" weight="medium">Last Login</Text>
                  <Text as="div" size="2">
                    {asset.workstation.last_login ? new Date(asset.workstation.last_login).toLocaleString() : 'Never'}
                  </Text>
                </div>
              </Flex>
            </Card>
          </div>
        </div>
      );
    }

    if (asset.network_device) {
      return (
        <div className="space-y-6">
          <Flex align="center" gap="4" className="mb-6">
            {getNetworkDeviceIcon(asset.network_device.device_type)}
            <div>
              <Text as="div" size="5" weight="medium">Network Device Details</Text>
              <Text as="div" size="2" color="gray">
                {asset.network_device.device_type.charAt(0).toUpperCase() + asset.network_device.device_type.slice(1)}
              </Text>
            </div>
          </Flex>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-4">
              <Flex gap="3" align="center">
                <Signal className="h-6 w-6 text-primary-400" />
                <div>
                  <Text as="div" size="2" weight="medium">Management IP</Text>
                  <Text as="div" size="2">{asset.network_device.management_ip}</Text>
                </div>
              </Flex>
            </Card>
            <Card className="p-4">
              <Flex gap="3" align="center">
                <Layers className="h-6 w-6 text-primary-400" />
                <div>
                  <Text as="div" size="2" weight="medium">Port Count</Text>
                  <Text as="div" size="2">{asset.network_device.port_count}</Text>
                </div>
              </Flex>
            </Card>
            <Card className="p-4">
              <Flex gap="3" align="center">
                <Power className="h-6 w-6 text-primary-400" />
                <div>
                  <Text as="div" size="2" weight="medium">Power Draw</Text>
                  <Text as="div" size="2">{asset.network_device.power_draw_watts}W</Text>
                </div>
              </Flex>
            </Card>
            <Card className="p-4">
              <Flex gap="3" align="center">
                <RotateCw className="h-6 w-6 text-primary-400" />
                <div>
                  <Text as="div" size="2" weight="medium">Firmware Version</Text>
                  <Text as="div" size="2">{asset.network_device.firmware_version}</Text>
                </div>
              </Flex>
            </Card>
            <Card className="p-4">
              <Flex gap="3" align="center">
                <Power className="h-6 w-6 text-primary-400" />
                <div>
                  <Text as="div" size="2" weight="medium">PoE Support</Text>
                  <Text as="div" size="2">{asset.network_device.supports_poe ? 'Yes' : 'No'}</Text>
                </div>
              </Flex>
            </Card>
          </div>
        </div>
      );
    }

    if (asset.server) {
      return (
        <div className="space-y-6">
          <Flex align="center" gap="4" className="mb-6">
            <Server className="h-16 w-16 text-primary-500" />
            <div>
              <Text as="div" size="5" weight="medium">Server Details</Text>
              <Text as="div" size="2" color="gray">{asset.server.os_type} {asset.server.os_version}</Text>
            </div>
          </Flex>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-4">
              <Flex gap="3" align="center">
                <Cpu className="h-6 w-6 text-primary-400" />
                <div>
                  <Text as="div" size="2" weight="medium">CPU</Text>
                  <Text as="div" size="2">{asset.server.cpu_model} ({asset.server.cpu_cores} cores)</Text>
                </div>
              </Flex>
            </Card>
            <Card className="p-4">
              <Flex gap="3" align="center">
                <CircuitBoard className="h-6 w-6 text-primary-400" />
                <div>
                  <Text as="div" size="2" weight="medium">RAM</Text>
                  <Text as="div" size="2">{asset.server.ram_gb}GB</Text>
                </div>
              </Flex>
            </Card>
            <Card className="p-4">
              <Flex gap="3" align="center">
                <Cloud className="h-6 w-6 text-primary-400" />
                <div>
                  <Text as="div" size="2" weight="medium">Type</Text>
                  <Text as="div" size="2">{asset.server.is_virtual ? 'Virtual' : 'Physical'}</Text>
                </div>
              </Flex>
            </Card>
            {asset.server.hypervisor && (
              <Card className="p-4">
                <Flex gap="3" align="center">
                  <Database className="h-6 w-6 text-primary-400" />
                  <div>
                    <Text as="div" size="2" weight="medium">Hypervisor</Text>
                    <Text as="div" size="2">{asset.server.hypervisor}</Text>
                  </div>
                </Flex>
              </Card>
            )}
            {asset.server.primary_ip && (
              <Card className="p-4">
                <Flex gap="3" align="center">
                  <Network className="h-6 w-6 text-primary-400" />
                  <div>
                    <Text as="div" size="2" weight="medium">Primary IP</Text>
                    <Text as="div" size="2">{asset.server.primary_ip}</Text>
                  </div>
                </Flex>
              </Card>
            )}
          </div>
        </div>
      );
    }

    if (asset.mobile_device) {
      return (
        <div className="space-y-6">
          <Flex align="center" gap="4" className="mb-6">
            <PhoneIcon className="h-16 w-16 text-primary-500" />
            <div>
              <Text as="div" size="5" weight="medium">Mobile Device Details</Text>
              <Text as="div" size="2" color="gray">{asset.mobile_device.model}</Text>
            </div>
          </Flex>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-4">
              <Flex gap="3" align="center">
                <AppWindow className="h-6 w-6 text-primary-400" />
                <div>
                  <Text as="div" size="2" weight="medium">Operating System</Text>
                  <Text as="div" size="2">{asset.mobile_device.os_type} {asset.mobile_device.os_version}</Text>
                </div>
              </Flex>
            </Card>
            {asset.mobile_device.imei && (
              <Card className="p-4">
                <Flex gap="3" align="center">
                  <Fingerprint className="h-6 w-6 text-primary-400" />
                  <div>
                    <Text as="div" size="2" weight="medium">IMEI</Text>
                    <Text as="div" size="2">{asset.mobile_device.imei}</Text>
                  </div>
                </Flex>
              </Card>
            )}
            {asset.mobile_device.phone_number && (
              <Card className="p-4">
                <Flex gap="3" align="center">
                  <PhoneIcon className="h-6 w-6 text-primary-400" />
                  <div>
                    <Text as="div" size="2" weight="medium">Phone Number</Text>
                    <Text as="div" size="2">{asset.mobile_device.phone_number}</Text>
                  </div>
                </Flex>
              </Card>
            )}
            {asset.mobile_device.carrier && (
              <Card className="p-4">
                <Flex gap="3" align="center">
                  <Signal className="h-6 w-6 text-primary-400" />
                  <div>
                    <Text as="div" size="2" weight="medium">Carrier</Text>
                    <Text as="div" size="2">{asset.mobile_device.carrier}</Text>
                  </div>
                </Flex>
              </Card>
            )}
            <Card className="p-4">
              <Flex gap="3" align="center">
                <Shield className="h-6 w-6 text-primary-400" />
                <div>
                  <Text as="div" size="2" weight="medium">Supervision Status</Text>
                  <Text as="div" size="2">{asset.mobile_device.is_supervised ? 'Supervised' : 'Unsupervised'}</Text>
                </div>
              </Flex>
            </Card>
          </div>
        </div>
      );
    }

    if (asset.printer) {
      return (
        <div className="space-y-6">
          <Flex align="center" gap="4" className="mb-6">
            <Printer className="h-16 w-16 text-primary-500" />
            <div>
              <Text as="div" size="5" weight="medium">Printer Details</Text>
              <Text as="div" size="2" color="gray">{asset.printer.model}</Text>
            </div>
          </Flex>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {asset.printer.ip_address && (
              <Card className="p-4">
                <Flex gap="3" align="center">
                  <Network className="h-6 w-6 text-primary-400" />
                  <div>
                    <Text as="div" size="2" weight="medium">IP Address</Text>
                    <Text as="div" size="2">{asset.printer.ip_address}</Text>
                  </div>
                </Flex>
              </Card>
            )}
            <Card className="p-4">
              <Flex gap="3" align="center">
                <Wifi className="h-6 w-6 text-primary-400" />
                <div>
                  <Text as="div" size="2" weight="medium">Network Printer</Text>
                  <Text as="div" size="2">{asset.printer.is_network_printer ? 'Yes' : 'No'}</Text>
                </div>
              </Flex>
            </Card>
            <Card className="p-4">
              <Flex gap="3" align="center">
                <Palette className="h-6 w-6 text-primary-400" />
                <div>
                  <Text as="div" size="2" weight="medium">Color Support</Text>
                  <Text as="div" size="2">{asset.printer.supports_color ? 'Yes' : 'No'}</Text>
                </div>
              </Flex>
            </Card>
            <Card className="p-4">
              <Flex gap="3" align="center">
                <FileStack className="h-6 w-6 text-primary-400" />
                <div>
                  <Text as="div" size="2" weight="medium">Duplex Support</Text>
                  <Text as="div" size="2">{asset.printer.supports_duplex ? 'Yes' : 'No'}</Text>
                </div>
              </Flex>
            </Card>
            {asset.printer.monthly_duty_cycle && (
              <Card className="p-4">
                <Flex gap="3" align="center">
                  <Gauge className="h-6 w-6 text-primary-400" />
                  <div>
                    <Text as="div" size="2" weight="medium">Monthly Duty Cycle</Text>
                    <Text as="div" size="2">{asset.printer.monthly_duty_cycle.toLocaleString()} pages</Text>
                  </div>
                </Flex>
              </Card>
            )}
          </div>
        </div>
      );
    }

    return <Text as="p">No additional details available</Text>;
  };

  const renderMaintenanceSummary = () => {
    if (isLoading || !maintenanceReport) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <Flex justify="between" align="center">
            <div>
              <Text as="div" size="2" color="gray" weight="medium">Active Schedules</Text>
              <Text as="div" size="6" weight="medium">{maintenanceReport.active_schedules}</Text>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </Flex>
        </Card>

        <Card className="p-4">
          <Flex justify="between" align="center">
            <div>
              <Text as="div" size="2" color="gray" weight="medium">Overdue</Text>
              <Text as="div" size="6" weight="medium" className="text-amber-600">
                {maintenanceReport.completed_maintenances}
              </Text>
            </div>
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </Flex>
        </Card>

        <Card className="p-4">
          <Flex justify="between" align="center">
            <div>
              <Text as="div" size="2" color="gray" weight="medium">Upcoming</Text>
              <Text as="div" size="6" weight="medium" className="text-blue-600">
                {maintenanceReport.upcoming_maintenances}
              </Text>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </Flex>
        </Card>
      </div>
    );
  };

  const renderRelatedAssets = () => {
    if (!asset.relationships || asset.relationships.length === 0) {
      return (
        <Card className="p-6">
          <Text as="p" color="gray">No related assets found</Text>
        </Card>
      );
    }

    return (
      <Card className="p-6">
        <Text as="div" size="4" weight="medium" className="mb-4">Related Assets</Text>
        <div className="space-y-2">
          {asset.relationships.map((rel: AssetRelationship): JSX.Element => (
            <div key={`${rel.parent_asset_id}-${rel.child_asset_id}`}
                 className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <div>
                <Text as="div" size="2" weight="medium">{rel.relationship_type}</Text>
                <Text as="div" size="2" color="gray">
                  {rel.parent_asset_id === asset.asset_id ? 'Parent of' : 'Child of'} {rel.name}
                </Text>
              </div>
              <Link
                href={`/msp/assets/${rel.parent_asset_id === asset.asset_id ? rel.child_asset_id : rel.parent_asset_id}`}
                className="text-indigo-600 hover:text-indigo-700"
              >
                View
              </Link>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  const tabContent = [
    {
      label: "Details",
      content: (
        <div className="space-y-6">
          <Card className="p-6">
            <Text as="div" size="4" weight="medium" className="mb-4">Basic Information</Text>
            {renderBasicInfo()}
          </Card>

          <Card className="p-6">
            {renderTypeSpecificDetails()}
          </Card>

          {renderMaintenanceSummary()}
        </div>
      )
    },
    {
      label: "Related Assets",
      content: renderRelatedAssets()
    },
    {
      label: "Documents",
      content: (
        <Card className="p-6">
          <Documents
            documents={[]} // Initial empty array
            gridColumns={3}
            userId={asset.tenant}
            entityId={asset.asset_id}
            entityType="asset"
            isLoading={false}
          />
        </Card>
      )
    }
  ];

  return (
    <div className="max-w-4xl mx-auto bg-gray-50 p-6">
      <Flex justify="between" align="center" className="mb-6">
        <div>
          <Heading size="6">{asset.name}</Heading>
          <Text as="p" size="2" color="gray">Asset Tag: {asset.asset_tag}</Text>
        </div>
        <Flex gap="2">
          <CreateTicketFromAssetButton asset={asset} />
          <Link href={`/msp/assets/${asset.asset_id}/edit`}>
            <Button variant="outline" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </Link>
        </Flex>
      </Flex>

      <CustomTabs tabs={tabContent} />
    </div>
  );
}
