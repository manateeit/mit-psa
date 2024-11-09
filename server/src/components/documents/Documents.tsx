"use client";

import { useState } from 'react';
import { IDocument, IDocumentUploadResponse } from '../../interfaces/document.interface';
import DocumentStorageCard from './DocumentStorageCard';
import DocumentUpload from './DocumentUpload';
import DocumentsPagination from './DocumentsPagination';
import { getAllDocuments, deleteDocument } from '../../lib/actions/document-actions/documentActions';
import { toast } from 'react-hot-toast';

interface DocumentsProps {
    documents: IDocument[];
    gridColumns?: 3 | 4;
    userId: string;
    companyId?: string;
    onDocumentCreated?: (document: IDocument) => void;
    filters?: {
        type?: string;
        entityType?: string;
        uploadedBy?: string;
        searchTerm?: string;
    };
    isLoading?: boolean;
}

const Documents = ({ 
    documents, 
    gridColumns, 
    userId, 
    companyId, 
    onDocumentCreated,
    filters,
    isLoading = false
}: DocumentsProps): JSX.Element => {
    const [showUpload, setShowUpload] = useState(false);

    // Set grid columns based on the number of columns
    const gridColumnsClass = gridColumns === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

    // Handle file upload completion
    const handleUploadComplete = async (fileData: IDocumentUploadResponse) => {
        setShowUpload(false);
        const newDocument: IDocument = {
            document_id: '', // This will be set by the server
            document_name: fileData.original_name,
            content: '', // This will be set by the server
            type_id: '', // This will be determined by the server based on mime type
            user_id: userId,
            company_id: companyId,
            order_number: 0, // This will be set by the server
            created_by: userId,
            tenant: '', // This will be set by the server
            file_id: fileData.file_id,
            storage_path: fileData.storage_path,
            mime_type: fileData.mime_type,
            file_size: fileData.file_size
        };
        
        // Call the parent callback if provided
        if (onDocumentCreated) {
            onDocumentCreated(newDocument);
        }

        // Parent will handle refreshing the documents list
    };

    // Handle document deletion
    const handleDelete = async (document: IDocument) => {
        try {
            if (document.document_id) {
                await deleteDocument(document.document_id, userId);
                toast.success('Document deleted successfully');
                // Trigger a refresh in the parent component
                if (onDocumentCreated) {
                    onDocumentCreated(document); // Reuse this callback to trigger refresh
                }
            }
        } catch (error) {
            console.error('Error deleting document:', error);
            toast.error('Failed to delete document. Please try again.');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-3">
                {/* New document button */}
                <button 
                    className="bg-[#6941C6] text-white px-4 py-1 rounded-md whitespace-nowrap"
                    onClick={() => setShowUpload(true)}
                >
                    + New Document
                </button>
            </div>

            {/* Upload Dialog */}
            {showUpload && (
                <div className="mb-4 p-4 border border-gray-200 rounded-md">
                    <DocumentUpload
                        userId={userId}
                        companyId={companyId}
                        onUploadComplete={handleUploadComplete}
                    />
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="flex justify-center items-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6941C6]"></div>
                </div>
            )}

            {/* Documents */}
            <div className={`grid ${gridColumnsClass} gap-2 items-start`}>
                {!isLoading && documents.map((document: IDocument): JSX.Element => (
                    <DocumentStorageCard
                        key={document.document_id || document.file_id}
                        document={document}
                        onDelete={handleDelete}
                    />
                ))}
            </div>

            {/* Pagination */}
            <DocumentsPagination />
        </div>
    );
};

export default Documents;
