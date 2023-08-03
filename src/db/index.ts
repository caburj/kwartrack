import { createClient } from "edgedb";
import e from "../../dbschema/edgeql-js";

const client = createClient();

export async function findUser(email: string) {
  const query = e.select(e.ExpensifUser, (user) => ({
    id: true,
    email: true,
    name: true,
    username: true,
    filter: e.op(user.email, "=", email),
  }));

  const result = await query.run(client);
  if (result.length === 0) {
    return null;
  }
  return result[0];
}

export async function findUsername(username: string) {
  const query = e.select(e.ExpensifUser, (user) => ({
    id: true,
    email: true,
    name: true,
    username: true,
    filter: e.op(user.username, "=", username),
  }));

  const result = await query.run(client);
  if (result.length === 0) {
    return null;
  }
  return result[0];
}
