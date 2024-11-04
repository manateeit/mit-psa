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
  let viewProjectPermission: IPermission;
  let editProjectPermission: IPermission;
  let createProjectPermission: IPermission;
  let deleteProjectPermission: IPermission;
  let userRole: IRoleWithPermissions;
  let adminRole: IRoleWithPermissions;
  let regularUser: IUserWithRoles;
  let adminUser: IUserWithRoles;
  let testProject: IProject | undefined;

  beforeEach(async () => {
    // Create test data for each test
    ({ tenant: tenantId } = await db('tenants').select("tenant").first());

    companyId = uuidv4();
    await db('companies').insert({
      company_id: companyId,
      company_name: 'Test Company',
      tenant: tenantId,
    });

    // Create permissions
    viewProjectPermission = { permission_id: uuidv4(), resource: 'project', action: 'view' };
    editProjectPermission = { permission_id: uuidv4(), resource: 'project', action: 'edit' };
    createProjectPermission = { permission_id: uuidv4(), resource: 'project', action: 'create' };
    deleteProjectPermission = { permission_id: uuidv4(), resource: 'project', action: 'delete' };

    // Create roles
    userRole = {
      role_id: uuidv4(),
      role_name: 'User',
      description: 'Regular user role',
      permissions: [viewProjectPermission]
    };

    adminRole = {
      role_id: uuidv4(),
      role_name: 'Admin',
      description: 'Administrator role',
      permissions: [viewProjectPermission, editProjectPermission, createProjectPermission, deleteProjectPermission]
    };

    // Create users
    regularUser = {
      user_id: uuidv4(),
      tenant: tenantId,
      username: 'johndoe',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      hashed_password: 'hashed_password_here',
      is_inactive: false,
      roles: [userRole]
    };

    adminUser = {
      user_id: uuidv4(),
      tenant: tenantId,
      username: 'janeadmin',
      first_name: 'Jane',
      last_name: 'Admin',
      email: 'jane@example.com',
      hashed_password: 'hashed_password_here',
      is_inactive: false,
      roles: [adminRole]
    };

    // Insert users into the database
    await db('users').insert([
      { ...regularUser, role: 'user' },
      { ...adminUser, role: 'admin' }
    ]);

    // Create a test project in the database
    initiatingSpellStatus = await db('statuses')
      .where('status_name', 'Initiating Spell')
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
      if (user.username === 'johndoe' && resource === 'project' && action === 'view') return true;
      return false;
    });
  });

  afterEach(async () => {
    // Clean up test data
    await db('projects').where('project_id', testProject?.project_id).del();
    await db('users').whereIn('user_id', [regularUser.user_id, adminUser.user_id]).del();
    await db('companies').where('company_id', companyId).del();
    vi.restoreAllMocks();
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
      .rejects.toThrow('Permission denied: Cannot edit project');

    const unchangedProject = await db('projects').where('project_id', testProject!.project_id).first();
    expect(unchangedProject.project_name).toBe(testProject!.project_name);
  });

  it('should allow admin user to create a project', async () => {
    vi.spyOn(userActions, 'getCurrentUser').mockResolvedValue(adminUser);
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
