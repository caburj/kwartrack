import { createClient } from "edgedb";
import e from "../../dbschema/edgeql-js";

const client = createClient();

export async function getUser(email: string) {
  const query = e.select(e.User, (user) => ({
    email: true,
    name: true,
    filter: e.op(user.email, "=", email),
  }));

  const result = await query.run(client);
  if (result.length === 0) {
    return null;
  }
  return result[0];
}
