'use client'
import React, { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Switch } from '../ui/Switch'
import { createService } from '@/lib/actions/serviceActions'
import { getServiceCategories } from '@/lib/actions/categoryActions'
import { IService, IServiceCategory, ServiceType } from '@/interfaces/billing.interfaces'
import { UnitOfMeasureInput } from './UnitOfMeasureInput'
import { useTenant } from '../TenantProvider'

interface QuickAddServiceProps {
  onServiceAdded: () => void
}

// Define service type options
const SERVICE_TYPE_OPTIONS = [
  { value: 'Fixed' as ServiceType, label: 'Fixed Price' },
  { value: 'Time' as ServiceType, label: 'Time Based' },
  { value: 'Usage' as ServiceType, label: 'Usage Based' }
];

export function QuickAddService({ onServiceAdded }: QuickAddServiceProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<IServiceCategory[]>([])
  const tenant = useTenant()

  // Initialize service state with all fields
  const [serviceData, setServiceData] = useState<Omit<IService, 'service_id' | 'tenant'>>({
    service_name: '',
    service_type: 'Fixed', // Default to Fixed type
    default_rate: 0,
    unit_of_measure: '',
    category_id: '',
    is_taxable: true,
    tax_region: ''
  })

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await getServiceCategories()
        setCategories(fetchedCategories)
      } catch (error) {
        console.error('Error fetching categories:', error)
        setError('Failed to fetch categories')
      }
    }

    fetchCategories()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Validate required fields
      if (!serviceData.service_type) {
        setError('Service Type is required')
        return
      }

      console.log('[QuickAddService] Submitting service data:', serviceData)
      await createService(serviceData)
      console.log('[QuickAddService] Service created successfully')
      
      onServiceAdded()
      setOpen(false)
      // Reset form
      setServiceData({
        service_name: '',
        service_type: 'Fixed', // Reset to Fixed type
        default_rate: 0,
        unit_of_measure: '',
        category_id: '',
        is_taxable: true,
        tax_region: ''
      })
      setError(null)
    } catch (error) {
      console.error('[QuickAddService] Error creating service:', error)
      setError('Failed to create service')
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button>Add Service</Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg w-96">
          <Dialog.Title className="text-lg font-bold mb-4">Add New Service</Dialog.Title>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="serviceName" className="block text-sm font-medium text-gray-700">Service Name</label>
              <Input
                id="serviceName"
                value={serviceData.service_name}
                onChange={(e) => setServiceData({ ...serviceData, service_name: e.target.value })}
                placeholder="Service Name"
                required
              />
            </div>

            <div>
              <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700">Service Type</label>
              <Select
                options={SERVICE_TYPE_OPTIONS}
                value={serviceData.service_type}
                onChange={(value) => {
                  // Ensure value is a valid ServiceType
                  if (value === 'Fixed' || value === 'Time' || value === 'Usage') {
                    setServiceData({ ...serviceData, service_type: value })
                  }
                }}
                placeholder="Select Service Type"
                required
              />
            </div>

            <div>
              <label htmlFor="defaultRate" className="block text-sm font-medium text-gray-700">Default Rate</label>
              <Input
                id="defaultRate"
                type="number"
                value={serviceData.default_rate}
                onChange={(e) => setServiceData({ ...serviceData, default_rate: parseFloat(e.target.value) })}
                placeholder="Default Rate"
                required
              />
            </div>

            <div>
              <label htmlFor="unitOfMeasure" className="block text-sm font-medium text-gray-700">Unit of Measure</label>
              <UnitOfMeasureInput
                value={serviceData.unit_of_measure}
                onChange={(value) => setServiceData({ ...serviceData, unit_of_measure: value })}
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
              <Select
                options={categories.map((cat): { value: string; label: string } => ({ 
                  value: cat.category_id, 
                  label: cat.category_name 
                }))}
                onChange={(value) => setServiceData({ ...serviceData, category_id: value })}
                value={serviceData.category_id}
                placeholder="Select Category"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={serviceData.is_taxable}
                onCheckedChange={(checked) => setServiceData({ ...serviceData, is_taxable: checked })}
              />
              <label className="text-sm font-medium text-gray-700">Is Taxable</label>
            </div>

            <div>
              <label htmlFor="taxRegion" className="block text-sm font-medium text-gray-700">Tax Region</label>
              <Input
                id="taxRegion"
                value={serviceData.tax_region}
                onChange={(e) => setServiceData({ ...serviceData, tax_region: e.target.value })}
                placeholder="Tax Region"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Service</Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
