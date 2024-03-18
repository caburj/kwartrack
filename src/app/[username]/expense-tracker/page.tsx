import { currentUser } from '@clerk/nextjs';
import { notFound } from 'next/navigation';
import { getUserIdAndDbname } from '@/procedures/server_functions';
import { UserPage } from './user_page';

export default async function Page({
  params: { username },
}: {
  params: { username: string };
}) {
  const user = await currentUser();
  if (!user) {
    return notFound();
  }
  const primaryEmail = user.emailAddresses.find(
    em => em.id === user.primaryEmailAddressId,
  );
  if (!primaryEmail) {
    return notFound();
  }
  const result = await getUserIdAndDbname({
    username,
    email: primaryEmail.emailAddress,
  });
  if (!result) {
    return notFound();
  }
  return <UserPage {...result} />;
}
