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
    AssetCompanyInfo
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
    assetListResponseSchema,
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
import { transact } from 'yjs';

// Define an interface for the database result that includes joined company fields
interface AssetWithCompanyFields extends Asset {
    company_name?: string;
}


export async function createAsset(data: CreateAssetRequest): Promise<Asset> {
    try {
        // Validate the input data
        const validatedData = validateData(createAssetSchema, data);

        const asset = await AssetModel.create(validatedData);
        await AssetHistoryModel.create(
            asset.asset_id,
            'system', // TODO: Get actual user ID
            'created',
            { ...validatedData }
        );
        revalidatePath('/assets');

        // Validate the response
        return validateData(assetSchema, asset);
    } catch (error) {
        console.error('Error creating asset:', error);
        throw new Error('Failed to create asset');
    }
}

export async function updateAsset(asset_id: string, data: UpdateAssetRequest): Promise<Asset> {
    try {
        // Validate the update data
        const validatedData = validateData(updateAssetSchema, data);

        const asset = await AssetModel.update(asset_id, validatedData);
        await AssetHistoryModel.create(
            asset_id,
            'system', // TODO: Get actual user ID
            'updated',
            { ...validatedData }
        );
        revalidatePath('/assets');
        revalidatePath(`/assets/${asset_id}`);

        // Validate the response
        return validateData(assetSchema, asset);
    } catch (error) {
        console.error('Error updating asset:', error);
        throw new Error('Failed to update asset');
    }
}

export async function deleteAsset(asset_id: string): Promise<void> {
    try {
        // Validate asset_id
        validateData(z.object({ asset_id: z.string().uuid() }), { asset_id });

        await AssetModel.delete(asset_id);
        revalidatePath('/assets');
    } catch (error) {
        console.error('Error deleting asset:', error);
        throw new Error('Failed to delete asset');
    }
}



// Asset type actions
export async function createAssetType(data: CreateAssetTypeRequest): Promise<AssetType> {
    try {
        // Validate the input data
        const validatedData = validateData(createAssetTypeSchema, data);

        const assetType = await AssetTypeModel.create(validatedData);
        revalidatePath('/assets/types');

        // Validate the response
        return validateData(assetTypeSchema, assetType);
    } catch (error) {
        console.error('Error creating asset type:', error);
        throw new Error('Failed to create asset type');
    }
}

export async function updateAssetType(type_id: string, data: Partial<AssetType>): Promise<AssetType> {
    try {
        // Validate type_id and update data
        validateData(z.object({ type_id: z.string().uuid() }), { type_id });
        const validatedData = validateData(assetTypeSchema.partial(), data);

        const assetType = await AssetTypeModel.update(type_id, validatedData);
        revalidatePath('/assets/types');
        revalidatePath(`/assets/types/${type_id}`);

        // Validate the response
        return validateData(assetTypeSchema, assetType);
    } catch (error) {
        console.error('Error updating asset type:', error);
        throw new Error('Failed to update asset type');
    }
}

export async function deleteAssetType(type_id: string): Promise<void> {
    try {
        // Validate type_id
        validateData(z.object({ type_id: z.string().uuid() }), { type_id });

        await AssetTypeModel.delete(type_id);
        revalidatePath('/assets/types');
    } catch (error) {
        console.error('Error deleting asset type:', error);
        throw new Error('Failed to delete asset type');
    }
}

export async function getAssetType(type_id: string): Promise<AssetType | null> {
    try {
        // Validate type_id
        validateData(z.object({ type_id: z.string().uuid() }), { type_id });

        const assetType = await AssetTypeModel.findById(type_id);
        if (!assetType) return null;

        // Validate the response
        return validateData(assetTypeSchema, assetType);
    } catch (error) {
        console.error('Error getting asset type:', error);
        throw new Error('Failed to get asset type');
    }
}

export async function listAssetTypes(): Promise<AssetType[]> {
    try {
        const assetTypes = await AssetTypeModel.list();

        // Validate each asset type in the response
        return assetTypes.map((assetType): AssetType =>
            validateData(assetTypeSchema, assetType)
        );
    } catch (error) {
        console.error('Error listing asset types:', error);
        throw new Error('Failed to list asset types');
    }
}


// New asset association actions
export async function createAssetAssociation(data: CreateAssetAssociationRequest): Promise<AssetAssociation> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error('No user session found');
        }

        // Validate the input data
        const validatedData = validateData(createAssetAssociationSchema, data);

        const association = await AssetAssociationModel.create(validatedData, currentUser.user_id);

        // Revalidate relevant paths
        revalidatePath('/assets');
        if (data.entity_type === 'ticket') {
            revalidatePath(`/tickets/${data.entity_id}`);
        }

        // Validate the response
        return validateData(assetAssociationSchema, association);
    } catch (error) {
        console.error('Error creating asset association:', error);
        throw new Error('Failed to create asset association');
    }
}

export async function listAssetAssociations(asset_id: string): Promise<AssetAssociation[]> {
    try {
        // Validate asset_id
        validateData(z.object({ asset_id: z.string().uuid() }), { asset_id });

        const associations = await AssetAssociationModel.listByAsset(asset_id);

        // Validate each association in the response
        return associations.map((association): AssetAssociation =>
            validateData(assetAssociationSchema, association)
        );
    } catch (error) {
        console.error('Error listing asset associations:', error);
        throw new Error('Failed to list asset associations');
    }
}

export async function listEntityAssets(entity_id: string, entity_type: string): Promise<AssetAssociation[]> {
    try {
        // Validate parameters
        validateData(
            z.object({
                entity_id: z.string().uuid(),
                entity_type: z.enum(['ticket', 'project'])
            }),
            { entity_id, entity_type }
        );

        const associations = await AssetAssociationModel.listByEntity(entity_id, entity_type);

        // Validate each association in the response
        return associations.map((association): AssetAssociation =>
            validateData(assetAssociationSchema, association)
        );
    } catch (error) {
        console.error('Error listing entity assets:', error);
        throw new Error('Failed to list entity assets');
    }
}

export async function removeAssetAssociation(
    asset_id: string,
    entity_id: string,
    entity_type: string
): Promise<void> {
    try {
        // Validate parameters
        validateData(
            z.object({
                asset_id: z.string().uuid(),
                entity_id: z.string().uuid(),
                entity_type: z.enum(['ticket', 'project'])
            }),
            { asset_id, entity_id, entity_type }
        );

        await AssetAssociationModel.delete(asset_id, entity_id, entity_type);

        // Revalidate relevant paths
        revalidatePath('/assets');
        if (entity_type === 'ticket') {
            revalidatePath(`/tickets/${entity_id}`);
        }
    } catch (error) {
        console.error('Error removing asset association:', error);
        throw new Error('Failed to remove asset association');
    }
}

// New document management actions
export async function associateDocumentWithAsset(data: CreateAssetDocumentRequest): Promise<AssetDocument> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error('No user session found');
        }

        const { knex, tenant } = await createTenantKnex();
        if (!tenant) {
            throw new Error('No tenant found');
        }

        // Insert the association
        const [association] = await knex('asset_document_associations')
            .insert({
                tenant,
                asset_id: data.asset_id,
                document_id: data.document_id,
                notes: data.notes,
                created_by: currentUser.user_id
            })
            .returning('*');

        // Get full document details
        const [documentWithDetails] = await knex('asset_document_associations as ada')
            .select(
                'ada.*',
                'documents.document_name',
                'documents.mime_type',
                'documents.file_size',
                'users.first_name',
                'users.last_name'
            )
            .join('documents', function () {
                this.on('documents.document_id', '=', 'ada.document_id')
                    .andOn('documents.tenant', '=', 'ada.tenant');
            })
            .leftJoin('users', function () {
                this.on('users.user_id', '=', 'ada.created_by')
                    .andOn('users.tenant', '=', 'ada.tenant');
            })
            .where({
                'ada.association_id': association.association_id,
                'ada.tenant': tenant
            });

        // Revalidate relevant paths
        revalidatePath('/assets');
        revalidatePath(`/assets/${data.asset_id}`);

        return validateData(assetDocumentSchema, documentWithDetails);
    } catch (error) {
        console.error('Error associating document with asset:', error);
        throw new Error('Failed to associate document with asset');
    }
}

export async function removeDocumentFromAsset(asset_id: string, document_id: string): Promise<void> {
    try {
        const { knex, tenant } = await createTenantKnex();
        if (!tenant) {
            throw new Error('No tenant found');
        }

        await knex('asset_document_associations')
            .where({
                tenant,
                asset_id,
                document_id
            })
            .delete();

        // Revalidate relevant paths
        revalidatePath('/assets');
        revalidatePath(`/assets/${asset_id}`);
    } catch (error) {
        console.error('Error removing document from asset:', error);
        throw new Error('Failed to remove document from asset');
    }
}

export async function getAssetDocuments(asset_id: string): Promise<AssetDocument[]> {
    try {
        const { knex, tenant } = await createTenantKnex();
        if (!tenant) {
            throw new Error('No tenant found');
        }

        const documents = await knex('asset_document_associations as ada')
            .select(
                'ada.*',
                'documents.document_name',
                'documents.mime_type',
                'documents.file_size',
                'users.first_name',
                'users.last_name'
            )
            .join('documents', function () {
                this.on('documents.document_id', '=', 'ada.document_id')
                    .andOn('documents.tenant', '=', 'ada.tenant');
            })
            .leftJoin('users', function () {
                this.on('users.user_id', '=', 'ada.created_by')
                    .andOn('users.tenant', '=', 'ada.tenant');
            })
            .where({
                'ada.tenant': tenant,
                'ada.asset_id': asset_id
            })
            .orderBy('ada.created_at', 'desc');

        return documents.map((doc): AssetDocument => validateData(assetDocumentSchema, doc));
    } catch (error) {
        console.error('Error getting asset documents:', error);
        throw new Error('Failed to get asset documents');
    }
}

// Update existing getAsset to include documents
export async function getAsset(asset_id: string): Promise<Asset | null> {
    try {
        // Validate asset_id
        validateData(z.object({ asset_id: z.string().uuid() }), { asset_id });

        const asset = await AssetModel.findById(asset_id);
        if (!asset) return null;

        // Get associated documents
        const documents = await getAssetDocuments(asset_id);
        const assetWithDocs = {
            ...asset,
            documents
        };

        // Validate the response
        return validateData(assetSchema, assetWithDocs);
    } catch (error) {
        console.error('Error getting asset:', error);
        throw new Error('Failed to get asset');
    }
}

interface AssetWithCompanyFields extends Asset {
    company_name?: string;
}

export async function listAssets(params: AssetQueryParams): Promise<AssetListResponse> {
    try {
        // Validate query parameters
        const validatedParams = validateData(assetQuerySchema, params);

        const { knex, tenant } = await createTenantKnex();
        if (!tenant) {
            throw new Error('No tenant found');
        }

        // Build base query with company join and date formatting
        const baseQuery = knex('assets')
            .where('assets.tenant', tenant)
            .join('companies', function () {
                this.on('companies.company_id', '=', 'assets.company_id')
                    .andOn('companies.tenant', '=', 'assets.tenant');
            })
            .select(
                'assets.asset_id',
                'assets.type_id',
                'assets.company_id',
                'assets.asset_tag',
                'assets.serial_number',
                'assets.name',
                'assets.status',
                'assets.location',
                knex.raw('COALESCE(assets.purchase_date::text, null) as purchase_date'),
                knex.raw('COALESCE(assets.warranty_end_date::text, null) as warranty_end_date'),
                'assets.attributes',
                knex.raw('assets.created_at::text as created_at'),
                knex.raw('assets.updated_at::text as updated_at'),
                'assets.tenant',
                'companies.company_name'
            );

        // Apply filters from params
        if (validatedParams.company_id) {
            baseQuery.where('assets.company_id', validatedParams.company_id);
        }
        if (validatedParams.type_id) {
            baseQuery.where('assets.type_id', validatedParams.type_id);
        }
        if (validatedParams.status) {
            baseQuery.where('assets.status', validatedParams.status);
        }

        // Get total count
        const [{ count }] = await knex('assets')
            .where('tenant', tenant)
            .count('* as count');

        // Get paginated results
        const page = validatedParams.page || 1;
        const limit = validatedParams.limit || 10;
        const offset = (page - 1) * limit;

        const assets = await baseQuery
            .orderBy('assets.created_at', 'desc')
            .limit(limit)
            .offset(offset);

        const transformedAssets = assets.map((asset: AssetWithCompanyFields): Asset => {
            // Extract company data explicitly
            const { company_name, ...restAsset } = asset;

            // Create properly structured company object
            const company: AssetCompanyInfo = {
                company_id: asset.company_id,
                company_name: company_name || ''
            };

            // Return transformed asset with explicit date string conversions
            return {
                ...restAsset,
                company,
                created_at: asset.created_at ? String(asset.created_at) : '',
                updated_at: asset.updated_at ? String(asset.updated_at) : '',
                purchase_date: asset.purchase_date ? String(asset.purchase_date) : undefined,
                warranty_end_date: asset.warranty_end_date ? String(asset.warranty_end_date) : undefined,
            };
        });

        // Get documents for each asset
        const assetsWithDocs = await Promise.all(
            transformedAssets.map(async (asset): Promise<Asset> => {
                const documents = await getAssetDocuments(asset.asset_id);

                // Explicitly construct the return object with all fields
                return {
                    asset_id: asset.asset_id,
                    type_id: asset.type_id,
                    company_id: asset.company_id,
                    asset_tag: asset.asset_tag,
                    serial_number: asset.serial_number,
                    name: asset.name,
                    status: asset.status,
                    location: asset.location,
                    purchase_date: asset.purchase_date,
                    warranty_end_date: asset.warranty_end_date,
                    attributes: asset.attributes,
                    created_at: asset.created_at,
                    updated_at: asset.updated_at,
                    tenant: asset.tenant,
                    company: {
                        company_id: asset.company_id,
                        company_name: asset.company?.company_name || ''
                    },
                    documents
                };
            })
        );

        const response = {
            assets: assetsWithDocs,
            total: Number(count),
            page,
            limit
        };

        return response;
    } catch (error) {
        console.error('[listAssets] Error listing assets:', error);
        if (error instanceof Error) {
            console.error('[listAssets] Error details:', {
                message: error.message,
                stack: error.stack
            });
        }
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

        // Get maintenance statistics
        const stats = await knex('asset_maintenance_schedules')
            .where({ tenant, asset_id })
            .select(
                knex.raw('COUNT(*) as total_schedules'),
                knex.raw('SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_schedules'),
                knex.raw('MIN(last_maintenance) as last_maintenance'),
                knex.raw('MIN(next_maintenance) as next_maintenance')
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
            last_maintenance: stats?.last_maintenance,
            next_maintenance: stats?.next_maintenance,
            compliance_rate,
            maintenance_history: history
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

        // Get asset statistics - Fixed the ambiguous tenant reference
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
            .leftJoin('asset_maintenance_schedules', function () {
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
