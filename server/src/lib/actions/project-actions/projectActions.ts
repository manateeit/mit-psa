'use server';

import { Knex } from 'knex';
import ProjectModel from '@/lib/models/project';
import ProjectTaskModel from '@/lib/models/projectTask'
import { IProject, IProjectPhase, IProjectTask, IProjectTicketLink, IStatus, IProjectStatusMapping, IStandardStatus, ItemType, ITaskChecklistItem, IProjectTicketLinkWithDetails, ProjectStatus } from '@/interfaces/project.interfaces';
import { getCurrentUser, getAllUsers } from '@/lib/actions/user-actions/userActions';
import { IUser, IUserWithRoles } from '@/interfaces/auth.interfaces';
import { hasPermission } from '@/lib/auth/rbac';
import { validateData, validateArray } from '../../utils/validation';
import { createTenantKnex } from '@/lib/db';
import { 
    createProjectSchema, 
    updateProjectSchema, 
    projectPhaseSchema 
} from '../../schemas/project.schemas';

async function checkPermission(user: IUser, resource: string, action: string): Promise<void> {
    const hasPermissionResult = await hasPermission(user, resource, action);
    if (!hasPermissionResult) {
        throw new Error(`Permission denied: Cannot ${action} ${resource}`);
    }
}

export async function getProjects(): Promise<IProject[]> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error("user not found");
        }
        await checkPermission(currentUser, 'project', 'read');
        return await ProjectModel.getAll(true);
    } catch (error) {
        console.error('Error fetching projects:', error);
        throw error;
    }
}

export async function getProjectPhase(phaseId: string): Promise<IProjectPhase | null> {
    try {
        const phase = await ProjectModel.getPhaseById(phaseId);
        return phase;
    } catch (error) {
        console.error('Error fetching project phase:', error);
        throw new Error('Failed to fetch project phase');
    }
}

export async function getProjectTreeData(projectId?: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("user not found");
    }

    await checkPermission(currentUser, 'project', 'read');
    
    const projects = projectId ? 
      [await ProjectModel.getById(projectId)] : 
      await ProjectModel.getAll(true);
    
    const validProjects = projects.filter((p): p is IProject => p !== null);
    
    if (validProjects.length === 0) {
      throw new Error('No projects found');
    }
    
    const treeData = await Promise.all(validProjects.map(async (project): Promise<{
      label: string;
      value: string;
      type: 'project';
      children: {
        label: string;
        value: string;
        type: 'phase';
        children: {
          label: string;
          value: string;
          type: 'status';
        }[];
      }[];
    } | null> => {
      try {
        const [phases, statusMappings] = await Promise.all([
          ProjectModel.getPhases(project.project_id),
          ProjectModel.getProjectStatusMappings(project.project_id)
        ]);

        if (!statusMappings || statusMappings.length === 0) {
          const standardStatuses = await ProjectModel.getStandardStatusesByType('project_task');
          await Promise.all(standardStatuses.map((status): Promise<IProjectStatusMapping> => 
            ProjectModel.addProjectStatusMapping(project.project_id, {
              standard_status_id: status.standard_status_id,
              is_standard: true,
              custom_name: null,
              display_order: status.display_order,
              is_visible: true,
            })
          ));
        }

        const statuses = await getProjectTaskStatuses(project.project_id);

        return {
          label: project.project_name,
          value: project.project_id,
          type: 'project' as const,
          children: phases.map((phase): {
            label: string;
            value: string;
            type: 'phase';
            children: {
              label: string;
              value: string;
              type: 'status';
            }[];
          } => ({
            label: phase.phase_name,
            value: phase.phase_id,
            type: 'phase' as const,
            children: statuses.map((status): {
                label: string;
                value: string;
                type: 'status';
              } => ({
              label: status.custom_name || status.name,
              value: status.project_status_mapping_id,
              type: 'status' as const
            }))
          }))
        };
      } catch (error) {
        console.error(`Error processing project ${project.project_id}:`, error);
        return null;
      }
    }));

    const validTreeData = treeData
      .filter((data): data is NonNullable<typeof data> =>
        data !== null && 
        data.children && 
        data.children.length > 0
      );
    
    if (validTreeData.length === 0) {
      throw new Error('No projects available with valid phases');
    }
    
    return validTreeData;
  } catch (error) {
    console.error('Error fetching project tree data:', error);
    throw new Error('Failed to fetch project tree data');
  }
}

export async function updatePhase(phaseId: string, phaseData: Partial<IProjectPhase>): Promise<IProjectPhase> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error("user not found");
        }

        await checkPermission(currentUser, 'project', 'update');

        const validatedData = validateData(projectPhaseSchema.partial(), phaseData);
        
        const updatedPhase = await ProjectModel.updatePhase(phaseId, validatedData);
        return updatedPhase;
    } catch (error) {
        console.error('Error updating project phase:', error);
        throw error;
    }
}

export async function deletePhase(phaseId: string): Promise<void> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error("user not found");
        }

        await checkPermission(currentUser, 'project', 'delete');
        await ProjectModel.deletePhase(phaseId);
    } catch (error) {
        console.error('Error deleting project phase:', error);
        throw error;
    }
}

export async function addProjectPhase(phaseData: Omit<IProjectPhase, 'phase_id' | 'created_at' | 'updated_at' | 'tenant'>): Promise<IProjectPhase> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error("user not found");
        }

        await checkPermission(currentUser, 'project', 'update');

        const validatedData = validateData(projectPhaseSchema.omit({ 
            phase_id: true,
            created_at: true,
            updated_at: true,
            tenant: true
        }), phaseData);

        const phases = await ProjectModel.getPhases(phaseData.project_id);
        const nextOrderNumber = phases.length + 1;

        const existingWbsCodes = phases.map((phase): number => parseInt(phase.wbs_code));
        const maxWbsCode = existingWbsCodes.length > 0 ? Math.max(...existingWbsCodes) : 0;
        const newWbsCode = (maxWbsCode + 1).toString();

        const phaseWithDefaults = {
            ...validatedData,
            order_number: nextOrderNumber,
            wbs_code: newWbsCode,
        };

        return await ProjectModel.addPhase(phaseWithDefaults);
    } catch (error) {
        console.error('Error adding project phase:', error);
        throw error;
    }
}

export async function getProject(projectId: string): Promise<IProject | null> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error("user not found");
        }
        await checkPermission(currentUser, 'project', 'read');
        return await ProjectModel.getById(projectId);
    } catch (error) {
        console.error('Error fetching project:', error);
        throw error;
    }
}

async function getStandardProjectTaskStatuses(): Promise<IStandardStatus[]> {
    try {
        return await ProjectModel.getStandardStatusesByType('project_task');
    } catch (error) {
        console.error('Error fetching standard project task statuses:', error);
        throw new Error('Failed to fetch standard project task statuses');
    }
}

async function getProjectStatuses(): Promise<IStatus[]> {
  try {
    return await ProjectModel.getStatusesByType('project');
  } catch (error) {
    console.error('Error fetching project statuses:', error);
    throw new Error('Failed to fetch project statuses');
  }
}

export async function createProject(projectData: Omit<IProject, 'project_id' | 'created_at' | 'updated_at'>): Promise<IProject> {
    try {
        const [standardTaskStatuses, projectStatuses] = await Promise.all([
            getStandardProjectTaskStatuses(),
            getProjectStatuses()
        ]);

        if (projectStatuses.length === 0) {
            throw new Error('No project statuses found');
        }

        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error("user not found");
        }
        await checkPermission(currentUser, 'project', 'create');

        const validatedData = validateData(createProjectSchema, projectData);

        const projectDataWithStatus = {
            ...validatedData,
            status: projectStatuses[0].status_id
        };

        const newProject = await ProjectModel.create(projectDataWithStatus);

        for (const status of standardTaskStatuses) {
            await ProjectModel.addProjectStatusMapping(newProject.project_id, {
                standard_status_id: status.standard_status_id,
                is_standard: true,
                custom_name: null,
                display_order: status.display_order,
                is_visible: true,
            });
        }

        return newProject;
    } catch (error) {
        console.error('Error creating project:', error);
        throw error;
    }
}

export async function updateProject(projectId: string, projectData: Partial<IProject>): Promise<IProject> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error("user not found");
        }

        await checkPermission(currentUser, 'project', 'update');

        const validatedData = validateData(updateProjectSchema, projectData);
        
        const updatedProject = await ProjectModel.update(projectId, validatedData);
        return updatedProject;
    } catch (error) {
        console.error('Error updating project:', error);
        throw error;
    }
}

export async function deleteProject(projectId: string): Promise<void> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error("user not found");
        }

        await checkPermission(currentUser, 'project', 'delete');
        await ProjectModel.delete(projectId);
    } catch (error) {
        console.error('Error deleting project:', error);
        throw error;
    }
}

export async function getProjectDetails(projectId: string): Promise<{
    project: IProject;
    phases: IProjectPhase[];
    tasks: IProjectTask[];
    ticketLinks: IProjectTicketLinkWithDetails[];
    statuses: ProjectStatus[];
    users: IUserWithRoles[];
}> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error("user not found");
        }

        await checkPermission(currentUser, 'project', 'read');
        
        const [project, phases, rawTasks, statuses, users, checklistItemsMap, ticketLinksMap] = await Promise.all([
            ProjectModel.getById(projectId),
            ProjectModel.getPhases(projectId),
            ProjectTaskModel.getTasks(projectId),
            getProjectTaskStatuses(projectId),
            getAllUsers(),
            ProjectTaskModel.getAllTaskChecklistItems(projectId),
            ProjectTaskModel.getAllTaskTicketLinks(projectId)
        ]);

        if (!project) {
            throw new Error('Project not found');
        }

        const tasks = rawTasks.map((task): IProjectTask & { checklist_items: ITaskChecklistItem[] } => ({
            ...task,
            checklist_items: checklistItemsMap[task.task_id] || []
        }));

        const ticketLinks = Object.values(ticketLinksMap).flat();

        return { project, phases, tasks, ticketLinks, statuses, users };
    } catch (error) {
        console.error('Error fetching project details:', error);
        throw error;
    }
}

export async function updateProjectStructure(projectId: string, updates: { phases: Partial<IProjectPhase>[]; tasks: Partial<IProjectTask>[] }): Promise<void> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error("user not found");
        }

        await checkPermission(currentUser, 'project', 'update');
        await ProjectModel.updateStructure(projectId, updates);
    } catch (error) {
        console.error('Error updating project structure:', error);
        throw error;
    }
}

export async function getProjectTaskStatuses(projectId: string): Promise<ProjectStatus[]> {
    try {
        const statusMappings = await ProjectModel.getProjectStatusMappings(projectId);
        if (!statusMappings || statusMappings.length === 0) {
            console.warn(`No status mappings found for project ${projectId}`);
            return [];
        }

        const statuses = await Promise.all(statusMappings.map(async (mapping: IProjectStatusMapping): Promise<ProjectStatus | null> => {
            try {
                if (mapping.is_standard && mapping.standard_status_id) {
                    const standardStatus = await ProjectModel.getStandardStatus(mapping.standard_status_id);
                    if (!standardStatus) {
                        console.warn(`Standard status not found for mapping ${mapping.project_status_mapping_id}`);
                        return null;
                    }
                    return {
                        ...standardStatus,
                        project_status_mapping_id: mapping.project_status_mapping_id,
                        status_id: standardStatus.standard_status_id,
                        custom_name: mapping.custom_name,
                        display_order: mapping.display_order,
                        is_visible: mapping.is_visible,
                        is_standard: true,
                        is_closed: standardStatus.is_closed
                    } as ProjectStatus;
                } else if (mapping.status_id) {
                    const customStatus = await ProjectModel.getCustomStatus(mapping.status_id);
                    if (!customStatus) {
                        console.warn(`Custom status not found for mapping ${mapping.project_status_mapping_id}`);
                        return null;
                    }
                    return {
                        ...customStatus,
                        project_status_mapping_id: mapping.project_status_mapping_id,
                        status_id: customStatus.status_id,
                        custom_name: mapping.custom_name,
                        display_order: mapping.display_order,
                        is_visible: mapping.is_visible,
                        is_standard: false,
                        is_closed: customStatus.is_closed
                    } as ProjectStatus;
                }
                console.warn(`Invalid status mapping ${mapping.project_status_mapping_id}: missing both standard_status_id and status_id`);
                return null;
            } catch (error) {
                console.error(`Error processing status mapping ${mapping.project_status_mapping_id}:`, error);
                return null;
            }
        }));

        const validStatuses = statuses.filter((status): status is ProjectStatus => status !== null);
        
        if (validStatuses.length === 0) {
            console.warn(`No valid statuses found for project ${projectId}`);
            return [];
        }

        return validStatuses;
    } catch (error) {
        console.error('Error fetching project statuses:', error);
        return [];
    }
}

export async function addStatusToProject(
    projectId: string,
    statusData: Omit<IStatus, 'status_id' | 'created_at' | 'updated_at'>
): Promise<IStatus> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error("user not found");
        }

        await checkPermission(currentUser, 'project', 'update');
        return await ProjectModel.addStatusToProject(projectId, statusData);
    } catch (error) {
        console.error('Error adding status to task:', error);
        throw error;
    }
}

export async function updateProjectStatus(
    statusId: string,
    statusData: Partial<IStatus>,
    mappingData: Partial<IProjectStatusMapping>
): Promise<IStatus> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error("user not found");
        }

        await checkPermission(currentUser, 'project', 'update');
        return await ProjectModel.updateProjectStatus(statusId, statusData, mappingData);
    } catch (error) {
        console.error('Error updating project status:', error);
        throw new Error('Failed to update project status');
    }
}

export async function deleteProjectStatus(statusId: string): Promise<void> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error("user not found");
        }

        await checkPermission(currentUser, 'project', 'delete');
        await ProjectModel.deleteProjectStatus(statusId);
    } catch (error) {
        console.error('Error deleting project status:', error);
        throw new Error('Failed to delete project status');
    }
}
