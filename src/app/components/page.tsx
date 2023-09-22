"use client";

import { useState } from "react";
import { Command } from "cmdk";
import {
  Text,
  Box,
  ScrollArea,
  Flex,
  Avatar,
  Button,
  TextArea,
  Checkbox,
  ContextMenu,
  Dialog,
  TextField,
  Popover,
} from "@radix-ui/themes";
import { ChatBubbleIcon } from "@radix-ui/react-icons";

const randomStrings = [
  "This is a pig",
  "This is a dog",
  "That was full",
  "This is a cow",
  "Full metal alchepig",
  "This is a cat",
  "I am a pig",
  "I am a dog",
  "food is good",
  "I am a cow",
  "I am a cat",
  "All the world's a stage",
  "I am a bird",
  "hitting two birds with one stone",
  "I am a fish",
  "I am a human",
  "I am a robot",
];

export default function CommandMenu() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("unselected");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger>
          <span>{selected}</span>
        </Popover.Trigger>
        <Popover.Content>
          <Command label="Global Command Menu" loop>
            <Command.Input
              onValueChange={(search) => {
                setSearch(search);
              }}
            />
            <ScrollArea
              type="always"
              scrollbars="vertical"
              style={{ height: 180 }}
            >
              <Command.List>
                <Command.Empty>No results found.</Command.Empty>
                {randomStrings.map((str) => (
                  <Command.Item
                    key={str}
                    onSelect={(value) => {
                      setSelected(value);
                      setOpen(false);
                    }}
                  >
                    <Text>{str}</Text>
                  </Command.Item>
                ))}
              </Command.List>
            </ScrollArea>
          </Command>
        </Popover.Content>
      </Popover.Root>
      <div>
        <Text>Search: {search}</Text>
        <div>Selected: {selected}</div>
        <ContextMenu.Root>
          <ContextMenu.Trigger>
            <Box>
              <Text>Right click me</Text>
            </Box>
          </ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.Item shortcut="⌘ E">Edit</ContextMenu.Item>
            <ContextMenu.Item shortcut="⌘ D">Duplicate</ContextMenu.Item>
            <ContextMenu.Separator />
            <ContextMenu.Item shortcut="⌘ N">Archive</ContextMenu.Item>

            <ContextMenu.Sub>
              <ContextMenu.SubTrigger>More</ContextMenu.SubTrigger>
              <ContextMenu.SubContent>
                <ContextMenu.Item>Move to project…</ContextMenu.Item>
                <ContextMenu.Item>Move to folder…</ContextMenu.Item>
                <ContextMenu.Separator />
                <ContextMenu.Item>Advanced options…</ContextMenu.Item>
              </ContextMenu.SubContent>
            </ContextMenu.Sub>

            <ContextMenu.Separator />
            <ContextMenu.Item>Share</ContextMenu.Item>
            <ContextMenu.Item>Add to favorites</ContextMenu.Item>
            <ContextMenu.Separator />
            <ContextMenu.Item shortcut="⌘ ⌫" color="red">
              Delete
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Root>
        <Dialog.Root>
          <Dialog.Trigger>
            <Button>Edit profile</Button>
          </Dialog.Trigger>
          <Dialog.Content style={{ maxWidth: 450 }}>
            <Dialog.Title>Edit profile</Dialog.Title>
            <Dialog.Description size="2" mb="4">
              Make changes to your profile.
            </Dialog.Description>
            <Flex direction="column" gap="3">
              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  Name
                </Text>
                <TextField.Input
                  defaultValue="Freja Johnsen"
                  placeholder="Enter your full name"
                />
              </label>
              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  Email
                </Text>
                <TextField.Input
                  defaultValue="freja@example.com"
                  placeholder="Enter your email"
                />
              </label>
            </Flex>
            <Flex gap="3" mt="4" justify="end">
              <Dialog.Close>
                <Button variant="soft" color="gray">
                  Cancel
                </Button>
              </Dialog.Close>
              <Dialog.Close>
                <Button>Save</Button>
              </Dialog.Close>
            </Flex>
          </Dialog.Content>
        </Dialog.Root>
        <Popover.Root>
          <Popover.Trigger>
            <Button variant="soft">
              <ChatBubbleIcon width="16" height="16" />
              Comment
            </Button>
          </Popover.Trigger>
          <Popover.Content style={{ width: 360 }}>
            <Flex gap="3">
              <Avatar
                size="2"
                src="https://images.unsplash.com/photo-1607346256330-dee7af15f7c5?&w=64&h=64&dpr=2&q=70&crop=focalpoint&fp-x=0.67&fp-y=0.5&fp-z=1.4&fit=crop"
                fallback="A"
                radius="full"
              />
              <Box grow="1">
                <TextArea
                  placeholder="Write a comment…"
                  style={{ height: 80 }}
                />
                <Flex gap="3" mt="3" justify="between">
                  <Flex align="center" gap="2" asChild>
                    <label>
                      <Checkbox />
                      <Text size="2">Send to group</Text>
                    </label>
                  </Flex>
                  <Popover.Close>
                    <Button size="1">Comment</Button>
                  </Popover.Close>
                </Flex>
              </Box>
            </Flex>
          </Popover.Content>
        </Popover.Root>
      </div>
    </>
  );
}
