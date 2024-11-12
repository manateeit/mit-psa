'use client';

import { TenantEntity } from './index';
import { ICompany } from './company.interfaces';

// Add new interface for simplified company data
export interface AssetCompanyInfo {
    company_id: string;
    company_name: string;
}

export interface AssetType extends TenantEntity {
    type_id: string;
    type_name: string;
    parent_type_id?: string;
    attributes_schema?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface Asset extends TenantEntity {
    asset_id: string;
    type_id: string;
    company_id: string;
    company?: AssetCompanyInfo;
    asset_tag: string;
    serial_number?: string;
    name: string;
    status: string;
    location?: string;
    purchase_date?: string;
    warranty_end_date?: string;
    attributes?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
    documents?: AssetDocument[];
    maintenanceSchedules?: AssetMaintenanceSchedule[];
    maintenanceHistory?: AssetMaintenanceHistory[];
}

export interface AssetHistory extends TenantEntity {
    history_id: string;
    asset_id: string;
    changed_by: string;
    change_type: string;
    changes: Record<string, unknown>;
    changed_at: string;
}

export interface AssetAssociation extends TenantEntity {
    asset_id: string;
    entity_id: string;
    entity_type: 'ticket' | 'project';
    relationship_type: 'affected' | 'related';
    created_at: string;
    created_by: string;
    notes?: string;
}

export interface AssetDocument extends TenantEntity {
    association_id: string;
    asset_id: string;
    document_id: string;
    notes?: string;
    created_at: string;
    created_by: string;
    document_name?: string;
    mime_type?: string;
    file_size?: number;
    first_name?: string;
    last_name?: string;
}

// Request/Response interfaces
export interface CreateAssetTypeRequest {
    type_name: string;
    parent_type_id?: string;
    attributes_schema?: Record<string, unknown>;
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
    attributes?: Record<string, unknown>;
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
    attributes?: Record<string, unknown>;
}

export interface CreateAssetAssociationRequest {
    asset_id: string;
    entity_id: string;
    entity_type: AssetAssociation['entity_type'];
    relationship_type: AssetAssociation['relationship_type'];
    notes?: string;
}

export interface CreateAssetDocumentRequest {
    asset_id: string;
    document_id: string;
    notes?: string;
}

// Maintenance types and enums
export type MaintenanceType = 'preventive' | 'inspection' | 'calibration' | 'replacement';
export type MaintenanceFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

// Maintenance interfaces
export interface AssetMaintenanceSchedule extends TenantEntity {
    schedule_id: string;
    asset_id: string;
    schedule_name: string;
    description?: string;
    maintenance_type: MaintenanceType;
    frequency: MaintenanceFrequency;
    frequency_interval: number;
    schedule_config: Record<string, unknown>;
    last_maintenance?: string;
    next_maintenance: string;
    is_active: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface AssetMaintenanceNotification extends TenantEntity {
    notification_id: string;
    schedule_id: string;
    asset_id: string;
    notification_type: 'upcoming' | 'due' | 'overdue';
    notification_date: string;
    is_sent: boolean;
    sent_at?: string;
    notification_data: Record<string, unknown>;
    created_at: string;
}

export interface AssetMaintenanceHistory extends TenantEntity {
    history_id: string;
    schedule_id: string;
    asset_id: string;
    maintenance_type: MaintenanceType;
    description: string;
    maintenance_data: Record<string, unknown>;
    performed_at: string;
    performed_by: string;
    created_at: string;
}

// Request interfaces for maintenance scheduling
export interface CreateMaintenanceScheduleRequest {
    asset_id: string;
    schedule_name: string;
    description?: string;
    maintenance_type: MaintenanceType;
    frequency: MaintenanceFrequency;
    frequency_interval: number;
    schedule_config: Record<string, unknown>;
    next_maintenance: string;
}

export interface UpdateMaintenanceScheduleRequest {
    schedule_name?: string;
    description?: string;
    maintenance_type?: MaintenanceType;
    frequency?: MaintenanceFrequency;
    frequency_interval?: number;
    schedule_config?: Record<string, unknown>;
    next_maintenance?: string;
    is_active?: boolean;
}

export interface CreateMaintenanceHistoryRequest {
    schedule_id: string;
    asset_id: string;
    maintenance_type: MaintenanceType;
    description: string;
    maintenance_data: Record<string, unknown>;
    performed_at: string;
}

// Response interfaces for maintenance reporting
export interface AssetMaintenanceReport {
    asset_id: string;
    asset_name: string;
    total_schedules: number;
    active_schedules: number;
    completed_maintenances: number;
    upcoming_maintenances: number;
    last_maintenance?: string;
    next_maintenance?: string;
    compliance_rate: number;
    maintenance_history: AssetMaintenanceHistory[];
}

export interface ClientMaintenanceSummary {
    company_id: string;
    company_name: string;
    total_assets: number;
    assets_with_maintenance: number;
    total_schedules: number;
    overdue_maintenances: number;
    upcoming_maintenances: number;
    compliance_rate: number;
    maintenance_by_type: Record<MaintenanceType, number>;
}

// Query params interface
export interface AssetQueryParams {
    company_id?: string;
    company_name?: string;
    type_id?: string;
    status?: string;
    search?: string;
    maintenance_status?: 'due' | 'overdue' | 'upcoming' | 'completed';
    maintenance_type?: MaintenanceType;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
    include_company_details?: boolean;
}

export interface AssetListResponse {
    assets: Asset[];
    total: number;
    page: number;
    limit: number;
    company_summary?: {
        total_companies: number;
        assets_by_company: Record<string, number>;
    };
}

// Company-specific maintenance report
export interface CompanyMaintenanceReport {
    company_id: string;
    company_name: string;
    total_assets: number;
    assets_with_maintenance: number;
    total_schedules: number;
    overdue_maintenances: number;
    upcoming_maintenances: number;
    compliance_rate: number;
    maintenance_by_type: Record<MaintenanceType, number>;
    assets: Array<{
        asset_id: string;
        asset_name: string;
        asset_tag: string;
        status: string;
        last_maintenance?: string;
        next_maintenance?: string;
    }>;
}
