// import { NextApiRequest, NextApiResponse } from 'next';
// import { getServerSession } from "next-auth/next";
// import { options } from '../../../app/api/auth/[...nextauth]/options';
// import User from '../../../lib/models/user';
// // import { setTenant } from '../../../lib/db/db';

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   const session = await getServerSession(req, res, options);

//   if (!session) {
//     return res.status(401).json({ error: 'Unauthorized' });
//   }

//   if (!session.user.tenant) {
//     return res.status(400).json({ error: 'Tenant information missing' });
//   }

//   try {
//     await setTenant(session.user.tenant);
//     const users = await User.getAll();
//     res.status(200).json(users);
//   } catch (error) {
//     console.error('Error fetching users:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// }
