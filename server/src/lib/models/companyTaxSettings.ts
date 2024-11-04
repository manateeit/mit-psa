import { Knex } from 'knex';
import { createTenantKnex } from '../db';
import { ICompanyTaxSettings, ITaxRate, ITaxComponent, ICompositeTaxMapping, ITaxRateThreshold, ITaxHoliday } from '../../interfaces/tax.interfaces';

const CompanyTaxSettings = {
  async get(companyId: string): Promise<ICompanyTaxSettings | null> {
    try {
      const { knex: db } = await createTenantKnex();
      const taxSettings = await db<ICompanyTaxSettings>('company_tax_settings')
        .where({ company_id: companyId })
        .first();

      if (taxSettings) {
        taxSettings.tax_components = await this.getCompositeTaxComponents(taxSettings.tax_rate_id);
        taxSettings.tax_rate_thresholds = await this.getTaxRateThresholds(taxSettings.tax_rate_id);
        taxSettings.tax_holidays = await this.getTaxHolidays(taxSettings.tax_rate_id);
      }

      return taxSettings || null;
    } catch (error) {
      console.error(`Error getting tax settings for company ${companyId}:`, error);
      throw error;
    }
  },

  async create(taxSettings: Omit<ICompanyTaxSettings, 'tenant'>): Promise<ICompanyTaxSettings> {
    try {
      const { knex: db, tenant } = await createTenantKnex();
      const [createdSettings] = await db<ICompanyTaxSettings>('company_tax_settings')
        .insert({ ...taxSettings, tenant: tenant! })
        .returning('*');

      return createdSettings;
    } catch (error) {
      console.error('Error creating company tax settings:', error);
      throw error;
    }
  },

  async update(companyId: string, taxSettings: Partial<ICompanyTaxSettings>): Promise<ICompanyTaxSettings> {
    try {
      const { knex: db } = await createTenantKnex();
      const [updatedSettings] = await db<ICompanyTaxSettings>('company_tax_settings')
        .where({ company_id: companyId })
        .update(taxSettings)
        .returning('*');

      return updatedSettings;
    } catch (error) {
      console.error(`Error updating tax settings for company ${companyId}:`, error);
      throw error;
    }
  },

  async getTaxRate(tax_rate_id: string): Promise<ITaxRate | undefined> {
    try {
      const { knex: db } = await createTenantKnex();
      const taxRate = await db<ITaxRate>('tax_rates')
        .where({ tax_rate_id })
        .first();
      return taxRate;
    } catch (error) {
      console.error(`Error getting tax rate ${tax_rate_id}:`, error);
      throw error;
    }
  },

  async getCompositeTaxComponents(tax_rate_id: string): Promise<ITaxComponent[]> {
    try {
      const { knex: db } = await createTenantKnex();
      const components = await db<ITaxComponent>('tax_components')
        .join('composite_tax_mappings', 'tax_components.tax_component_id', 'composite_tax_mappings.tax_component_id')
        .where('composite_tax_mappings.composite_tax_id', tax_rate_id)
        .orderBy('composite_tax_mappings.sequence')
        .select('tax_components.*');
      return components;
    } catch (error) {
      console.error(`Error getting composite tax components for tax rate ${tax_rate_id}:`, error);
      throw error;
    }
  },

  async getTaxRateThresholds(tax_rate_id: string): Promise<ITaxRateThreshold[]> {
    try {
      const { knex: db } = await createTenantKnex();
      const thresholds = await db<ITaxRateThreshold>('tax_rate_thresholds')
        .where({ tax_rate_id })
        .orderBy('min_amount');
      return thresholds;
    } catch (error) {
      console.error(`Error getting tax rate thresholds for tax rate ${tax_rate_id}:`, error);
      throw error;
    }
  },

  async getTaxHolidays(tax_rate_id: string): Promise<ITaxHoliday[]> {
    try {
      const { knex: db } = await createTenantKnex();
      const holidays = await db<ITaxHoliday>('tax_holidays')
        .where('tax_rate_id', tax_rate_id)
        .orderBy('start_date');
      return holidays;
    } catch (error) {
      console.error(`Error getting tax holidays for tax rate ${tax_rate_id}:`, error);
      throw error;
    }
  },

  async createCompositeTax(taxRate: Omit<ITaxRate, 'tenant'>, components: ITaxComponent[]): Promise<ITaxRate> {
    const { knex: db, tenant } = await createTenantKnex();
    const trx = await db.transaction();
    try {
      const [createdTaxRate] = await trx<ITaxRate>('tax_rates')
        .insert({ ...taxRate, is_composite: true, tenant: tenant! })
        .returning('*');

      const compositeMappings = components.map((component, index): ICompositeTaxMapping => ({
        composite_tax_id: createdTaxRate.tax_rate_id,
        tax_component_id: component.tax_component_id,
        sequence: index + 1,
        tenant: tenant!
      }));

      await trx<ICompositeTaxMapping>('composite_tax_mappings').insert(compositeMappings);

      await trx.commit();
      return createdTaxRate;
    } catch (error) {
      await trx.rollback();
      console.error('Error creating composite tax:', error);
      throw error;
    }
  },

  async updateCompositeTax(tax_rate_id: string, taxRate: Partial<ITaxRate>, components: ITaxComponent[]): Promise<ITaxRate> {
    const { knex: db, tenant } = await createTenantKnex();
    const trx = await db.transaction();
    try {
      const [updatedTaxRate] = await trx<ITaxRate>('tax_rates')
        .where({ tax_rate_id })
        .update(taxRate)
        .returning('*');

      await trx<ICompositeTaxMapping>('composite_tax_mappings')
        .where({ composite_tax_id: tax_rate_id })
        .del();

      const compositeMappings = components.map((component, index): ICompositeTaxMapping => ({
        composite_tax_id: tax_rate_id,
        tax_component_id: component.tax_component_id,
        sequence: index + 1,
        tenant: tenant!
      }));

      await trx<ICompositeTaxMapping>('composite_tax_mappings').insert(compositeMappings);

      await trx.commit();
      return updatedTaxRate;
    } catch (error) {
      await trx.rollback();
      console.error(`Error updating composite tax ${tax_rate_id}:`, error);
      throw error;
    }
  },
};

export default CompanyTaxSettings;
