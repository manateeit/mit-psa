"use client";

import { useState, useEffect } from 'react';
import { IDocument } from '@/interfaces/document.interface';
import DocumentStorageCard from './DocumentStorageCard';
import DocumentUpload from './DocumentUpload';
import DocumentSelector from './DocumentSelector';
import DocumentsPagination from './DocumentsPagination';
import { Button } from '@/components/ui/Button';
import { getDocumentsByEntity, deleteDocument, removeDocumentAssociations } from '@/lib/actions/document-actions/documentActions';
import { Plus, Link } from 'lucide-react';

interface DocumentsProps {
    documents: IDocument[];
    gridColumns?: 3 | 4;
    userId: string;
    entityId?: string;
    entityType?: 'ticket' | 'company' | 'contact' | 'schedule';
    isLoading?: boolean;
    onDocumentCreated?: () => Promise<void>;
}

const Documents = ({ 
    documents: initialDocuments, 
    gridColumns, 
    userId,
    entityId,
    entityType,
    isLoading = false,
    onDocumentCreated
}: DocumentsProps): JSX.Element => {
    const [documents, setDocuments] = useState<IDocument[]>(initialDocuments);
    const [showUpload, setShowUpload] = useState(false);
    const [showSelector, setShowSelector] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Update documents when initialDocuments changes
    useEffect(() => {
        console.log('Documents received:', initialDocuments); // Debug log
        if (Array.isArray(initialDocuments)) {
            setDocuments(initialDocuments);
            setError(null);
        } else {
            console.error('initialDocuments is not an array:', initialDocuments);
            setDocuments([]);
            setError('Invalid document data');
        }
    }, [initialDocuments]);

    // Set grid columns based on the number of columns
    const gridColumnsClass = gridColumns === 4 
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

    // Handle file upload completion
    const handleUploadComplete = async (uploadResult: { success: boolean; document: IDocument }) => {
        setShowUpload(false);
        if (uploadResult.success) {
            setDocuments(prev => [uploadResult.document, ...prev]);
            if (onDocumentCreated) {
                await onDocumentCreated();
            }
        }
    };

    // Handle document selection completion
    const handleDocumentsSelected = async () => {
        try {
            if (entityId && entityType) {
                const updatedDocuments = await getDocumentsByEntity(entityId, entityType);
                setDocuments(updatedDocuments);
            }
            if (onDocumentCreated) {
                await onDocumentCreated();
            }
        } catch (error) {
            console.error('Error refreshing documents:', error);
            setError('Failed to refresh documents');
        }
    };

    // Handle document deletion
    const handleDelete = async (document: IDocument) => {
        try {
            await deleteDocument(document.document_id, userId);
            setDocuments(prev => prev.filter(d => d.document_id !== document.document_id));
            if (onDocumentCreated) {
                await onDocumentCreated();
            }
        } catch (error) {
            console.error('Error deleting document:', error);
            setError('Failed to delete document');
        }
    };

    // Handle document disassociation
    const handleDisassociate = async (document: IDocument) => {
        if (!entityId || !entityType) return;
        
        try {
            await removeDocumentAssociations(entityId, entityType, [document.document_id]);
            setDocuments(prev => prev.filter(d => d.document_id !== document.document_id));
            if (onDocumentCreated) {
                await onDocumentCreated();
            }
        } catch (error) {
            console.error('Error disassociating document:', error);
            setError('Failed to remove document association');
        }
    };

    return (
        <div className="w-full space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                    {/* Upload new document button */}
                    <Button 
                        onClick={() => setShowUpload(true)}
                        className="bg-[#6941C6] text-white hover:bg-[#5B34B5]"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Document
                    </Button>
                    {/* Select existing documents button - only show if entityId and entityType are provided */}
                    {entityId && entityType && (
                        <Button
                            onClick={() => setShowSelector(true)}
                            className="bg-[#6941C6] text-white hover:bg-[#5B34B5]"
                        >
                            <Link className="w-4 h-4 mr-2" />
                            Link Documents
                        </Button>
                    )}
                </div>
            </div>

            {/* Upload Dialog */}
            {showUpload && (
                <div className="mb-4 p-4 border border-gray-200 rounded-md bg-white">
                    <DocumentUpload
                        userId={userId}
                        entityId={entityId}
                        entityType={entityType}
                        onUploadComplete={handleUploadComplete}
                        onCancel={() => setShowUpload(false)}
                    />
                </div>
            )}

            {/* Document Selector Dialog - only render if entityId and entityType are provided */}
            {entityId && entityType && (
                <DocumentSelector
                    entityId={entityId}
                    entityType={entityType}
                    onDocumentsSelected={handleDocumentsSelected}
                    isOpen={showSelector}
                    onClose={() => setShowSelector(false)}
                />
            )}

            {/* Error State */}
            {error && (
                <div className="text-center py-4 text-red-500 bg-red-50 rounded-md">
                    {error}
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6941C6]"></div>
                </div>
            )}

            {/* Documents Grid */}
            {!isLoading && documents && documents.length > 0 ? (
                <div className={`grid ${gridColumnsClass} gap-4`}>
                    {documents.map((document): JSX.Element => {
                        console.log('Rendering document:', document); // Debug log
                        return (
                            <div key={document.document_id} className="h-full">
                                <DocumentStorageCard
                                    document={document}
                                    onDelete={() => handleDelete(document)}
                                    onDisassociate={entityId && entityType ? () => handleDisassociate(document) : undefined}
                                    showDisassociate={Boolean(entityId && entityType)}
                                />
                            </div>
                        );
                    })}
                </div>
            ) : !isLoading && (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-md">
                    No documents found
                </div>
            )}

            {/* Pagination */}
            {documents && documents.length > 0 && (
                <div className="mt-4">
                    <DocumentsPagination />
                </div>
            )}
        </div>
    );
};

export default Documents;
