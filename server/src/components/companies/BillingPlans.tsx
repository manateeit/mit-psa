import React from 'react';
import { Button, Select } from '@radix-ui/themes';
import { ICompanyBillingPlan, IBillingPlan, IServiceCategory } from '../../interfaces/billing.interfaces';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDefinition } from '@/interfaces/dataTable.interfaces';

interface BillingPlansProps {
    companyBillingPlans: ICompanyBillingPlan[];
    billingPlans: IBillingPlan[];
    serviceCategories: IServiceCategory[];
    onEdit: (billing: ICompanyBillingPlan) => void;
    onDelete: (companyBillingPlanId: string) => void;
    onAdd: () => void;
    onCompanyPlanChange: (companyBillingPlanId: string, planId: string) => void;
    formatDateForDisplay: (date: string | Date | null) => string;
}

const BillingPlans: React.FC<BillingPlansProps> = ({
    companyBillingPlans,
    billingPlans,
    serviceCategories,
    onEdit,
    onDelete,
    onAdd,
    onCompanyPlanChange,
    formatDateForDisplay
}) => {
    const columns: ColumnDefinition<ICompanyBillingPlan>[] = [
        {
            title: 'Plan',
            dataIndex: 'plan_id',
            render: (value, record) => (
                <Select.Root
                    value={value}
                    onValueChange={(newValue) => onCompanyPlanChange(record.company_billing_plan_id, newValue)}
                >
                    <Select.Trigger />
                    <Select.Content>
                        {billingPlans.map((plan): React.ReactNode => (
                            <Select.Item key={plan.plan_id} value={plan.plan_id || ''}>
                                {plan.plan_name}
                            </Select.Item>
                        ))}
                    </Select.Content>
                </Select.Root>
            )
        },
        {
            title: 'Category',
            dataIndex: 'service_category',
            render: (value, record) => (
                <Select.Root
                    value={value || ''}
                    onValueChange={(newValue) => onCompanyPlanChange(record.company_billing_plan_id, newValue)}
                >
                    <Select.Trigger />
                    <Select.Content>
                        {serviceCategories.map((category): React.ReactNode => (
                            <Select.Item key={category.category_id} value={category.category_id}>
                                {category.category_name}
                            </Select.Item>
                        ))}
                    </Select.Content>
                </Select.Root>
            )
        },
        {
            title: 'Start Date',
            dataIndex: 'start_date',
            render: (value) => formatDateForDisplay(value)
        },
        {
            title: 'End Date',
            dataIndex: 'end_date',
            render: (value) => value ? formatDateForDisplay(value) : 'Ongoing'
        },
        {
            title: 'Actions',
            dataIndex: 'company_billing_plan_id',
            render: (value, record) => (
                <>
                    <Button variant="soft" size="1" onClick={() => onEdit(record)}>Edit</Button>
                    <Button variant="soft" size="1" color="red" onClick={() => onDelete(value)}>Remove</Button>
                </>
            )
        }
    ];

    return (
        <div>
            <h3 className="font-semibold mb-4">Billing Plans</h3>
            <DataTable
                data={companyBillingPlans}
                columns={columns}
            />
            <Button
                onClick={onAdd}
                className="mt-4"
            >
                Add New Billing Plan
            </Button>
        </div>
    );
};

export default BillingPlans;
