'use client'

import { useEffect, useState } from 'react';
import ContactDetailsView from '../../../../components/contacts/ContactDetailsView';
import Documents from '../../../../components/documents/Documents';
import { IContact } from '../../../../interfaces/contact.interfaces';
import { ICompany } from '../../../../interfaces/company.interfaces';
import { getCurrentUser } from '@/lib/actions/user-actions/userActions';
import { IUserWithRoles } from '@/interfaces/auth.interfaces';

const ContactDetailPage = async ({ params }: { params: { id: string } }) => {
  const [contact, setContact] = useState<IContact | null>(null);
  const [documents, setDocuments] = useState<[]>([]);
  const [companies, setCompanies] = useState<ICompany[]>([]);
  const [currentUser, setCurrentUser] = useState<IUserWithRoles | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data first
        const userData = await getCurrentUser();
        setCurrentUser(userData);

        // Fetch companies
        const companiesResponse = await fetch('/api/companies');
        const companiesData = await companiesResponse.json();
        setCompanies(companiesData);

        // Fetch contact data
        const contactResponse = await fetch(`/api/contacts/${params.id}`);
        const contactData = await contactResponse.json();
        setContact(contactData);

        // Fetch documents
        const documentsResponse = await fetch(`/api/contacts/${params.id}/documents`);
        const documentsData = await documentsResponse.json();
        setDocuments(documentsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [params.id]);

  if (!contact || !currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{contact.full_name}</h1>
      <ContactDetailsView initialContact={contact} companies={companies} />
      <div className="max-w-3xl mx-auto mt-10">
        <h2 className="text-xl font-semibold mb-4">Documents</h2>
        <Documents 
          documents={documents} 
          userId={currentUser.user_id}
        />
      </div>
    </div>
  );
};

export default ContactDetailPage;
