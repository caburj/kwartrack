import {
  checkPendingInvitation,
  findUserByEmail,
} from "@/procedures/server_functions";
import { currentUser } from "@clerk/nextjs";
import { notFound, redirect } from "next/navigation";

export default async function Home() {
  const user = await currentUser();
  if (user === null) {
    return redirect("/sign-in");
  }

  const primaryEmail = user?.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId
  )?.emailAddress;

  if (primaryEmail === undefined) {
    throw new Error("Primary email not found");
  }

  const eUser = await findUserByEmail({ email: primaryEmail });
  if (eUser === undefined) {
    const hasPendingInvitation = await checkPendingInvitation({
      email: primaryEmail,
    });
    if (!hasPendingInvitation) {
      return notFound();
    } else {
      return redirect("/invitation/accept");
    }
  }
  return redirect(`/${eUser.username}/expense-tracker`);
}
