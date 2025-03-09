"use client";

import React, { useState, useEffect } from "react";
import { Card } from "server/src/components/ui/Card";
import { Button } from "server/src/components/ui/Button";
import { ReflectionContainer } from "server/src/types/ui-reflection/ReflectionContainer";
import { Code2, Plus, Search, MoreVertical, BookTemplate, History, Check } from "lucide-react";
import { Input } from "server/src/components/ui/Input";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "server/src/components/ui/DropdownMenu";
import { Badge } from "server/src/components/ui/Badge";
import { getAllWorkflows, setActiveWorkflowVersion, getWorkflowVersions } from "server/src/lib/actions/workflow-editor-actions";
import { toast } from "react-hot-toast";

// Type for workflow data with events
interface WorkflowWithEvents {
  id: string;
  name: string;
  description?: string;
  version: string;
  tags: string[];
  isActive: boolean;
  code: string;
  events: string[];
  lastUpdated?: string;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowWithEvents[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activatingVersion, setActivatingVersion] = useState<{workflowId: string, versionId: string} | null>(null);
  
  // Load workflows on page load
  useEffect(() => {
    loadWorkflows();
  }, []);
  
  // Load workflows from server
  const loadWorkflows = async () => {
    setLoading(true);
    try {
      const workflowsData = await getAllWorkflows();
      
      // TODO: Replace with actual event data when available
      // For now, we'll use placeholder event data
      const workflowsWithEvents: WorkflowWithEvents[] = workflowsData.map(workflow => ({
        ...workflow,
        id: workflow.id || "",
        events: [],
        lastUpdated: new Date().toISOString()
      }));
      
      setWorkflows(workflowsWithEvents);
    } catch (error) {
      console.error("Error loading workflows:", error);
      toast.error("Failed to load workflows");
    } finally {
      setLoading(false);
    }
  };
  
  // Filter workflows based on search term
  const filteredWorkflows = workflows.filter(workflow => 
    workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workflow.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workflow.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <ReflectionContainer id="workflows-container" label="Workflows">
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Code2 className="h-6 w-6 text-primary-500 mr-2" />
              <h1 className="text-xl font-semibold">Workflows</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative w-64">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  id="search-workflows-input"
                  placeholder="Search workflows..." 
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  id="browse-templates-button"
                  variant="outline"
                  onClick={() => window.location.href = "/msp/automation-hub/template-library"}
                >
                  <BookTemplate className="h-4 w-4 mr-2" />
                  Browse Templates
                </Button>
                <Button
                  id="create-workflow-button"
                  onClick={() => window.location.href = "/msp/automation-hub/workflows/editor"}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Workflow
                </Button>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : workflows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Code2 className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No workflows found</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new workflow or using a template.</p>
              <div className="mt-6 flex space-x-4">
                <Button
                  id="browse-templates-empty-button"
                  onClick={() => window.location.href = "/msp/automation-hub/template-library"}
                  variant="outline"
                >
                  <BookTemplate className="h-4 w-4 mr-2" />
                  Browse Templates
                </Button>
                <Button
                  id="create-workflow-empty-button"
                  onClick={() => window.location.href = "/msp/automation-hub/workflows/editor"}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Workflow
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Version
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Events
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredWorkflows.map((workflow) => (
                    <tr key={workflow.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{workflow.name}</div>
                            <div className="text-sm text-gray-500">{workflow.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Badge className="bg-blue-100 text-blue-800">
                            v{workflow.version}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          className={`${
                            workflow.isActive
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {workflow.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {workflow.events.length > 0 ? (
                            workflow.events.map((event) => (
                              <Badge key={event} className="bg-blue-100 text-blue-800">
                                {event}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">No events</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {workflow.lastUpdated ? new Date(workflow.lastUpdated).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              id={`${workflow.id}-actions-menu`}
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              id={`edit-${workflow.id}-menu-item`}
                              onClick={() => window.location.href = `/msp/automation-hub/workflows/editor?id=${workflow.id}`}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              id={`versions-${workflow.id}-menu-item`}
                              onClick={() => {
                                window.location.href = `/msp/automation-hub/workflows/editor?id=${workflow.id}`;
                              }}
                            >
                              <History className="h-4 w-4 mr-2" />
                              Manage Versions
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              id={`duplicate-${workflow.id}-menu-item`}
                            >
                              Duplicate
                            </DropdownMenuItem>
                            {workflow.isActive ? (
                              <DropdownMenuItem 
                                id={`deactivate-${workflow.id}-menu-item`}
                                onClick={async () => {
                                  // TODO: Implement deactivate workflow functionality
                                  toast.success("Workflow deactivated");
                                  await loadWorkflows();
                                }}
                              >
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                id={`activate-${workflow.id}-menu-item`}
                                onClick={async () => {
                                  // TODO: Implement activate workflow functionality
                                  toast.success("Workflow activated");
                                  await loadWorkflows();
                                }}
                              >
                                Activate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              id={`delete-${workflow.id}-menu-item`}
                              className="text-red-600 focus:text-red-600"
                              onClick={async () => {
                                // TODO: Implement delete workflow functionality
                                if (confirm("Are you sure you want to delete this workflow? This action cannot be undone.")) {
                                  toast.success("Workflow deleted");
                                  await loadWorkflows();
                                }
                              }}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </ReflectionContainer>
  );
}