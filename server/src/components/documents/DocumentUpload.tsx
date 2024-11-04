'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileStore } from '../../types/storage';
import { downloadFile, deleteFile } from '../../lib/actions/file-actions/fileActions';
import { uploadDocument } from '../../lib/actions/document-actions/documentActions';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '../ui/Dialog';

interface DocumentUploadProps {
    userId: string;
    companyId?: string;
    contactNameId?: string;
    ticketId?: string;
    scheduleId?: string;
    onUploadComplete?: (fileData: FileStore) => void;
    existingFiles?: FileStore[];
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ 
    userId,
    companyId,
    contactNameId,
    ticketId,
    scheduleId,
    onUploadComplete,
    existingFiles = []
}) => {
    const [files, setFiles] = useState<FileStore[]>(existingFiles);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; fileId?: string }>({
        show: false,
    });

    const handleUpload = async (formData: FormData) => {
        try {
            const result = await uploadDocument(formData, {
                userId,
                companyId,
                contactNameId,
                ticketId,
                scheduleId
            });

            if (!result.success || !result.document) {
                throw new Error(result.error || 'Failed to upload document');
            }
            
            const file = formData.get('file');
            if (!(file instanceof File)) {
                throw new Error('Invalid file data');
            }

            // Convert to FileStore shape for consistency
            const fileStore: FileStore = {
                file_id: result.document.file_id!,
                file_name: file.name,
                original_name: file.name,
                mime_type: file.type,
                file_size: file.size,
                storage_path: result.document.storage_path!,
                tenant: result.document.tenant!,
                uploaded_by: userId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_deleted: false
            };

            setFiles(prev => [...prev, fileStore]);
            onUploadComplete?.(fileStore);
            
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload document');
            console.error('Error uploading document:', err);
        }
    };

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setError(null);
        setUploading(true);

        try {
            for (const file of acceptedFiles) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('uploaded_by', userId);
                await handleUpload(formData);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload files');
        } finally {
            setUploading(false);
        }
    }, [userId, handleUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: true,
    });

    const handleDownload = async (fileId: string) => {
        try {
            const result = await downloadFile(fileId);
            if (result.success && result.data) {
                // Create blob and trigger download
                const blob = new Blob([result.data.buffer]);
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = result.data.metadata.file_name;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                throw new Error(result.error || 'Failed to download file');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to download file');
        }
    };

    const handleDelete = async (fileId: string) => {
        try {
            const result = await deleteFile(fileId, userId);
            if (result.success) {
                setFiles(prev => prev.filter(f => f.file_id !== fileId));
                setDeleteConfirm({ show: false });
            } else {
                throw new Error(result.error || 'Failed to delete file');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete file');
        }
    };

    return (
        <div className="space-y-4">
            <Card className="p-4">
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
                >
                    <input {...getInputProps()} />
                    {isDragActive ? (
                        <p>Drop the files here...</p>
                    ) : (
                        <p>Drag and drop files here, or click to select files</p>
                    )}
                </div>

                {uploading && (
                    <div className="mt-4">
                        <p className="text-blue-600">Uploading files...</p>
                    </div>
                )}

                {error && (
                    <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
                        {error}
                    </div>
                )}
            </Card>

            {files.length > 0 && (
                <Card className="p-4">
                    <h3 className="text-lg font-semibold mb-4">Files</h3>
                    <div className="space-y-2">
                        {files.map((file: FileStore): JSX.Element => (
                            <div
                                key={file.file_id}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                            >
                                <div className="flex-1">
                                    <p className="font-medium">{file.original_name}</p>
                                    <p className="text-sm text-gray-500">
                                        {(file.file_size / 1024).toFixed(2)} KB
                                    </p>
                                </div>
                                <div className="flex space-x-2">
                                    <Button
                                        onClick={() => handleDownload(file.file_id)}
                                        variant="outline"
                                        size="sm"
                                    >
                                        Download
                                    </Button>
                                    <Button
                                        onClick={() => setDeleteConfirm({ show: true, fileId: file.file_id })}
                                        variant="destructive"
                                        size="sm"
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            <Dialog isOpen={deleteConfirm.show} onClose={() => setDeleteConfirm({ show: false })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Delete</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this file? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end space-x-2">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteConfirm({ show: false })}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteConfirm.fileId && handleDelete(deleteConfirm.fileId)}
                        >
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DocumentUpload;
