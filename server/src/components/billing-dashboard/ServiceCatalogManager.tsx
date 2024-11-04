'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { UnitOfMeasureInput } from './UnitOfMeasureInput';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { getServices, updateService, deleteService } from '@/lib/actions/serviceActions';
import { getServiceCategories } from '@/lib/actions/serviceCategoryActions';
import { IService, IServiceCategory, ServiceType } from '@/interfaces/billing.interfaces';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Switch } from '../ui/Switch';
import { SelectOption } from '../ui/Select';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDefinition } from '@/interfaces/dataTable.interfaces';
import { QuickAddService } from './QuickAddService';

// Define service type options
const SERVICE_TYPE_OPTIONS = [
  { value: 'Fixed' as ServiceType, label: 'Fixed Price' },
  { value: 'Time' as ServiceType, label: 'Time Based' },
  { value: 'Usage' as ServiceType, label: 'Usage Based' }
];

const ServiceCatalogManager: React.FC = () => {
  const [services, setServices] = useState<IService[]>([]);
  const [categories, setCategories] = useState<IServiceCategory[]>([]);
  const [editingService, setEditingService] = useState<IService | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, []);

  const fetchServices = async () => {
    try {
      const fetchedServices = await getServices();
      setServices(fetchedServices);
      setError(null);
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Failed to fetch services');
    }
  };

  const fetchCategories = async () => {
    try {
      const fetchedCategories = await getServiceCategories();
      setCategories(fetchedCategories);
      setError(null);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to fetch categories');
    }
  };

  const handleUpdateService = async () => {
    if (!editingService) return;
    if (!editingService.service_type) {
      setError('Service Type is required');
      return;
    }
    try {
      await updateService(editingService.service_id!, editingService);
      setEditingService(null);
      await fetchServices();
      setError(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating service:', error);
      setError('Failed to update service');
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      await deleteService(serviceId);
      await fetchServices();
      setError(null);
    } catch (error) {
      console.error('Error deleting service:', error);
      setError('Failed to delete service');
    }
  };

  const columns: ColumnDefinition<IService>[] = [
    {
      title: 'Service Name',
      dataIndex: 'service_name',
    },
    {
      title: 'Service Type',
      dataIndex: 'service_type',
    },
    {
      title: 'Default Rate',
      dataIndex: 'default_rate',
    },
    {
      title: 'Category',
      dataIndex: 'category_id',
      render: (value, record) => categories.find(cat => cat.category_id === value)?.category_name || 'N/A',
    },
    {
      title: 'Unit of Measure',
      dataIndex: 'unit_of_measure',
    },
    {
      title: 'Is Taxable',
      dataIndex: 'is_taxable',
      render: (value) => value ? 'Yes' : 'No',
    },
    {
      title: 'Tax Region',
      dataIndex: 'tax_region',
      render: (value) => value || 'N/A',
    },
    {
      title: 'Actions',
      dataIndex: 'service_id',
      render: (_, record) => (
        <div className="space-x-2">
          <Button
            variant="default"
            onClick={() => {
              setEditingService(record);
              setIsEditDialogOpen(true);
            }}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleDeleteService(record.service_id!)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Service Catalog Management</h3>
        </CardHeader>
        <CardContent>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <div className="space-y-4">
            <QuickAddService onServiceAdded={fetchServices} />
            <DataTable
              data={services}
              columns={columns}
              pagination={true}
            />
          </div>
        </CardContent>
      </Card>
      <Dialog isOpen={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Service Name"
              value={editingService?.service_name || ''}
              onChange={(e) => setEditingService({ ...editingService!, service_name: e.target.value })}
            />
            <Select
              options={SERVICE_TYPE_OPTIONS}
              value={editingService?.service_type || 'Fixed'}
              onChange={(value) => {
                // Ensure value is a valid ServiceType
                if (value === 'Fixed' || value === 'Time' || value === 'Usage') {
                  setEditingService({ ...editingService!, service_type: value })
                }
              }}
              placeholder="Select Service Type"
              required
            />
            <Input
              type="number"
              placeholder="Default Rate"
              value={editingService?.default_rate || ''}
              onChange={(e) => setEditingService({ ...editingService!, default_rate: parseFloat(e.target.value) })}
            />
            <Select
              options={categories.map((cat): SelectOption => ({ value: cat.category_id, label: cat.category_name }))}
              onChange={(value) => setEditingService({ ...editingService!, category_id: value })}
              value={editingService?.category_id || ''}
              placeholder="Select Category"
            />
            <UnitOfMeasureInput
              value={editingService?.unit_of_measure || ''}
              onChange={(value) => setEditingService({ ...editingService!, unit_of_measure: value })}
              placeholder="Unit of Measure"
              className="w-full"
            />
            <div className="flex items-center space-x-2">
              <Switch
                checked={editingService?.is_taxable ?? true}
                onCheckedChange={(checked) => setEditingService({ ...editingService!, is_taxable: checked })}
              />
              <label>Is Taxable</label>
            </div>
            <Input
              placeholder="Tax Region"
              value={editingService?.tax_region || ''}
              onChange={(e) => setEditingService({ ...editingService!, tax_region: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setEditingService(null);
            }}>Cancel</Button>
            <Button onClick={() => {
              handleUpdateService();
              setIsEditDialogOpen(false);
            }}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ServiceCatalogManager;
