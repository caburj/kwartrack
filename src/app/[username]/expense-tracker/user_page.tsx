"use client";

import { UserPageStoreProvider } from "./store";
import { Box, Flex } from "@radix-ui/themes";
import { TransactionsTable } from "./transactions_table";
import { SideBar } from "./side_bar";
import { useEffect, useState } from "react";
import { css } from "../../../../styled-system/css";
import "react-datepicker/dist/react-datepicker.css";
import "react-loading-skeleton/dist/skeleton.css";

export function UserPage(props: { id: string; dbname: string }) {
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
    <UserPageStoreProvider>
      <Flex gap="3">
        <SideBar user={props} width={width} />
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
            <TransactionsTable user={props} />
          </Flex>
        </Box>
      </Flex>
    </UserPageStoreProvider>
  );
}
