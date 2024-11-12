'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import CustomSelect from '@/components/ui/CustomSelect';
import { Asset, CreateAssetRequest, AssetType } from '@/interfaces/asset.interfaces';
import { ICompany } from '@/interfaces';
import { createAsset, listAssetTypes } from '@/lib/actions/asset-actions/assetActions';
import { getAllCompanies } from '@/lib/actions/companyActions';
import { CompanyPicker } from '@/components/companies/CompanyPicker';
import { SelectOption } from '@/components/ui/Select';

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

export default function CreateAssetDialog({ onClose, onAssetCreated }: CreateAssetDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [companies, setCompanies] = useState<ICompany[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [formData, setFormData] = useState<CreateAssetRequest>({
    type_id: '',
    company_id: '',
    asset_tag: '',
    name: '',
    status: 'active',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [types, companiesList] = await Promise.all([
          listAssetTypes(),
          getAllCompanies(false) // false to get only active companies
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
      // TODO: Add error handling UI
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof CreateAssetRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      title="Create New Asset"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
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
