"use client";

import { useState, useEffect, KeyboardEvent } from 'react';
import { IDocument } from '../../../interfaces/document.interface';
import Documents from '../../../components/documents/Documents';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import CustomSelect from '../../../components/ui/CustomSelect';
import { SelectOption } from '../../../components/ui/Select';
import { getAllDocuments } from '../../../lib/actions/document-actions/documentActions';
import { getCurrentUser } from '../../../lib/actions/user-actions/userActions';
import { toast } from 'react-hot-toast';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<IDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  const [filterInputs, setFilterInputs] = useState({
    type: 'all',
    entityType: '',
    searchTerm: ''
  });

  const documentTypes: SelectOption[] = [
    { value: 'all', label: 'All Document Types' },
    { value: 'application/pdf', label: 'PDF' },
    { value: 'image', label: 'Images' },
    { value: 'text', label: 'Documents' },
    { value: 'application', label: 'Other' }
  ];

  const entityTypes: SelectOption[] = [
    { value: 'ticket', label: 'Tickets' },
    { value: 'client', label: 'Clients' },
    { value: 'contact', label: 'Contacts' },
    { value: 'project', label: 'Projects' }
  ];

  const handleSearch = async () => {
    try {
      setIsLoading(true);
      // Only include type in filters if it's not 'all'
      const searchFilters = {
        ...filterInputs,
        type: filterInputs.type === 'all' ? '' : filterInputs.type
      };
      const docs = await getAllDocuments(searchFilters);
      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to fetch documents');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch current user on component mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setCurrentUserId(user.user_id);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
        toast.error('Failed to fetch user information');
      }
    };
    fetchUser();
  }, []);

  // Run initial search on component mount
  useEffect(() => {
    handleSearch();
  }, []); // Empty dependency array means this runs once on mount

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleDocumentUpdate = async () => {
    try {
      setIsLoading(true);
      const searchFilters = {
        ...filterInputs,
        type: filterInputs.type === 'all' ? '' : filterInputs.type
      };
      const updatedDocs = await getAllDocuments(searchFilters);
      setDocuments(updatedDocs);
    } catch (error) {
      console.error('Error refreshing documents:', error);
      toast.error('Failed to refresh documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilterInputs({
      type: 'all',
      entityType: '',
      searchTerm: ''
    });
    handleSearch();
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Documents</h1>
      </div>

      <div className="flex gap-6">
        {/* Left Column - Filters */}
        <div className="w-80">
          <Card className="p-4 sticky top-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Documents
                </label>
                <Input
                  placeholder="Search by document name..."
                  value={filterInputs.searchTerm}
                  onChange={(e) => setFilterInputs({ ...filterInputs, searchTerm: e.target.value })}
                  onKeyPress={handleKeyPress}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Type
                </label>
                <CustomSelect
                  options={documentTypes}
                  value={filterInputs.type}
                  onValueChange={(value: string) => {
                    setFilterInputs({ ...filterInputs, type: value });
                    handleSearch();
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entity Type
                </label>
                <CustomSelect
                  options={entityTypes}
                  value={filterInputs.entityType}
                  onValueChange={(value: string) => {
                    setFilterInputs({ ...filterInputs, entityType: value });
                    handleSearch();
                  }}
                  placeholder="All Entities"
                />
              </div>

              <div className="pt-4">
                <button
                  onClick={handleClearFilters}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Documents */}
        <div className="flex-1">
          <Card className="p-4">
            <Documents
              documents={documents}
              gridColumns={3}
              userId={currentUserId}
              filters={filterInputs}
              isLoading={isLoading}
              onDocumentCreated={handleDocumentUpdate}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
