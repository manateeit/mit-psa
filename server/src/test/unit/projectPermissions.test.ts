import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IUser, IUserWithRoles, IRoleWithPermissions, IPermission } from '../../interfaces/auth.interfaces';
import { IProject } from '../../interfaces/project.interfaces';
import * as projectActions from '../../lib/actions/projectActions';
import ProjectModel from '../../lib/models/project';
import { getCurrentUser } from '../../lib/auth/session';

// Mock the Project model methods
vi.mock('../../lib/models/project', () => ({
  default: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock the getCurrentUser function
vi.mock('../../lib/auth/session', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Project Permissions', () => {
  let viewProjectPermission: IPermission;
  let editProjectPermission: IPermission;
  let createProjectPermission: IPermission;
  let deleteProjectPermission: IPermission;
  let userRole: IRoleWithPermissions;
  let adminRole: IRoleWithPermissions;
  let regularUser: IUserWithRoles;
  let adminUser: IUserWithRoles;
  let userWithoutPermissions: IUser;
  let mockProject: IProject;

  beforeEach(() => {
    // Create project-specific permissions
    viewProjectPermission = { permission_id: '1', resource: 'project', action: 'view' };
    editProjectPermission = { permission_id: '2', resource: 'project', action: 'edit' };
    createProjectPermission = { permission_id: '3', resource: 'project', action: 'create' };
    deleteProjectPermission = { permission_id: '4', resource: 'project', action: 'delete' };

    // Create roles with project permissions
    userRole = {
      role_id: '1',
      role_name: 'User',
      description: 'Regular user role with view project permission',
      permissions: [viewProjectPermission]
    };

    adminRole = {
      role_id: '2',
      role_name: 'Admin',
      description: 'Administrator role with all project permissions',
      permissions: [viewProjectPermission, editProjectPermission, createProjectPermission, deleteProjectPermission]
    };

    // Create users with specific roles
    regularUser = {
      user_id: '1',
      tenant: 'test-tenant',
      username: 'johndoe',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      hashed_password: 'hashed_password_here',
      roles: [userRole],
      is_inactive: false
    };

    adminUser = {
      user_id: '2',
      tenant: 'test-tenant',
      username: 'janeadmin',
      first_name: 'Jane',
      last_name: 'Admin',
      email: 'jane@example.com',
      hashed_password: 'hashed_password_here',
      roles: [adminRole],
      is_inactive: false
    };

    userWithoutPermissions = {
      user_id: '3',
      tenant: 'test-tenant',
      username: 'nopermissions',
      first_name: 'No',
      last_name: 'Permissions',
      email: 'no@permissions.com',
      hashed_password: 'hashed_password_here',
      is_inactive: false
    };

    mockProject = {
      tenant: 'test-tenant',
      project_id: 'P-1',
      company_id: 'COMP-1',
      project_name: 'Test Project',
      description: 'This is a test project',
      start_date: new Date(),
      end_date: null,
      status: 'STATUS-1',
      created_at: new Date(),
      updated_at: new Date(),
      wbs_code: 'WBS-001',
      is_inactive: false
    };

    // Reset mocks before each test
    vi.resetAllMocks();

    // Mock ProjectModel.getAll to return our mockProject
    (ProjectModel.getAll as any).mockResolvedValue([mockProject]);

    // Mock ProjectModel.getById to return our mockProject
    (ProjectModel.getById as any).mockResolvedValue(mockProject);

    // Mock ProjectModel.create to return our mockProject
    (ProjectModel.create as any).mockResolvedValue(mockProject);

    // Mock ProjectModel.update to return our mockProject
    (ProjectModel.update as any).mockResolvedValue(mockProject);

    // Mock ProjectModel.delete to return void
    (ProjectModel.delete as any).mockResolvedValue(undefined);
  });

  it('should allow regular user to view projects', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(regularUser);
    const projects = await projectActions.getProjects();
    expect(projects).toHaveLength(1);
    expect(projects[0]).toEqual(mockProject);
  });

  it('should allow admin user to view projects', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(adminUser);
    const projects = await projectActions.getProjects();
    expect(projects).toHaveLength(1);
    expect(projects[0]).toEqual(mockProject);
  });

  it('should throw an error if user does not have view permission', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(userWithoutPermissions);
    await expect(projectActions.getProjects()).rejects.toThrow('Permission denied: Cannot view project');
  });

  it('should allow regular user to view a specific project', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(regularUser);
    const project = await projectActions.getProject('P-1');
    expect(project).toEqual(mockProject);
  });

  it('should allow admin user to view a specific project', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(adminUser);
    const project = await projectActions.getProject('P-1');
    expect(project).toEqual(mockProject);
  });

  it('should throw an error if user does not have view permission for a specific project', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(userWithoutPermissions);
    await expect(projectActions.getProject('P-1')).rejects.toThrow('Permission denied: Cannot view project');
  });

  const updateData: Partial<IProject> = {
    project_name: 'Updated Project Name',
    updated_at: new Date()
  };

  it('should allow admin user to edit a project', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(adminUser);
    const result = await projectActions.updateProject('P-1', updateData);
    expect(result).toEqual(mockProject);
  });

  it('should not allow regular user to edit a project', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(regularUser);
    await expect(projectActions.updateProject('P-1', updateData)).rejects.toThrow('Permission denied: Cannot edit project');
  });

  it('should throw an error if user does not have edit permission', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(userWithoutPermissions);
    await expect(projectActions.updateProject('P-1', updateData)).rejects.toThrow('Permission denied: Cannot edit project');
  });

  const newProjectData: Omit<IProject, 'project_id' | 'created_at' | 'updated_at'> = {
    tenant: 'test-tenant',
    company_id: 'COMP-1',
    project_name: 'New Project',
    description: 'This is a new project',
    start_date: new Date(),
    end_date: null,
    status: 'STATUS-1',
    wbs_code: 'WBS-002',
    is_inactive: false
  };

  it('should allow admin user to create a project', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(adminUser);
    const result = await projectActions.createProject(newProjectData);
    expect(result).toEqual(mockProject);
  });

  it('should not allow regular user to create a project', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(regularUser);
    await expect(projectActions.createProject(newProjectData)).rejects.toThrow('Permission denied: Cannot create project');
  });

  it('should throw an error if user does not have create permission', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(userWithoutPermissions);
    await expect(projectActions.createProject(newProjectData)).rejects.toThrow('Permission denied: Cannot create project');
  });

  it('should allow admin user to delete a project', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(adminUser);
    await expect(projectActions.deleteProject('P-1')).resolves.toBeUndefined();
  });

  it('should not allow regular user to delete a project', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(regularUser);
    await expect(projectActions.deleteProject('P-1')).rejects.toThrow('Permission denied: Cannot delete project');
  });

  it('should throw an error if user does not have delete permission', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(userWithoutPermissions);
    await expect(projectActions.deleteProject('P-1')).rejects.toThrow('Permission denied: Cannot delete project');
  });
});
