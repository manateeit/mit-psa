import { z } from 'zod';

// Base schemas
export const tenantSchema = z.object({
    tenant: z.string().uuid()
});

// Asset type schemas
export const assetTypeSchema = tenantSchema.extend({
    type_id: z.string().uuid(),
    type_name: z.string(),
    parent_type_id: z.string().uuid().optional(),
    attributes_schema: z.record(z.any()).optional(),
    created_at: z.string(),
    updated_at: z.string()
});

export const createAssetTypeSchema = z.object({
    type_name: z.string(),
    parent_type_id: z.string().uuid().optional(),
    attributes_schema: z.record(z.any()).optional()
});

// Asset schemas
export const assetSchema = tenantSchema.extend({
    asset_id: z.string().uuid(),
    type_id: z.string().uuid(),
    company_id: z.string().uuid(),
    asset_tag: z.string(),
    serial_number: z.string().optional(),
    name: z.string(),
    status: z.string(),
    location: z.string().optional(),
    purchase_date: z.string().optional(),
    warranty_end_date: z.string().optional(),
    attributes: z.record(z.any()).optional(),
    created_at: z.string(),
    updated_at: z.string(),
    documents: z.array(z.lazy(() => assetDocumentSchema)).optional(),
    maintenanceSchedules: z.array(z.lazy(() => assetMaintenanceScheduleSchema)).optional(),
    maintenanceHistory: z.array(z.lazy(() => assetMaintenanceHistorySchema)).optional()
});

export const createAssetSchema = z.object({
    type_id: z.string().uuid(),
    company_id: z.string().uuid(),
    asset_tag: z.string(),
    serial_number: z.string().optional(),
    name: z.string(),
    status: z.string(),
    location: z.string().optional(),
    purchase_date: z.string().optional(),
    warranty_end_date: z.string().optional(),
    attributes: z.record(z.any()).optional()
});

export const updateAssetSchema = createAssetSchema.partial();

// Asset history schemas
export const assetHistorySchema = tenantSchema.extend({
    history_id: z.string().uuid(),
    asset_id: z.string().uuid(),
    changed_by: z.string().uuid(),
    change_type: z.string(),
    changes: z.record(z.any()),
    changed_at: z.string()
});

// Asset association schemas
export const assetAssociationSchema = tenantSchema.extend({
    asset_id: z.string().uuid(),
    entity_id: z.string().uuid(),
    entity_type: z.enum(['ticket', 'project']),
    relationship_type: z.enum(['affected', 'related']),
    created_at: z.string(),
    created_by: z.string().uuid(),
    notes: z.string().optional()
});

export const createAssetAssociationSchema = z.object({
    asset_id: z.string().uuid(),
    entity_id: z.string().uuid(),
    entity_type: z.enum(['ticket', 'project']),
    relationship_type: z.enum(['affected', 'related']),
    notes: z.string().optional()
});

// Asset document schemas
export const assetDocumentSchema = tenantSchema.extend({
    association_id: z.string().uuid(),
    asset_id: z.string().uuid(),
    document_id: z.string().uuid(),
    notes: z.string().optional(),
    created_at: z.string(),
    created_by: z.string().uuid(),
    document_name: z.string().optional(),
    mime_type: z.string().optional(),
    file_size: z.number().optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional()
});

// Asset maintenance schemas
export const maintenanceTypeEnum = z.enum(['preventive', 'inspection', 'calibration', 'replacement']);
export const maintenanceFrequencyEnum = z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom']);

export const assetMaintenanceScheduleSchema = tenantSchema.extend({
    schedule_id: z.string().uuid(),
    asset_id: z.string().uuid(),
    schedule_name: z.string(),
    description: z.string().optional(),
    maintenance_type: maintenanceTypeEnum,
    frequency: maintenanceFrequencyEnum,
    frequency_interval: z.number().positive(),
    schedule_config: z.record(z.any()),
    last_maintenance: z.string().optional(),
    next_maintenance: z.string(),
    is_active: z.boolean(),
    created_by: z.string().uuid(),
    created_at: z.string(),
    updated_at: z.string()
});

export const createMaintenanceScheduleSchema = z.object({
    asset_id: z.string().uuid(),
    schedule_name: z.string(),
    description: z.string().optional(),
    maintenance_type: maintenanceTypeEnum,
    frequency: maintenanceFrequencyEnum,
    frequency_interval: z.number().positive(),
    schedule_config: z.record(z.any()),
    next_maintenance: z.string()
});

export const updateMaintenanceScheduleSchema = z.object({
    schedule_name: z.string().optional(),
    description: z.string().optional(),
    maintenance_type: maintenanceTypeEnum.optional(),
    frequency: maintenanceFrequencyEnum.optional(),
    frequency_interval: z.number().positive().optional(),
    schedule_config: z.record(z.any()).optional(),
    next_maintenance: z.string().optional(),
    is_active: z.boolean().optional()
});

export const assetMaintenanceNotificationSchema = tenantSchema.extend({
    notification_id: z.string().uuid(),
    schedule_id: z.string().uuid(),
    asset_id: z.string().uuid(),
    notification_type: z.enum(['upcoming', 'due', 'overdue']),
    notification_date: z.string(),
    is_sent: z.boolean(),
    sent_at: z.string().optional(),
    notification_data: z.record(z.any()),
    created_at: z.string()
});

export const assetMaintenanceHistorySchema = tenantSchema.extend({
    history_id: z.string().uuid(),
    schedule_id: z.string().uuid(),
    asset_id: z.string().uuid(),
    maintenance_type: maintenanceTypeEnum,
    description: z.string(),
    maintenance_data: z.record(z.any()),
    performed_at: z.string(),
    performed_by: z.string().uuid(),
    created_at: z.string()
});

export const createMaintenanceHistorySchema = z.object({
    schedule_id: z.string().uuid(),
    asset_id: z.string().uuid(),
    maintenance_type: maintenanceTypeEnum,
    description: z.string(),
    maintenance_data: z.record(z.any()),
    performed_at: z.string()
});

// Query params schema
export const assetQuerySchema = z.object({
    company_id: z.string().uuid().optional(),
    type_id: z.string().uuid().optional(),
    status: z.string().optional(),
    search: z.string().optional(),
    maintenance_status: z.enum(['due', 'overdue', 'upcoming', 'completed']).optional(),
    maintenance_type: maintenanceTypeEnum.optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    page: z.number().optional(),
    limit: z.number().optional()
});

// List response schema
export const assetListResponseSchema = z.object({
    assets: z.array(assetSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number()
});

// Maintenance reporting schemas
export const assetMaintenanceReportSchema = z.object({
    asset_id: z.string().uuid(),
    asset_name: z.string(),
    total_schedules: z.number(),
    active_schedules: z.number(),
    completed_maintenances: z.number(),
    upcoming_maintenances: z.number(),
    last_maintenance: z.string().optional(),
    next_maintenance: z.string().optional(),
    compliance_rate: z.number(),
    maintenance_history: z.array(assetMaintenanceHistorySchema)
});

export const clientMaintenanceSummarySchema = z.object({
    company_id: z.string().uuid(),
    company_name: z.string(),
    total_assets: z.number(),
    assets_with_maintenance: z.number(),
    total_schedules: z.number(),
    overdue_maintenances: z.number(),
    upcoming_maintenances: z.number(),
    compliance_rate: z.number(),
    maintenance_by_type: z.record(z.number())
});
