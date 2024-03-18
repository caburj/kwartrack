import {
  Button,
  Dialog,
  Flex,
  Separator,
  Switch,
  Text,
  TextField,
} from '@radix-ui/themes';
import { useState } from 'react';
import { createDisturber } from 'disturb';
import { boolean, minLength, object, optional, parse, string } from 'valibot';
import { Category } from '@/utils/derived_types';
import { TwoColumnInput, useDefaultPartitionInput } from '@/utils/common';

export const editCategory = createDisturber<
  { name: string; isPrivate: boolean; defaultCategoryId?: string },
  { category: Category; user: { id: string; dbname: string } }
>(function EditCategoryDialog({ category, user, confirmWith, cancel, open }) {
  const [categoryIsPrivate, setCategoryIsPrivate] = useState(
    category.is_private,
  );
  const { selectedDefaultPartition, inputEl } = useDefaultPartitionInput({
    user,
    categoryIsPrivate,
    defaultPartitionId: category.default_partition?.id,
  });
  const formId = `form-${category.id}`;
  return (
    <Dialog.Root open={open} onOpenChange={open => !open && cancel()}>
      <Dialog.Content style={{ maxWidth: 500 }}>
        <Dialog.Title>Edit category</Dialog.Title>
        <Separator size="4" mb="4" />
        <Flex direction="column" gap="3" asChild>
          <form
            id={formId}
            onSubmit={async e => {
              e.preventDefault();
              const form = document.getElementById(formId);
              const formdata = new FormData(form as HTMLFormElement);
              const schema = object({
                name: string([minLength(1)]),
                isPrivate: boolean(),
                defaultCategoryId: optional(string([minLength(1)])),
              });
              const fdata = Object.fromEntries(formdata.entries());
              const parsedData = parse(schema, {
                name: fdata.name,
                isPrivate: fdata.isPrivate === 'on',
                defaultCategoryId: selectedDefaultPartition?.id,
              });
              confirmWith(parsedData);
            }}
          >
            <TwoColumnInput>
              <Text as="div" size="2" weight="bold">
                Name
              </Text>
              <TextField.Input
                name="name"
                placeholder="Enter category name"
                defaultValue={category.name}
              />
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
          <Button type="submit" form={formId}>
            Save
          </Button>
          <Button variant="soft" color="gray" onClick={cancel}>
            Discard
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
});
