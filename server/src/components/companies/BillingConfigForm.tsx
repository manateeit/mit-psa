import React from 'react';
import { Text } from '@radix-ui/themes';
import { Switch } from '@/components/ui/Switch';
import CustomSelect from '@/components/ui/CustomSelect';

interface BillingConfigFormProps {
    billingConfig: {
        payment_terms: string;
        billing_cycle: string;
        credit_limit: number;
        preferred_payment_method: string;
        auto_invoice: boolean;
        invoice_delivery_method: string;
    };
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSelectChange: (name: string) => (value: string) => void;
    handleSwitchChange: (checked: boolean) => void;
}

const BillingConfigForm: React.FC<BillingConfigFormProps> = ({
    billingConfig,
    handleInputChange,
    handleSelectChange,
    handleSwitchChange
}) => {
    const paymentTermsOptions = [
        { value: 'net_30', label: 'Net 30' },
        { value: 'net_15', label: 'Net 15' },
        { value: 'due_on_receipt', label: 'Due on Receipt' }
    ];

    const billingCycleOptions = [
        { value: 'monthly', label: 'Monthly' },
        { value: 'quarterly', label: 'Quarterly' },
        { value: 'annually', label: 'Annually' }
    ];

    const paymentMethodOptions = [
        { value: 'credit_card', label: 'Credit Card' },
        { value: 'bank_transfer', label: 'Bank Transfer' },
        { value: 'check', label: 'Check' }
    ];

    const deliveryMethodOptions = [
        { value: 'email', label: 'Email' },
        { value: 'mail', label: 'Mail' },
        { value: 'both', label: 'Both' }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <CustomSelect
                    label="Payment Terms"
                    value={billingConfig.payment_terms}
                    onValueChange={handleSelectChange('payment_terms')}
                    options={paymentTermsOptions}
                />
            </div>

            <div className="space-y-2">
                <CustomSelect
                    label="Billing Cycle"
                    value={billingConfig.billing_cycle}
                    onValueChange={handleSelectChange('billing_cycle')}
                    options={billingCycleOptions}
                />
            </div>

            <div className="space-y-2">
                <CustomSelect
                    label="Preferred Payment Method"
                    value={billingConfig.preferred_payment_method}
                    onValueChange={handleSelectChange('preferred_payment_method')}
                    options={paymentMethodOptions}
                />
            </div>

            <div className="space-y-2">
                <CustomSelect
                    label="Invoice Delivery Method"
                    value={billingConfig.invoice_delivery_method}
                    onValueChange={handleSelectChange('invoice_delivery_method')}
                    options={deliveryMethodOptions}
                />
            </div>

            <div className="space-y-2">
                <Text as="label" size="2" className="text-gray-700 font-medium">Credit Limit</Text>
                <input
                    type="number"
                    name="credit_limit"
                    value={billingConfig.credit_limit}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            <div className="space-y-2">
                <Text as="label" size="2" className="text-gray-700 font-medium">Auto Invoice</Text>
                <div className="flex items-center">
                    <Switch
                        checked={billingConfig.auto_invoice}
                        onCheckedChange={handleSwitchChange}
                        className="data-[state=checked]:bg-primary-500"
                    />
                    <Text size="2" className="ml-2">{billingConfig.auto_invoice ? 'Enabled' : 'Disabled'}</Text>
                </div>
            </div>
        </div>
    );
};

export default BillingConfigForm;
