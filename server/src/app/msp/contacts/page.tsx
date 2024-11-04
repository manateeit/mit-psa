// server/src/app/msp/contacts/page.tsx
import React from 'react';
import dynamic from 'next/dynamic';
import Contacts from '@/components/contacts/Contacts';
import ContactModel from '@/lib/models/contact';
import UserModel from '@/lib/models/user';
import { User } from 'next-auth';

type IdName = { id: string; name: string };

export default async function ContactsPage() {
  const contacts = await ContactModel.getAll(true);
  const users = await UserModel.getAll(); 

  const OverallInteractionsFeed = dynamic(
    () => import('@/components/interactions/OverallInteractionsFeed'),
    { ssr: false }
  );

  return (
    <div className="flex flex-col md:flex-row md:space-x-6">
      <div className="w-full md:w-2/3 mb-6 md:mb-0">
        <Contacts initialContacts={contacts} />
      </div>
      <div className="w-full md:w-1/3">
        <OverallInteractionsFeed 
          users={users.map((user):IdName => ({ id: user.user_id, name: user.username }))}
          contacts={contacts.map((contact):IdName => ({ id: contact.contact_name_id, name: contact.full_name }))}
        />
      </div>
    </div>
  );
}