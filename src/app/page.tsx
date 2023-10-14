import { findUserByEmail } from "@/procedures/server_functions";
import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

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
    return redirect("/onboarding");
  }
  return redirect(`/${eUser.dbname}/${eUser.username}`);
}
