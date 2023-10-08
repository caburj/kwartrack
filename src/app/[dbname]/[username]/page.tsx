"use client";

import { rpc } from "../../rpc_client";
import { useQuery } from "@tanstack/react-query";
import { UserPageStoreProvider } from "./store";
import { QueryResult } from "@/utils/common";
import { Box, Flex } from "@radix-ui/themes";
import { TransactionsTable } from "./transactions_table";
import { SideBar } from "./side_bar";
import { useEffect, useState } from "react";
import { css } from "../../../../styled-system/css";
import "react-datepicker/dist/react-datepicker.css";

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
  const [width, setWidth] = useState(375);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isDragging) {
      const onMouseMove = (e: MouseEvent) => {
        if (e.clientX < 300 || e.clientX > 600) return;
        setWidth(e.clientX);
      };
      const onMouseUp = () => {
        setIsDragging(false);
      };
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      return () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <QueryResult
      query={user}
      onLoading={<>Loading {`${username}'s accounts`}...</>}
      onUndefined={<>{`${username}'s`} data not found</>}
    >
      {(user) => (
        <Flex gap="3">
          <SideBar user={user} width={width} />
          <div
            className={css({
              position: "fixed",
              top: "0",
              bottom: "0",
              width: "4px",
              backgroundColor: isDragging ? "var(--accent-a9)" : undefined,
              transition: "background-color 0.3s ease",
              "&:hover": {
                cursor: "col-resize",
                backgroundColor: "var(--accent-a9)",
              },
              zIndex: 100,
            })}
            style={{
              left: `${width - 2}px`,
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onMouseUp={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
          ></div>
          <Box
            position="fixed"
            top="0"
            right="0"
            bottom="0"
            style={{
              left: `${width}px`,
            }}
          >
            <Flex direction="column" p="2" height="100%">
              <TransactionsTable user={user} />
            </Flex>
          </Box>
        </Flex>
      )}
    </QueryResult>
  );
}
