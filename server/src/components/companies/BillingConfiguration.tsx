'use client'

import React, { useState, useEffect } from 'react';
import { ICompany } from '../../interfaces/company.interfaces';
import { Button, Dialog, AlertDialog } from '@radix-ui/themes';
import { getCompanyBillingPlan, updateCompanyBillingPlan, addCompanyBillingPlan, removeCompanyBillingPlan, editCompanyBillingPlan } from '../../lib/actions/companyBillingPlanActions';
import { getBillingPlans } from '../../lib/actions/billingPlanAction';
import { getServiceCategories } from '../../lib/actions/serviceCategoryActions';
import { ICompanyBillingPlan, IBillingPlan, IServiceCategory, ServiceType } from '../../interfaces/billing.interfaces';
import { getServices, createService, updateService, deleteService } from '../../lib/actions/serviceActions';
import { IService } from '../../interfaces/billing.interfaces';
import { getTaxRates } from '../../lib/actions/taxRateActions';
import { getCompanyTaxRates, addCompanyTaxRate, removeCompanyTaxRate } from '../../lib/actions/companyTaxRateActions';
import { ITaxRate, ICompanyTaxRate } from '../../interfaces/billing.interfaces';
import { getBillingCycle, updateBillingCycle } from '../../lib/actions/billingCycleActions';
import BillingConfigForm from './BillingConfigForm';
import ServiceCatalog from './ServiceCatalog';
import CompanyTaxRates from './CompanyTaxRates';
import BillingPlans from './BillingPlans';

interface BillingConfigurationProps {
    company: ICompany;
    onSave: (updatedCompany: Partial<ICompany>) => void;
}

type DateString = string;

interface CompanyBillingPlanWithStringDates extends Omit<ICompanyBillingPlan, 'start_date' | 'end_date'> {
    start_date: DateString;
    end_date: DateString | null;
}

const BillingConfiguration: React.FC<BillingConfigurationProps> = ({ company, onSave }) => {
    const [billingConfig, setBillingConfig] = useState({
        payment_terms: company.payment_terms || 'net_30',
        billing_cycle: '',
        credit_limit: company.credit_limit || 0,
        preferred_payment_method: company.preferred_payment_method || '',
        auto_invoice: company.auto_invoice || false,
        invoice_delivery_method: company.invoice_delivery_method || '',
    });

    const [billingPlans, setBillingPlans] = useState<IBillingPlan[]>([]);
    const [serviceCategories, setServiceCategories] = useState<IServiceCategory[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isAddingNewPlan, setIsAddingNewPlan] = useState(false);
    const [companyBillingPlans, setCompanyBillingPlans] = useState<CompanyBillingPlanWithStringDates[]>([]);
    const [editingBillingPlan, setEditingBillingPlan] = useState<CompanyBillingPlanWithStringDates | null>(null);
    const [newBillingPlan, setNewBillingPlan] = useState<Omit<CompanyBillingPlanWithStringDates, 'company_billing_plan_id' | 'tenant'>>({
        company_id: company.company_id,
        plan_id: '',
        service_category: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: null,
        is_active: true
    });

    const [services, setServices] = useState<IService[]>([]);
    const [newService, setNewService] = useState<Partial<IService>>({
        unit_of_measure: 'hour',
        service_type: 'Time' as ServiceType,
        service_name: '',
        default_rate: 0,
        category_id: '',
    });
    const [editingService, setEditingService] = useState<IService | null>(null);
    const [taxRates, setTaxRates] = useState<ITaxRate[]>([]);
    const [companyTaxRates, setCompanyTaxRates] = useState<ICompanyTaxRate[]>([]);
    const [selectedTaxRate, setSelectedTaxRate] = useState<string>('');

    const formatStartDate = (date: any): string => {
        if (!date) return new Date().toISOString().split('T')[0];
        if (typeof date === 'string') return date.includes('T') ? date.split('T')[0] : date;
        return new Date().toISOString().split('T')[0];
    };

    useEffect(() => {
        const fetchData = async () => {
            const billingPlans = await getCompanyBillingPlan(company.company_id);
            const billingPlansWithStringDates: CompanyBillingPlanWithStringDates[] = billingPlans.map((plan: ICompanyBillingPlan): CompanyBillingPlanWithStringDates => ({
                ...plan,
                start_date: formatStartDate(plan.start_date),
                end_date: plan.end_date ? (typeof plan.end_date === 'string' ? plan.end_date.split('T')[0] : null) : null
            }));
            setCompanyBillingPlans(billingPlansWithStringDates);

            const plans = await getBillingPlans();
            setBillingPlans(plans);

            const categories = await getServiceCategories();
            setServiceCategories(categories);

            const billingCycle = await getBillingCycle(company.company_id);
            setBillingConfig(prev => ({ ...prev, billing_cycle: billingCycle }));

            const fetchedServices = await getServices();
            setServices(fetchedServices);

            const fetchedTaxRates = await getTaxRates();
            setTaxRates(fetchedTaxRates);

            const fetchedCompanyTaxRates = await getCompanyTaxRates(company.company_id);
            setCompanyTaxRates(fetchedCompanyTaxRates);
        };
        fetchData();
    }, [company.company_id]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setBillingConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string) => async (value: string) => {
        if (name === 'billing_cycle') {
            await updateBillingCycle(company.company_id, value);
        }
        setBillingConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleSwitchChange = (checked: boolean) => {
        setBillingConfig(prev => ({ ...prev, auto_invoice: checked }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { billing_cycle, ...restConfig } = billingConfig;
        onSave(restConfig);
    };

    const handleCompanyPlanChange = async (companyBillingPlanId: string, planId: string) => {
        try {
            await updateCompanyBillingPlan(companyBillingPlanId, { plan_id: planId });
            const updatedBillingPlans = await getCompanyBillingPlan(company.company_id);
            const updatedBillingPlansWithStringDates: CompanyBillingPlanWithStringDates[] = updatedBillingPlans.map((plan: ICompanyBillingPlan): CompanyBillingPlanWithStringDates => ({
                ...plan,
                start_date: formatStartDate(plan.start_date),
                end_date: plan.end_date ? (typeof plan.end_date === 'string' ? plan.end_date.split('T')[0] : null) : null
            }));
            setCompanyBillingPlans(updatedBillingPlansWithStringDates);
        } catch (error) {
            setErrorMessage('Failed to update billing plan. Please try again.');
        }
    };

    const handleAddBillingPlan = async () => {
        try {
            const billingToAdd: Omit<ICompanyBillingPlan, 'company_billing_plan_id' | 'tenant'> = {
                ...newBillingPlan,
                start_date: newBillingPlan.start_date || '',
                end_date: newBillingPlan.end_date || null
            };
            await addCompanyBillingPlan(billingToAdd);
            const updatedBillingPlans = await getCompanyBillingPlan(company.company_id);
            const updatedBillingPlansWithStringDates: CompanyBillingPlanWithStringDates[] = updatedBillingPlans.map((plan: ICompanyBillingPlan): CompanyBillingPlanWithStringDates => ({
                ...plan,
                start_date: formatStartDate(plan.start_date),
                end_date: plan.end_date ? (typeof plan.end_date === 'string' ? plan.end_date.split('T')[0] : null) : null
            }));
            setCompanyBillingPlans(updatedBillingPlansWithStringDates);
            setIsAddingNewPlan(false);
        } catch (error) {
            setErrorMessage('Failed to add billing plan. Please try again.');
        }
    };

    const handleRemoveBillingPlan = async (companyBillingPlanId: string) => {
        try {
            await removeCompanyBillingPlan(companyBillingPlanId);
            const updatedBillingPlans = await getCompanyBillingPlan(company.company_id);
            const updatedBillingPlansWithStringDates: CompanyBillingPlanWithStringDates[] = updatedBillingPlans.map((plan: ICompanyBillingPlan): CompanyBillingPlanWithStringDates => ({
                ...plan,
                start_date: formatStartDate(plan.start_date),
                end_date: plan.end_date ? (typeof plan.end_date === 'string' ? plan.end_date.split('T')[0] : null) : null
            }));
            setCompanyBillingPlans(updatedBillingPlansWithStringDates);
        } catch (error) {
            setErrorMessage('Failed to remove billing plan. Please try again.');
        }
    };

    const handleEditBillingPlan = (billing: CompanyBillingPlanWithStringDates) => {
        setEditingBillingPlan({ ...billing });
    };

    const handleSaveEditBillingPlan = async () => {
        if (editingBillingPlan) {
            try {
                const updatedBilling: ICompanyBillingPlan = {
                    ...editingBillingPlan,
                    start_date: editingBillingPlan.start_date || '',
                    end_date: editingBillingPlan.end_date || null
                };
                await editCompanyBillingPlan(updatedBilling.company_billing_plan_id, updatedBilling);

                const updatedBillingPlans = await getCompanyBillingPlan(company.company_id);
                const updatedBillingPlansWithStringDates: CompanyBillingPlanWithStringDates[] = updatedBillingPlans.map((plan: ICompanyBillingPlan): CompanyBillingPlanWithStringDates => ({
                    ...plan,
                    start_date: formatStartDate(plan.start_date),
                    end_date: plan.end_date ? (typeof plan.end_date === 'string' ? plan.end_date.split('T')[0] : null) : null
                }));
                setCompanyBillingPlans(updatedBillingPlansWithStringDates);
                setEditingBillingPlan(null);
                setErrorMessage(null);
            } catch (error) {
                setErrorMessage('Failed to save changes. Please try again.');
            }
        }
    };

    const handleAddService = async () => {
        try {
            await createService(newService as IService);
            setNewService({
                unit_of_measure: 'hour',
                service_type: 'Time' as ServiceType,
                service_name: '',
                default_rate: 0,
                category_id: '',
            });
            const updatedServices = await getServices();
            setServices(updatedServices);
        } catch (error) {
            setErrorMessage('Failed to add service. Please try again.');
        }
    };

    const handleUpdateService = async () => {
        if (!editingService) return;
        try {
            await updateService(editingService.service_id, editingService);
            setEditingService(null);
            const updatedServices = await getServices();
            setServices(updatedServices);
        } catch (error) {
            setErrorMessage('Failed to update service. Please try again.');
        }
    };

    const handleDeleteService = async (serviceId: string) => {
        try {
            await deleteService(serviceId);
            const updatedServices = await getServices();
            setServices(updatedServices);
        } catch (error) {
            setErrorMessage('Failed to delete service. Please try again.');
        }
    };

    const handleAddCompanyTaxRate = async () => {
        if (!selectedTaxRate) return;
        try {
            const newCompanyTaxRate: Omit<ICompanyTaxRate, 'company_tax_rate_id' | 'tenant'> = {
                company_id: company.company_id,
                tax_rate_id: selectedTaxRate
            };
            await addCompanyTaxRate(newCompanyTaxRate);
            const updatedCompanyTaxRates = await getCompanyTaxRates(company.company_id);
            setCompanyTaxRates(updatedCompanyTaxRates);
            setSelectedTaxRate('');
        } catch (error) {
            setErrorMessage('Failed to add tax rate to company. Please try again.');
        }
    };

    const handleRemoveCompanyTaxRate = async (taxRateId: string) => {
        try {
            await removeCompanyTaxRate(company.company_id, taxRateId);
            const updatedCompanyTaxRates = await getCompanyTaxRates(company.company_id);
            setCompanyTaxRates(updatedCompanyTaxRates);
        } catch (error) {
            setErrorMessage('Failed to remove tax rate from company. Please try again.');
        }
    };

    // Helper function to format date for input
    const formatDateForInput = (date: string | Date | null): string => {
        if (!date) return '';
        return typeof date === 'string' ? date : date.toISOString().split('T')[0];
    };

    // Helper function to format date for display
    const formatDateForDisplay = (date: string | Date | null): string => {
        if (!date) return 'N/A';
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {errorMessage && (
                <AlertDialog.Root open={!!errorMessage}>
                    <AlertDialog.Content>
                        <AlertDialog.Title>Error</AlertDialog.Title>
                        <AlertDialog.Description>{errorMessage}</AlertDialog.Description>
                        <Button onClick={() => setErrorMessage(null)} className="bg-blue-600 text-white hover:bg-blue-700">
                            Close
                        </Button>
                    </AlertDialog.Content>
                </AlertDialog.Root>
            )}

            <BillingConfigForm
                billingConfig={billingConfig}
                handleInputChange={handleInputChange}
                handleSelectChange={handleSelectChange}
                handleSwitchChange={handleSwitchChange}
            />

            <ServiceCatalog
                services={services}
                serviceCategories={serviceCategories}
                onEdit={setEditingService}
                onDelete={handleDeleteService}
                onAdd={() => setIsAddingNewPlan(true)}
            />

            <CompanyTaxRates
                companyTaxRates={companyTaxRates}
                taxRates={taxRates}
                selectedTaxRate={selectedTaxRate}
                onSelectTaxRate={setSelectedTaxRate}
                onAdd={handleAddCompanyTaxRate}
                onRemove={handleRemoveCompanyTaxRate}
            />

            <BillingPlans
                companyBillingPlans={companyBillingPlans}
                billingPlans={billingPlans}
                serviceCategories={serviceCategories}
                onEdit={handleEditBillingPlan}
                onDelete={handleRemoveBillingPlan}
                onAdd={() => setIsAddingNewPlan(true)}
                onCompanyPlanChange={handleCompanyPlanChange}
                formatDateForDisplay={formatDateForDisplay}
            />

            <div className="flex justify-end">
                <Button 
                    type="submit" 
                    className="bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                    Save Billing Configuration
                </Button>
            </div>

            <Dialog.Root open={!!editingService} onOpenChange={(open) => !open && setEditingService(null)}>
                <Dialog.Content>
                    <Dialog.Title>Edit Service</Dialog.Title>
                    {editingService && (
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={editingService.service_name}
                                onChange={(e) => setEditingService({ ...editingService, service_name: e.target.value })}
                                className="w-full px-3 py-2 border rounded"
                                placeholder="Service Name"
                            />
                            <Button 
                                onClick={handleUpdateService}
                                className="bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                            >
                                Save Changes
                            </Button>
                        </div>
                    )}
                </Dialog.Content>
            </Dialog.Root>
        </form>
    );
};

export default BillingConfiguration;
