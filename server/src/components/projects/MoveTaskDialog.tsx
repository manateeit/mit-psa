'use client';

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from 'server/src/components/ui/Button';
import TreeSelect, { TreeSelectOption, TreeSelectPath } from 'server/src/components/ui/TreeSelect';
import { toast } from 'react-hot-toast';
import { moveTaskToPhase } from 'server/src/lib/actions/project-actions/projectTaskActions';
import { IProjectTask } from 'server/src/interfaces/project.interfaces';

interface MoveTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: IProjectTask;
  currentProjectId: string;
  projectTreeData: Array<TreeSelectOption<'project' | 'phase' | 'status'>>;
  onConfirm: (targetPhaseId: string, targetStatusId: string | undefined) => void; 
}

export default function MoveTaskDialog({
  isOpen,
  onClose,
  task,
  currentProjectId,
  projectTreeData,
  onConfirm: onConfirmProp,
}: MoveTaskDialogProps) {
  const [selectedTargetPath, setSelectedTargetPath] = useState<TreeSelectPath | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCrossProjectMove, setIsCrossProjectMove] = useState<boolean>(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTargetPath(null); // Start fresh, don't pre-fill from current task location
      setIsSubmitting(false);
      setIsCrossProjectMove(false);
    }
  }, [isOpen, task.task_id]);

  const handleTreeSelect = (value: string, type: string, excluded: boolean, path?: TreeSelectPath) => {
    if (path && path['phase']) {
        setSelectedTargetPath(path);
        const newProjectId = path['project'];
        setIsCrossProjectMove(Boolean(newProjectId && currentProjectId !== newProjectId));
    } else {
        setSelectedTargetPath(null);
        setIsCrossProjectMove(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedTargetPath || !selectedTargetPath['phase']) {
        toast.error("Please select a target phase.");
        return;
    }
    if (selectedTargetPath['phase'] === task.phase_id) {
        toast.error("Please select a different phase to move the task.");
        return;
    }

    const targetPhaseId = selectedTargetPath['phase'];
    const targetStatusId = selectedTargetPath['status'] || undefined;

    onConfirmProp(targetPhaseId, targetStatusId);

    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg w-[500px] max-h-[90vh] overflow-y-auto z-50">
          <Dialog.Title className="text-lg font-semibold mb-4">Move Task</Dialog.Title>
          <Dialog.Description className="mb-2 text-sm text-gray-600">
            Move task <span className="font-medium">"{task.task_name}"</span> to a new phase/status:
          </Dialog.Description>

          <div className="mb-6"> {/* Increased bottom margin */}
            <TreeSelect<'project' | 'phase' | 'status'>
                // Use phase from selectedTargetPath for the value, default to empty string
                value={selectedTargetPath?.['phase'] || ''}
                onValueChange={handleTreeSelect}
                options={projectTreeData}
                placeholder="Select target project/phase/status..."
                className="w-full"
                multiSelect={false}
                showExclude={false}
                showReset={false}
                allowEmpty={false}
            />
          </div>

          {/* No switches needed for move */}

          <div className="flex justify-end space-x-2">
            <Button id='cancel-move-button' variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              id='confirm-move-button'
              onClick={handleConfirm}
              disabled={!selectedTargetPath?.['phase'] || selectedTargetPath?.['phase'] === task.phase_id}
            >
              Confirm Move
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}