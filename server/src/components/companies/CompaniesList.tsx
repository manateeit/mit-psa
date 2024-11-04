import { DataTable } from '@/components/ui/DataTable';
import { ColumnDefinition } from '@/interfaces/dataTable.interfaces';
import { ICompany } from "@/interfaces/company.interfaces";
import Link from "next/link";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Button } from "@radix-ui/themes";

interface CompaniesListProps {
    selectedCompanies: string[];
    filteredCompanies: ICompany[];
    setSelectedCompanies: (companies: string[]) => void;
    handleCheckboxChange: (companyId: string) => void;
    handleEditCompany: (companyId: string) => void;
    handleDeleteCompany: (companyId: string) => void;
}

const CompaniesList = ({ selectedCompanies, filteredCompanies, setSelectedCompanies, handleCheckboxChange, handleEditCompany, handleDeleteCompany }: CompaniesListProps) => {
    const columns: ColumnDefinition<ICompany>[] = [
        {
            title: '',
            dataIndex: 'company_id',
            render: (value: string, record: ICompany) => (
                <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4"
                    checked={selectedCompanies.includes(value)}
                    onChange={() => handleCheckboxChange(value)}
                />
            ),
        },
        {
            title: 'Name',
            dataIndex: 'company_name',
            render: (text: string, record: ICompany) => (
                <Link href={`/msp/companies/${record.company_id}`} className="text-blue-600">
                    {text}
                </Link>
            ),
        },
        {
            title: 'Client Type',
            dataIndex: 'client_type',
            render: (text: string | null) => text || 'N/A',
        },
        {
            title: 'Phone',
            dataIndex: 'phone_no',
            render: (text: string | null) => text || 'N/A',
        },
        {
            title: 'Address',
            dataIndex: 'address',
            render: (text: string | null) => text || 'N/A',
        },
        {
            title: 'Account Owner',
            dataIndex: ['properties', 'account_manager_name'],
            render: (text: string | undefined) => text || 'N/A',
          },
        {
            title: 'Url',
            dataIndex: 'url',
            render: (text: string | null) => (
                text && text.trim() !== '' ? (
                    <a href={text} target="_blank" rel="noopener noreferrer" className="text-blue-600">
                        {text}
                    </a>
                ) : 'N/A'
            ),
        },
        {
            title: 'Actions',
            dataIndex: 'company_id',
            render: (value: string) => (
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                        <Button variant="ghost" size="1">
                            <MoreVertical size={16} />
                        </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content className="bg-white rounded-md shadow-lg p-1">
                        <DropdownMenu.Item 
                            className="px-2 py-1 text-sm cursor-pointer hover:bg-gray-100 flex items-center"
                            onSelect={() => handleEditCompany(value)}
                        >
                            <Pencil size={14} className="mr-2" />
                            Edit
                        </DropdownMenu.Item>
                        <DropdownMenu.Item 
                            className="px-2 py-1 text-sm cursor-pointer hover:bg-gray-100 text-red-600 flex items-center"
                            onSelect={() => handleDeleteCompany(value)}
                        >
                            <Trash2 size={14} className="mr-2" />
                            Delete
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
            ),
        },
    ];

    return (
        <div className="w-full">
            <DataTable
                data={filteredCompanies}
                columns={columns}
            />
        </div>
    );
};

export default CompaniesList;
