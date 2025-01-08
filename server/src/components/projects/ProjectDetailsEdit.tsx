'use client';

import React, { useState, useEffect } from 'react';
import { IProject } from '@/interfaces/project.interfaces';
import { ICompany } from '@/interfaces/company.interfaces';
import { IUser } from '@/interfaces/auth.interfaces';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { CompanyPicker } from '@/components/companies/CompanyPicker';
import CustomSelect from '@/components/ui/CustomSelect';
import { updateProject } from '@/lib/actions/project-actions/projectActions';
import { getContactsByCompany, getAllContacts } from '@/lib/actions/contact-actions/contactActions';
import { getAllUsers } from '@/lib/actions/user-actions/userActions';
import { toast } from 'react-hot-toast';

interface ProjectDetailsEditProps {
  initialProject: IProject;
  companies: ICompany[];
  onSave: (updatedProject: IProject) => void;
  onCancel: () => void;
}

const ProjectDetailsEdit: React.FC<ProjectDetailsEditProps> = ({
  initialProject,
  companies,
  onSave,
  onCancel,
}) => {
  const [project, setProject] = useState<IProject>(initialProject);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientTypeFilter, setClientTypeFilter] = useState<'all' | 'company' | 'individual'>('all');
  const [filterState, setFilterState] = useState<'all' | 'active' | 'inactive'>('active');
  const [contacts, setContacts] = useState<{ value: string; label: string }[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const allUsers = await getAllUsers();
        setUsers(allUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const contactsData = project.company_id 
          ? await getContactsByCompany(project.company_id)
          : await getAllContacts();
        setContacts(contactsData.map(contact => ({
          value: contact.contact_name_id,
          label: contact.full_name
        })));
      } catch (error) {
        console.error('Error fetching contacts:', error);
        setContacts([]);
      }
    };
    fetchContacts();
  }, [project.company_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updatedProject = await updateProject(project.project_id, {
        project_name: project.project_name,
        description: project.description,
        company_id: project.company_id,
        start_date: project.start_date,
        end_date: project.end_date,
        assigned_to: project.assigned_to,
        contact_name_id: project.contact_name_id,
        is_inactive: project.is_inactive,
      });

      toast.success('Project updated successfully');
      onSave(updatedProject);
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProject(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCompanySelect = (companyId: string) => {
    setProject(prev => ({
      ...prev,
      company_id: companyId,
      // Reset contact when company changes
      contact_name_id: null,
      contact_name: null,
    }));
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Edit Project</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="project_name" className="block text-sm font-medium text-gray-700">
              Project Name
            </label>
            <input
              type="text"
              id="project_name"
              name="project_name"
              value={project.project_name}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={project.description || ''}
              onChange={handleInputChange}
              rows={4}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client
            </label>
            <CompanyPicker
              companies={companies}
              selectedCompanyId={project.company_id}
              onSelect={handleCompanySelect}
              filterState={filterState}
              onFilterStateChange={setFilterState}
              clientTypeFilter={clientTypeFilter}
              onClientTypeFilterChange={setClientTypeFilter}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
            <CustomSelect
              value={project.contact_name_id || ''}
              onValueChange={(value) => setProject(prev => ({ ...prev, contact_name_id: value }))}
              options={contacts}
              placeholder="Select Contact"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
            <CustomSelect
              value={project.assigned_to || ''}
              onValueChange={(value) => setProject(prev => ({ ...prev, assigned_to: value }))}
              options={users.map(user => ({
                value: user.user_id,
                label: `${user.first_name} ${user.last_name}`
              }))}
              placeholder="Select Assignee"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={project.end_date ? new Date(project.end_date).toISOString().split('T')[0] : ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label htmlFor="is_inactive" className="text-sm font-medium text-gray-700">
              Inactive
            </label>
            <Switch
              id="is_inactive"
              checked={project.is_inactive}
              onCheckedChange={(checked) => setProject(prev => ({ ...prev, is_inactive: checked }))}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProjectDetailsEdit;
