'use client';

import { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { DataTable } from '@/components/ui/DataTable';
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/DropdownMenu';
import { ColumnDefinition } from '@/interfaces/dataTable.interfaces';
import { addCompanyEmailSetting, updateCompanyEmailSetting, deleteCompanyEmailSetting } from '@/lib/actions/company-settings/emailSettings';
import { ICompanyEmailSettings } from '@/interfaces/company.interfaces';

interface EmailRegistrationSettingsProps {
  companyId: string;
  initialSuffixes: ICompanyEmailSettings[];
}

export default function EmailRegistrationSettings({ 
  companyId,
  initialSuffixes 
}: EmailRegistrationSettingsProps) {
  const [suffixes, setSuffixes] = useState<ICompanyEmailSettings[]>(initialSuffixes);
  const [newSuffix, setNewSuffix] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const columns: ColumnDefinition<ICompanyEmailSettings>[] = [
    {
      title: 'Email Suffix',
      dataIndex: 'email_suffix',
    },
    {
      title: 'Self Registration',
      dataIndex: 'self_registration_enabled',
      render: (value: boolean, record: ICompanyEmailSettings) => (
        <Switch
          id={`enable-registration-switch-${record.email_suffix}`}
          checked={value}
          onCheckedChange={async (checked) => {
            try {
              await updateCompanyEmailSetting(
                companyId,
                record.email_suffix,
                checked
              );
              setSuffixes(suffixes.map(suffix => 
                suffix.email_suffix === record.email_suffix
                  ? { ...suffix, self_registration_enabled: checked }
                  : suffix
              ));
            } catch (error) {
              setError('Failed to update registration setting');
            }
          }}
        />
      ),
    },
    {
      title: 'Actions',
      dataIndex: 'email_suffix',
      render: (value: string) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              id={`email-suffix-actions-menu-${value}`}
              variant="ghost"
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              id={`delete-suffix-menu-item-${value}`}
              className="text-red-600"
              onClick={async () => {
                try {
                  await deleteCompanyEmailSetting(
                    companyId,
                    value
                  );
                  setSuffixes(suffixes.filter(
                    suffix => suffix.email_suffix !== value
                  ));
                } catch (error) {
                  setError('Failed to delete email suffix');
                }
              }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  async function handleAddSuffix(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const suffix = await addCompanyEmailSetting(
        companyId,
        newSuffix.toLowerCase(),
        true
      );
      setSuffixes([...suffixes, suffix]);
      setNewSuffix('');
    } catch (error) {
      setError('Failed to add email suffix');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card id="contacts-email-settings-section" className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Email Registration Settings</h3>
          <p className="text-sm text-gray-500">
            Manage which email domains can self-register for client access.
          </p>
        </div>

        <form onSubmit={handleAddSuffix} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="email-suffix">Add Email Suffix</Label>
              <Input
                id="email-suffix"
                placeholder="example.com"
                value={newSuffix}
                onChange={(e) => setNewSuffix(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="flex items-end">
              <Button
                id="add-suffix-button"
                type="submit"
                disabled={isLoading || !newSuffix}
              >
                Add Suffix
              </Button>
            </div>
          </div>
        </form>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div id="email-suffixes-table">
          {suffixes.length > 0 ? (
            <DataTable
              columns={columns}
              data={suffixes}
            />
          ) : (
            <p className="text-center text-gray-500 py-4">
              No email suffixes configured
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
