"use server";

import { createNewDB } from "@/procedures/server_functions";
import { minLength, object, string } from "valibot";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs";

export async function signup(data: FormData) {
  const user = await currentUser();
  if (!user) throw new Error("No user");

  const email = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId
  )?.emailAddress;

  if (!email) throw new Error("No email");

  const username = data.get("username");
  const name = data.get("name");

  const dataSchema = object({
    username: string([minLength(1)]),
    name: string(),
  });

  const parsedData = dataSchema.parse({
    username,
    name,
  });

  const result = await createNewDB({ ...parsedData, email });
  redirect(`/${result.user.username}/expense-tracker`);
}
