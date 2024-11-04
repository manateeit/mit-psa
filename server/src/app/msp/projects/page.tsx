import Projects from '@/components/projects/Projects';
import { getProjects } from '@/lib/actions/projectActions';
import { getAllCompanies } from '@/lib/actions/companyActions';
import { IProject } from '@/interfaces/project.interfaces';
import { ICompany } from '@/interfaces';

export default async function ProjectsPage() {
  try {
    const [projects, companies] = await Promise.all([
      getProjects() as Promise<IProject[]>,
      getAllCompanies() as Promise<ICompany[]>
    ]);

    return <Projects initialProjects={projects} companies={companies} />;
  } catch(e) {
    console.error('Error loading projects page:', e);
    return <></>
  }
}
