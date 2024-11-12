import { z } from 'zod';

export const assetTypeSchema = z.object({
    tenant: z.string().uuid().optional(),
    type_id: z.string().uuid(),
    type_name: z.string(),
    parent_type_id: z.string().uuid().optional(),
    attributes_schema: z.record(z.any()).optional(),
    created_at: z.string(),
    updated_at: z.string()
});

export const assetSchema = z.object({
    tenant: z.string().uuid().optional(),
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
    updated_at: z.string()
});

export const assetHistorySchema = z.object({
    tenant: z.string().uuid().optional(),
    history_id: z.string().uuid(),
    asset_id: z.string().uuid(),
    changed_by: z.string(),
    change_type: z.string(),
    changes: z.record(z.any()),
    changed_at: z.string()
});

export const assetAssociationSchema = z.object({
    tenant: z.string().uuid().optional(),
    asset_id: z.string().uuid(),
    entity_id: z.string().uuid(),
    entity_type: z.enum(['ticket', 'project']),
    relationship_type: z.enum(['affected', 'related']),
    created_at: z.string(),
    created_by: z.string().uuid(),
    notes: z.string().optional()
});

export const createAssetTypeSchema = z.object({
    type_name: z.string(),
    parent_type_id: z.string().uuid().optional(),
    attributes_schema: z.record(z.any()).optional()
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

export const updateAssetSchema = z.object({
    type_id: z.string().uuid().optional(),
    company_id: z.string().uuid().optional(),
    asset_tag: z.string().optional(),
    serial_number: z.string().optional(),
    name: z.string().optional(),
    status: z.string().optional(),
    location: z.string().optional(),
    purchase_date: z.string().optional(),
    warranty_end_date: z.string().optional(),
    attributes: z.record(z.any()).optional()
});

export const createAssetAssociationSchema = z.object({
    asset_id: z.string().uuid(),
    entity_id: z.string().uuid(),
    entity_type: z.enum(['ticket', 'project']),
    relationship_type: z.enum(['affected', 'related']),
    notes: z.string().optional()
});

export const assetQuerySchema = z.object({
    company_id: z.string().uuid().optional(),
    type_id: z.string().uuid().optional(),
    status: z.string().optional(),
    search: z.string().optional(),
    page: z.number().optional(),
    limit: z.number().optional()
});

export const assetListResponseSchema = z.object({
    assets: z.array(assetSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number()
});
