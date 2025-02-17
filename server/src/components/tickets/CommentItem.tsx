'use client';

import React, { useMemo, useState } from 'react';
import TextEditor from '../editor/TextEditor';
import { PartialBlock } from '@blocknote/core';
import ReactMarkdown from 'react-markdown';
import { Pencil2Icon, TrashIcon } from '@radix-ui/react-icons';
import AvatarIcon from '@/components/ui/AvatarIcon';
import { IComment } from '@/interfaces/comment.interface';
import { IUserWithRoles } from '@/interfaces/auth.interfaces';
import UserPicker from '@/components/ui/UserPicker';
import { Button } from '@/components/ui/Button';
import { withDataAutomationId } from '@/types/ui-reflection/withDataAutomationId';

interface CommentItemProps {
  id?: string;
  conversation: IComment;
  user: { 
    first_name: string; 
    last_name: string;
    user_id: string;
    email?: string;
  } | null;
  isEditing: boolean;
  currentComment: IComment | null;
  ticketId: string;
  userMap: Record<string, { first_name: string; last_name: string; user_id: string; email?: string; user_type: string; }>;
  onContentChange: (content: PartialBlock[]) => void;
  onSave: (updates: Partial<IComment>) => void;
  onClose: () => void;
  onEdit: (conversation: IComment) => void;
  onDelete: (commentId: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  id,
  conversation,
  user,
  isEditing,
  currentComment,
  ticketId,
  userMap,
  onContentChange,
  onSave,
  onClose,
  onEdit,
  onDelete
}) => {
  const [selectedUserId, setSelectedUserId] = useState(conversation.user_id || '');
  const [editedContent, setEditedContent] = useState<PartialBlock[]>([{
    type: "paragraph",
    props: {
      textAlignment: "left",
      backgroundColor: "default",
      textColor: "default"
    },
    content: [{
      type: "text",
      text: conversation.note || '',
      styles: {}
    }]
  }]);

  const commentId = useMemo(() => 
    conversation.comment_id || currentComment?.comment_id || id || 'unknown',
    [conversation.comment_id, currentComment?.comment_id, id]
  );

  const getAuthorName = () => {
    if (!conversation.user_id) return 'Unknown User';
    const commentUser = userMap[conversation.user_id];
    if (!commentUser) return 'Unknown User';
    return `${commentUser.first_name} ${commentUser.last_name}${commentUser.user_type === 'client' ? ' (Client)' : ''}`;
  };

  const getAuthorEmail = () => {
    if (!conversation.user_id) return null;
    const commentUser = userMap[conversation.user_id];
    return commentUser?.email;
  };

  const canEdit = useMemo(() => {
    return user?.user_id === conversation.user_id;
  }, [conversation.user_id, user?.user_id]);

  const handleSave = () => {
    const selectedUser = userMap[selectedUserId];
    const updates: Partial<IComment> = {
      note: JSON.stringify(editedContent),
      user_id: selectedUserId,
      author_type: selectedUser?.user_type === 'internal' ? 'internal' : 'client'
    };

    onSave(updates);
  };

  const handleContentChange = (blocks: PartialBlock[]) => {
    setEditedContent(blocks);
    onContentChange(blocks);
  };

  const editorContent = useMemo(() => {
    if (!currentComment || !isEditing) return null;

    return (
      <div>
        <div className="mb-4">
          <UserPicker
            label="Select User"
            value={selectedUserId}
            onValueChange={setSelectedUserId}
            users={Object.entries(userMap).map(([id, user]): IUserWithRoles => ({
              user_id: id,
              username: id,
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email || '',
              hashed_password: '',
              is_inactive: false,
              tenant: '',
              roles: [],
              created_at: new Date(),
              two_factor_enabled: false,
              is_google_user: false,
              user_type: user.user_type
            }))}
          />
        </div>

        <TextEditor
          {...withDataAutomationId({ id: `${commentId}-text-editor` })}
          roomName={`ticket-${ticketId}-comment-${currentComment.comment_id}`}
          initialContent={editedContent}
          onContentChange={handleContentChange}
        />

        <div className="flex justify-end space-x-2 mt-2">
          <button
            {...withDataAutomationId({ id: `${commentId}-save-btn` })}
            onClick={handleSave}
            className="bg-green-500 hover:bg-green-600 text-white font-medium py-1 px-3 rounded-md transition duration-150 ease-in-out"
            disabled={!selectedUserId}
          >
            Save
          </button>
          <Button
            {...withDataAutomationId({ id: `${commentId}-cancel-btn` })}
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-1 px-3 rounded-md transition duration-150 ease-in-out"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }, [
    currentComment,
    isEditing,
    selectedUserId,
    commentId,
    ticketId,
    editedContent,
    userMap,
    handleContentChange,
    handleSave,
    onClose
  ]);

  const authorFirstName = conversation.user_id ? userMap[conversation.user_id]?.first_name || '' : '';
  const authorLastName = conversation.user_id ? userMap[conversation.user_id]?.last_name || '' : '';

  return (
    <div {...withDataAutomationId({ id: commentId })} className="bg-gray-50 rounded-lg p-4 mb-4 shadow-sm">
      <div className="flex items-start mb-2">
        <div className="mr-3">
          <AvatarIcon 
            {...withDataAutomationId({ id: `${commentId}-avatar` })}
            userId={conversation.user_id || ''}
            firstName={authorFirstName}
            lastName={authorLastName}
            size="md"
          />
        </div>
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <div>
              <p {...withDataAutomationId({ id: `${commentId}-author-name` })} className="font-semibold text-gray-800">
                {getAuthorName()}
              </p>
              {getAuthorEmail() && (
                <p {...withDataAutomationId({ id: `${commentId}-author-email` })} className="text-sm text-gray-600">
                  <a href={`mailto:${getAuthorEmail()}`} className="hover:text-indigo-600">
                    {getAuthorEmail()}
                  </a>
                </p>
              )}
            </div>
            {canEdit && (
              <div className="space-x-2">
                <button
                  id={`edit-comment-${conversation.comment_id}-button`}
                  onClick={() => onEdit(conversation)}
                  className="text-indigo-600 hover:text-indigo-800 font-medium p-1 rounded-full hover:bg-indigo-100 transition duration-150 ease-in-out"
                  aria-label="Edit comment"
                >
                  <Pencil2Icon className="w-5 h-5" />
                </button>
                <Button
                  id='delete-comment-button'
                  onClick={() => onDelete(conversation.comment_id || '')}
                  className="text-red-600 hover:text-red-800 font-medium p-1 rounded-full hover:bg-red-100 transition duration-150 ease-in-out"
                  aria-label="Delete comment"
                >
                  <TrashIcon className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>
          {isEditing && currentComment?.comment_id === conversation.comment_id ? (
            editorContent
          ) : (
            <div {...withDataAutomationId({ id: `${commentId}-content` })} className="prose max-w-none mt-2">
              <ReactMarkdown>{conversation.note || ''}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
