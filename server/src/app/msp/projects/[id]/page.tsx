import { getProjectDetails } from '@/lib/actions/project-actions/projectActions';
import ProjectDetail from '@/components/projects/ProjectDetail';
import BackNav from '@/components/ui/BackNav';
import ProjectActiveToggle from '@/components/projects/ProjectActiveToggle';

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const projectDetails = await getProjectDetails(id);

  return (
    <div>
      <div className="flex items-center space-x-5 mb-4">
        <BackNav>Back to Projects</BackNav>
        <h1 className="text-xl font-bold">{projectDetails.project.project_name}</h1>
        <ProjectActiveToggle 
          projectId={projectDetails.project.project_id} 
          initialIsInactive={projectDetails.project.is_inactive} 
        />
      </div>
      <ProjectDetail
        project={projectDetails.project}
        phases={projectDetails.phases}
        tasks={projectDetails.tasks}
        ticketLinks={projectDetails.ticketLinks}
        statuses={projectDetails.statuses}
        users={projectDetails.users}
      />
    </div>
  );
}
