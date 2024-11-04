"use client";

import { useState, useEffect } from 'react';
import { IDocument, IDocumentUploadResponse } from '../../interfaces/document.interface';
import DocumentStorageCard from './DocumentStorageCard';
import DocumentUpload from './DocumentUpload';
import DocumentsPagination from './DocumentsPagination';
import { getDocumentByCompanyId, deleteDocument } from '../../lib/actions/document-actions/documentActions';
import { toast } from 'react-hot-toast';

interface DocumentsProps {
    documents: IDocument[];
    gridColumns?: 3 | 4;
    userId: string;
    companyId?: string;
    onDocumentCreated?: (document: IDocument) => void;
}

const Documents = ({ documents: initialDocuments, gridColumns, userId, companyId, onDocumentCreated }: DocumentsProps): JSX.Element => {
    const [documents, setDocuments] = useState<IDocument[]>(initialDocuments);
    const [searchTerm, setSearchTerm] = useState('');
    const [showUpload, setShowUpload] = useState(false);

    // Fetch latest documents whenever component mounts or companyId changes
    useEffect(() => {
        const fetchLatestDocuments = async () => {
            if (companyId) {
                try {
                    const latestDocuments = await getDocumentByCompanyId(companyId);
                    setDocuments(latestDocuments);
                } catch (error) {
                    console.error('Error fetching documents:', error);
                    toast.error('Failed to fetch documents');
                }
            }
        };

        fetchLatestDocuments();
    }, [companyId]);

    // Set grid columns based on the number of columns
    const gridColumnsClass = gridColumns === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

    // Set filter based on search term
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setSearchTerm(e.target.value);
    };

    // Handle file upload completion
    const handleUploadComplete = (fileData: IDocumentUploadResponse) => {
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
        
        // Update local state with the new document
        setDocuments(prevDocuments => [...prevDocuments, newDocument]);
        
        // Call the parent callback if provided
        if (onDocumentCreated) {
            onDocumentCreated(newDocument);
        }
    };

    // Handle document deletion
    const handleDelete = async (document: IDocument) => {
        try {
            if (document.document_id) {
                await deleteDocument(document.document_id, userId);
                // Update local state to remove the deleted document
                setDocuments(prevDocuments => 
                    prevDocuments.filter(doc => doc.document_id !== document.document_id)
                );
                toast.success('Document deleted successfully');
            }
        } catch (error) {
            console.error('Error deleting document:', error);
            toast.error('Failed to delete document. Please try again.');
        }
    };

    // Filter documents based on document name search term
    const filteredDocuments = documents.filter(doc =>
        doc.document_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-3 space-x-4 flex-wrap">
                {/* Search */}
                <input
                    type="text"
                    placeholder="Search"
                    className="px-4 py-1 border border-gray-300 rounded-md w-48"
                    value={searchTerm}
                    onChange={handleSearch}
                />

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

            {/* Documents */}
            <div className={`grid ${gridColumnsClass} gap-2 items-start`}>
                {filteredDocuments.map((document: IDocument): JSX.Element => (
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
