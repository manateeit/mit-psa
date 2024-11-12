import { createTenantKnex } from '../lib/db';
import { 
    Asset, 
    AssetType, 
    AssetHistory, 
    AssetAssociation,
    CreateAssetRequest, 
    UpdateAssetRequest, 
    CreateAssetAssociationRequest,
    AssetQueryParams, 
    AssetListResponse,
    CompanyMaintenanceReport,
    MaintenanceType
} from '../interfaces/asset.interfaces';
import { ICompany } from '../interfaces/company.interfaces';

function convertDatesToISOString(obj: any): any {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (obj instanceof Date) {
        return obj.toISOString();
    }

    if (Array.isArray(obj)) {
        return obj.map((item):string => convertDatesToISOString(item));
    }

    if (typeof obj === 'object') {
        const converted: any = {};
        for (const [key, value] of Object.entries(obj)) {
            converted[key] = convertDatesToISOString(value);
        }
        return converted;
    }

    return obj;
}

export class AssetTypeModel {
    static async create(data: Omit<AssetType, 'tenant' | 'type_id' | 'created_at' | 'updated_at'>): Promise<AssetType> {
        const { knex, tenant } = await createTenantKnex();
        const [assetType] = await knex('asset_types')
            .insert({
                ...data,
                tenant,
            })
            .returning('*');
        return convertDatesToISOString(assetType);
    }

    static async findById(type_id: string): Promise<AssetType | null> {
        const { knex, tenant } = await createTenantKnex();
        const assetType = await knex('asset_types')
            .where({ tenant, type_id })
            .first();
        return assetType ? convertDatesToISOString(assetType) : null;
    }

    static async update(type_id: string, data: Partial<AssetType>): Promise<AssetType> {
        const { knex, tenant } = await createTenantKnex();
        const [assetType] = await knex('asset_types')
            .where({ tenant, type_id })
            .update({
                ...data,
                updated_at: new Date().toISOString(),
            })
            .returning('*');
        return convertDatesToISOString(assetType);
    }

    static async list(): Promise<AssetType[]> {
        const { knex, tenant } = await createTenantKnex();
        const assetTypes = await knex('asset_types').where({ tenant });
        return convertDatesToISOString(assetTypes);
    }

    static async delete(type_id: string): Promise<void> {
        const { knex, tenant } = await createTenantKnex();
        await knex('asset_types')
            .where({ tenant, type_id })
            .delete();
    }
}

export class AssetModel {
    static async create(data: CreateAssetRequest): Promise<Asset> {
        const { knex, tenant } = await createTenantKnex();
        if (!tenant) {
            throw new Error('No tenant found');
        }

        // Verify company exists and get full company details
        const company = await knex('companies')
            .select('*')
            .where({ tenant, company_id: data.company_id })
            .first();

        if (!company) {
            throw new Error('Company not found');
        }

        const [asset] = await knex('assets')
            .insert({
                ...data,
                tenant,
            })
            .returning('*');

        // Transform company data to match ICompany interface
        const transformedCompany: ICompany = {
            company_id: company.company_id,
            company_name: company.company_name,
            email: company.email ?? '',
            phone_no: company.phone_no ?? '',
            url: company.url ?? '',
            address: company.address ?? '',
            created_at: company.created_at ?? new Date().toISOString(),
            updated_at: company.updated_at ?? new Date().toISOString(),
            is_inactive: company.is_inactive ?? false,
            is_tax_exempt: company.is_tax_exempt ?? false,
            notes: company.notes ?? '',
            client_type: company.client_type,
            tax_id_number: company.tax_id_number,
            properties: company.properties,
            payment_terms: company.payment_terms,
            billing_cycle: company.billing_cycle,
            credit_limit: company.credit_limit,
            preferred_payment_method: company.preferred_payment_method,
            auto_invoice: company.auto_invoice ?? false,
            invoice_delivery_method: company.invoice_delivery_method,
            tax_region: company.tax_region,
            tax_exemption_certificate: company.tax_exemption_certificate,
            tenant // This is optional in the interface
        };

        return convertDatesToISOString({
            ...asset,
            company: transformedCompany
        });
    }

    static async findById(asset_id: string): Promise<Asset | null> {
        const { knex, tenant } = await createTenantKnex();
        if (!tenant) {
            throw new Error('No tenant found');
        }

        const asset = await knex('assets')
            .select(
                'assets.*',
                'companies.company_name',
                'companies.email',
                'companies.phone_no',
                'companies.url',
                'companies.address',
                'companies.created_at as company_created_at',
                'companies.updated_at as company_updated_at',
                'companies.is_inactive',
                'companies.is_tax_exempt',
                'companies.client_type',
                'companies.tax_id_number',
                'companies.properties',
                'companies.payment_terms',
                'companies.billing_cycle',
                'companies.credit_limit',
                'companies.preferred_payment_method',
                'companies.auto_invoice',
                'companies.invoice_delivery_method',
                'companies.tax_region',
                'companies.tax_exemption_certificate',
                'companies.notes as company_notes'
            )
            .leftJoin('companies', function() {
                this.on('assets.company_id', '=', 'companies.company_id')
                    .andOn('companies.tenant', '=', knex.raw('?', [tenant]));
            })
            .where({ 'assets.tenant': tenant, 'assets.asset_id': asset_id })
            .first();

        if (!asset) return null;

        // Transform the result to include company as a nested object
        const { 
            company_name,
            email,
            phone_no,
            url,
            address,
            company_created_at,
            company_updated_at,
            is_inactive,
            is_tax_exempt,
            client_type,
            tax_id_number,
            properties,
            payment_terms,
            billing_cycle,
            credit_limit,
            preferred_payment_method,
            auto_invoice,
            invoice_delivery_method,
            tax_region,
            tax_exemption_certificate,
            company_notes,
            ...assetData 
        } = asset;

        return convertDatesToISOString({
            ...assetData,
            company: company_name ? {
                company_id: asset.company_id,
                company_name,
                email: email ?? '',
                phone_no: phone_no ?? '',
                url: url ?? '',
                address: address ?? '',
                created_at: company_created_at ?? new Date().toISOString(),
                updated_at: company_updated_at ?? new Date().toISOString(),
                is_inactive: is_inactive ?? false,
                is_tax_exempt: is_tax_exempt ?? false,
                notes: company_notes ?? '',
                client_type,
                tax_id_number,
                properties,
                payment_terms,
                billing_cycle,
                credit_limit,
                preferred_payment_method,
                auto_invoice: auto_invoice ?? false,
                invoice_delivery_method,
                tax_region,
                tax_exemption_certificate,
                tenant // This is optional in the interface
            } : undefined
        });
    }

    static async update(asset_id: string, data: UpdateAssetRequest): Promise<Asset> {
        const { knex, tenant } = await createTenantKnex();
        if (!tenant) {
            throw new Error('No tenant found');
        }


        // If company_id is being updated, verify the new company exists
        if (data.company_id) {
            const company = await knex('companies')
                .select('*')
                .where({ tenant, company_id: data.company_id })
                .first();

            if (!company) {
                throw new Error('Company not found');
            }
        }

        const [asset] = await knex('assets')
            .where({ tenant, asset_id })
            .update({
                ...data,
                updated_at: new Date().toISOString(),
            })
            .returning('*');

        // Fetch company details
        const company = await knex('companies')
            .select('*')
            .where({ tenant, company_id: asset.company_id })
            .first();

        // Transform company data
        const transformedCompany: ICompany | undefined = company ? {
            company_id: company.company_id,
            company_name: company.company_name,
            email: company.email ?? '',
            phone_no: company.phone_no ?? '',
            url: company.url ?? '',
            address: company.address ?? '',
            created_at: company.created_at ?? new Date().toISOString(),
            updated_at: company.updated_at ?? new Date().toISOString(),
            is_inactive: company.is_inactive ?? false,
            is_tax_exempt: company.is_tax_exempt ?? false,
            notes: company.notes ?? '',
            client_type: company.client_type,
            tax_id_number: company.tax_id_number,
            properties: company.properties,
            payment_terms: company.payment_terms,
            billing_cycle: company.billing_cycle,
            credit_limit: company.credit_limit,
            preferred_payment_method: company.preferred_payment_method,
            auto_invoice: company.auto_invoice ?? false,
            invoice_delivery_method: company.invoice_delivery_method,
            tax_region: company.tax_region,
            tax_exemption_certificate: company.tax_exemption_certificate,
            tenant // This is optional in the interface
        } : undefined;

        return convertDatesToISOString({
            ...asset,
            company: transformedCompany
        });
    }

    static async list(params: AssetQueryParams): Promise<AssetListResponse> {
        const { knex, tenant } = await createTenantKnex();
        if (!tenant) {
            throw new Error('No tenant found');
        }

        const { 
            company_id, 
            company_name, 
            type_id, 
            status, 
            search, 
            maintenance_status,
            maintenance_type,
            page = 1, 
            limit = 10,
            include_company_details = false
        } = params;

        let baseQuery = knex('assets')
            .select(
                'assets.*',
                'companies.company_name',
                'companies.email',
                'companies.phone_no',
                'companies.url',
                'companies.address',
                'companies.created_at as company_created_at',
                'companies.updated_at as company_updated_at',
                'companies.is_inactive',
                'companies.is_tax_exempt',
                'companies.client_type',
                'companies.tax_id_number',
                'companies.properties',
                'companies.payment_terms',
                'companies.billing_cycle',
                'companies.credit_limit',
                'companies.preferred_payment_method',
                'companies.auto_invoice',
                'companies.invoice_delivery_method',
                'companies.tax_region',
                'companies.tax_exemption_certificate',
                'companies.notes as company_notes'
            )
            .innerJoin('companies', function() {
                this.on('assets.company_id', '=', 'companies.company_id')
                    .andOn('companies.tenant', '=', 'assets.tenant');
            })
            .where('assets.tenant', tenant);

        if (company_id) {
            baseQuery = baseQuery.where('assets.company_id', company_id);
        }
        if (company_name) {
            baseQuery = baseQuery.where('companies.company_name', 'ilike', `%${company_name}%`);
        }
        if (type_id) {
            baseQuery = baseQuery.where('assets.type_id', type_id);
        }
        if (status) {
            baseQuery = baseQuery.where('assets.status', status);
        }
        if (search) {
            baseQuery = baseQuery.where(builder => {
                builder
                    .where('assets.name', 'ilike', `%${search}%`)
                    .orWhere('assets.asset_tag', 'ilike', `%${search}%`)
                    .orWhere('assets.serial_number', 'ilike', `%${search}%`);
            });
        }

        if (maintenance_status) {
            const now = new Date().toISOString();
            baseQuery = baseQuery.leftJoin('asset_maintenance_schedules', function() {
                this.on('assets.asset_id', '=', 'asset_maintenance_schedules.asset_id')
                    .andOn('asset_maintenance_schedules.tenant', '=', knex.raw('?', [tenant]));
            });

            switch (maintenance_status) {
                case 'due':
                    baseQuery = baseQuery.where('asset_maintenance_schedules.next_maintenance', '<=', now);
                    break;
                case 'overdue':
                    baseQuery = baseQuery.where('asset_maintenance_schedules.next_maintenance', '<', now);
                    break;
                case 'upcoming':
                    baseQuery = baseQuery.where('asset_maintenance_schedules.next_maintenance', '>', now);
                    break;
                case 'completed':
                    baseQuery = baseQuery.whereNotNull('asset_maintenance_schedules.last_maintenance');
                    break;
            }
        }

        if (maintenance_type) {
            baseQuery = baseQuery.where('asset_maintenance_schedules.maintenance_type', maintenance_type);
        }

        // Get total count using a separate query
        const countQuery = baseQuery.clone();
        const [{ count }] = await countQuery
            .clearSelect()
            .count('* as count');

        const offset = Math.max(0, (page - 1) * limit);
        const assets = await baseQuery
            .orderBy('assets.created_at', 'desc')
            .offset(offset)
            .limit(Math.max(1, limit));

        console.log(baseQuery.toSQL());

        // Transform results to include company as a nested object and convert dates to ISO strings
        const transformedAssets = assets.map((asset: any): Asset => {
            const { 
                company_name,
                email,
                phone_no,
                url,
                address,
                company_created_at,
                company_updated_at,
                is_inactive,
                is_tax_exempt,
                client_type,
                tax_id_number,
                properties,
                payment_terms,
                billing_cycle,
                credit_limit,
                preferred_payment_method,
                auto_invoice,
                invoice_delivery_method,
                tax_region,
                tax_exemption_certificate,
                company_notes,
                ...assetData 
            } = asset;

            return convertDatesToISOString({
                ...assetData,
                company: company_name ? {
                    company_id: asset.company_id,
                    company_name,
                    email: email ?? '',
                    phone_no: phone_no ?? '',
                    url: url ?? '',
                    address: address ?? '',
                    created_at: company_created_at ?? new Date().toISOString(),
                    updated_at: company_updated_at ?? new Date().toISOString(),
                    is_inactive: is_inactive ?? false,
                    is_tax_exempt: is_tax_exempt ?? false,
                    notes: company_notes ?? '',
                    client_type,
                    tax_id_number,
                    properties,
                    payment_terms,
                    billing_cycle,
                    credit_limit,
                    preferred_payment_method,
                    auto_invoice: auto_invoice ?? false,
                    invoice_delivery_method,
                    tax_region,
                    tax_exemption_certificate,
                    tenant
                } : undefined
            });
        });

        let company_summary;
        if (include_company_details) {
            const assetsByCompany = await knex('assets')
                .select('company_id')
                .count('* as count')
                .where({ tenant })
                .groupBy('company_id');

            company_summary = {
                total_companies: assetsByCompany.length,
                assets_by_company: assetsByCompany.reduce<Record<string, number>>((acc, { company_id, count }) => ({
                    ...acc,
                    [company_id]: Number(count)
                }), {})
            };
        }

        return {
            assets: transformedAssets,
            total: Number(count),
            page,
            limit,
            company_summary
        };
    }

    static async delete(asset_id: string): Promise<void> {
        const { knex, tenant } = await createTenantKnex();
        await knex('assets')
            .where({ tenant, asset_id })
            .delete();
    }

    static async getCompanyAssetReport(company_id: string): Promise<CompanyMaintenanceReport> {
        const { knex, tenant } = await createTenantKnex();

        // Get company details
        const company = await knex('companies')
            .where({ tenant, company_id })
            .first();

        if (!company) {
            throw new Error('Company not found');
        }

        // Get asset statistics
        const assetStats = await knex('assets')
            .where({ tenant, company_id })
            .select(
                knex.raw('COUNT(DISTINCT assets.asset_id) as total_assets'),
                knex.raw(`
                    COUNT(DISTINCT CASE 
                        WHEN asset_maintenance_schedules.asset_id IS NOT NULL 
                        THEN assets.asset_id 
                    END) as assets_with_maintenance
                `)
            )
            .leftJoin('asset_maintenance_schedules', function() {
                this.on('assets.asset_id', '=', 'asset_maintenance_schedules.asset_id')
                    .andOn('asset_maintenance_schedules.tenant', '=', knex.raw('?', [tenant]));
            })
            .first();

        // Get maintenance statistics
        const maintenanceStats = await knex('asset_maintenance_schedules')
            .where({ tenant })
            .whereIn('asset_id', knex('assets').where({ tenant, company_id }).select('asset_id'))
            .select(
                knex.raw('COUNT(*) as total_schedules'),
                knex.raw(`
                    COUNT(CASE 
                        WHEN next_maintenance < NOW() AND is_active 
                        THEN 1 
                    END) as overdue_maintenances
                `),
                knex.raw(`
                    COUNT(CASE 
                        WHEN next_maintenance > NOW() AND is_active 
                        THEN 1 
                    END) as upcoming_maintenances
                `)
            )
            .first();

        // Get maintenance type breakdown
        const typeBreakdown = await knex('asset_maintenance_schedules')
            .where({ tenant })
            .whereIn('asset_id', knex('assets').where({ tenant, company_id }).select('asset_id'))
            .select('maintenance_type')
            .count('* as count')
            .groupBy('maintenance_type')
            .then(results => {
                const breakdown: Record<MaintenanceType, number> = {
                    preventive: 0,
                    inspection: 0,
                    calibration: 0,
                    replacement: 0
                };
                results.forEach(({ maintenance_type, count }) => {
                    if (maintenance_type in breakdown) {
                        breakdown[maintenance_type as MaintenanceType] = Number(count);
                    }
                });
                return breakdown;
            });

        // Get asset details
        const assets = await knex('assets')
            .select(
                'assets.asset_id',
                'assets.name as asset_name',
                'assets.asset_tag',
                'assets.status',
                'asset_maintenance_schedules.last_maintenance',
                'asset_maintenance_schedules.next_maintenance'
            )
            .leftJoin('asset_maintenance_schedules', function() {
                this.on('assets.asset_id', '=', 'asset_maintenance_schedules.asset_id')
                    .andOn('asset_maintenance_schedules.tenant', '=', knex.raw('?', [tenant]));
            })
            .where({ 'assets.tenant': tenant, 'assets.company_id': company_id });

        // Calculate compliance rate
        const completed = await knex('asset_maintenance_history')
            .where({ tenant })
            .whereIn('asset_id', knex('assets').where({ tenant, company_id }).select('asset_id'))
            .count('* as count')
            .first();

        const scheduled = await knex('asset_maintenance_schedules')
            .where({ tenant })
            .whereIn('asset_id', knex('assets').where({ tenant, company_id }).select('asset_id'))
            .sum('frequency_interval as sum')
            .first();

        const completedCount = completed?.count ? Number(completed.count) : 0;
        const scheduledSum = scheduled?.sum ? Number(scheduled.sum) : 0;
        const compliance_rate = scheduledSum > 0 ? (completedCount / scheduledSum) * 100 : 100;

        return convertDatesToISOString({
            company_id,
            company_name: company.company_name,
            total_assets: Number(assetStats?.total_assets || 0),
            assets_with_maintenance: Number(assetStats?.assets_with_maintenance || 0),
            total_schedules: Number(maintenanceStats?.total_schedules || 0),
            overdue_maintenances: Number(maintenanceStats?.overdue_maintenances || 0),
            upcoming_maintenances: Number(maintenanceStats?.upcoming_maintenances || 0),
            compliance_rate,
            maintenance_by_type: typeBreakdown,
            assets
        });
    }
}

export class AssetHistoryModel {
    static async create(
        asset_id: string, 
        changed_by: string, 
        change_type: string, 
        changes: Record<string, unknown>
    ): Promise<AssetHistory> {
        const { knex, tenant } = await createTenantKnex();
        const [history] = await knex('asset_history')
            .insert({
                tenant,
                asset_id,
                changed_by,
                change_type,
                changes,
            })
            .returning('*');
        return convertDatesToISOString(history);
    }

    static async listByAsset(asset_id: string): Promise<AssetHistory[]> {
        const { knex, tenant } = await createTenantKnex();
        const history = await knex('asset_history')
            .where({ tenant, asset_id })
            .orderBy('changed_at', 'desc');
        return convertDatesToISOString(history);
    }
}

export class AssetAssociationModel {
    static async create(data: CreateAssetAssociationRequest, created_by: string): Promise<AssetAssociation> {
        const { knex, tenant } = await createTenantKnex();
        const [association] = await knex('asset_associations')
            .insert({
                ...data,
                tenant,
                created_by,
                created_at: new Date().toISOString(),
            })
            .returning('*');
        return convertDatesToISOString(association);
    }

    static async findByAssetAndEntity(
        asset_id: string,
        entity_id: string,
        entity_type: string
    ): Promise<AssetAssociation | null> {
        const { knex, tenant } = await createTenantKnex();
        const association = await knex('asset_associations')
            .where({
                tenant,
                asset_id,
                entity_id,
                entity_type,
            })
            .first();
        return association ? convertDatesToISOString(association) : null;
    }

    static async listByAsset(asset_id: string): Promise<AssetAssociation[]> {
        const { knex, tenant } = await createTenantKnex();
        const associations = await knex('asset_associations')
            .where({ tenant, asset_id })
            .orderBy('created_at', 'desc');
        return convertDatesToISOString(associations);
    }

    static async listByEntity(entity_id: string, entity_type: string): Promise<AssetAssociation[]> {
        const { knex, tenant } = await createTenantKnex();
        const associations = await knex('asset_associations')
            .where({ tenant, entity_id, entity_type })
            .orderBy('created_at', 'desc');
        return convertDatesToISOString(associations);
    }

    static async delete(asset_id: string, entity_id: string, entity_type: string): Promise<void> {
        const { knex, tenant } = await createTenantKnex();
        await knex('asset_associations')
            .where({
                tenant,
                asset_id,
                entity_id,
                entity_type,
            })
            .delete();
    }
}
