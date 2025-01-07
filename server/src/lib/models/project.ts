// server/src/lib/models/project.ts
import { v4 as uuidv4 } from 'uuid';
import ProjectTaskModel from './projectTask';
import { getCurrentUser } from '@/lib/actions/user-actions/userActions';
import { IProject, IProjectPhase, IProjectTask, IProjectTicketLink, IStatus, IProjectStatusMapping, IStandardStatus, ITaskChecklistItem, ItemType, IProjectTaskCardInfo, IProjectTicketLinkWithDetails } from '@/interfaces/project.interfaces';
import { Knex } from 'knex';
import { createTenantKnex } from '@/lib/db';

const ProjectModel = {
  updatePhase: async (phaseId: string, phaseData: Partial<IProjectPhase>): Promise<IProjectPhase> => {
    try {
      const {knex: db} = await createTenantKnex();
      const [updatedPhase] = await db<IProjectPhase>('project_phases')
        .where('phase_id', phaseId)
        .update({
          ...phaseData,
          updated_at: db.fn.now()
        })
        .returning('*');
      return updatedPhase;
    } catch (error) {
      console.error('Error updating project phase:', error);
      throw error;
    }
  },

  getAll: async (includeInactive: boolean = false): Promise<IProject[]> => {
    try {
      const {knex: db} = await createTenantKnex();
      let query = db<IProject>('projects')
        .select(
          'projects.*', 
          'companies.company_name as client_name',
          'users.first_name as assigned_to_first_name',
          'users.last_name as assigned_to_last_name',
          'contacts.full_name as contact_name'
        )
        .leftJoin('companies', 'projects.company_id', 'companies.company_id')
        .leftJoin('users', function() {
          this.on('projects.assigned_to', 'users.user_id')
             .andOn('projects.tenant', 'users.tenant')
        })
        .leftJoin('contacts', function() {
          this.on('projects.contact_name_id', 'contacts.contact_name_id')
             .andOn('projects.tenant', 'contacts.tenant')
        });
      
      if (!includeInactive) {
        query = query.where('projects.is_inactive', false);
      }
      
      const projects = await query;
      return projects;
    } catch (error) {
      console.error('Error getting all projects:', error);
      throw error;
    }
  },

  getById: async (projectId: string): Promise<IProject | null> => {
    try {
      const {knex: db} = await createTenantKnex();
      const project = await db<IProject>('projects')
        .select(
          'projects.*', 
          'companies.company_name as client_name',
          'users.first_name as assigned_to_first_name',
          'users.last_name as assigned_to_last_name',
          'contacts.full_name as contact_name'
        )
        .leftJoin('companies', 'projects.company_id', 'companies.company_id')
        .leftJoin('users', function() {
          this.on('projects.assigned_to', 'users.user_id')
             .andOn('projects.tenant', 'users.tenant')
        })
        .leftJoin('contacts', function() {
          this.on('projects.contact_name_id', 'contacts.contact_name_id')
             .andOn('projects.tenant', 'contacts.tenant')
        })
        .where('projects.project_id', projectId)
        .first();

      return project || null;
    } catch (error) {
      console.error('Error getting project by ID:', error);
      throw error;
    }
  },

  getStatusesByType: async (statusType: ItemType): Promise<IStatus[]> => {
    try {
      const {knex: db} = await createTenantKnex();
      const statuses = await db<IStatus>('statuses')
        .where('status_type', statusType)
        .orderBy('order_number');
      return statuses;
    } catch (error) {
      console.error('Error getting statuses by type:', error);
      throw error;
    }
  },

  create: async (projectData: Omit<IProject, 'project_id' | 'created_at' | 'updated_at' | 'tenant'>): Promise<IProject> => {
    try {
      const {knex: db, tenant} = await createTenantKnex();
      const [newProject] = await db<IProject>('projects')
        .insert({
          ...projectData,
          project_id: uuidv4(),
          is_inactive: false,
          tenant: tenant!,
          assigned_to: projectData.assigned_to || null,
          contact_name_id: projectData.contact_name_id || null
        })
        .returning('*');

      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  update: async (projectId: string, projectData: Partial<IProject>): Promise<IProject> => {
    try {
      const {knex: db} = await createTenantKnex();
      const [updatedProject] = await db<IProject>('projects')
        .where('project_id', projectId)
        .update({
          ...projectData,
          updated_at: db.fn.now()
        })
        .returning('*');
      return updatedProject;
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  delete: async (projectId: string): Promise<void> => {
    try {
      const {knex: db} = await createTenantKnex();
      await db.transaction(async (trx: Knex.Transaction) => {
        // First, get all phases for this project
        const phases = await trx('project_phases')
          .where('project_id', projectId)
          .select('phase_id');
        
        const phaseIds = phases.map((phase):string => phase.phase_id);

        // Delete checklist items for all tasks in all phases
        if (phaseIds.length > 0) {
          await trx('task_checklist_items')
            .whereIn('task_id', 
              trx('project_tasks')
                .select('task_id')
                .whereIn('phase_id', phaseIds)
            )
            .del();
        }

        // Delete all tasks in all phases
        if (phaseIds.length > 0) {
          await trx('project_tasks')
            .whereIn('phase_id', phaseIds)
            .del();
        }

        // Delete project ticket links
        await trx('project_ticket_links')
          .where('project_id', projectId)
          .del();

        // Delete all phases
        await trx('project_phases')
          .where('project_id', projectId)
          .del();

        // Delete project status mappings
        await trx('project_status_mappings')
          .where('project_id', projectId)
          .del();
        
        // Finally, delete the project
        await trx('projects')
          .where('project_id', projectId)
          .del();
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },

  getStandardStatusesByType: async (itemType: ItemType): Promise<IStandardStatus[]> => {
    try {
      const {knex: db} = await createTenantKnex();
      const standardStatuses = await db<IStandardStatus>('standard_statuses')
        .where('item_type', itemType)
        .orderBy('display_order');
      return standardStatuses;
    } catch (error) {
      console.error('Error getting standard statuses by type:', error);
      throw error;
    }
  },

  addProjectStatusMapping: async (projectId: string, mappingData: Omit<IProjectStatusMapping, 'project_id' | 'project_status_mapping_id' | 'tenant'>): Promise<IProjectStatusMapping> => {
    try {
      const {knex: db, tenant} = await createTenantKnex();
      const [newMapping] = await db<IProjectStatusMapping>('project_status_mappings')
        .insert({
          ...mappingData,
          project_id: projectId,
          project_status_mapping_id: uuidv4(),
          tenant: tenant!
        })
        .returning('*');
      return newMapping;
    } catch (error) {
      console.error('Error adding project status mapping:', error);
      throw error;
    }
  },

  getProjectStatusMappings: async (projectId: string): Promise<IProjectStatusMapping[]> => {
    try {
      const {knex: db} = await createTenantKnex();
      const mappings = await db<IProjectStatusMapping>('project_status_mappings')
        .where('project_id', projectId)
        .orderBy('display_order');
      return mappings;
    } catch (error) {
      console.error('Error getting project status mappings:', error);
      throw error;
    }
  },

  getStandardStatus: async (standardStatusId: string): Promise<IStandardStatus | null> => {
    try {
      const {knex: db} = await createTenantKnex();
      const standardStatus = await db<IStandardStatus>('standard_statuses')
        .where('standard_status_id', standardStatusId)
        .first();
      return standardStatus || null;
    } catch (error) {
      console.error('Error getting standard status:', error);
      throw error;
    }
  },

  getCustomStatus: async (statusId: string): Promise<IStatus | null> => {
    try {
      const {knex: db} = await createTenantKnex();
      const customStatus = await db<IStatus>('statuses')
        .where('status_id', statusId)
        .first();
      return customStatus || null;
    } catch (error) {
      console.error('Error getting custom status:', error);
      throw error;
    }
  },

  getProjectTaskStatuses: async (projectId: string): Promise<(IStatus | IStandardStatus)[]> => {
    try {
      const mappings = await ProjectModel.getProjectStatusMappings(projectId);
      const statuses = await Promise.all(mappings.map(async (mapping): Promise<IStatus | IStandardStatus | null> => {
        if (mapping.is_standard && mapping.standard_status_id) {
          const standardStatus = await ProjectModel.getStandardStatus(mapping.standard_status_id);
          return standardStatus ? {
            ...standardStatus,
            project_status_mapping_id: mapping.project_status_mapping_id,
            custom_name: mapping.custom_name,
            display_order: mapping.display_order,
            is_visible: mapping.is_visible,
            is_standard: true
          } as IStandardStatus : null;
        } else if (mapping.status_id) {
          const customStatus = await ProjectModel.getCustomStatus(mapping.status_id);
          return customStatus ? {
            ...customStatus,
            project_status_mapping_id: mapping.project_status_mapping_id,
            custom_name: mapping.custom_name,
            display_order: mapping.display_order,
            is_visible: mapping.is_visible,
            is_standard: false
          } as IStatus : null;
        } else {
          console.error('Invalid project status mapping: missing both standard_status_id and status_id');
          return null;
        }
      }));
      return statuses.filter((status): status is IStatus | IStandardStatus => status !== null);
    } catch (error) {
      console.error('Error getting project statuses:', error);
      throw error;
    }
  },

  addStatusToProject: async (projectId: string, statusData: Omit<IStatus, 'status_id' | 'created_at' | 'updated_at' | 'tenant'>): Promise<IStatus> => {
    try {
      const {knex: db, tenant} = await createTenantKnex();
      return await db.transaction(async (trx: Knex.Transaction) => {
        const [newStatus] = await trx<IStatus>('statuses')
          .insert({
            ...statusData,
            status_id: uuidv4(),
            tenant: tenant!
          })
          .returning('*');

        await trx<IProjectStatusMapping>('project_status_mappings')
          .insert({
            project_id: projectId,
            status_id: newStatus.status_id,
            is_standard: false,
            custom_name: null,
            display_order: 0,
            is_visible: true,
            project_status_mapping_id: uuidv4(),
            tenant: tenant!
          });

        return newStatus;
      });
    } catch (error) {
      console.error('Error adding status to project:', error);
      throw error;
    }
  },

  updateProjectStatus: async (statusId: string, statusData: Partial<IStatus>, mappingData: Partial<IProjectStatusMapping>): Promise<IStatus> => {
    try {
      const {knex: db} = await createTenantKnex();
      return await db.transaction(async (trx: Knex.Transaction) => {
        const [updatedStatus] = await trx<IStatus>('statuses')
          .where('status_id', statusId)
          .update({
            ...statusData
          })
          .returning('*');

        if (mappingData) {
          await trx<IProjectStatusMapping>('project_status_mappings')
            .where('status_id', statusId)
            .update(mappingData);
        }

        return updatedStatus;
      });
    } catch (error) {
      console.error('Error updating project status:', error);
      throw error;
    }
  },

  deleteProjectStatus: async (statusId: string): Promise<void> => {
    try {
      const {knex: db} = await createTenantKnex();
      await db.transaction(async (trx: Knex.Transaction) => {
        // First, check if the status is being used by any tasks
        const tasksUsingStatus = await trx<IProjectTask>('project_tasks')
          .where('project_status_mapping_id', statusId)
          .first();

        if (tasksUsingStatus) {
          throw new Error('Cannot delete status: it is being used by one or more tasks');
        }

        await trx<IProjectStatusMapping>('project_status_mappings')
          .where('status_id', statusId)
          .del();

        await trx<IStatus>('statuses')
          .where('status_id', statusId)
          .del();
      });
    } catch (error) {
      console.error('Error deleting project status:', error);
      throw error;
    }
  },

  getPhases: async (projectId: string): Promise<IProjectPhase[]> => {
    try {
      const {knex: db} = await createTenantKnex();
      const phases = await db<IProjectPhase>('project_phases')
        .where('project_id', projectId)
        .orderBy('wbs_code');
      return phases.sort((a, b) => {
        const aParts = a.wbs_code.split('.').map(Number);
        const bParts = b.wbs_code.split('.').map(Number);
        for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
          if (aParts[i] === undefined) return -1;
          if (bParts[i] === undefined) return 1;
          if (aParts[i] !== bParts[i]) return aParts[i] - bParts[i];
        }
        return 0;
      });
    } catch (error) {
      console.error('Error getting project phases:', error);
      throw error;
    }
  },

  getPhaseById: async (phaseId: string): Promise<IProjectPhase | null> => {
    try {
      const {knex: db} = await createTenantKnex();
      const phase = await db<IProjectPhase>('project_phases')
        .where('phase_id', phaseId)
        .first();
      return phase || null;
    } catch (error) {
      console.error('Error getting project phase by ID:', error);
      throw error;
    }
  },  


  updateStructure: async (projectId: string, updates: { phases: Partial<IProjectPhase>[]; tasks: Partial<IProjectTask>[] }): Promise<void> => {
    try {
      const {knex: db} = await createTenantKnex();
      await db.transaction(async (trx) => {
        for (const phase of updates.phases) {
          if (!phase.phase_id) {
            throw new Error('Phase ID is required for update');
          }
          // Remove wbs_code from updates to prevent override
          const { wbs_code, ...phaseUpdate } = phase;
          await trx('project_phases')
            .where({ project_id: projectId, phase_id: phase.phase_id })
            .update({
              ...phaseUpdate,
              updated_at: trx.fn.now()
            });
        }
        for (const task of updates.tasks) {
          if (!task.task_id) {
            throw new Error('Task ID is required for update');
          }
          // Remove wbs_code from updates to prevent override
          const { wbs_code, ...taskUpdate } = task;
          await trx('project_tasks')
            .where({ task_id: task.task_id })
            .update({
              ...taskUpdate,
              updated_at: trx.fn.now()
            });
        }
      });
    } catch (error) {
      console.error('Error updating project structure:', error);
      throw error;
    }
  },


  generateNextWbsCode: async (parentWbsCode: string): Promise<string> => {
    try {
      const {knex: db} = await createTenantKnex();
      const tasks = await db<IProjectTask>('project_tasks')
        .where('wbs_code', 'like', `${parentWbsCode}.%`);

      if (!tasks || tasks.length === 0) {
        return `${parentWbsCode}.1`;
      }

      // Get all the numeric parts after the parent WBS code
      const childNumbers = tasks.map((task): number => {
        const lastPart = task.wbs_code.split('.').pop();
        return parseInt(lastPart || '0');
      });

      // Find the highest number
      const maxNumber = Math.max(...childNumbers);
      return `${parentWbsCode}.${maxNumber + 1}`;
    } catch (error) {
      console.error('Error generating next WBS code:', error);
      throw error;
    }
  },


  addPhase: async (phaseData: Omit<IProjectPhase, 'phase_id' | 'created_at' | 'updated_at' | 'tenant'>): Promise<IProjectPhase> => {
    try {
      const {knex: db, tenant} = await createTenantKnex();
      const [newPhase] = await db<IProjectPhase>('project_phases')
        .insert({
          ...phaseData,
          phase_id: uuidv4(),
          tenant: tenant!,
          created_at: db.fn.now(),
          updated_at: db.fn.now()
        })
        .returning('*');

      return newPhase;
    } catch (error) {
      console.error('Error adding project phase:', error);
      throw error;
    }
  },

  deletePhase: async (phaseId: string): Promise<void> => {
    try {
      const {knex: db} = await createTenantKnex();
      await db.transaction(async (trx: Knex.Transaction) => {
        // First, delete all checklist items for tasks in this phase
        await trx('task_checklist_items')
          .whereIn('task_id', 
            trx('project_tasks')
              .select('task_id')
              .where('phase_id', phaseId)
          )
          .del();

        // Delete all tasks in the phase
        await trx('project_tasks')
          .where('phase_id', phaseId)
          .del();

        // Finally, delete the phase itself
        await trx('project_phases')
          .where('phase_id', phaseId)
          .del();
      });
    } catch (error) {
      console.error('Error deleting phase:', error);
      throw error;
    }
  },
  
  getProjectStatusMapping: async (mappingId: string): Promise<IProjectStatusMapping | null> => {
    try {
      const {knex: db} = await createTenantKnex();
      const mapping = await db<IProjectStatusMapping>('project_status_mappings')
        .where('project_status_mapping_id', mappingId)
        .first();
      return mapping || null;
    } catch (error) {
      console.error('Error getting project status mapping:', error);
      throw error;
    }
  }
};

export default ProjectModel;
