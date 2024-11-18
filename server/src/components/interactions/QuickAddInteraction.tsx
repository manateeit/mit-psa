// server/src/components/interactions/QuickAddInteraction.tsx
'use client'

import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/Button';
import CustomSelect from '@/components/ui/CustomSelect';
import { Input } from '@/components/ui/Input';
import { addInteraction, getInteractionTypes, getInteractionById } from '@/lib/actions/interactionActions';
import { IInteraction, IInteractionType } from '@/interfaces/interaction.interfaces';
import { useTenant } from '../TenantProvider';
import { useSession } from 'next-auth/react';

interface QuickAddInteractionProps {
  entityId: string;
  entityType: 'contact' | 'company';
  companyId?: string;
  onInteractionAdded: (newInteraction: IInteraction) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickAddInteraction({ 
  entityId, 
  entityType, 
  companyId, 
  onInteractionAdded, 
  isOpen, 
  onClose 
}: QuickAddInteractionProps) {
  const [description, setDescription] = useState('');
  const [typeId, setTypeId] = useState('');
  const [duration, setDuration] = useState('');
  const [interactionTypes, setInteractionTypes] = useState<IInteractionType[]>([]);
  const tenant = useTenant()!;
  const { data: session } = useSession();

  useEffect(() => {
    const fetchInteractionTypes = async () => {
      try {
        const types = await getInteractionTypes();
        setInteractionTypes(types);
      } catch (error) {
        console.error('Error fetching interaction types:', error);
      }
    };

    fetchInteractionTypes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) {
      console.error('User not authenticated');
      return;
    }
  
    try {
      const interactionData: Partial<IInteraction> = {
        description,
        type_id: typeId,
        duration: duration ? parseInt(duration, 10) : null,
        user_id: session.user.id,
        tenant: tenant
      };
  
      if (entityType === 'contact') {
        interactionData.contact_name_id = entityId;
        interactionData.company_id = companyId;
      } else {
        interactionData.company_id = entityId;
      }
  
      console.log('Interaction data being sent:', interactionData);
  
      const newInteraction = await addInteraction(interactionData as Omit<IInteraction, 'interaction_date'>);
      console.log('New interaction received:', newInteraction);
      
      // Fetch the complete interaction data
      const fullInteraction = await getInteractionById(newInteraction.interaction_id);
      
      onInteractionAdded(fullInteraction);
      onClose();
      // Clear form fields
      setDescription('');
      setTypeId('');
      setDuration('');
    } catch (error) {
      console.error('Error adding interaction:', error);
      // Handle error (e.g., show error message to user)  
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg w-96">
          <Dialog.Title className="text-lg font-bold mb-4">Add New Interaction</Dialog.Title>
          <form onSubmit={handleSubmit} className="space-y-4">
            <CustomSelect
              options={interactionTypes.map((type) => ({ value: type.type_id, label: type.type_name }))}
              value={typeId}
              onValueChange={setTypeId}
              placeholder="Select Interaction Type"
              className="w-full"
            />
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              required
            />
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Duration (minutes)"
            />
            <Button type="submit" className="w-full">Save Interaction</Button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
