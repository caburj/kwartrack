import { createNewUser } from "@/procedures/server_functions";
import { redirect } from "next/navigation";
import { object, string } from "valibot";

async function signup(data: FormData) {
  "use server";

  const email = data.get("email");
  const username = data.get("username");
  const name = data.get("name");

  const dataSchema = object({
    email: string(),
    username: string(),
    name: string(),
  });

  const parsedData = dataSchema.parse({
    email,
    username,
    name,
  });

  const { dbname, user } = await createNewUser(parsedData);
  if (user === undefined) {
    throw new Error("User not found");
  }
  redirect(`/${dbname}/${user.username}`);
}

export default function SignUpPage() {
  return (
    <div>
      <h1>Register</h1>
      <form action={signup}>
        <input type="text" name="email" placeholder="Email" />
        <input type="text" name="username" placeholder="Username" />
        <input type="text" name="name" placeholder="Name" />
        <button type="submit">Register</button>
      </form>
    </div>
  );
}
