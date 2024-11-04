// server/src/components/CompanyForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { ICompany } from '@/interfaces/company.interfaces';
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";

interface CompanyFormProps {
  onSubmit: (data: Omit<ICompany, "company_id" | "created_at" | "updated_at">) => void;
}

const CompanyForm: React.FC<CompanyFormProps> = ({ onSubmit }) => {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<Omit<ICompany, "company_id" | "created_at" | "updated_at">>();

  const clientTypeOptions = [
    { value: 'company', label: 'Company' },
    { value: 'individual', label: 'Individual' }
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="company_name">Company Name</Label>
        <Input
          id="company_name"
          {...register('company_name', { required: 'Company name is required' })}
        />
        {errors.company_name && <p className="mt-1 text-sm text-red-600">{errors.company_name.message}</p>}
      </div>

      <div>
        <Select
          id="client_type"
          label="Client Type"
          options={clientTypeOptions}
          onChange={(value) => setValue('client_type', value)}
        />
        {errors.client_type && <p className="mt-1 text-sm text-red-600">{errors.client_type.message}</p>}
      </div>

      <div>
        <Label htmlFor="phone_no">Phone Number</Label>
        <Input
          id="phone_no"
          {...register('phone_no')}
        />
      </div>

      <div>
        <Label htmlFor="url">URL</Label>
        <Input
          id="url"
          {...register('url')}
        />
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          {...register('address')}
        />
      </div>

      <div>
        <Label htmlFor="industry">Industry</Label>
        <Input
          id="industry"
          {...register('properties.industry')}
        />
      </div>

      <div>
        <Label htmlFor="company_size">Company Size</Label>
        <Input
          id="company_size"
          {...register('properties.company_size')}
        />
      </div>

      <div>
        <Label htmlFor="annual_revenue">Annual Revenue</Label>
        <Input
          id="annual_revenue"
          {...register('properties.annual_revenue')}
        />
      </div>

      <Button type="submit">
        Create Client
      </Button>
    </form>
  );
};

export default CompanyForm;
