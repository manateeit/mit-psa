import { TenantEntity } from ".";

export interface IDocument extends TenantEntity {
    document_id: string;
    document_name: string;
    type_id: string | null;  // Updated to allow null for shared document types
    shared_type_id?: string;  // New field for shared document types
    user_id: string;
    contact_name_id?: string;
    company_id?: string;
    ticket_id?: string;
    schedule_id?: string;
    order_number: number;
    created_by: string;
    edited_by?: string;
    entered_at?: Date;
    updated_at?: Date;
    content: string;

    // Storage-related fields
    file_id?: string;  // Reference to file_stores table
    storage_path?: string;  // Path within the storage provider
    mime_type?: string;  // MIME type of the stored file
    file_size?: number;  // Size of the file in bytes

    // Additional fields (not in the database)
    createdByFullName?: string;
}

export interface IDocumentType extends TenantEntity {
    type_id: string;
    type_name: string;
    icon?: string;
}

export interface ISharedDocumentType {
    type_id: string;
    type_name: string;
    icon?: string;
    description?: string;
    created_at?: Date;
    updated_at?: Date;
}

// Document storage configuration
export interface IDocumentStorageConfig {
    allowed_mime_types: string[];
    max_file_size: number;
}

// Document upload response
export interface IDocumentUploadResponse {
    file_id: string;
    storage_path: string;
    mime_type: string;
    file_size: number;
    original_name: string;
}
