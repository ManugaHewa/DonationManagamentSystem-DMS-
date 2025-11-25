import { Donor, User } from '@prisma/client';

type Contactable = Partial<Pick<User, 'email' | 'phone' | 'username'>> & {
  mobile?: string;
  landline?: string;
};

type ContactDetails =
  | { type: 'email'; value: string }
  | { type: 'phone'; value: string }
  | { type: 'username'; value: string }
  | { type: 'none'; value: null };

export const getPreferredContact = (
  user?: Contactable | null,
  donor?: Partial<Donor> | null
): ContactDetails => {
  const email = user?.email || donor?.email;
  if (email) return { type: 'email', value: email };

  const phone = user?.phone || donor?.mobile || donor?.landline;
  if (phone) return { type: 'phone', value: phone };

  const username = user?.username;
  if (username) return { type: 'username', value: username };

  return { type: 'none', value: null };
};
