'use client'

import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Plus, X, Edit2 } from "lucide-react";
import { IInteractionType } from '@/interfaces/interaction.interfaces';
import { getAllInteractionTypes, createInteractionType, updateInteractionType, deleteInteractionType } from '@/lib/actions/interactionTypeActions';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDefinition } from '@/interfaces/dataTable.interfaces';

const InteractionTypesSettings: React.FC = () => {
  const [interactionTypes, setInteractionTypes] = useState<IInteractionType[]>([]);
  const [newTypeName, setNewTypeName] = useState('');
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);

  useEffect(() => {
    fetchInteractionTypes();
  }, []);

  const fetchInteractionTypes = async () => {
    try {
      const types = await getAllInteractionTypes();
      setInteractionTypes(types);
    } catch (error) {
      console.error('Error fetching interaction types:', error);
    }
  };

  const handleCreateType = async () => {
    if (newTypeName.trim()) {
      try {
        await createInteractionType({ type_name: newTypeName.trim() });
        setNewTypeName('');
        fetchInteractionTypes();
      } catch (error) {
        console.error('Error creating interaction type:', error);
      }
    }
  };

  const handleUpdateType = async (typeId: string, newName: string) => {
    try {
      await updateInteractionType(typeId, { type_name: newName.trim() });
      setEditingTypeId(null);
      fetchInteractionTypes();
    } catch (error) {
      console.error('Error updating interaction type:', error);
    }
  };

  const handleDeleteType = async (typeId: string) => {
    try {
      await deleteInteractionType(typeId);
      fetchInteractionTypes();
    } catch (error) {
      console.error('Error deleting interaction type:', error);
    }
  };

  const columns: ColumnDefinition<IInteractionType>[] = [
    {
      title: 'Name',
      dataIndex: 'type_name',
      render: (value: string, record: IInteractionType) => (
        editingTypeId === record.type_id ? (
          <Input
            value={value}
            onChange={(e) => setInteractionTypes(types => 
              types.map((t): IInteractionType => t.type_id === record.type_id ? { ...t, type_name: e.target.value } : t)
            )}
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
            <Button onClick={() => handleUpdateType(record.type_id, record.type_name)} size="sm">Save</Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingTypeId(record.type_id)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteType(record.type_id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Interaction Types</h3>
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
    </div>
  );
};

export default InteractionTypesSettings;
