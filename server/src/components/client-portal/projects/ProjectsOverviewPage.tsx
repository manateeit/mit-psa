'use client';

import { useState, useEffect } from 'react';
import { getClientProjects } from '@/lib/actions/client-portal-actions/client-projects';
import { ProjectCard } from './ProjectCard';
import { DataTable } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search, XCircle, ExternalLink } from 'lucide-react';
import { IProject } from '@/interfaces/project.interfaces';
import { ColumnDefinition } from '@/interfaces/dataTable.interfaces';
import { formatDateOnly } from '@/lib/utils/dateTimeUtils';
import { Card } from '@/components/ui/Card';

export function ProjectsOverviewPage() {
  const [projects, setProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<IProject | null>(null);
  const pageSize = 10;
  
  // Define columns for the DataTable
  const columns: ColumnDefinition<IProject>[] = [
    {
      title: 'Project Name',
      dataIndex: 'project_name',
      width: '30%',
      render: (value, record) => (
        <div className="font-medium">{value}</div>
      )
    },
    {
      title: 'Reference',
      dataIndex: 'wbs_code',
      width: '15%'
    },
    {
      title: 'Status',
      dataIndex: 'status_name',
      width: '15%',
      render: (value) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {value || 'Unknown'}
        </span>
      )
    },
    {
      title: 'Start Date',
      dataIndex: 'start_date',
      width: '15%',
      render: (value) => value ? formatDateOnly(new Date(value)) : 'N/A'
    },
    {
      title: 'End Date',
      dataIndex: 'end_date',
      width: '15%',
      render: (value) => value ? formatDateOnly(new Date(value)) : 'N/A'
    },
    {
      title: 'Details',
      dataIndex: 'project_id',
      width: '10%',
      render: (_, record) => (
        <Button 
          id={`view-project-${record.project_id}`}
          variant="ghost" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedProject(record);
          }}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      )
    }
  ];
  
  // Fetch projects on initial load and when filters change
  useEffect(() => {
    async function loadProjects() {
      setLoading(true);
      try {
        const result = await getClientProjects({
          page,
          pageSize,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: searchQuery || undefined
        });
        
        setProjects(result.projects);
        setTotalItems(result.total);
      } catch (error) {
        console.error('Error loading projects:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadProjects();
  }, [page, statusFilter, searchQuery]);
  
  const handleResetFilters = () => {
    setStatusFilter('all');
    setSearchQuery('');
  };
  
  const handleRowClick = (project: IProject) => {
    setSelectedProject(project);
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-gray-600">
            Overview of your current and past projects
          </p>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative w-64">
          <Input
            id="project-search-input"
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        </div>
        
        <select
          id="project-status-filter"
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="open">All Open Projects</option>
          <option value="closed">All Closed Projects</option>
          <option value="planning">Planning</option>
          <option value="in progress">In Progress</option>
          <option value="on hold">On Hold</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        
        <Button
          id="reset-filters-button"
          variant="outline"
          onClick={handleResetFilters}
          className="whitespace-nowrap flex items-center gap-2 ml-auto"
        >
          <XCircle className="h-4 w-4" />
          Reset Filters
        </Button>
      </div>
      
      {/* Projects Table */}
      <DataTable
        id="projects-table"
        data={projects}
        columns={columns}
        pagination={true}
        currentPage={page}
        onPageChange={setPage}
        pageSize={pageSize}
        totalItems={totalItems}
        onRowClick={handleRowClick}
      />
      
      {/* Selected Project Card */}
      {selectedProject && (
        <Card className="p-6 mt-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-semibold">{selectedProject.project_name}</h2>
              <p className="text-sm text-gray-500">#{selectedProject.wbs_code}</p>
            </div>
            <Button
              id="close-project-details"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedProject(null)}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-700">{selectedProject.description || 'No description available'}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Start Date</p>
              <p>{selectedProject.start_date ? formatDateOnly(new Date(selectedProject.start_date)) : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">End Date</p>
              <p>{selectedProject.end_date ? formatDateOnly(new Date(selectedProject.end_date)) : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <p>{selectedProject.status_name}</p>
            </div>
          </div>
          
          <ProjectCard project={selectedProject} />
        </Card>
      )}
    </div>
  );
}
