'use server'

import { ICompany } from '@/interfaces/company.interfaces';
import { createTenantKnex } from '@/lib/db';
import { unparseCSV } from '@/lib/utils/csvParser';

export async function getCompanyById(companyId: string): Promise<ICompany | null> {
  const { knex } = await createTenantKnex();
  const company = await knex<ICompany>('companies').where({ company_id: companyId }).first();
  return company || null;
}

export async function updateCompany(companyId: string, updateData: Partial<ICompany>): Promise<ICompany> {
  const {knex: db} = await createTenantKnex();
  try {
    console.log('Updating company in database:', companyId, updateData);

    await db.transaction(async (trx) => {
      if (updateData.properties) {
        await trx('companies')
          .where({ company_id: companyId })
          .update({
            ...updateData,
            properties: trx.raw('properties || ?::jsonb', JSON.stringify(updateData.properties))
          });
      } else {
        await trx('companies')
          .where({ company_id: companyId })
          .update({
            ...updateData,
            updated_at: new Date().toISOString()
          });
      }

      // If the company is being set to inactive, update all associated contacts
      if (updateData.is_inactive === true) {
        await trx('contacts')
          .where({ company_id: companyId })
          .update({ is_inactive: true });
      }
    });

    // Fetch and return the updated company data
    const updatedCompany = await db('companies')
      .where({ company_id: companyId })
      .first();

    console.log('Updated company data:', updatedCompany);
    return updatedCompany;
  } catch (error) {
    console.error('Error updating company:', error);
    throw new Error('Failed to update company');
  }
}

export async function createCompany(company: Omit<ICompany, 'company_id' | 'created_at' | 'updated_at'>): Promise<ICompany> {
  const { knex, tenant } = await createTenantKnex();
  const [createdCompany] = await knex<ICompany>('companies')
    .insert({
      ...company,
      tenant: tenant!,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .returning('*');

  if (!createdCompany) {
    throw new Error('Failed to create company');
  }

  return createdCompany;
}

export async function getAllCompanies(includeInactive: boolean = true): Promise<ICompany[]> {
  const {knex: db} = await createTenantKnex();
  try {
    let query = db('companies').select('*');
    if (!includeInactive) {
      query = query.where('is_inactive', false);
    }
    const companies = await query;
    return companies;
  } catch (error) {
    console.error('Error fetching all companies:', error);
    throw new Error('Failed to fetch all companies');
  }
}

export async function deleteCompany(companyId: string): Promise<void> {
  const { knex } = await createTenantKnex();
  await knex<ICompany>('companies').where({ company_id: companyId }).del();
}

export async function exportCompaniesToCSV(companies: ICompany[]): Promise<string> {
  const fields = [
    'company_name',
    'phone_no',
    'email',
    'url',
    'address',
    'client_type',
    'is_inactive',
    'is_tax_exempt',
    'tax_id_number',
    'payment_terms',
    'billing_cycle',
    'credit_limit',
    'preferred_payment_method',
    'auto_invoice',
    'invoice_delivery_method',
    'tax_region'
  ];

  return unparseCSV(companies, fields);
}

export async function checkExistingCompanies(
  companyNames: string[]
): Promise<ICompany[]> {
  const {knex: db, tenant} = await createTenantKnex();
  
  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const existingCompanies = await db('companies')
    .select('*')
    .whereIn('company_name', companyNames)
    .andWhere('tenant', tenant);

  return existingCompanies;
}

export interface ImportCompanyResult {
  success: boolean;
  message: string;
  company?: ICompany;
  originalData: Record<string, any>;
}

export async function importCompaniesFromCSV(
  companiesData: Array<Partial<ICompany>>,
  updateExisting: boolean = false
): Promise<ImportCompanyResult[]> {
  const results: ImportCompanyResult[] = [];
  const {knex: db, tenant} = await createTenantKnex();
  
  if (!tenant) {
    throw new Error('Tenant not found');
  }

  // Start a transaction to ensure all operations succeed or fail together
  await db.transaction(async (trx) => {
    for (const companyData of companiesData) {
      try {
        if (!companyData.company_name) {
          throw new Error('Company name is required');
        }

        const existingCompany = await trx('companies')
          .where({ company_name: companyData.company_name, tenant })
          .first();

        if (existingCompany && !updateExisting) {
          results.push({
            success: false,
            message: `Company with name ${companyData.company_name} already exists`,
            originalData: companyData
          });
          continue;
        }

        let savedCompany: ICompany;

        if (existingCompany && updateExisting) {
          // Keep the existing tenant when updating
          const updateData = {
            ...companyData,
            tenant: existingCompany.tenant,
            updated_at: new Date().toISOString()
          };

          [savedCompany] = await trx('companies')
            .where({ company_id: existingCompany.company_id })
            .update(updateData)
            .returning('*');

          results.push({
            success: true,
            message: 'Company updated',
            company: savedCompany,
            originalData: companyData
          });
        } else {
          // Create new company
          const companyToCreate = {
            company_name: companyData.company_name,
            phone_no: companyData.phone_no || '',
            email: companyData.email || '',
            url: companyData.url || '',
            address: companyData.address || '',
            is_inactive: companyData.is_inactive || false,
            is_tax_exempt: companyData.is_tax_exempt || false,
            client_type: companyData.client_type || 'company',
            tenant: tenant,
            properties: companyData.properties || {},
            payment_terms: companyData.payment_terms || '',
            billing_cycle: companyData.billing_cycle || '',
            credit_limit: companyData.credit_limit || 0,
            preferred_payment_method: companyData.preferred_payment_method || '',
            auto_invoice: companyData.auto_invoice || false,
            invoice_delivery_method: companyData.invoice_delivery_method || '',
            tax_region: companyData.tax_region || '',
            tax_id_number: companyData.tax_id_number || '',
            tax_exemption_certificate: companyData.tax_exemption_certificate || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          [savedCompany] = await trx('companies')
            .insert(companyToCreate)
            .returning('*');

          results.push({
            success: true,
            message: 'Company created',
            company: savedCompany,
            originalData: companyData
          });
        }
      } catch (error) {
        console.error('Error processing company:', companyData, error);
        results.push({
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          originalData: companyData
        });
      }
    }
  });

  return results;
}

