import { Box, Button, Flex, Grid, Popover, ScrollArea, Text } from "@radix-ui/themes";
import { Command } from "cmdk";
import { useState } from "react";
import { css } from "../../../../styled-system/css";
import { CaretSortIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";

export function Combobox<I extends { id: string }>(props: {
  groupedItems: Record<string, I[]>;
  isItemIncluded?: (item: I) => boolean;
  getItemValue: (item: I, groupKey: string) => string;
  getItemDisplay: (item: I, groupKey: string) => string;
  getGroupHeading: (groupKey: string, items: I[]) => string;
  onSelectItem: (item: I) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pred = props.isItemIncluded ?? (() => true);
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      {props.children}
      <Popover.Content style={{ padding: "0px" }}>
        <Command loop className="linear">
          <Flex
            p="2"
            gap="1"
            className={css({
              borderBottom: "1px solid var(--gray-6)",
            })}
          >
            <Grid align="center">
              <MagnifyingGlassIcon width="18" height="18" />
            </Grid>
            <Command.Input />
          </Flex>
          <ScrollArea
            scrollbars="vertical"
            className={css({ maxHeight: "200px" })}
          >
            <Box px="5" pb="4">
              <Command.List>
                {Object.entries(props.groupedItems).map(([key, items]) => {
                  const itemsToDisplay = items.filter(pred);
                  if (itemsToDisplay.length === 0) return null;
                  return (
                    <Command.Group
                      heading={props.getGroupHeading(key, itemsToDisplay)}
                      key={key}
                    >
                      {itemsToDisplay.map((item) => (
                        <Command.Item
                          key={item.id}
                          value={props.getItemValue(item, key)}
                          onSelect={() => {
                            props.onSelectItem(item);
                            setOpen(false);
                          }}
                        >
                          {props.getItemDisplay(item, key)}
                        </Command.Item>
                      ))}
                    </Command.Group>
                  );
                })}
              </Command.List>
            </Box>
          </ScrollArea>
        </Command>
      </Popover.Content>
    </Popover.Root>
  );
}

export function ComboboxTrigger(props: { children: React.ReactNode }) {
  return (
    <Popover.Trigger>
      <Button variant="outline" color="gray">
        <Text>{props.children}</Text>
        <CaretSortIcon
          width="18"
          height="18"
          className={css({
            display: "inline-block",
            verticalAlign: "middle",
          })}
        />
      </Button>
    </Popover.Trigger>
  );
}
