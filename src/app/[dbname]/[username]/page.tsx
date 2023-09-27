"use client";

import { rpc } from "../../rpc_client";
import { useQuery } from "@tanstack/react-query";
import { UserPageStoreProvider } from "./store";
import { QueryResult } from "@/utils/common";
import { Box, Flex } from "@radix-ui/themes";
import { TransactionForm } from "./transaction_form";
import { TransactionsTable } from "./transactions_table";
import { SideBar } from "./side_bar";

export default function Main(props: {
  params: { username: string; dbname: string };
}) {
  const { username, dbname } = props.params;
  return (
    <UserPageStoreProvider>
      <UserPage username={username} dbname={dbname} />
    </UserPageStoreProvider>
  );
}

export function UserPage({
  username,
  dbname,
}: {
  username: string;
  dbname: string;
}) {
  const user = useQuery(["user", username], () => {
    return rpc.post.findUser({ username, dbname });
  });
  return (
    <QueryResult
      query={user}
      onLoading={<>Loading {`${username}'s accounts`}...</>}
      onUndefined={<>{`${username}'s data`} not found</>}
    >
      {(user) => (
        <Flex gap="3">
          <SideBar user={user} />
          <Box
            position="fixed"
            top="0"
            right="0"
            bottom="0"
            style={{
              left: "350px",
            }}
          >
            <Flex direction="column" p="2" height="100%">
              <TransactionForm user={user} />
              <TransactionsTable user={user} />
            </Flex>
          </Box>
        </Flex>
      )}
    </QueryResult>
  );
}
