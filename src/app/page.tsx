import { findUserByEmail } from "@/procedures/server_functions";
import { redirect } from "next/navigation";

export async function login(data: FormData) {
  "use server";

  const email = data.get("email");
  if (typeof email !== "string") {
    throw new Error("Email is not a string");
  }
  const user = await findUserByEmail({ email });
  if (user === undefined) {
    throw new Error("User not found");
  }
  return redirect(`/${user.dbname}/${user.username}`);
}

export default function Home() {
  return (
    <form action={login}>
      <label htmlFor="email">Email</label>
      <input
        type="email"
        id="email"
        name="email"
        placeholder="Enter your email"
      />
      <input type="submit" value="Submit" />
    </form>
  );
}
