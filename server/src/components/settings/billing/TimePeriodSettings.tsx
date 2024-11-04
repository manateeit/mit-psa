import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Select, SelectOption } from "@/components/ui/Select";
import { ITimePeriodSettings } from '@/interfaces/timeEntry.interfaces';
import { getActiveTimePeriodSettings, updateTimePeriodSettings, createTimePeriodSettings, deleteTimePeriodSettings } from '@/lib/actions/time-period-settings-actions/timePeriodSettingsActions';
import { ISO8601String } from '@/types/types.d';
import { formatISO, parseISO } from 'date-fns';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const monthOptions: SelectOption[] = monthNames.map((name, index): SelectOption => ({
  value: (index + 1).toString(),
  label: name
}));

const getMonthName = (monthNumber: number): string => monthNames[monthNumber - 1];
const getMonthNumber = (monthName: string): number => monthNames.indexOf(monthName) + 1;

const TimePeriodSettings: React.FC = () => {
  const [settings, setSettings] = useState<ITimePeriodSettings[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewSettingForm, setShowNewSettingForm] = useState<boolean>(false);
  const [newSetting, setNewSetting] = useState<Partial<ITimePeriodSettings>>({
    start_day: 1,
    end_day: 31,
    frequency: 1,
    frequency_unit: 'month',
    is_active: true,
    effective_from: formatISO(new Date()) as ISO8601String,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const activeSettings = await getActiveTimePeriodSettings();
      setSettings(activeSettings);
    } catch (err) {
      setError('Failed to fetch time period settings');
      console.error('Error fetching time period settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSetting = async () => {
    try {
      const createdSetting = await createTimePeriodSettings(newSetting);
      setSettings([...settings, createdSetting]);
      setNewSetting({
        start_day: 1,
        end_day: 31,
        frequency: 1,
        frequency_unit: 'month',
        is_active: true,
        effective_from: formatISO(new Date()) as ISO8601String,
      });
      setShowNewSettingForm(false);
    } catch (error) {
      console.error('Error adding time period setting:', error);
      setError('Failed to add time period setting');
    }
  };

  const handleUpdateSetting = async (updatedSetting: ITimePeriodSettings) => {
    try {
      await updateTimePeriodSettings(updatedSetting);
      await fetchSettings();
    } catch (error) {
      console.error('Error updating time period setting:', error);
      setError('Failed to update time period setting');
    }
  };

  const handleDeleteSetting = async (settingId: string) => {
    try {
      await deleteTimePeriodSettings(settingId);
      setSettings(settings.filter(s => s.time_period_settings_id !== settingId));
    } catch (error) {
      console.error('Error deleting time period setting:', error);
      setError('Failed to delete time period setting');
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Period Settings</CardTitle>
        <CardDescription>Configure billing time period settings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {settings.map((setting):JSX.Element => (
            <TimePeriodSettingItem
              key={setting.time_period_settings_id}
              setting={setting}
              onUpdate={handleUpdateSetting}
              onDelete={handleDeleteSetting}
            />
          ))}
          {showNewSettingForm ? (
            <NewTimePeriodSettingForm
              newSetting={newSetting}
              setNewSetting={setNewSetting}
              onAdd={handleAddSetting}
              onCancel={() => setShowNewSettingForm(false)}
            />
          ) : (
            <Button onClick={() => setShowNewSettingForm(true)}>Add New Time Period Setting</Button>
          )}
          {error && <div className="text-red-500">{error}</div>}
        </div>
      </CardContent>
    </Card>
  );
};

interface NewTimePeriodSettingFormProps {
  newSetting: Partial<ITimePeriodSettings>;
  setNewSetting: React.Dispatch<React.SetStateAction<Partial<ITimePeriodSettings>>>;
  onAdd: () => void;
  onCancel: () => void;
}

const NewTimePeriodSettingForm: React.FC<NewTimePeriodSettingFormProps> = ({ newSetting, setNewSetting, onAdd, onCancel }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewSetting({ ...newSetting, [name]: parseInt(value, 10) });
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'frequency_unit') {
      setNewSetting({ ...newSetting, [name]: value as 'day' | 'week' | 'month' | 'year' });
    } else if (name === 'start_month' || name === 'end_month') {
      setNewSetting({ ...newSetting, [name]: parseInt(value, 10) });
    }
  };

  const frequencyUnitOptions: SelectOption[] = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' },
  ];

  return (
    <div className="border p-4 rounded-md">
      <Label htmlFor="frequency">Frequency</Label>
      <Input
        id="frequency"
        name="frequency"
        type="number"
        min={1}
        value={newSetting.frequency}
        onChange={handleInputChange}
      />
      <Select
        id="frequency_unit"
        label="Frequency Unit"
        value={newSetting.frequency_unit}
        onChange={(value) => handleSelectChange('frequency_unit', value)}
        options={frequencyUnitOptions}
      />
      {(newSetting.frequency_unit === 'week' || newSetting.frequency_unit === 'month') && (
        <>
          <Label htmlFor="start_day">Start Day</Label>
          <Input
            id="start_day"
            name="start_day"
            type="number"
            min={1}
            max={newSetting.frequency_unit === 'week' ? 7 : 31}
            value={newSetting.start_day}
            onChange={handleInputChange}
          />
          <Label htmlFor="end_day">End Day</Label>
          <Input
            id="end_day"
            name="end_day"
            type="number"
            min={1}
            max={newSetting.frequency_unit === 'week' ? 7 : 31}
            value={(newSetting.end_day) ? newSetting.end_day : ''}
            onChange={handleInputChange}
          />
        </>
      )}
      {newSetting.frequency_unit === 'year' && (
        <>
          <Select
            id="start_month"
            label="Start Month"
            value={newSetting.start_month?.toString()}
            onChange={(value) => handleSelectChange('start_month', value)}
            options={monthOptions}
          />
          <Label htmlFor="start_day_of_month">Start Day of Month</Label>
          <Input
            id="start_day_of_month"
            name="start_day_of_month"
            type="number"
            min={1}
            max={31}
            value={newSetting.start_day_of_month}
            onChange={handleInputChange}
          />
          <Select
            id="end_month"
            label="End Month"
            value={newSetting.end_month?.toString()}
            onChange={(value) => handleSelectChange('end_month', value)}
            options={monthOptions}
          />
          <Label htmlFor="end_day_of_month">End Day of Month</Label>
          <Input
            id="end_day_of_month"
            name="end_day_of_month"
            type="number"
            min={1}
            max={31}
            value={newSetting.end_day_of_month}
            onChange={handleInputChange}
          />
        </>
      )}
      <Button onClick={onAdd}>Add Time Period Setting</Button>
      <Button onClick={onCancel} variant="outline">Cancel</Button>
    </div>
  );
};

interface TimePeriodSettingItemProps {
  setting: ITimePeriodSettings;
  onUpdate: (setting: ITimePeriodSettings) => void;
  onDelete: (id: string) => void;
}

const TimePeriodSettingItem: React.FC<TimePeriodSettingItemProps> = ({ setting, onUpdate, onDelete }) => {
  const [editedSetting, setEditedSetting] = useState<ITimePeriodSettings>(setting);
  const [isEditing, setIsEditing] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedSetting({ ...editedSetting, [name]: parseInt(value, 10) });
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'frequency_unit') {
      setEditedSetting({ ...editedSetting, [name]: value as 'day' | 'week' | 'month' | 'year' });
    } else if (name === 'start_month' || name === 'end_month') {
      setEditedSetting({ ...editedSetting, [name]: parseInt(value, 10) });
    }
  };

  const handleSave = () => {
    onUpdate(editedSetting);
    setIsEditing(false);
  };

  const frequencyUnitOptions: SelectOption[] = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' },
  ];

  return (
    <div className="border p-4 rounded-md">
      {isEditing ? (
        <>
          <Label htmlFor="frequency">Frequency</Label>
          <Input
            id="frequency"
            name="frequency"
            type="number"
            min={1}
            value={editedSetting.frequency}
            onChange={handleInputChange}
          />
          <Select
            id="frequency_unit"
            label="Frequency Unit"
            value={editedSetting.frequency_unit}
            onChange={(value) => handleSelectChange('frequency_unit', value)}
            options={frequencyUnitOptions}
          />
          {(editedSetting.frequency_unit === 'week' || editedSetting.frequency_unit === 'month') && (
            <>
              <Label htmlFor="start_day">Start Day</Label>
              <Input
                id="start_day"
                name="start_day"
                type="number"
                min={1}
                max={editedSetting.frequency_unit === 'week' ? 7 : 31}
                value={editedSetting.start_day}
                onChange={handleInputChange}
              />
              <Label htmlFor="end_day">End Day</Label>
              <Input
                id="end_day"
                name="end_day"
                type="number"
                min={1}
                max={editedSetting.frequency_unit === 'week' ? 7 : 31}
                value={editedSetting.end_day}
                onChange={handleInputChange}
              />
            </>
          )}
          {editedSetting.frequency_unit === 'year' && (
            <>
              <Label htmlFor="start_month">Start Month</Label>
              <Select
                id="start_month"
                label="Start Month"
                value={editedSetting.start_month?.toString()}
                onChange={(value) => handleSelectChange('start_month', value)}
                options={monthOptions}
              />
              <Label htmlFor="start_day_of_month">Start Day of Month</Label>
              <Input
                id="start_day_of_month"
                name="start_day_of_month"
                type="number"
                min={1}
                max={31}
                value={editedSetting.start_day_of_month}
                onChange={handleInputChange}
              />
              <Label htmlFor="end_month">End Month</Label>
              <Select
                id="end_month"
                label="End Month"
                value={editedSetting.end_month?.toString()}
                onChange={(value) => handleSelectChange('end_month', value)}
                options={monthOptions}
              />
              <Label htmlFor="end_day_of_month">End Day of Month</Label>
              <Input
                id="end_day_of_month"
                name="end_day_of_month"
                type="number"
                min={1}
                max={31}
                value={editedSetting.end_day_of_month}
                onChange={handleInputChange}
              />
            </>
          )}
          <Button onClick={handleSave}>Save</Button>
          <Button onClick={() => setIsEditing(false)} variant="outline">Cancel</Button>
        </>
      ) : (
        <>
          <p>Frequency: {setting.frequency} {setting.frequency_unit}(s)</p>
          {(setting.frequency_unit === 'week' || setting.frequency_unit === 'month') && (
            <>
              <p>Start Day: {setting.start_day}</p>
              <p>End Day: {setting.end_day || 'End of period'}</p>
            </>
          )}
          {setting.frequency_unit === 'year' && (
            <>
              <p>Start: {getMonthName(setting.start_month || 1)} {setting.start_day_of_month}</p>
              <p>End: {getMonthName(setting.end_month || 12)} {setting.end_day_of_month}</p>
            </>
          )}
          <p>Effective From: {parseISO(setting.effective_from).toLocaleString()}</p>
          <p>Effective To: {setting.effective_to ? parseISO(setting.effective_to).toLocaleString() : 'No end'}</p>
          <Button onClick={() => setIsEditing(true)}>Edit</Button>
          <Button onClick={() => onDelete(setting.time_period_settings_id)} variant="destructive">Delete</Button>
        </>
      )}
    </div>
  );
};

export default TimePeriodSettings;
