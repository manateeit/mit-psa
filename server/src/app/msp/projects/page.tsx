'use client';

import { useEffect, useState } from 'react';
import Projects from '@/components/projects/Projects';
import { getProjects } from '@/lib/actions/project-actions/projectActions';
import { getAllCompanies } from '@/lib/actions/companyActions';
import { IProject } from '@/interfaces/project.interfaces';
import { ICompany } from '@/interfaces';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<IProject[]>([]);
  const [companies, setCompanies] = useState<ICompany[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsData, companiesData] = await Promise.all([
          getProjects() as Promise<IProject[]>,
          getAllCompanies() as Promise<ICompany[]>
        ]);
        setProjects(projectsData);
        setCompanies(companiesData);
      } catch(e) {
        console.error('Error loading projects page:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array means this runs once on mount and when navigating back

  if (loading) {
    return <div>Loading...</div>;
  }

  return <Projects initialProjects={projects} companies={companies} />;
}
