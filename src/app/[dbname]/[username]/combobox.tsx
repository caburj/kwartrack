import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  Popover,
  ScrollArea,
  Text,
} from "@radix-ui/themes";
import { Command } from "cmdk";
import { forwardRef, useState } from "react";
import { css } from "../../../../styled-system/css";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { RadixColor } from "@/utils/common";

export function Combobox<
  I extends { id: string; is_private: boolean },
  K extends string
>(props: {
  groupedItems: Record<K, I[]>;
  isItemIncluded?: (item: I) => boolean;
  getItemValue: (item: I, groupKey: K) => string;
  getItemDisplay: (item: I, groupKey: K) => string;
  getItemColor: (item: I, groupKey: K) => RadixColor;
  getGroupHeading: (groupKey: K, items: I[]) => string;
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
              borderBottom: "1px solid var(--gray-a6)",
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
            <Box px="4" pb="4">
              <Command.List>
                {(
                  Object.entries(props.groupedItems) as unknown as [K, I[]][]
                ).map(([key, items]) => {
                  const itemsToDisplay = items.filter(pred);
                  if (itemsToDisplay.length === 0) return null;
                  return (
                    <Command.Group
                      heading={props.getGroupHeading(key, itemsToDisplay)}
                      key={key}
                    >
                      {itemsToDisplay.map((item) => {
                        const color = props.getItemColor(item, key);
                        const variant = item.is_private ? "outline" : "soft";
                        return (
                          <Command.Item
                            key={item.id}
                            value={props.getItemValue(item, key)}
                            onSelect={() => {
                              props.onSelectItem(item);
                              setOpen(false);
                            }}
                          >
                            <Badge
                              color={color}
                              variant={variant}
                              style={{ cursor: "pointer" }}
                            >
                              {props.getItemDisplay(item, key)}
                            </Badge>
                          </Command.Item>
                        );
                      })}
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

export const ComboboxTrigger = forwardRef(function ComboboxTrigger(
  props: {
    children: React.ReactNode;
    color?: RadixColor;
  },
  ref: React.Ref<HTMLButtonElement>
) {
  return (
    <Popover.Trigger>
      <button
        ref={ref}
        style={{ outlineColor: `var(--${props.color ?? "gray"}-9)` }}
        onKeyDown={(ev) => {
          if (["Space", "Enter"].includes(ev.key)) {
            ev.preventDefault();
            ev.stopPropagation();
            ev.currentTarget.click();
          }
        }}
      >
        <Badge
          variant="outline"
          color={props.color ?? "gray"}
          style={{ cursor: "pointer" }}
        >
          <Text>{props.children}</Text>
        </Badge>
      </button>
    </Popover.Trigger>
  );
});
