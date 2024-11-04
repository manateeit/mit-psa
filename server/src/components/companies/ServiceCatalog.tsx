import React from 'react';
import { Button } from '@radix-ui/themes';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDefinition } from '@/interfaces/dataTable.interfaces';
import { IService, IServiceCategory } from '../../interfaces/billing.interfaces';

interface ServiceCatalogProps {
    services: IService[];
    serviceCategories: IServiceCategory[];
    onEdit: (service: IService) => void;
    onDelete: (serviceId: string) => void;
    onAdd: () => void;
}

const ServiceCatalog: React.FC<ServiceCatalogProps> = ({
    services,
    serviceCategories,
    onEdit,
    onDelete,
    onAdd
}) => {
    const columns: ColumnDefinition<IService>[] = [
        {
            title: 'Service Name',
            dataIndex: 'service_name',
        },
        {
            title: 'Default Rate',
            dataIndex: 'default_rate',
        },
        {
            title: 'Unit of Measure',
            dataIndex: 'unit_of_measure',
        },
        {
            title: 'Category',
            dataIndex: 'category_id',
            render: (value, record) => {
                return serviceCategories.find(cat => cat.category_id === value)?.category_name;
            },
        },
        {
            title: 'Actions',
            dataIndex: 'service_id',
            render: (value, record) => (
                <>
                    <Button variant="soft" size="1" onClick={() => onEdit(record)} className="mr-2">
                        Edit
                    </Button>
                    <Button variant="soft" size="1" color="red" onClick={() => onDelete(value!)}>
                        Delete
                    </Button>
                </>
            ),
        },
    ];

    return (
        <div>
            <h3 className="font-semibold mb-4">Service Catalog</h3>
            <DataTable
                data={services}
                columns={columns}
            />
            <Button onClick={onAdd} className="mt-4">
                Add New Service
            </Button>
        </div>
    );
};

export default ServiceCatalog;
