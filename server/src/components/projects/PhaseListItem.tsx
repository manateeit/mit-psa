'use client';

import { IProjectPhase } from 'server/src/interfaces/project.interfaces';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { TextArea } from '../ui/TextArea';
import { DatePicker } from 'server/src/components/ui/DatePicker';

interface PhaseListItemProps {
  phase: IProjectPhase;
  isSelected: boolean;
  isEditing: boolean;
  isDragOver: boolean;
  editingName: string;
  editingDescription: string | null;
  editingStartDate?: Date;
  editingEndDate?: Date;
  onSelect: (phase: IProjectPhase) => void;
  onEdit: (phase: IProjectPhase) => void;
  onSave: (phase: IProjectPhase) => void;
  onCancel: () => void;
  onDelete: (phase: IProjectPhase) => void;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string | null) => void;
  onStartDateChange?: (date: Date | undefined) => void;
  onEndDateChange?: (date: Date | undefined) => void;
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
  editingDescription,
  editingStartDate,
  editingEndDate,
  onSelect,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onNameChange,
  onDescriptionChange,
  onStartDateChange,
  onEndDateChange,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  return (
    <li
      className={`flex items-center justify-between px-3 py-2.5 rounded-md cursor-pointer group transition-colors
        ${isSelected ? 'bg-purple-50' : 'hover:bg-gray-50'}
        ${isDragOver ? 'bg-purple-50/50' : ''}
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
        <div className="flex flex-col w-full gap-3">
          <div className="flex-1 min-w-0">
            {/* Phase Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Phase Name</label>
              <TextArea
                value={editingName}
                onChange={(e) => onNameChange(e.target.value)}
                className="w-full px-3 py-1 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
            {/* Description Input - Added */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Phase Description</label>
              <TextArea
                value={editingDescription ?? ''}
                onChange={(e) => onDescriptionChange(e.target.value || null)}
                className="w-full px-3 py-1 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="Description"
                onClick={(e) => e.stopPropagation()}
                rows={2}
              />
            </div>
            {/* Start Date Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <DatePicker
                value={editingStartDate}
                onChange={(date: Date | undefined) => onStartDateChange?.(date)}
                placeholder="Start date"
                className="w-full"
              />
            </div>
            {/* End Date Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-0.5">End Date</label>
              <DatePicker
                value={editingEndDate}
                onChange={(date: Date | undefined) => onEndDateChange?.(date)}
                placeholder="End date"
                className="w-full"
              />
            </div>
          </div>
          {/* Action Buttons  */}
          <div className="flex justify-end gap-2 mt-3">
            <Button
              id={`cancel-edit-phase-${phase.phase_id}`}
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
              title="Cancel editing"
            >
              Cancel
            </Button>
            <Button
              id={`save-edit-phase-${phase.phase_id}`}
              variant="default"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onSave(phase);
              }}
              title="Save changes"
            >
              Save
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Display View */}
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gray-900">{phase.phase_name}</span>
            {phase.description && (
              <span className="text-sm text-gray-600 mt-1">{phase.description}</span>
            )}
            <div className="mt-1 text-xs text-gray-500 space-y-1">
              <div>
                Start: {phase.start_date
                  ? new Date(phase.start_date).toLocaleDateString()
                  : 'Not set'}
              </div>
              <div>
                Due: {phase.end_date
                  ? new Date(phase.end_date).toLocaleDateString()
                  : 'Not set'}
              </div>
            </div>
          </div>
          {/* Hover Action Buttons */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(phase);
              }}
              className="p-1 rounded-md hover:bg-gray-50 transition-colors"
              title="Edit phase"
            >
              <Pencil className="w-4 h-4 text-gray-500 hover:text-gray-700" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(phase);
              }}
              className="p-1 rounded-md hover:bg-red-50 transition-colors"
              title="Delete phase"
            >
              <Trash2 className="w-4 h-4 text-red-600 hover:text-red-800" />
            </button>
          </div>
        </>
      )}
    </li>
  );
};

export default PhaseListItem;
