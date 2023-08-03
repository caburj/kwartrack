"use server";

import { redirect } from "next/navigation";
import { findUser } from ".";

export async function login(data: FormData) {
  const email = data.get("email");
  if (typeof email !== "string") {
    throw new Error("Email is not a string");
  }
  const user = await findUser(email);
  if (user === null) {
    throw new Error("User not found");
  }
  return redirect(`/${user.username}`);
}
