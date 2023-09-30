"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { ChevronRightIcon } from "@radix-ui/react-icons";
import { Box, Flex, Text } from "@radix-ui/themes";
import { css } from "../../../styled-system/css";
import { ReactNode } from "react";

export default function Page() {
  return (
    <Box
      style={{
        width: "400px",
        height: "400px",
      }}
    >
      <Collapsible
        item={{
          id: "0",
          kind: "group",
          heading: "Group 1",
          items: [
            {
              id: "1",
              kind: "item",
              heading: (
                <Accordion.Trigger>
                  <Text className={css({ cursor: "pointer" })}>Test 1</Text>
                </Accordion.Trigger>
              ),
              content: "This is a content of 1",
            },
            {
              id: "2",
              kind: "group",
              heading: (
                <Accordion.Trigger>
                  <Text className={css({ cursor: "pointer" })}>Test 2</Text>
                </Accordion.Trigger>
              ),
              openItems: ["3"],
              items: [
                {
                  id: "3",
                  kind: "item",
                  heading: (
                    <Accordion.Trigger>
                      <Text className={css({ cursor: "pointer" })}>Test 3</Text>
                    </Accordion.Trigger>
                  ),
                  content: "This is a content of 3",
                },
                {
                  id: "4",
                  kind: "group",
                  heading: (
                    <Accordion.Trigger>
                      <Text className={css({ cursor: "pointer" })}>Test 4</Text>
                    </Accordion.Trigger>
                  ),
                  openItems: ["6"],
                  items: [
                    {
                      id: "6",
                      kind: "item",
                      heading: (
                        <Accordion.Trigger>
                          <Text className={css({ cursor: "pointer" })}>
                            Test 6
                          </Text>
                        </Accordion.Trigger>
                      ),
                      content: "This is a content of 6",
                    },
                    {
                      id: "7",
                      kind: "item",
                      heading: (
                        <Accordion.Trigger>
                          <Text className={css({ cursor: "pointer" })}>
                            Test 7
                          </Text>
                        </Accordion.Trigger>
                      ),
                      content: "This is a content of 7",
                    },
                  ],
                },
              ],
            },
            {
              id: "5",
              kind: "item",
              heading: (
                <Accordion.Trigger>
                  <Text className={css({ cursor: "pointer" })}>Test 5</Text>
                </Accordion.Trigger>
              ),
              content: "This is a content of 5",
            },
          ],
          openItems: ["1"],
        }}
      />
    </Box>
  );
}

function Collapsible(props: { item: GroupItem }) {
  return (
    <Accordion.Root type="multiple" defaultValue={props.item.openItems}>
      {props.item.items.map((item) => (
        <Accordion.Item value={item.id} key={item.id}>
          <Accordion.Header asChild>{item.heading}</Accordion.Header>
          <Accordion.Content asChild>
            <Flex direction="column">
              {item.kind === "group" ? (
                <Collapsible item={item} />
              ) : (
                item.content
              )}
            </Flex>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}

type CollapsibleItem = GroupItem | BasicItem;

type GroupItem = {
  id: string;
  kind: "group";
  heading: ReactNode;
  items: CollapsibleItem[];
  openItems: string[];
};

type BasicItem = {
  id: string;
  kind: "item";
  heading: ReactNode;
  content: ReactNode;
};
