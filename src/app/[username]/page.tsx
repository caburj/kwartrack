import { localCall } from "../api/local_handler";

export default async function AccountsPage({
  params,
}: {
  params: { username: string };
}) {
  const { username } = params;
  const user = await localCall("findUser", { username });
  return (
    <div>
      <h1>My Accounts</h1>
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </div>
  );
}
