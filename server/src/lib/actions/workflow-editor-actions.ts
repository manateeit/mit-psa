'use server';
import { createTenantKnex } from "server/src/lib/db";
import { getCurrentUser } from "./user-actions/userActions";
import { z } from "zod";
import logger from "@shared/core/logger.js";

import { serializeWorkflowDefinition, deserializeWorkflowDefinition } from "@shared/workflow/core/workflowDefinition";
import {
  validateWorkflowCode,
  checkWorkflowSecurity,
  extractWorkflowMetadata,
  WorkflowMetadataSchema
} from "../utils/workflowValidation";

// Zod schema for workflow data

// Zod schema for workflow creation/update
const WorkflowSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Workflow name is required"),
  description: z.string().optional(),
  version: z.string().default("1.0.0"),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  code: z.string().min(1, "Workflow code is required"),
});

// Type for workflow data
export type WorkflowData = z.infer<typeof WorkflowSchema>;

// Type for workflow version data
export type WorkflowVersionData = {
  versionId: string;
  version: string;
  isCurrent: boolean;
  createdAt: string;
  createdBy: string;
};


/**
 * Create a new workflow
 * 
 * @param data Workflow data
 * @returns Created workflow ID
 */
export async function createWorkflow(data: WorkflowData): Promise<string> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    // Validate input
    const validatedData = WorkflowSchema.parse(data);
    
    // Extract metadata from code
    const metadata = extractWorkflowMetadata(validatedData.code);
    if (!metadata) {
      throw new Error("Could not extract workflow metadata from code");
    }
    
    // Create Knex instance
    const { knex } = await createTenantKnex();
    
    // Create workflow registration
    const [registration] = await knex('workflow_registrations')
      .insert({
        tenant_id: user.tenant,
        name: validatedData.name,
        description: validatedData.description || '',
        category: 'custom',
        tags: JSON.stringify(validatedData.tags),
        status: validatedData.isActive ? 'active' : 'inactive',
        created_by: user.user_id,
        updated_by: user.user_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .returning('registration_id');
    
    // Create workflow definition
    const workflowDefinition = {
      metadata: {
        name: metadata.name,
        description: metadata.description || validatedData.description || '',
        version: metadata.version || validatedData.version,
        author: metadata.author || `${user.first_name} ${user.last_name}`.trim(),
        tags: metadata.tags || validatedData.tags,
      },
      executeFn: validatedData.code,
    };
    
    // Create workflow version
    await knex('workflow_registration_versions')
      .insert({
        registration_id: registration.registration_id,
        tenant_id: user.tenant,
        version: validatedData.version,
        is_current: true,
        definition: JSON.stringify(workflowDefinition),
        created_by: user.user_id,
        created_at: new Date().toISOString(),
      });
    
    return registration.registration_id;
  } catch (error) {
    logger.error("Error creating workflow:", error);
    throw error;
  }
}

/**
 * Update an existing workflow
 * 
 * @param id Workflow ID
 * @param data Workflow data
 * @returns Updated workflow ID
 */
export async function updateWorkflow(id: string, data: WorkflowData): Promise<string> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    // Validate input
    const validatedData = WorkflowSchema.parse(data);
    
    // Extract metadata from code
    const metadata = extractWorkflowMetadata(validatedData.code);
    if (!metadata) {
      throw new Error("Could not extract workflow metadata from code");
    }
    
    // Create Knex instance
    const { knex } = await createTenantKnex();
    
    // Update workflow registration
    await knex('workflow_registrations')
      .where({
        registration_id: id,
        tenant_id: user.tenant,
      })
      .update({
        name: validatedData.name,
        description: validatedData.description || '',
        tags: JSON.stringify(validatedData.tags),
        status: validatedData.isActive ? 'active' : 'inactive',
        updated_by: user.user_id,
        updated_at: new Date().toISOString(),
      });
    
    // Create workflow definition
    const workflowDefinition = {
      metadata: {
        name: metadata.name,
        description: metadata.description || validatedData.description || '',
        version: metadata.version || validatedData.version,
        author: metadata.author || `${user.first_name} ${user.last_name}`.trim(),
        tags: metadata.tags || validatedData.tags,
      },
      executeFn: validatedData.code,
    };
    
    // Set all existing versions to not current
    await knex('workflow_registration_versions')
      .where({
        registration_id: id,
        tenant_id: user.tenant,
      })
      .update({
        is_current: false,
      });
    
    // Create new workflow version
    await knex('workflow_registration_versions')
      .insert({
        registration_id: id,
        tenant_id: user.tenant,
        version: validatedData.version,
        is_current: true,
        definition: JSON.stringify(workflowDefinition),
        created_by: user.user_id,
        created_at: new Date().toISOString(),
      });
    
    return id;
  } catch (error) {
    logger.error(`Error updating workflow ${id}:`, error);
    throw error;
  }
}

/**
 * Get all versions of a workflow
 *
 * @param id Workflow ID
 * @returns Array of workflow versions
 */
export async function getWorkflowVersions(id: string): Promise<WorkflowVersionData[]> {
  // Get current user
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const { knex } = await createTenantKnex();
  
  try {
    // Get workflow registration to verify it exists
    const registration = await knex('workflow_registrations')
      .where({
        registration_id: id,
        tenant_id: user.tenant
      })
      .first();
    
    if (!registration) {
      throw new Error(`Workflow with ID ${id} not found`);
    }
    
    // Get all versions for the workflow
    const versions = await knex('workflow_registration_versions')
      .where({
        registration_id: id,
        tenant_id: user.tenant
      })
      .select(
        'version_id',
        'version',
        'is_current',
        'created_at',
        'created_by'
      )
      .orderBy('created_at', 'desc');
    
    // Map to version data
    return versions.map(version => ({
      versionId: version.version_id,
      version: version.version,
      isCurrent: version.is_current,
      createdAt: version.created_at,
      createdBy: version.created_by
    }));
  } catch (error) {
    logger.error(`Error getting workflow versions for ${id}:`, error);
    throw error;
  } finally {
    // Release the knex connection
    if (knex) {
      await knex.destroy();
    }
  }
}

/**
 * Set a specific version as the active version
 *
 * @param workflowId Workflow ID
 * @param versionId Version ID to set as active
 * @returns Success status
 */
export async function setActiveWorkflowVersion(workflowId: string, versionId: string): Promise<{ success: boolean }> {
  // Get current user
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const { knex } = await createTenantKnex();
  
  try {
    return await knex.transaction(async (trx) => {
      // Get workflow registration to verify it exists
      const registration = await trx('workflow_registrations')
        .where({
          registration_id: workflowId,
          tenant_id: user.tenant
        })
        .first();
      
      if (!registration) {
        throw new Error(`Workflow with ID ${workflowId} not found`);
      }
      
      // Get the version to verify it exists
      const version = await trx('workflow_registration_versions')
        .where({
          version_id: versionId,
          registration_id: workflowId,
          tenant_id: user.tenant
        })
        .first();
      
      if (!version) {
        throw new Error(`Version with ID ${versionId} not found for workflow ${workflowId}`);
      }
      
      // Set all versions to not current
      await trx('workflow_registration_versions')
        .where({
          registration_id: workflowId,
          tenant_id: user.tenant
        })
        .update({
          is_current: false
        });
      
      // Set the specified version as current
      await trx('workflow_registration_versions')
        .where({
          version_id: versionId,
          registration_id: workflowId,
          tenant_id: user.tenant
        })
        .update({
          is_current: true
        });
      
      // Update the workflow registration with the version number
      await trx('workflow_registrations')
        .where({
          registration_id: workflowId,
          tenant_id: user.tenant
        })
        .update({
          version: version.version,
          updated_at: new Date().toISOString(),
          updated_by: user.user_id
        });
      
      return { success: true };
    });
  } catch (error) {
    logger.error(`Error setting active workflow version for ${workflowId}:`, error);
    throw error;
  } finally {
    // Release the knex connection
    if (knex) {
      await knex.destroy();
    }
  }
}

/**
 * Get a workflow by ID
 * 
 * @param id Workflow ID
 * @returns Workflow data
 */
export async function getWorkflow(id: string): Promise<WorkflowData> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    // Create Knex instance
    const { knex } = await createTenantKnex();
    
    // Get workflow registration
    const registration = await knex('workflow_registrations')
      .where({
        registration_id: id,
        tenant_id: user.tenant,
      })
      .first();
    
    if (!registration) {
      throw new Error(`Workflow with ID ${id} not found`);
    }
    
    // Get current version
    const version = await knex('workflow_registration_versions')
      .where({
        registration_id: id,
        tenant_id: user.tenant,
        is_current: true,
      })
      .first();
    
    if (!version) {
      throw new Error(`No current version found for workflow ${id}`);
    }
    
    // Parse definition
    const definition = JSON.parse(version.definition);
    
    // Return workflow data
    return {
      id: registration.registration_id,
      name: registration.name,
      description: registration.description,
      version: version.version,
      tags: JSON.parse(registration.tags),
      isActive: registration.status === 'active',
      code: definition.executeFn,
    };
  } catch (error) {
    logger.error(`Error getting workflow ${id}:`, error);
    throw error;
  }
}

/**
 * Get all workflows
 * 
 * @returns Array of workflow data
 */
export async function getAllWorkflows(): Promise<WorkflowData[]> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    // Create Knex instance
    const { knex } = await createTenantKnex();
    
    // Get all workflow registrations
    const registrations = await knex('workflow_registrations')
      .where({
        tenant_id: user.tenant,
      })
      .orderBy('created_at', 'desc');
    
    // Get current versions for all registrations
    const workflows: WorkflowData[] = [];
    
    for (const registration of registrations) {
      const version = await knex('workflow_registration_versions')
        .where({
          registration_id: registration.registration_id,
          tenant_id: user.tenant,
          is_current: true,
        })
        .first();
      
      if (version) {
        // Parse definition
        const definition = JSON.parse(version.definition);
        
        // Add to workflows array
        workflows.push({
          id: registration.registration_id,
          name: registration.name,
          description: registration.description,
          version: version.version,
          tags: JSON.parse(registration.tags),
          isActive: registration.status === 'active',
          code: definition.executeFn,
        });
      }
    }
    
    return workflows;
  } catch (error) {
    logger.error("Error getting all workflows:", error);
    throw error;
  }
}

/**
 * Delete a workflow
 * 
 * @param id Workflow ID
 * @returns Success status
 */
export async function deleteWorkflow(id: string): Promise<boolean> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    // Create Knex instance
    const { knex } = await createTenantKnex();
    
    // Delete workflow versions
    await knex('workflow_registration_versions')
      .where({
        registration_id: id,
        tenant_id: user.tenant,
      })
      .delete();
    
    // Delete workflow registration
    const deleted = await knex('workflow_registrations')
      .where({
        registration_id: id,
        tenant_id: user.tenant,
      })
      .delete();
    
    return deleted > 0;
  } catch (error) {
    logger.error(`Error deleting workflow ${id}:`, error);
    throw error;
  }
}

/**
 * Test a workflow
 * 
 * @param code Workflow code
 * @returns Test result
 */
export async function testWorkflow(code: string): Promise<{ success: boolean; output: string; warnings?: string[] }> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    // Validate workflow code
    const validation = validateWorkflowCode(code);
    
    // Check for security issues
    const securityWarnings = checkWorkflowSecurity(code);
    
    // Combine all warnings
    const allWarnings = [...validation.warnings, ...securityWarnings];
    
    if (!validation.valid) {
      return {
        success: false,
        output: `Workflow validation failed: ${validation.errors.join(", ")}`,
        warnings: allWarnings.length > 0 ? allWarnings : undefined
      };
    }
    
    // Create a temporary workflow definition for testing
    if (validation.metadata) {
      const workflowDefinition = {
        metadata: {
          name: validation.metadata.name,
          description: validation.metadata.description || '',
          version: validation.metadata.version || '1.0.0',
          author: validation.metadata.author || `${user.first_name} ${user.last_name}`.trim(),
          tags: validation.metadata.tags || [],
        },
        executeFn: code,
      };
      
      try {
        // This will throw if the code is invalid
        deserializeWorkflowDefinition(workflowDefinition);
        
        return {
          success: true,
          output: "Workflow code validated successfully. The workflow appears to be correctly structured.",
          warnings: allWarnings.length > 0 ? allWarnings : undefined
        };
      } catch (error) {
        return {
          success: false,
          output: `Workflow deserialization failed: ${error instanceof Error ? error.message : String(error)}`,
          warnings: allWarnings.length > 0 ? allWarnings : undefined
        };
      }
    }
    
    return {
      success: false,
      output: "Could not extract workflow metadata from code",
      warnings: allWarnings.length > 0 ? allWarnings : undefined
    };
  } catch (error) {
    logger.error("Error testing workflow:", error);
    throw error;
  }
}