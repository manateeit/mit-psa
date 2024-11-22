'use client';

import { IProjectPhase } from '@/interfaces/project.interfaces';
import { Pencil, Check, X, Trash2 } from 'lucide-react';

interface PhaseListItemProps {
  phase: IProjectPhase;
  isSelected: boolean;
  isEditing: boolean;
  isDragOver: boolean;
  editingName: string;
  onSelect: (phase: IProjectPhase) => void;
  onEdit: (phase: IProjectPhase) => void;
  onSave: (phase: IProjectPhase) => void;
  onCancel: () => void;
  onDelete: (phase: IProjectPhase) => void;
  onNameChange: (name: string) => void;
  onDragOver: (e: React.DragEvent, phaseId: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, phase: IProjectPhase) => void;
}

export const PhaseListItem: React.FC<PhaseListItemProps> = ({
  phase,
  isSelected,
  isEditing,
  isDragOver,
  editingName,
  onSelect,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onNameChange,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  return (
    <li
      className={`flex items-center justify-between p-2 rounded cursor-pointer group transition-colors
        ${isSelected ? 'bg-blue-100' : 'hover:bg-gray-100'}
        ${isDragOver ? 'bg-purple-100' : ''}
      `}
      onClick={() => {
        if (!isEditing) {
          onSelect(phase);
        }
      }}
      onDragOver={(e) => onDragOver(e, phase.phase_id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, phase)}
    >
      {isEditing ? (
        <div className="flex items-center justify-between w-full">
          <input
            type="text"
            value={editingName}
            onChange={(e) => onNameChange(e.target.value)}
            className="flex-1 px-2 py-1 border rounded mr-2"
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSave(phase);
              }}
              className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-100"
              title="Save"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <>
          <span>{phase.wbs_code} {phase.phase_name}</span>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(phase);
              }}
              className="p-1 rounded hover:bg-gray-200"
              title="Edit phase name"
            >
              <Pencil className="w-4 h-4 text-gray-500 hover:text-gray-700" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(phase);
              }}
              className="p-1 rounded hover:bg-red-100"
              title="Delete phase"
            >
              <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-700" />
            </button>
          </div>
        </>
      )}
    </li>
  );
};

export default PhaseListItem;
