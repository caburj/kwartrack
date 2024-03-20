import {
  Button,
  Dialog,
  Flex,
  Separator,
  Switch,
  Text,
  Select,
  TextField,
} from '@radix-ui/themes';
import { useState } from 'react';
import { createDisturber } from 'disturb';
import { boolean, minLength, object, optional, parse, string } from 'valibot';
import { useQueryClient } from '@tanstack/react-query';
import { TwoColumnInput, useDefaultPartitionInput } from '@/utils/common';
import { rpc } from '@/app/rpc_client';

const newCategorySchema = object({
  name: string([minLength(1)]),
  kind: string(),
  isPrivate: boolean(),
  defaultPartitionId: optional(string()),
});

type CategoryKind = 'Income' | 'Expense' | 'Transfer';

export const newCategory = createDisturber<
  null,
  {
    user: { id: string; dbname: string };
  }
>(function NewCategoryDialog({ user, confirmWith, cancel, open }) {
  const queryClient = useQueryClient();

  const [categoryKind, setCategoryKind] = useState<CategoryKind>('Income');

  const [categoryIsPrivate, setCategoryIsPrivate] = useState(false);

  const { selectedDefaultPartition, inputEl } = useDefaultPartitionInput({
    user,
    categoryIsPrivate,
  });

  return (
    <Dialog.Root open={open} onOpenChange={open => !open && cancel()}>
      <Dialog.Content style={{ maxWidth: 500 }}>
        <Dialog.Title>New Category</Dialog.Title>
        <Separator size="4" mb="4" />
        <Flex direction="column" gap="3" asChild>
          <form
            id="category-form"
            onSubmit={async e => {
              e.preventDefault();
              const formdata = new FormData(e.target as HTMLFormElement);
              const parsedData = parse(newCategorySchema, {
                ...Object.fromEntries(formdata.entries()),
                isPrivate: formdata.get('isPrivate') === 'on',
                defaultPartitionId: selectedDefaultPartition?.id,
              });
              const { name, kind, isPrivate, defaultPartitionId } = parsedData;
              await rpc.post.createCategory({
                userId: user.id,
                dbname: user.dbname,
                name,
                kind,
                isPrivate,
                defaultPartitionId,
              });
              queryClient.invalidateQueries({
                queryKey: ['categories', user.id],
              });
              confirmWith(null);
            }}
          >
            <TwoColumnInput>
              <Text as="div" size="2" weight="bold">
                Name
              </Text>
              <TextField.Input name="name" placeholder="Enter category name" />
            </TwoColumnInput>
            <TwoColumnInput>
              <Text as="div" size="2" weight="bold">
                Kind
              </Text>
              <Select.Root
                value={categoryKind}
                name="kind"
                onValueChange={(val: CategoryKind) => {
                  setCategoryKind(val);
                }}
              >
                <Select.Trigger variant="surface" />
                <Select.Content>
                  <Select.Item value="Income">Income</Select.Item>
                  <Select.Item value="Expense">Expense</Select.Item>
                  <Select.Item value="Transfer">Transfer</Select.Item>
                </Select.Content>
              </Select.Root>
            </TwoColumnInput>
            <TwoColumnInput>
              <Text as="div" size="2" weight="bold">
                Private
              </Text>
              <Switch
                name="isPrivate"
                checked={categoryIsPrivate}
                onClick={() => {
                  setCategoryIsPrivate(!categoryIsPrivate);
                }}
              />
            </TwoColumnInput>
            {inputEl}
          </form>
        </Flex>
        <Separator size="4" mt="4" />
        <Flex gap="3" mt="4" justify="start" direction="row-reverse">
          <Button type="submit" form="category-form">
            Save
          </Button>
          <Button variant="soft" color="gray" onClick={cancel}>
            Cancel
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
});
