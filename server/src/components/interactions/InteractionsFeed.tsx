// server/src/components/interactions/InteractionsFeed.tsx
'use client'
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Calendar, Phone, Mail, FileText, CheckSquare, Filter, RefreshCw } from 'lucide-react';
import { IInteraction, IInteractionType } from '@/interfaces/interaction.interfaces';
import { QuickAddInteraction } from './QuickAddInteraction';
import { getInteractionsForEntity, getInteractionTypes } from '@/lib/actions/interactionActions';
import { useDrawer } from '@/context/DrawerContext';
import { getInteractionById } from '@/lib/actions/interactionActions';
import InteractionDetails from './InteractionDetails';
import CustomSelect from '@/components/ui/CustomSelect';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';

interface InteractionsFeedProps {
  entityId: string;
  entityType: 'contact' | 'company';
  companyId?: string;
  interactions: IInteraction[];
  setInteractions: React.Dispatch<React.SetStateAction<IInteraction[]>>;
}


const InteractionIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'call': return <Phone className="text-gray-500" />;
    case 'email': return <Mail className="text-gray-500" />;
    case 'meeting': return <Calendar className="text-gray-500" />;
    case 'note': return <FileText className="text-gray-500" />;
    case 'task': return <CheckSquare className="text-gray-500" />;
    default: return null;
  }
};

const InteractionsFeed: React.FC<InteractionsFeedProps> = ({ entityId, entityType, companyId, interactions, setInteractions }) => {
  const { openDrawer } = useDrawer();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [interactionTypes, setInteractionTypes] = useState<IInteractionType[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  useEffect(() => {
    fetchInteractions();
    fetchInteractionTypes();
  }, [entityId, entityType]);

  const fetchInteractions = async () => {
    const fetchedInteractions = await getInteractionsForEntity(entityId, entityType);
    setInteractions(fetchedInteractions);
  };

  const fetchInteractionTypes = async () => {
    const types = await getInteractionTypes();
    setInteractionTypes(types);
  };

  const filteredInteractions = useMemo(() => {
    return interactions.filter(interaction =>
      (interaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
       interaction.type_name.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedType === '' || interaction.type_id === selectedType) &&
      (!startDate || new Date(interaction.interaction_date) >= new Date(startDate)) &&
      (!endDate || new Date(interaction.interaction_date) <= new Date(endDate))
    );
  }, [interactions, searchTerm, selectedType, startDate, endDate]);

  const handleInteractionAdded = (newInteraction: IInteraction) => {
    setInteractions([newInteraction, ...interactions]);
    setIsQuickAddOpen(false);
  };

  const handleInteractionClick = useCallback((interaction: IInteraction) => {
    openDrawer(
      <InteractionDetails interaction={interaction} />,
      async () => {
        try {
          const updatedInteraction = await getInteractionById(interaction.interaction_id);
          setInteractions(prevInteractions => 
            prevInteractions.map((i):IInteraction => 
              i.interaction_id === updatedInteraction.interaction_id ? updatedInteraction : i
            )
          );
        } catch (error) {
          console.error('Error fetching updated interaction:', error);
        }
      }
    );
  }, [openDrawer, setInteractions]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const resetFilters = () => {
    setSelectedType('');
    setStartDate('');
    setEndDate('');
  };

  const handleApplyFilters = () => {
    setIsFilterDialogOpen(false);
  };

  return (
    <Card className="w-full max-w-2xl">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Interactions</h2>
          <Button 
            onClick={() => setIsQuickAddOpen(true)} 
            size="default"
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Add Interaction
          </Button>
        </div>
        <div className="flex flex-wrap gap-4 mb-4">
          <Input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search interactions"
            className="flex-grow"
          />
          <Button 
            onClick={() => setIsFilterDialogOpen(true)} 
            variant="outline"
            size="default"
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>
      <CardContent>
        <ul className="space-y-2">
          {filteredInteractions.map((interaction):JSX.Element => (
            <li 
              key={interaction.interaction_id} 
              className="flex items-start space-x-3 p-4 hover:bg-gray-50 rounded-lg cursor-pointer border-b border-gray-200 last:border-b-0"
              onClick={() => handleInteractionClick(interaction)}
            >
              <div className="flex-shrink-0">
                <InteractionIcon type={interaction.type_name} />
              </div>
              <div className="flex-grow">
                <p className="font-semibold">{interaction.description}</p>
                <p className="text-sm text-gray-500">{new Date(interaction.interaction_date).toLocaleString()}</p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>

      <Dialog isOpen={isFilterDialogOpen} onClose={() => setIsFilterDialogOpen(false)}>
        <DialogHeader>
          <DialogTitle>Filter Interactions</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div className="space-y-4">
            <CustomSelect
              options={[{ value: '', label: 'All Types' }, ...interactionTypes.map((type) => ({ value: type.type_id, label: type.type_name }))]}
              value={selectedType}
              onValueChange={setSelectedType}
              placeholder="Interaction Type"
            />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start Date"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End Date"
            />
            <div className="flex justify-between">
              <Button onClick={resetFilters} variant="outline" className="flex items-center">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset Filters
              </Button>
              <Button onClick={handleApplyFilters}>Apply Filters</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <QuickAddInteraction
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        entityId={entityId}
        entityType={entityType}
        companyId={companyId}
        onInteractionAdded={handleInteractionAdded}
      />
    </Card>
  );
};

export default InteractionsFeed;
