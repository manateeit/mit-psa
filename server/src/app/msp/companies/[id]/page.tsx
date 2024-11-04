import Company from '@/lib/models/company';
import { ICompany } from '@/interfaces/company.interfaces';
import { IDocument } from '@/interfaces/document.interface';
import { IContact } from "@/interfaces/contact.interfaces";
import { getDocumentByCompanyId } from '@/lib/actions/document-actions/documentActions';
import CompanyDetails from '@/components/companies/CompanyDetails';
import { getContactsByCompany } from '@/lib/actions/contact-actions/contactActions';
import { getCompanyById } from '@/lib/actions/companyActions';
import { notFound } from 'next/navigation';

const CompanyPage = async ({ params }: { params: { id: string } }) => {
  const { id } = params;
 
  try {
    // Fetch all data in parallel
    const [company, documents, contacts] = await Promise.all([
      Company.getById(id),
      getDocumentByCompanyId(id),
      getContactsByCompany(id)
    ]);

    if (!company) {
      return notFound();
    }

    return (
      <div className="mx-auto px-4 mt-10">
       <CompanyDetails company={company} documents={documents} contacts={contacts} isInDrawer={false} />
      </div>
    );
  } catch (error) {
    console.error(`Error fetching data for company with id ${id}:`, error);
    return <div>Error loading company data</div>;
  }
}

export default CompanyPage;
