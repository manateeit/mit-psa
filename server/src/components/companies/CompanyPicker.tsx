// server/src/components/CompanyPicker.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '../ui/Input';
import CustomSelect from '../ui/CustomSelect';
import { ICompany } from '@/interfaces';
import { ChevronDownIcon } from '@radix-ui/react-icons';

interface CompanyPickerProps {
  companies?: ICompany[];
  onSelect: (companyId: string) => void;
  selectedCompanyId: string | null;
  filterState: 'all' | 'active' | 'inactive';
  onFilterStateChange: (state: 'all' | 'active' | 'inactive') => void;
  clientTypeFilter: 'all' | 'company' | 'individual';
  onClientTypeFilterChange: (type: 'all' | 'company' | 'individual') => void;
}

export const CompanyPicker: React.FC<CompanyPickerProps> = ({
  companies = [],
  onSelect,
  selectedCompanyId,
  filterState,
  onFilterStateChange,
  clientTypeFilter,
  onClientTypeFilterChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCompanies, setFilteredCompanies] = useState<ICompany[]>(companies);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filterCompanies = useCallback(() => {
    return companies.filter(company => {
      const matchesSearch = company.company_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesState = 
        filterState === 'all' ? true :
        filterState === 'active' ? !company.is_inactive :
        filterState === 'inactive' ? company.is_inactive :
        true;
      const matchesClientType = 
        clientTypeFilter === 'all' ? true :
        clientTypeFilter === 'company' ? company.client_type === 'company' :
        clientTypeFilter === 'individual' ? company.client_type === 'individual' :
        true;
      return matchesSearch && matchesState && matchesClientType;
    });
  }, [companies, filterState, clientTypeFilter, searchTerm]);

  useEffect(() => {
    setFilteredCompanies(filterCompanies());
  }, [filterCompanies]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (companyId: string) => {
    onSelect(companyId);
    setIsOpen(false);
  };

  const handleFilterStateChange = (value: string) => {
    onFilterStateChange(value as 'all' | 'active' | 'inactive');
  };

  const handleClientTypeFilterChange = (value: string) => {
    onClientTypeFilterChange(value as 'all' | 'company' | 'individual');
  };

  const selectedCompany = selectedCompanyId
    ? companies.find((c) => c.company_id === selectedCompanyId)
    : null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2 border rounded flex justify-between items-center bg-white text-left"
      >
        <span>{selectedCompany ? selectedCompany.company_name : 'Select Client'}</span>
        <ChevronDownIcon />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center space-x-4">
              <div className="flex-1">
                <CustomSelect
                  value={filterState}
                  onValueChange={handleFilterStateChange}
                  options={[
                    { value: 'active', label: 'Active Clients' },
                    { value: 'inactive', label: 'Inactive Clients' },
                    { value: 'all', label: 'All Clients' },
                  ]}
                  placeholder="Filter by status"
                />
              </div>
              <div className="flex-1">
                <CustomSelect
                  value={clientTypeFilter}
                  onValueChange={handleClientTypeFilterChange}
                  options={[
                    { value: 'all', label: 'All Types' },
                    { value: 'company', label: 'Companies' },
                    { value: 'individual', label: 'Individuals' },
                  ]}
                  placeholder="Filter by client type"
                />
              </div>
            </div>
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="max-h-60 overflow-y-auto border-t">
            {filteredCompanies.map((company):JSX.Element => (
              <button
                type="button"
                key={company.company_id}
                onClick={() => handleSelect(company.company_id)}
                className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                  company.company_id === selectedCompanyId ? 'bg-blue-100' : ''
                }`}
              >
                {company.company_name}
                {company.is_inactive && <span className="ml-2 text-gray-500">(Inactive)</span>}
                <span className="ml-2 text-gray-500">
                  ({company.client_type === 'company' ? 'Company' : 'Individual'})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
