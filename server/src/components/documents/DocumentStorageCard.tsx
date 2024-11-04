"use client";

import { Card } from '../ui/Card';
import { IDocument } from '../../interfaces/document.interface';
import DocumentPreview from './DocumentPreview';
import DocumentDownload from './DocumentDownload';
import { Button } from '../ui/Button';

interface DocumentStorageCardProps {
    document: IDocument;
    onPreview?: () => void;
    onDelete?: (document: IDocument) => void;
}

const DocumentStorageCard = ({ document, onPreview, onDelete }: DocumentStorageCardProps): JSX.Element => {
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this document?')) {
            onDelete?.(document);
        }
    };

    return (
        <Card className="p-4 hover:shadow-md transition-shadow">
            {/* Preview */}
            {document.file_id && (
                <div className="mb-4" onClick={onPreview}>
                    <DocumentPreview document={document} />
                </div>
            )}

            {/* Document Info */}
            <div className="space-y-2">
                <h3 className="font-medium text-gray-900 truncate">
                    {document.document_name}
                </h3>
                
                {/* File Details */}
                {document.file_id && (
                    <div className="text-sm text-gray-500 space-y-1">
                        <p>{document.mime_type}</p>
                        {document.file_size && (
                            <p>{formatFileSize(document.file_size)}</p>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-2 mt-4">
                    {document.file_id && (
                        <>
                            <DocumentDownload document={document} />
                            <Button
                                onClick={handleDelete}
                                variant="destructive"
                                size="sm"
                            >
                                Delete
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default DocumentStorageCard;
