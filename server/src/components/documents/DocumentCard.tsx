"use client";
import { useState } from 'react';
import { IDocument } from '@/interfaces';
import TextEditor from '@/components/editor/TextEditor';
import { updateDocument } from '@/lib/actions/document-actions/documentActions';

const DocumentCard = ({ document }: { document: IDocument }) => {
    const roomName = "document-room-" + document.document_id;

    const [isEditorOpen, setIsEditorOpen] = useState(false);

    // Turn date into Month Day, Year format
    const formatDate = (date: Date | undefined) => {
        if (!date) return "";
        return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    const handleEditorToggle = () => {
        setIsEditorOpen(!isEditorOpen);
    }

    // Save document content
    const handleSubmit = async (content: string) => {
        try {
            if (document.document_id && document) {
                // Update existing document
                await updateDocument(document.document_id, { content });

                alert('Document saved successfully');
                window.location.reload();
            }
        } catch (error) {
            console.error('Error saving document:', error);
        }
    };

    return (
        <div key={document.document_id} className="rounded overflow-hidden">
            <button onClick={handleEditorToggle} className="w-full text-left">
                {/* Document image */}
                <div className="h-40 bg-gray-200 relative">
                    {/* <Image
                        src="/images/avatar-purple-background.png"
                        alt="Document"
                        layout="fill"
                        objectFit="cover"
                    /> */}
                </div>

                {/* Document details */}
                <div className="py-4">
                    <div className="text-sm text-gray-500 mb-1">Collaborative document</div>
                    <h3 className="text-md font-semibold mb-1">{document.document_name}</h3>
                    <div className="text-sm">
                        <span className="text-gray-600 font-medium me-2">{document.createdByFullName}</span>
                        <span className="text-gray-500">{formatDate(document.entered_at)}</span>
                    </div>
                </div>
            </button>

            {/* Editor */}
            {isEditorOpen &&
                <div className="mt-4 max-h-96 overflow-y-scroll overflow-x-hidden">
                    <TextEditor
                        key={"document-" + document.document_id}
                        roomName={roomName}
                        initialContent={document.content}
                        handleSubmit={handleSubmit}
                    />
                </div>
            }
        </div>
    );
};

export default DocumentCard;