import { findUserDb } from "@/procedures/server_functions";
import { currentUser } from "@clerk/nextjs";
import { UserPageMain } from "./user_page";
import { notFound } from "next/navigation";

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
    (em) => em.id === user.primaryEmailAddressId
  );
  if (!primaryEmail) {
    return notFound();
  }
  const dbname = await findUserDb({
    username,
    email: primaryEmail.emailAddress,
  });
  if (!dbname) {
    return notFound();
  }
  return <UserPageMain params={{ dbname, username }} />;
}
