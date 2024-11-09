import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import knex from 'knex';
import dotenv from 'dotenv';
import { IUserWithRoles, IRole, IRoleWithPermissions, IPermission } from '../../interfaces/auth.interfaces';
import { IProject, IProjectPhase, IProjectTask, IStatus } from '../../interfaces/project.interfaces';
import * as projectActions from '../../lib/actions/projectActions';
import * as userActions from '../../lib/actions/user-actions/userActions';
import * as rbac from '../../lib/auth/rbac';

dotenv.config();

let db: knex.Knex;
let initiatingSpellStatus: IStatus;

// Create a more complete mock Headers implementation
const mockHeaders = {
  get: vi.fn((key: string) => {
    if (key === 'x-tenant-id') {
      return '11111111-1111-1111-1111-111111111111';
    }
    return null;
  }),
  append: vi.fn(),
  delete: vi.fn(),
  entries: vi.fn(),
  forEach: vi.fn(),
  has: vi.fn(),
  keys: vi.fn(),
  set: vi.fn(),
  values: vi.fn(),
};

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn(() => mockHeaders)
}));

// Mock next-auth with tenant information
vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn(() => Promise.resolve({
    user: {
      id: 'mock-user-id',
      tenant: '11111111-1111-1111-1111-111111111111'
    },
  })),
}));

vi.mock("@/app/api/auth/[...nextauth]/options", () => ({
  options: {},
}));


beforeAll(async () => {
  db = knex({
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER_SERVER,
      password: process.env.DB_PASSWORD_SERVER,
      database: process.env.DB_NAME_SERVER
    },
    migrations: {
      directory: "./migrations"
    },
    seeds: {
      directory: "./seeds/dev"
    }
  });

  // Drop all tables
  await db.raw('DROP SCHEMA public CASCADE');
  await db.raw('CREATE SCHEMA public');

  // Ensure the database is set up correctly
  await db.raw(`SET app.environment = '${process.env.APP_ENV}'`);

  await db.migrate.latest();
  await db.seed.run();
});

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

afterAll(async () => {
  await db.destroy();
});

describe('Project Permissions Infrastructure', () => {
  let tenantId: string;
  let companyId: string;
  let readProjectPermission: IPermission;
  let updateProjectPermission: IPermission;
  let createProjectPermission: IPermission;
  let deleteProjectPermission: IPermission;
  let userRole: IRoleWithPermissions;
  let adminRole: IRoleWithPermissions;
  let regularUser: IUserWithRoles;
  let adminUser: IUserWithRoles;
  let testProject: IProject | undefined;
  let regularUserId: string;
  let adminUserId: string;
  let createdPermissionIds: string[] = [];
  let createdRoleIds: string[] = [];
  let createdUserIds: string[] = [];

  beforeEach(async () => {
    try {
      // Reset tracking arrays
      createdPermissionIds = [];
      createdRoleIds = [];
      createdUserIds = [];

      // Create test data for each test
      ({ tenant: tenantId } = await db('tenants').select("tenant").first());

      companyId = uuidv4();
      await db('companies').insert({
        company_id: companyId,
        company_name: 'Test Company',
        tenant: tenantId,
      });

      // Create permissions
      readProjectPermission = { permission_id: uuidv4(), resource: 'project', action: 'read', tenant: tenantId };
      updateProjectPermission = { permission_id: uuidv4(), resource: 'project', action: 'update', tenant: tenantId };
      createProjectPermission = { permission_id: uuidv4(), resource: 'project', action: 'create', tenant: tenantId };
      deleteProjectPermission = { permission_id: uuidv4(), resource: 'project', action: 'delete', tenant: tenantId };

      // Track created permission IDs
      createdPermissionIds = [
        readProjectPermission.permission_id,
        updateProjectPermission.permission_id,
        createProjectPermission.permission_id,
        deleteProjectPermission.permission_id
      ];

      // Insert permissions into the database
      await db('permissions').insert([
        readProjectPermission,
        updateProjectPermission,
        createProjectPermission,
        deleteProjectPermission
      ]);

      // Create roles
      userRole = {
        role_id: uuidv4(),
        role_name: 'User',
        description: 'Regular user role',
        permissions: [readProjectPermission]
      };

      adminRole = {
        role_id: uuidv4(),
        role_name: 'Admin',
        description: 'Administrator role',
        permissions: [readProjectPermission, updateProjectPermission, createProjectPermission, deleteProjectPermission]
      };

      // Track created role IDs
      createdRoleIds = [userRole.role_id, adminRole.role_id];

      // Insert roles into the database
      await db('roles').insert([
        { role_id: userRole.role_id, role_name: userRole.role_name, description: userRole.description, tenant: tenantId },
        { role_id: adminRole.role_id, role_name: adminRole.role_name, description: adminRole.description, tenant: tenantId }
      ]);

      // Create role-permission associations
      await db('role_permissions').insert([
        { role_id: userRole.role_id, permission_id: readProjectPermission.permission_id, tenant: tenantId },
        { role_id: adminRole.role_id, permission_id: readProjectPermission.permission_id, tenant: tenantId },
        { role_id: adminRole.role_id, permission_id: updateProjectPermission.permission_id, tenant: tenantId },
        { role_id: adminRole.role_id, permission_id: createProjectPermission.permission_id, tenant: tenantId },
        { role_id: adminRole.role_id, permission_id: deleteProjectPermission.permission_id, tenant: tenantId }
      ]);

      // Generate user IDs
      regularUserId = uuidv4();
      adminUserId = uuidv4();

      // Track created user IDs
      createdUserIds = [regularUserId, adminUserId];

      // Create users without roles array
      const regularUserData = {
        user_id: regularUserId,
        tenant: tenantId,
        username: 'johndoe',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        hashed_password: 'hashed_password_here',
        is_inactive: false,
        role: 'user'
      };

      const adminUserData = {
        user_id: adminUserId,
        tenant: tenantId,
        username: 'janeadmin',
        first_name: 'Jane',
        last_name: 'Admin',
        email: 'jane@example.com',
        hashed_password: 'hashed_password_here',
        is_inactive: false,
        role: 'admin'
      };

      // Insert users into the database
      await db('users').insert([regularUserData, adminUserData]);

      // Add roles to users through user_roles table
      await db('user_roles').insert([
        { user_id: regularUserId, role_id: userRole.role_id, tenant: tenantId },
        { user_id: adminUserId, role_id: adminRole.role_id, tenant: tenantId }
      ]);

      // Assign the complete user objects with roles for use in tests
      regularUser = { ...regularUserData, roles: [userRole] };
      adminUser = { ...adminUserData, roles: [adminRole] };

      // Create a test project in the database
      initiatingSpellStatus = await db('statuses')
        .where('name', 'Initiating Spell')
        .first();

      if (!initiatingSpellStatus) {
        throw new Error('Initiating Spell status not found in the statuses table');
      }

      testProject = {
        tenant: tenantId,
        project_id: uuidv4(),
        company_id: companyId,
        project_name: 'Test Project',
        description: 'A test project',
        start_date: new Date(),
        end_date: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        wbs_code: 'TEST-001',
        is_inactive: false,
        status: initiatingSpellStatus.status_id
      };

      await db('projects').insert(testProject);

      // Mock the hasPermission function
      vi.spyOn(rbac, 'hasPermission').mockImplementation(async (user, resource, action) => {
        if (user.username === 'janeadmin') return true;
        if (user.username === 'johndoe' && resource === 'project' && action === 'read') return true;
        return false;
      });
    } catch (error) {
      console.error('Error in test setup:', error);
      throw error;
    }
  });

  afterEach(async () => {
    try {
      // Clean up test data in reverse order of creation
      if (testProject?.project_id) {
        await db('projects').where('project_id', testProject.project_id).del();
      }

      // Clean up user roles if user IDs exist
      if (createdUserIds.length > 0) {
        await db('user_roles').whereIn('user_id', createdUserIds).del();
      }

      // Clean up users if user IDs exist
      if (createdUserIds.length > 0) {
        await db('users').whereIn('user_id', createdUserIds).del();
      }

      // Clean up role permissions if role IDs exist
      if (createdRoleIds.length > 0) {
        await db('role_permissions').whereIn('role_id', createdRoleIds).del();
      }

      // Clean up roles if role IDs exist
      if (createdRoleIds.length > 0) {
        await db('roles').whereIn('role_id', createdRoleIds).del();
      }

      // Clean up permissions if permission IDs exist
      if (createdPermissionIds.length > 0) {
        await db('permissions').whereIn('permission_id', createdPermissionIds).del();
      }

      if (companyId) {
        await db('companies').where('company_id', companyId).del();
      }

      vi.restoreAllMocks();
    } catch (error) {
      console.error('Error in test cleanup:', error);
      throw error;
    }
  });

  it('should allow regular user to view projects', async () => {
    vi.spyOn(userActions, 'getCurrentUser').mockResolvedValue(regularUser);
    const projects = await projectActions.getProjects();
    expect(projects.length).toBeGreaterThanOrEqual(1);
    expect(projects.map((project): string => project.project_id)).toContain(testProject?.project_id);
  });

  it('should allow admin user to edit a project', async () => {
    vi.spyOn(userActions, 'getCurrentUser').mockResolvedValue(adminUser);
    const updateData: Partial<IProject> = {
      project_name: 'Updated Test Project',
    };
    const result = await projectActions.updateProject(testProject!.project_id, updateData);
    expect(result.project_name).toBe('Updated Test Project');

    const updatedProject = await db('projects').where('project_id', testProject!.project_id).first();
    expect(updatedProject.project_name).toBe('Updated Test Project');
  });

  it('should not allow regular user to edit a project', async () => {
    vi.spyOn(userActions, 'getCurrentUser').mockResolvedValue(regularUser);
    const updateData: Partial<IProject> = {
      project_name: 'Updated Test Project',
    };
    await expect(projectActions.updateProject(testProject!.project_id, updateData))
      .rejects.toThrow('Permission denied: Cannot update project');

    const unchangedProject = await db('projects').where('project_id', testProject!.project_id).first();
    expect(unchangedProject.project_name).toBe(testProject!.project_name);
  });

  it('should allow admin user to create a project', async () => {
    vi.spyOn(userActions, 'getCurrentUser').mockResolvedValue(adminUser);
    tenantId = uuidv4();
    const newProjectData: Omit<IProject, 'project_id' | 'created_at' | 'updated_at'> = {
      tenant: tenantId,
      company_id: companyId,
      project_name: 'New Test Project',
      description: 'A new test project',
      start_date: new Date(),
      end_date: new Date(),
      wbs_code: 'TEST-002',
      is_inactive: false,
      status: initiatingSpellStatus.status_id,
    };

    const newProject = await projectActions.createProject(newProjectData);
    expect(newProject).toBeDefined();
    expect(newProject.project_name).toBe('New Test Project');

    const retrievedProject = await db('projects').where('project_id', newProject.project_id).first();
    expect(retrievedProject.project_id).toEqual(newProject.project_id);

    // Clean up the newly created project
    await db('projects').where('project_id', newProject.project_id).del();
  });

  it('should not allow regular user to create a project', async () => {
    vi.spyOn(userActions, 'getCurrentUser').mockResolvedValue(regularUser);
    tenantId = uuidv4();
    const newProjectData: Omit<IProject, 'project_id' | 'created_at' | 'updated_at'> = {
      tenant: tenantId,
      company_id: companyId,
      project_name: 'New Test Project',
      description: 'A new test project',
      start_date: new Date(),
      end_date: new Date(),
      wbs_code: 'TEST-002',
      is_inactive: false,
      status: initiatingSpellStatus.status_id
    };

    await expect(projectActions.createProject(newProjectData))
      .rejects.toThrow('Permission denied: Cannot create project');
  });

  it('should allow admin user to delete a project', async () => {
    vi.spyOn(userActions, 'getCurrentUser').mockResolvedValue(adminUser);
    await projectActions.deleteProject(testProject!.project_id);

    const deletedProject = await db('projects').where('project_id', testProject!.project_id).first();
    expect(deletedProject).toBeUndefined();
  });

  it('should not allow regular user to delete a project', async () => {
    vi.spyOn(userActions, 'getCurrentUser').mockResolvedValue(regularUser);
    await expect(projectActions.deleteProject(testProject!.project_id))
      .rejects.toThrow('Permission denied: Cannot delete project');

    const unchangedProject = await db('projects').where('project_id', testProject!.project_id).first();
    expect(unchangedProject).toBeDefined();
  });
});
