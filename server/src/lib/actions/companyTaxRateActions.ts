'use server'

import { createTenantKnex } from '@/lib/db';
import { ICompanyTaxRate } from '@/interfaces/billing.interfaces';

export async function getCompanyTaxRates(companyId: string): Promise<ICompanyTaxRate[]> {
  const { knex } = await createTenantKnex();
  return await knex('company_tax_rates')
    .join('tax_rates', 'company_tax_rates.tax_rate_id', 'tax_rates.tax_rate_id')
    .where({ 'company_tax_rates.company_id': companyId })
    .select('company_tax_rates.*', 'tax_rates.region', 'tax_rates.tax_percentage', 'tax_rates.description');
}

export async function addCompanyTaxRate(companyTaxRate: Omit<ICompanyTaxRate, 'tenant'>): Promise<ICompanyTaxRate> {
  const { knex, tenant } = await createTenantKnex();
  const [newCompanyTaxRate] = await knex('company_tax_rates').insert({ ...companyTaxRate, tenant: tenant! }).returning('*');
  return newCompanyTaxRate;
}

export async function removeCompanyTaxRate(companyId: string, taxRateId: string): Promise<void> {
  const { knex } = await createTenantKnex();
  await knex('company_tax_rates')
    .where({ 
      company_id: companyId,
      tax_rate_id: taxRateId
    })
    .del();
}
