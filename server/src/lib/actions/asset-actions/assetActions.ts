'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { AssetModel, AssetTypeModel, AssetHistoryModel, AssetAssociationModel } from '@/models/asset';
import {
    CreateAssetRequest,
    UpdateAssetRequest,
    AssetQueryParams,
    CreateAssetTypeRequest,
    CreateAssetAssociationRequest,
    CreateAssetDocumentRequest,
    CreateMaintenanceScheduleRequest,
    UpdateMaintenanceScheduleRequest,
    CreateMaintenanceHistoryRequest,
    Asset,
    AssetType,
    AssetListResponse,
    AssetAssociation,
    AssetDocument,
    AssetMaintenanceSchedule,
    AssetMaintenanceHistory,
    AssetMaintenanceReport,
    ClientMaintenanceSummary,
    AssetCompanyInfo,
    WorkstationAsset,
    NetworkDeviceAsset,
    ServerAsset,
    MobileDeviceAsset,
    PrinterAsset,
    isWorkstationAsset,
    isNetworkDeviceAsset,
    isServerAsset,
    isMobileDeviceAsset,
    isPrinterAsset
} from '@/interfaces/asset.interfaces';
import { validateData } from '@/lib/utils/validation';
import {
    assetSchema,
    assetTypeSchema,
    assetAssociationSchema,
    createAssetSchema,
    createAssetTypeSchema,
    createAssetAssociationSchema,
    updateAssetSchema,
    assetQuerySchema,
    assetDocumentSchema,
    assetMaintenanceScheduleSchema,
    createMaintenanceScheduleSchema,
    updateMaintenanceScheduleSchema,
    assetMaintenanceHistorySchema,
    createMaintenanceHistorySchema,
    assetMaintenanceReportSchema,
    clientMaintenanceSummarySchema
} from '@/lib/schemas/asset.schema';
import { getCurrentUser } from '@/lib/actions/user-actions/userActions';
import { createTenantKnex } from '@/lib/db';
import { Knex } from 'knex';

// Helper function to get extension table data
async function getExtensionData(knex: Knex, tenant: string, asset_id: string, asset_type: string): Promise<Record<string, any> | null> {
    switch (asset_type.toLowerCase()) {
        case 'workstation':
            return knex('workstation_assets')
                .where({ tenant, asset_id })
                .first();
        case 'network_device':
            return knex('network_device_assets')
                .where({ tenant, asset_id })
                .first();
        case 'server':
            return knex('server_assets')
                .where({ tenant, asset_id })
                .first();
        case 'mobile_device':
            return knex('mobile_device_assets')
                .where({ tenant, asset_id })
                .first();
        case 'printer':
            return knex('printer_assets')
                .where({ tenant, asset_id })
                .first();
        default:
            return null;
    }
}

// Helper function to validate extension data based on type
function validateExtensionData(data: unknown, type: string): Record<string, any> | null {
    if (!data || typeof data !== 'object') return null;

    switch (type.toLowerCase()) {
        case 'workstation':
            if (isWorkstationAsset(data)) return data;
            break;
        case 'network_device':
            if (isNetworkDeviceAsset(data)) return data;
            break;
        case 'server':
            if (isServerAsset(data)) return data;
            break;
        case 'mobile_device':
            if (isMobileDeviceAsset(data)) return data;
            break;
        case 'printer':
            if (isPrinterAsset(data)) return data;
            break;
    }
    return null;
}

// Helper function to insert/update extension table data
async function upsertExtensionData(
    knex: Knex,
    tenant: string,
    asset_id: string,
    asset_type: string,
    data: unknown
): Promise<void> {
    const validatedData = validateExtensionData(data, asset_type);
    if (!validatedData) return;

    const table = `${asset_type.toLowerCase()}_assets`;
    const extensionData = { tenant, asset_id, ...validatedData };

    // Check if record exists
    const exists = await knex(table)
        .where({ tenant, asset_id })
        .first();

    if (exists) {
        await knex(table)
            .where({ tenant, asset_id })
            .update(extensionData);
    } else {
        await knex(table).insert(extensionData);
    }
}

// Export getAsset for external use
export async function getAsset(asset_id: string): Promise<Asset> {
    const { knex, tenant } = await createTenantKnex();
    if (!tenant) {
        throw new Error('No tenant found');
    }
    return getAssetWithExtensions(knex, tenant, asset_id);
}


export async function createAsset(data: CreateAssetRequest): Promise<Asset> {
    const { knex, tenant } = await createTenantKnex();
    if (!tenant) {
        throw new Error('No tenant found');
    }

    try {
        // Start transaction
        const result = await knex.transaction(async (trx: any) => {
            // Validate the input data
            const validatedData = validateData(createAssetSchema, data);

            // Get asset type
            const assetType = await trx('asset_types')
                .where({ tenant, type_id: validatedData.type_id })
                .first();

            if (!assetType) {
                throw new Error('Asset type not found');
            }

            // Create base asset
            const [asset] = await trx('assets')
                .insert({
                    tenant,
                    ...validatedData,
                    created_at: knex.fn.now(),
                    updated_at: knex.fn.now()
                })
                .returning('*');

            // Handle extension table data based on asset type
            if (assetType.type_name) {
                const extensionData = data[assetType.type_name.toLowerCase() as keyof CreateAssetRequest];
                if (extensionData) {
                    await upsertExtensionData(trx, tenant, asset.asset_id, assetType.type_name, extensionData);
                }
            }

            // Create history record
            await trx('asset_history').insert({
                tenant,
                asset_id: asset.asset_id,
                changed_by: 'system', // TODO: Get actual user ID
                change_type: 'created',
                changes: validatedData,
                changed_at: knex.fn.now()
            });

            // Get complete asset data including extension table data
            const completeAsset = await getAssetWithExtensions(trx, tenant, asset.asset_id);
            return completeAsset;
        });

        revalidatePath('/assets');
        return validateData(assetSchema, result);
    } catch (error) {
        console.error('Error creating asset:', error);
        throw new Error('Failed to create asset');
    }
}

export async function updateAsset(asset_id: string, data: UpdateAssetRequest): Promise<Asset> {
    const { knex, tenant } = await createTenantKnex();
    if (!tenant) {
        throw new Error('No tenant found');
    }

    try {
        const result = await knex.transaction(async (trx: any) => {
            // Validate the update data
            const validatedData = validateData(updateAssetSchema, data);

            // Get current asset type
            const asset = await trx('assets')
                .where({ tenant, asset_id })
                .first();

            if (!asset) {
                throw new Error('Asset not found');
            }

            const assetType = await trx('asset_types')
                .where({ tenant, type_id: asset.type_id })
                .first();

            // Update base asset
            const [updatedAsset] = await trx('assets')
                .where({ tenant, asset_id })
                .update({
                    ...validatedData,
                    updated_at: knex.fn.now()
                })
                .returning('*');

            // Handle extension table data
            if (assetType?.type_name) {
                const extensionData = data[assetType.type_name.toLowerCase() as keyof UpdateAssetRequest];
                if (extensionData) {
                    await upsertExtensionData(trx, tenant, asset_id, assetType.type_name, extensionData);
                }
            }

            // Create history record
            await trx('asset_history').insert({
                tenant,
                asset_id,
                changed_by: 'system', // TODO: Get actual user ID
                change_type: 'updated',
                changes: validatedData,
                changed_at: knex.fn.now()
            });

            // Get complete asset data including extension table data
            const completeAsset = await getAssetWithExtensions(trx, tenant, asset_id);
            return completeAsset;
        });

        revalidatePath('/assets');
        revalidatePath(`/assets/${asset_id}`);
        return validateData(assetSchema, result);
    } catch (error) {
        console.error('Error updating asset:', error);
        throw new Error('Failed to update asset');
    }
}

async function getAssetWithExtensions(knex: Knex, tenant: string, asset_id: string): Promise<Asset> {
    // Get base asset data with company info
    const asset = await knex('assets')
        .select(
            'assets.*',
            'companies.company_name'
        )
        .leftJoin('companies', function(this: Knex.JoinClause) {
            this.on('companies.company_id', '=', 'assets.company_id')
                .andOn('companies.tenant', '=', 'assets.tenant');
        })
        .where({ 'assets.tenant': tenant, 'assets.asset_id': asset_id })
        .first();

    if (!asset) {
        throw new Error('Asset not found');
    }

    // Get asset type
    const assetType = await knex('asset_types')
        .where({ tenant, type_id: asset.type_id })
        .first();

    // Get extension table data if applicable
    let extensionData = null;
    if (assetType?.type_name) {
        extensionData = await getExtensionData(knex, tenant, asset_id, assetType.type_name);
    }

    // Get relationships
    const relationships = await knex('asset_relationships')
        .where(function(this: Knex.QueryBuilder) {
            this.where('parent_asset_id', asset_id)
                .orWhere('child_asset_id', asset_id);
        })
        .andWhere({ tenant });

    // Transform the data
    const transformedAsset: Asset = {
        ...asset,
        company: {
            company_id: asset.company_id,
            company_name: asset.company_name || ''
        },
        relationships,
        // Add extension data under the appropriate key
        ...(extensionData && assetType?.type_name ? {
            [assetType.type_name.toLowerCase()]: extensionData
        } : {})
    };

    return transformedAsset;
}

export async function listAssets(params: AssetQueryParams): Promise<AssetListResponse> {
    const { knex, tenant } = await createTenantKnex();
    if (!tenant) {
        throw new Error('No tenant found');
    }

    try {
        // Validate query parameters
        const validatedParams = validateData(assetQuerySchema, params);

        // Build base query
        const baseQuery = knex('assets')
            .where('assets.tenant', tenant)
            .leftJoin('companies', function(this: Knex.JoinClause) {
                this.on('companies.company_id', '=', 'assets.company_id')
                    .andOn('companies.tenant', '=', 'assets.tenant');
            })
            .leftJoin('asset_types', function(this: Knex.JoinClause) {
                this.on('asset_types.type_id', '=', 'assets.type_id')
                    .andOn('asset_types.tenant', '=', 'assets.tenant');
            });

        // Apply filters
        if (validatedParams.company_id) {
            baseQuery.where('assets.company_id', validatedParams.company_id);
        }
        if (validatedParams.type_id && /^[0-9a-f-]{36}$/i.test(validatedParams.type_id)) {
            baseQuery.where('assets.type_id', validatedParams.type_id);
        }
        if (validatedParams.status) {
            baseQuery.where('assets.status', validatedParams.status);
        }

        // Get total count
        const [{ count }] = await baseQuery.clone().count('* as count');

        // Get paginated results
        const page = validatedParams.page || 1;
        const limit = validatedParams.limit || 10;
        const offset = (page - 1) * limit;

        const assets = await baseQuery
            .select(
                'assets.*',
                'companies.company_name',
                'asset_types.type_name'
            )
            .orderBy('assets.created_at', 'desc')
            .limit(limit)
            .offset(offset);

        // Get extension data for each asset if requested
        const assetsWithExtensions = await Promise.all(
            assets.map(async (asset: any): Promise<Asset> => {
                const extensionData = validatedParams.include_extension_data && asset.type_name
                    ? await getExtensionData(knex, tenant, asset.asset_id, asset.type_name)
                    : null;

                return {
                    ...asset,
                    company: {
                        company_id: asset.company_id,
                        company_name: asset.company_name || ''
                    },
                    ...(extensionData && asset.type_name ? {
                        [asset.type_name.toLowerCase()]: extensionData
                    } : {})
                };
            })
        );

        const response = {
            assets: assetsWithExtensions,
            total: Number(count),
            page,
            limit
        };

        return response;
    } catch (error) {
        console.error('Error listing assets:', error);
        throw new Error('Failed to list assets');
    }
}

// Maintenance Schedule Management
export async function createMaintenanceSchedule(data: CreateMaintenanceScheduleRequest): Promise<AssetMaintenanceSchedule> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error('No user session found');
        }

        const { knex, tenant } = await createTenantKnex();
        if (!tenant) {
            throw new Error('No tenant found');
        }

        // Validate the input data
        const validatedData = validateData(createMaintenanceScheduleSchema, data);

        // Insert the schedule
        const [schedule] = await knex('asset_maintenance_schedules')
            .insert({
                tenant,
                asset_id: validatedData.asset_id,
                schedule_name: validatedData.schedule_name,
                description: validatedData.description,
                maintenance_type: validatedData.maintenance_type,
                frequency: validatedData.frequency,
                frequency_interval: validatedData.frequency_interval,
                schedule_config: validatedData.schedule_config,
                next_maintenance: validatedData.next_maintenance,
                created_by: currentUser.user_id
            })
            .returning('*');

        // Create initial notification
        await knex('asset_maintenance_notifications')
            .insert({
                tenant,
                schedule_id: schedule.schedule_id,
                asset_id: schedule.asset_id,
                notification_type: 'upcoming',
                notification_date: schedule.next_maintenance,
                notification_data: {
                    schedule_name: schedule.schedule_name,
                    maintenance_type: schedule.maintenance_type
                }
            });

        revalidatePath('/assets');
        revalidatePath(`/assets/${data.asset_id}`);

        return validateData(assetMaintenanceScheduleSchema, schedule);
    } catch (error) {
        console.error('Error creating maintenance schedule:', error);
        throw new Error('Failed to create maintenance schedule');
    }
}

export async function updateMaintenanceSchedule(
    schedule_id: string,
    data: UpdateMaintenanceScheduleRequest
): Promise<AssetMaintenanceSchedule> {
    try {
        const { knex, tenant } = await createTenantKnex();
        if (!tenant) {
            throw new Error('No tenant found');
        }

        // Validate the update data
        const validatedData = validateData(updateMaintenanceScheduleSchema, data);

        // Update the schedule
        const [schedule] = await knex('asset_maintenance_schedules')
            .where({ tenant, schedule_id })
            .update({
                ...validatedData,
                updated_at: knex.fn.now()
            })
            .returning('*');

        // Update notifications if next_maintenance changed
        if (validatedData.next_maintenance) {
            await knex('asset_maintenance_notifications')
                .where({
                    tenant,
                    schedule_id,
                    is_sent: false
                })
                .update({
                    notification_date: validatedData.next_maintenance,
                    notification_data: knex.raw(`
                        jsonb_set(
                            notification_data,
                            '{schedule_name}',
                            ?::jsonb
                        )
                    `, [JSON.stringify(validatedData.schedule_name || schedule.schedule_name)])
                });
        }

        revalidatePath('/assets');
        revalidatePath(`/assets/${schedule.asset_id}`);

        return validateData(assetMaintenanceScheduleSchema, schedule);
    } catch (error) {
        console.error('Error updating maintenance schedule:', error);
        throw new Error('Failed to update maintenance schedule');
    }
}

export async function deleteMaintenanceSchedule(schedule_id: string): Promise<void> {
    try {
        const { knex, tenant } = await createTenantKnex();
        if (!tenant) {
            throw new Error('No tenant found');
        }

        const [schedule] = await knex('asset_maintenance_schedules')
            .where({ tenant, schedule_id })
            .delete()
            .returning(['asset_id']);

        revalidatePath('/assets');
        if (schedule) {
            revalidatePath(`/assets/${schedule.asset_id}`);
        }
    } catch (error) {
        console.error('Error deleting maintenance schedule:', error);
        throw new Error('Failed to delete maintenance schedule');
    }
}

export async function recordMaintenanceHistory(data: CreateMaintenanceHistoryRequest): Promise<AssetMaintenanceHistory> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error('No user session found');
        }

        const { knex, tenant } = await createTenantKnex();
        if (!tenant) {
            throw new Error('No tenant found');
        }

        // Validate the input data
        const validatedData = validateData(createMaintenanceHistorySchema, data);

        // Record the maintenance history
        const [history] = await knex('asset_maintenance_history')
            .insert({
                tenant,
                ...validatedData,
                performed_by: currentUser.user_id
            })
            .returning('*');

        // Update the schedule's last maintenance date and calculate next maintenance
        const [schedule] = await knex('asset_maintenance_schedules')
            .where({
                tenant,
                schedule_id: validatedData.schedule_id
            })
            .update({
                last_maintenance: validatedData.performed_at,
                next_maintenance: knex.raw(`
                    CASE frequency
                        WHEN 'daily' THEN ? + INTERVAL '1 day' * frequency_interval
                        WHEN 'weekly' THEN ? + INTERVAL '1 week' * frequency_interval
                        WHEN 'monthly' THEN ? + INTERVAL '1 month' * frequency_interval
                        WHEN 'quarterly' THEN ? + INTERVAL '3 months' * frequency_interval
                        WHEN 'yearly' THEN ? + INTERVAL '1 year' * frequency_interval
                        ELSE ? + INTERVAL '1 day' * frequency_interval
                    END
                `, Array(6).fill(validatedData.performed_at))
            })
            .returning('*');

        // Create next notification
        await knex('asset_maintenance_notifications')
            .insert({
                tenant,
                schedule_id: schedule.schedule_id,
                asset_id: schedule.asset_id,
                notification_type: 'upcoming',
                notification_date: schedule.next_maintenance,
                notification_data: {
                    schedule_name: schedule.schedule_name,
                    maintenance_type: schedule.maintenance_type
                }
            });

        revalidatePath('/assets');
        revalidatePath(`/assets/${data.asset_id}`);

        return validateData(assetMaintenanceHistorySchema, history);
    } catch (error) {
        console.error('Error recording maintenance history:', error);
        throw new Error('Failed to record maintenance history');
    }
}

// Reporting Functions
export async function getAssetMaintenanceReport(asset_id: string): Promise<AssetMaintenanceReport> {
    try {
        const { knex, tenant } = await createTenantKnex();
        if (!tenant) {
            throw new Error('No tenant found');
        }

        // Get asset details
        const asset = await knex('assets')
            .where({ tenant, asset_id })
            .first();

        if (!asset) {
            throw new Error('Asset not found');
        }

        // Get maintenance statistics with proper date handling
        const stats = await knex('asset_maintenance_schedules')
            .where({ tenant, asset_id })
            .select(
                knex.raw('COUNT(*) as total_schedules'),
                knex.raw('SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_schedules'),
                knex.raw(`
                    TO_CHAR(MAX(last_maintenance), 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as last_maintenance
                `),
                knex.raw(`
                    TO_CHAR(MIN(next_maintenance), 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as next_maintenance
                `)
            )
            .first();

        // Get maintenance history
        const history = await knex('asset_maintenance_history')
            .where({ tenant, asset_id })
            .orderBy('performed_at', 'desc');

        // Calculate compliance rate
        const completed = await knex('asset_maintenance_history')
            .where({ tenant, asset_id })
            .count('* as count')
            .first();

        const scheduled = await knex('asset_maintenance_schedules')
            .where({ tenant, asset_id })
            .sum('frequency_interval as sum')
            .first();

        const completedCount = completed?.count ? Number(completed.count) : 0;
        const scheduledSum = scheduled?.sum ? Number(scheduled.sum) : 0;
        const compliance_rate = scheduledSum > 0 ? (completedCount / scheduledSum) * 100 : 100;

        // Get upcoming maintenance count
        const upcomingCount = await knex('asset_maintenance_notifications')
            .where({ tenant, asset_id, is_sent: false })
            .count('* as count')
            .first()
            .then(result => Number(result?.count || 0));

        const report = {
            asset_id,
            asset_name: asset.name,
            total_schedules: Number(stats?.total_schedules || 0),
            active_schedules: Number(stats?.active_schedules || 0),
            completed_maintenances: completedCount,
            upcoming_maintenances: upcomingCount,
            last_maintenance: stats?.last_maintenance || undefined,
            next_maintenance: stats?.next_maintenance || undefined,
            compliance_rate,
            maintenance_history: history.map((record): AssetMaintenanceHistory => ({
                ...record,
                performed_at: record.performed_at instanceof Date 
                    ? record.performed_at.toISOString()
                    : String(record.performed_at)
            }))
        };

        return validateData(assetMaintenanceReportSchema, report);
    } catch (error) {
        console.error('Error getting asset maintenance report:', error);
        throw new Error('Failed to get asset maintenance report');
    }
}



export async function getClientMaintenanceSummary(company_id: string): Promise<ClientMaintenanceSummary> {
    try {
        const { knex, tenant } = await createTenantKnex();
        if (!tenant) {
            throw new Error('No tenant found');
        }

        // Get company details
        const company = await knex('companies')
            .where({ tenant, company_id })
            .first();

        if (!company) {
            throw new Error('Company not found');
        }

        // Get asset statistics with proper 'this' type annotation
        const assetStats = await knex('assets')
            .where({ 'assets.tenant': tenant, company_id })
            .select(
                knex.raw('COUNT(DISTINCT assets.asset_id) as total_assets'),
                knex.raw(`
                    COUNT(DISTINCT CASE 
                        WHEN asset_maintenance_schedules.asset_id IS NOT NULL 
                        THEN assets.asset_id 
                    END) as assets_with_maintenance
                `)
            )
            .leftJoin('asset_maintenance_schedules', function(this: Knex.JoinClause) {
                this.on('assets.asset_id', '=', 'asset_maintenance_schedules.asset_id')
                    .andOn('asset_maintenance_schedules.tenant', '=', knex.raw('?', [tenant]));
            })
            .first();

        // Get maintenance statistics with date conversion
        const maintenanceStats = await knex('asset_maintenance_schedules')
            .where({ 'asset_maintenance_schedules.tenant': tenant })
            .whereIn('asset_id',
                knex('assets')
                    .where({ 'assets.tenant': tenant, company_id })
                    .select('asset_id')
            )
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
            .where({ 'asset_maintenance_schedules.tenant': tenant })
            .whereIn('asset_id',
                knex('assets')
                    .where({ 'assets.tenant': tenant, company_id })
                    .select('asset_id')
            )
            .select('maintenance_type')
            .count('* as count')
            .groupBy('maintenance_type')
            .then(results =>
                results.reduce((acc, { maintenance_type, count }) => ({
                    ...acc,
                    [maintenance_type]: Number(count)
                }), {} as Record<string, number>)
            );

        // Calculate compliance rate
        const completed = await knex('asset_maintenance_history')
            .where({ 'asset_maintenance_history.tenant': tenant })
            .whereIn('asset_id',
                knex('assets')
                    .where({ 'assets.tenant': tenant, company_id })
                    .select('asset_id')
            )
            .count('* as count')
            .first();

        const scheduled = await knex('asset_maintenance_schedules')
            .where({ 'asset_maintenance_schedules.tenant': tenant })
            .whereIn('asset_id',
                knex('assets')
                    .where({ 'assets.tenant': tenant, company_id })
                    .select('asset_id')
            )
            .sum('frequency_interval as sum')
            .first();

        const completedCount = completed?.count ? Number(completed.count) : 0;
        const scheduledSum = scheduled?.sum ? Number(scheduled.sum) : 0;
        const compliance_rate = scheduledSum > 0 ? (completedCount / scheduledSum) * 100 : 100;

        // Create summary with proper date handling
        const summary = {
            company_id,
            company_name: company.company_name,
            total_assets: Number(assetStats?.total_assets || 0),
            assets_with_maintenance: Number(assetStats?.assets_with_maintenance || 0),
            total_schedules: Number(maintenanceStats?.total_schedules || 0),
            overdue_maintenances: Number(maintenanceStats?.overdue_maintenances || 0),
            upcoming_maintenances: Number(maintenanceStats?.upcoming_maintenances || 0),
            compliance_rate,
            maintenance_by_type: typeBreakdown || {}
        };

        // Validate and return the summary
        return validateData(clientMaintenanceSummarySchema, summary);
    } catch (error) {
        console.error('Error getting client maintenance summary:', error);
        throw new Error('Failed to get client maintenance summary');
    }
}

// Asset Association Functions
// Update only the map callback in listEntityAssets function
export async function listEntityAssets(entity_id: string, entity_type: 'ticket' | 'project'): Promise<Asset[]> {
    const { knex, tenant } = await createTenantKnex();
    if (!tenant) {
        throw new Error('No tenant found');
    }

    try {
        // Get asset associations
        const associations = await knex('asset_associations')
            .where({
                tenant,
                entity_id,
                entity_type
            });

        // Add explicit return type to the map callback
        const assets = await Promise.all(
            associations.map(async (association): Promise<Asset> => 
                getAssetWithExtensions(knex, tenant, association.asset_id)
            )
        );

        return assets;
    } catch (error) {
        console.error('Error listing entity assets:', error);
        throw new Error('Failed to list entity assets');
    }
}

export async function createAssetAssociation(data: CreateAssetAssociationRequest): Promise<AssetAssociation> {
    const { knex, tenant } = await createTenantKnex();
    if (!tenant) {
        throw new Error('No tenant found');
    }

    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error('No user session found');
        }

        // Validate the input data
        const validatedData = validateData(createAssetAssociationSchema, data);

        // Create the association
        const [association] = await knex('asset_associations')
            .insert({
                tenant,
                ...validatedData,
                created_by: currentUser.user_id,
                created_at: knex.fn.now()
            })
            .returning('*');

        // Revalidate paths
        revalidatePath('/assets');
        revalidatePath(`/assets/${data.asset_id}`);
        if (data.entity_type === 'ticket') {
            revalidatePath(`/tickets/${data.entity_id}`);
        } else {
            revalidatePath(`/projects/${data.entity_id}`);
        }

        return validateData(assetAssociationSchema, association);
    } catch (error) {
        console.error('Error creating asset association:', error);
        throw new Error('Failed to create asset association');
    }
}

export async function removeAssetAssociation(
    asset_id: string,
    entity_id: string,
    entity_type: 'ticket' | 'project'
): Promise<void> {
    const { knex, tenant } = await createTenantKnex();
    if (!tenant) {
        throw new Error('No tenant found');
    }

    try {
        await knex('asset_associations')
            .where({
                tenant,
                asset_id,
                entity_id,
                entity_type
            })
            .delete();

        // Revalidate paths
        revalidatePath('/assets');
        revalidatePath(`/assets/${asset_id}`);
        if (entity_type === 'ticket') {
            revalidatePath(`/tickets/${entity_id}`);
        } else {
            revalidatePath(`/projects/${entity_id}`);
        }
    } catch (error) {
        console.error('Error removing asset association:', error);
        throw new Error('Failed to remove asset association');
    }
}

// Add listAssetTypes function to existing file
export async function listAssetTypes(): Promise<AssetType[]> {
    const { knex, tenant } = await createTenantKnex();
    if (!tenant) {
        throw new Error('No tenant found');
    }

    try {
        const types = await knex('asset_types')
            .where({ tenant })
            .orderBy('type_name');

        // Transform and validate each type
        const transformedTypes = await Promise.all(types.map(async (type): Promise<AssetType> => {
            // Ensure all fields have valid values before validation
            const preparedType = {
                tenant: type.tenant || tenant, // Use current tenant if null
                type_id: type.type_id || '', // Should never be null due to NOT NULL constraint
                type_name: String(type.type_name || ''), // Convert null/undefined to empty string
                parent_type_id: type.parent_type_id || undefined, // Optional field
                attributes_schema: type.attributes_schema || {}, // Default to empty object
                created_at: type.created_at instanceof Date 
                    ? type.created_at.toISOString() 
                    : (type.created_at || new Date().toISOString()),
                updated_at: type.updated_at instanceof Date 
                    ? type.updated_at.toISOString() 
                    : (type.updated_at || new Date().toISOString())
            };

            try {
                // Validate the prepared data
                return validateData(assetTypeSchema, preparedType);
            } catch (validationError) {
                console.error('Validation error for asset type:', type, validationError);
                // Return a safe default if validation fails
                return {
                    tenant: tenant,
                    type_id: type.type_id || '',
                    type_name: String(type.type_name || ''),
                    attributes_schema: {},
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
            }
        }));

        return transformedTypes;
    } catch (error) {
        console.error('Error listing asset types:', error);
        throw new Error('Failed to list asset types');
    }
}
