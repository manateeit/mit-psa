import React from 'react';
import { Text, Select } from '@radix-ui/themes';
import { Switch } from '@/components/ui/Switch';

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
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Text as="label" size="2" className="text-gray-700 font-medium">Payment Terms</Text>
                <Select.Root
                    name="payment_terms"
                    value={billingConfig.payment_terms}
                    onValueChange={handleSelectChange('payment_terms')}
                >
                    <Select.Trigger className="w-full" />
                    <Select.Content>
                        <Select.Group>
                            <Select.Label>Payment Terms</Select.Label>
                            <Select.Item value="net_30">Net 30</Select.Item>
                            <Select.Item value="net_15">Net 15</Select.Item>
                            <Select.Item value="due_on_receipt">Due on Receipt</Select.Item>
                        </Select.Group>
                    </Select.Content>
                </Select.Root>
            </div>

            <div className="space-y-2">
                <Text as="label" size="2" className="text-gray-700 font-medium">Billing Cycle</Text>
                <Select.Root
                    name="billing_cycle"
                    value={billingConfig.billing_cycle}
                    onValueChange={handleSelectChange('billing_cycle')}
                >
                    <Select.Trigger className="w-full" />
                    <Select.Content>
                        <Select.Group>
                            <Select.Label>Billing Cycle</Select.Label>
                            <Select.Item value="monthly">Monthly</Select.Item>
                            <Select.Item value="quarterly">Quarterly</Select.Item>
                            <Select.Item value="annually">Annually</Select.Item>
                        </Select.Group>
                    </Select.Content>
                </Select.Root>
            </div>

            <div className="space-y-2">
                <Text as="label" size="2" className="text-gray-700 font-medium">Preferred Payment Method</Text>
                <Select.Root
                    name="preferred_payment_method"
                    value={billingConfig.preferred_payment_method}
                    onValueChange={handleSelectChange('preferred_payment_method')}
                >
                    <Select.Trigger className="w-full" />
                    <Select.Content>
                        <Select.Group>
                            <Select.Label>Preferred Payment Method</Select.Label>
                            <Select.Item value="credit_card">Credit Card</Select.Item>
                            <Select.Item value="bank_transfer">Bank Transfer</Select.Item>
                            <Select.Item value="check">Check</Select.Item>
                        </Select.Group>
                    </Select.Content>
                </Select.Root>
            </div>

            <div className="space-y-2">
                <Text as="label" size="2" className="text-gray-700 font-medium">Invoice Delivery Method</Text>
                <Select.Root
                    name="invoice_delivery_method"
                    value={billingConfig.invoice_delivery_method}
                    onValueChange={handleSelectChange('invoice_delivery_method')}
                >
                    <Select.Trigger className="w-full" />
                    <Select.Content>
                        <Select.Group>
                            <Select.Label>Invoice Delivery Method</Select.Label>
                            <Select.Item value="email">Email</Select.Item>
                            <Select.Item value="mail">Mail</Select.Item>
                            <Select.Item value="both">Both</Select.Item>
                        </Select.Group>
                    </Select.Content>
                </Select.Root>
            </div>

            <div className="space-y-2">
                <Text as="label" size="2" className="text-gray-700 font-medium">Credit Limit</Text>
                <input
                    type="number"
                    name="credit_limit"
                    value={billingConfig.credit_limit}
                    onChange={handleInputChange}
                    className="w-full"
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
