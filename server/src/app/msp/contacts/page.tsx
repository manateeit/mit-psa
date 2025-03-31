// server/src/app/msp/contacts/page.tsx
import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import ContactModel from 'server/src/lib/models/contact';
import UserModel from 'server/src/lib/models/user';
import { User } from 'next-auth';
import { IContact, IUserWithRoles } from 'server/src/interfaces';
import Contacts from 'server/src/components/contacts/Contacts';
import OverallInteractionsFeed from 'server/src/components/interactions/OverallInteractionsFeed';

type IdName = { id: string; name: string };

export default async function ContactsPage() {
  const contacts = await ContactModel.getAll(true);
  const usersData = await UserModel.getAll();

  // Fetch roles for each user and combine data
  const usersWithRoles: IUserWithRoles[] = await Promise.all(
    usersData.map(async (user) => {
      const roles = await UserModel.getUserRoles(user.user_id);
      return { ...user, roles };
    })
  );

  // Filter out any duplicate contacts based on contact_name_id
  const uniqueContacts = Array.from(
    new Map(contacts.map((contact):[string, IContact] => [contact.contact_name_id, contact])).values()
  );

  return (
    <div className="flex flex-col md:flex-row md:space-x-6">
      <div className="w-full md:w-2/3 mb-6 md:mb-0">
      <Suspense fallback={<div>Loading...</div>}>
        <Contacts initialContacts={uniqueContacts} />
        </Suspense>
      </div>
      <div className="w-full md:w-1/3">
      <Suspense fallback={<div>Loading...</div>}>
        <OverallInteractionsFeed 
          users={usersWithRoles}
          contacts={uniqueContacts}
        />
        </Suspense>
      </div>
    </div>
  );
}
