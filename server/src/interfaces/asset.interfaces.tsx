'use client';

import { TenantEntity } from './index';

export interface AssetType extends TenantEntity {
    type_id: string;
    type_name: string;
    parent_type_id?: string;
    attributes_schema?: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface Asset extends TenantEntity {
    asset_id: string;
    type_id: string;
    company_id: string;
    asset_tag: string;
    serial_number?: string;
    name: string;
    status: string;
    location?: string;
    purchase_date?: string;
    warranty_end_date?: string;
    attributes?: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface AssetHistory extends TenantEntity {
    history_id: string;
    asset_id: string;
    changed_by: string;
    change_type: string;
    changes: Record<string, any>;
    changed_at: string;
}

export interface AssetAssociation extends TenantEntity {
    asset_id: string;
    entity_id: string;
    entity_type: 'ticket' | 'project'; // Add more entity types as needed
    relationship_type: 'affected' | 'related';
    created_at: string;
    created_by: string;
    notes?: string;
}

// Request/Response interfaces
export interface CreateAssetTypeRequest {
    type_name: string;
    parent_type_id?: string;
    attributes_schema?: Record<string, any>;
}

export interface CreateAssetRequest {
    type_id: string;
    company_id: string;
    asset_tag: string;
    serial_number?: string;
    name: string;
    status: string;
    location?: string;
    purchase_date?: string;
    warranty_end_date?: string;
    attributes?: Record<string, any>;
}

export interface UpdateAssetRequest {
    type_id?: string;
    company_id?: string;
    asset_tag?: string;
    serial_number?: string;
    name?: string;
    status?: string;
    location?: string;
    purchase_date?: string;
    warranty_end_date?: string;
    attributes?: Record<string, any>;
}

export interface CreateAssetAssociationRequest {
    asset_id: string;
    entity_id: string;
    entity_type: AssetAssociation['entity_type'];
    relationship_type: AssetAssociation['relationship_type'];
    notes?: string;
}

export interface AssetQueryParams {
    company_id?: string;
    type_id?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}

export interface AssetListResponse {
    assets: Asset[];
    total: number;
    page: number;
    limit: number;
}
