import React from 'react';
import { Button } from '@radix-ui/themes';
import { ICompanyBillingPlan, IBillingPlan, IServiceCategory } from '@/interfaces/billing.interfaces';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDefinition } from '@/interfaces/dataTable.interfaces';
import CustomSelect from '@/components/ui/CustomSelect';

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
                <CustomSelect
                    value={value}
                    onValueChange={(newValue) => onCompanyPlanChange(record.company_billing_plan_id, newValue)}
                    options={billingPlans.map((plan): { value: string; label: string } => ({
                        value: plan.plan_id || '',
                        label: plan.plan_name
                    }))}
                    placeholder="Select plan..."
                />
            )
        },
        {
            title: 'Category',
            dataIndex: 'service_category',
            render: (value, record) => (
                <CustomSelect
                    value={value || 'unassigned'}
                    onValueChange={(newValue) => onCompanyPlanChange(record.company_billing_plan_id, newValue)}
                    options={[
                        { value: 'unassigned', label: 'Select category' },
                        ...serviceCategories.map((category): { value: string; label: string } => ({
                            value: category.category_id,
                            label: category.category_name
                        }))
                    ]}
                    placeholder="Select category..."
                />
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
