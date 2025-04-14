import { useRouter } from 'next/navigation';
import { Button } from 'server/src/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "server/src/components/ui/DropdownMenu";
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { MouseEvent } from 'react';
import { ICompany } from "server/src/interfaces/company.interfaces";
import CompanyAvatar from 'server/src/components/ui/CompanyAvatar';

interface CompanyGridCardProps {
    company: ICompany;
    selectedCompanies: string[];
    handleCheckboxChange: (companyId: string) => void;
    handleEditCompany: (companyId: string) => void;
    handleDeleteCompany: (company: ICompany) => void;
}

const CompanyGridCard = ({
    company,
    selectedCompanies,
    handleCheckboxChange,
    handleEditCompany,
    handleDeleteCompany
}: CompanyGridCardProps) => {
    const router = useRouter();

    const handleCardClick = () => {
        router.push(`/msp/companies/${company.company_id}`);
    };

    const stopPropagation = (e: MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div
            className="bg-white rounded-md border border-gray-200 shadow-md p-3 cursor-pointer hover:shadow-lg transition-shadow duration-200 flex flex-col relative"
            onClick={handleCardClick}
            data-testid={`company-card-${company.company_id}`}
        >
            <div className="flex items-center space-x-3 w-full">
                {/* Checkbox */}
                <div onClick={stopPropagation} className="flex-shrink-0">
                    <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={selectedCompanies.includes(company.company_id)}
                        onChange={() => handleCheckboxChange(company.company_id)}
                        aria-label={`Select company ${company.company_name}`}
                        data-testid={`company-checkbox-${company.company_id}`}
                    />
                </div>

                {/* Company Avatar */}
                <div className="flex-shrink-0">
                    <CompanyAvatar
                        companyId={company.company_id}
                        companyName={company.company_name}
                        logoUrl={company.logoUrl ?? null}
                        size="lg"
                    />
                </div>

                {/* Company Info */}
                <div className="flex-1 min-w-0">
                    <h2 className="text-md font-semibold text-gray-800 truncate" title={company.company_name}>
                        {company.company_name}
                    </h2>
                    <div className="text-sm text-gray-600 mt-1 space-y-0.5">
                        <p className="truncate">
                            <span className="font-medium text-gray-700">Type:</span>
                            <span className="ml-1">{company.client_type || 'N/A'}</span>
                        </p>
                        <p className="truncate">
                            <span className="font-medium text-gray-700">Phone:</span>
                            <span className="ml-1">{company.phone_no || 'N/A'}</span>
                        </p>
                        <p className="truncate">
                            <span className="font-medium text-gray-700">Address:</span>
                            <span className="ml-1">{company.address || 'N/A'}</span>
                        </p>
                        <div className="truncate">
                            <span className="font-medium text-gray-700">URL:</span>
                            {company.url && company.url.trim() !== '' ? (
                                <a
                                    href={company.url.startsWith('http') ? company.url : `https://${company.url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-1 text-blue-600 hover:underline"
                                    onClick={stopPropagation}
                                    data-testid={`company-url-link-${company.company_id}`}
                                >
                                    {company.url}
                                </a>
                            ) : (
                                <span className="ml-1">N/A</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions Menu */}
                <div onClick={stopPropagation} className="flex-shrink-0">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button
                                id={`task-actions-${company.company_id}`}
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                data-testid={`company-actions-trigger-${company.company_id}`}
                            >
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Company Actions</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            sideOffset={5}
                            className="bg-white rounded-md shadow-lg p-1 border border-gray-200 min-w-[120px]"
                            data-testid={`company-actions-menu-${company.company_id}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <DropdownMenuItem
                                className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-100 rounded-[3px] focus:outline-none focus:bg-gray-100"
                                onSelect={() => handleEditCompany(company.company_id)}
                                data-testid={`company-edit-button-${company.company_id}`}
                            >
                                <Pencil size={14} className="mr-2" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="flex items-center px-2 py-1.5 text-sm cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700 rounded-[3px] focus:outline-none focus:bg-red-50 focus:text-red-700"
                                onSelect={() => handleDeleteCompany(company)}
                                data-testid={`company-delete-button-${company.company_id}`}
                            >
                                <Trash2 size={14} className="mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
};

export default CompanyGridCard;