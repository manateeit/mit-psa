'use client'

import { useEffect, useState } from 'react';
import ContactDetailsView from '../../../../components/contacts/ContactDetailsView';
import Documents from '../../../../components/documents/Documents';
import { IContact } from '../../../../interfaces/contact.interfaces';
import { ICompany } from '../../../../interfaces/company.interfaces';
import { getCurrentUser } from '@/lib/actions/user-actions/userActions';
import { IUserWithRoles } from '@/interfaces/auth.interfaces';
import { getDocumentsByEntity } from '@/lib/actions/document-actions/documentActions';
import { IDocument } from '@/interfaces/document.interface';
import { getContactByContactNameId } from '@/lib/actions/contact-actions/contactActions';
import { getAllCompanies } from '@/lib/actions/companyActions';

const ContactDetailPage = ({ params }: { params: { id: string } }) => {
  const [contact, setContact] = useState<IContact | null>(null);
  const [documents, setDocuments] = useState<IDocument[]>([]);
  const [companies, setCompanies] = useState<ICompany[]>([]);
  const [currentUser, setCurrentUser] = useState<IUserWithRoles | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data first
        const userData = await getCurrentUser();
        setCurrentUser(userData);

        // Fetch companies using server action
        const companiesData = await getAllCompanies();
        setCompanies(companiesData);

        // Fetch contact data using server action
        const contactData = await getContactByContactNameId(params.id);
        setContact(contactData);

        // Fetch documents using server action
        const documentsData = await getDocumentsByEntity(params.id, 'contact');
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

  const handleDocumentCreated = async () => {
    // Refresh documents after a new one is created
    const updatedDocuments = await getDocumentsByEntity(params.id, 'contact');
    setDocuments(updatedDocuments);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{contact.full_name}</h1>
      <ContactDetailsView initialContact={contact} companies={companies} />
      <div className="max-w-3xl mx-auto mt-10">
        <h2 className="text-xl font-semibold mb-4">Documents</h2>
        <Documents 
          documents={documents} 
          userId={currentUser.user_id}
          entityId={params.id}
          entityType="contact"
          onDocumentCreated={handleDocumentCreated}
        />
      </div>
    </div>
  );
};

export default ContactDetailPage;
