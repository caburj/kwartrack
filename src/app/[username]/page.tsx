"use client";

import { rpc } from "../rpc_client";
import { useQuery } from "@tanstack/react-query";

export default function UserPage(props: { params: { username: string } }) {
  const { username } = props.params;
  const { data: user, isLoading } = useQuery(["user", username], () => {
    return rpc.post.findUser({ username });
  });
  return (
    <div>
      <h1>My Accounts</h1>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <pre>{JSON.stringify(user, null, 4)}</pre>
      )}
    </div>
  );
}
