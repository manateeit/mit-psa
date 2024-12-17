'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Plus, X, Edit2 } from "lucide-react";
import { IInteractionType } from '@/interfaces/interaction.interfaces';
import { getAllInteractionTypes, createInteractionType, updateInteractionType, deleteInteractionType } from '@/lib/actions/interactionTypeActions';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDefinition } from '@/interfaces/dataTable.interfaces';
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { Alert, AlertDescription } from "@/components/ui/Alert";

const InteractionTypesSettings: React.FC = () => {
  const [interactionTypes, setInteractionTypes] = useState<IInteractionType[]>([]);
  const [newTypeName, setNewTypeName] = useState('');
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    typeId: string;
    typeName: string;
  }>({
    isOpen: false,
    typeId: '',
    typeName: ''
  });

  useEffect(() => {
    fetchInteractionTypes();
  }, []);

  const startEditing = (typeId: string, initialValue: string) => {
    setEditingTypeId(typeId);
    setError(null);
    // Let the input render first, then set its value
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.value = initialValue;
        editInputRef.current.focus();
      }
    }, 0);
  };

  const cancelEditing = () => {
    setEditingTypeId(null);
    setError(null);
  };

  const fetchInteractionTypes = async () => {
    try {
      const types = await getAllInteractionTypes();
      setInteractionTypes(types);
    } catch (error) {
      console.error('Error fetching interaction types:', error);
      setError('Failed to fetch interaction types');
    }
  };

  const handleCreateType = async () => {
    if (newTypeName.trim()) {
      try {
        await createInteractionType({ type_name: newTypeName.trim() });
        setNewTypeName('');
        setError(null);
        fetchInteractionTypes();
      } catch (error) {
        console.error('Error creating interaction type:', error);
        setError('Failed to create interaction type');
      }
    }
  };

  const handleUpdateType = async (typeId: string) => {
    const newValue = editInputRef.current?.value.trim();
    if (newValue) {
      try {
        await updateInteractionType(typeId, { type_name: newValue });
        setEditingTypeId(null);
        setError(null);
        fetchInteractionTypes();
      } catch (error) {
        console.error('Error updating interaction type:', error);
        setError('Failed to update interaction type');
      }
    }
  };

  const handleDeleteType = async () => {
    try {
      await deleteInteractionType(deleteDialog.typeId);
      setError(null);
      fetchInteractionTypes();
    } catch (error: any) {
      console.error('Error deleting interaction type:', error);
      if (error.message.includes('records exist')) {
        setError('Cannot delete this interaction type because it is being used by existing records');
      } else {
        setError('Failed to delete interaction type');
      }
    } finally {
      setDeleteDialog({ isOpen: false, typeId: '', typeName: '' });
    }
  };

  const columns: ColumnDefinition<IInteractionType>[] = [
    {
      title: 'Name',
      dataIndex: 'type_name',
      render: (value: string, record: IInteractionType) => (
        editingTypeId === record.type_id ? (
          <Input
            ref={editInputRef}
            defaultValue={value}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleUpdateType(record.type_id);
              } else if (e.key === 'Escape') {
                cancelEditing();
              }
            }}
            className="w-full"
          />
        ) : (
          <span className="text-gray-700">{value}</span>
        )
      ),
    },
    {
      title: 'Action',
      dataIndex: 'type_id',
      render: (_: any, record: IInteractionType) => (
        <div className="flex items-center justify-end space-x-2">
          {editingTypeId === record.type_id ? (
            <>
              <Button 
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateType(record.type_id);
                }}
              >
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  cancelEditing();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing(record.type_id, record.type_name);
                }}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteDialog({
                    isOpen: true,
                    typeId: record.type_id,
                    typeName: record.type_name
                  });
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Interaction Types</h3>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <DataTable
        data={interactionTypes}
        columns={columns}
        pagination={false}
      />
      <div className="flex space-x-2 mt-4">
        <Input
          type="text"
          value={newTypeName}
          onChange={(e) => setNewTypeName(e.target.value)}
          placeholder="New Interaction Type"
          className="flex-grow"
        />
        <Button onClick={handleCreateType} className="bg-primary-500 text-white hover:bg-primary-600">
          <Plus className="h-4 w-4 mr-2" /> Add
        </Button>
      </div>

      <ConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, typeId: '', typeName: '' })}
        onConfirm={handleDeleteType}
        title="Delete Interaction Type"
        message={`Are you sure you want to delete the interaction type "${deleteDialog.typeName}"?\n\nWarning: If there are any records using this interaction type, the deletion will fail.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </div>
  );
};

export default InteractionTypesSettings;
