// server/src/components/ChannelPicker.tsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import CustomSelect from '@/components/ui/CustomSelect';
import { IChannel } from '@/interfaces';
import { ChevronDownIcon } from '@radix-ui/react-icons';

interface ChannelPickerProps {
  channels: IChannel[];
  onSelect: (channelId: string) => void;
  selectedChannelId: string | null;
  filterState: 'active' | 'inactive' | 'all';
  onFilterStateChange: (state: 'active' | 'inactive' | 'all') => void;
}

export const ChannelPicker: React.FC<ChannelPickerProps> = ({
  channels,
  onSelect,
  selectedChannelId,
  filterState,
  onFilterStateChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredChannels, setFilteredChannels] = useState<IChannel[]>([]);

  useEffect(() => {
    const filtered = channels.filter((channel) => {
      const matchesSearch = (channel.channel_name as string).toLowerCase().includes(searchTerm.toLowerCase());
      const matchesState =
        filterState === 'all' || (filterState === 'active' ? !channel.is_inactive : channel.is_inactive);
      return matchesSearch && matchesState;
    });

    setFilteredChannels(filtered);
  }, [channels, filterState, searchTerm]);

  const handleSelect = (channelId: string): void => {
    onSelect(channelId);
    setIsOpen(false);
  };

  const selectedChannel = selectedChannelId
    ? channels.find((c) => c.channel_id === selectedChannelId)
    : null;

  const getButtonLabel = (): string|undefined => {
    if (selectedChannel) {
      return selectedChannel.channel_name;
    }

    switch (filterState) {
      case 'inactive':
        return 'All Inactive Channels';
      case 'active':
        return 'All Active Channels';
      case 'all':
        return 'All Channels';
      default:
        return 'All Channels';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className="w-full min-h-[38px] px-3 py-2 border rounded-lg flex justify-between items-center bg-white text-left text-sm"
      >
        <span>{getButtonLabel()}</span>
        <ChevronDownIcon className="w-4 h-4 text-gray-400 ml-2" />
      </button>

      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <DialogHeader>
          <DialogTitle>Select Channel</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div className="mb-4">
            <CustomSelect
              value={filterState}
              onValueChange={(value) =>
                onFilterStateChange(value as 'active' | 'inactive' | 'all')
              }
              options={[
                { value: 'active', label: 'Active Channels' },
                { value: 'inactive', label: 'Inactive Channels' },
                { value: 'all', label: 'All Channels' },
              ]}
              placeholder="Filter channels"
            />
          </div>
          <Input
            placeholder="Search channels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />
          <div className="max-h-60 overflow-y-auto">
            {filteredChannels.map((channel):JSX.Element => (
              <button
                key={channel.channel_id}
                onClick={() =>
                  channel.channel_id && handleSelect(channel.channel_id)
                }
                className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                  channel.channel_id === selectedChannelId ? 'bg-blue-100' : ''
                }`}
              >
                {channel.channel_name}
                {channel.is_inactive && (
                  <span className="ml-2 text-gray-500">(Inactive)</span>
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
