'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { IWorkItem } from '@/interfaces/workItem.interfaces';
import { WorkItemPicker } from './WorkItemPicker';

interface AddWorkItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (workItem: IWorkItem) => void;
  existingWorkItems: IWorkItem[];
}

export function AddWorkItemDialog({ isOpen, onClose, onAdd, existingWorkItems }: AddWorkItemDialogProps) {
  const handleSelect = (workItem: IWorkItem) => {
    onAdd(workItem);
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Work Item</DialogTitle>
        </DialogHeader>
        <WorkItemPicker 
          onSelect={handleSelect} 
          existingWorkItems={existingWorkItems}
        />
      </DialogContent>
    </Dialog>
  );
}
