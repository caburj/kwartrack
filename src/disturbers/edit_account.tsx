import { createDisturber } from 'disturb';
import {
  Button,
  Dialog,
  Flex,
  Separator,
  Text,
  TextField,
} from '@radix-ui/themes';
import { minLength, object, parse, string } from 'valibot';
import { Account } from '@/utils/derived_types';
import { TwoColumnInput } from '@/utils/common';

export const editAccount = createDisturber<
  { name: string },
  { account: Account }
>(function EditAccountDialog({ account, confirmWith, cancel, open }) {
  const formId = `edit-account-form-${account.id}`;
  return (
    <Dialog.Root
      open={open}
      onOpenChange={open => {
        if (!open) {
          cancel();
        }
      }}
    >
      <Dialog.Content style={{ maxWidth: 500 }}>
        <Dialog.Title>Edit account</Dialog.Title>
        <Separator size="4" mb="4" />
        <Flex direction="column" gap="3" asChild>
          <form
            id={formId}
            onSubmit={async e => {
              e.preventDefault();
              const form = document.getElementById(formId);
              const formdata = new FormData(form as HTMLFormElement);
              const schema = object({ name: string([minLength(1)]) });
              const fdata = Object.fromEntries(formdata.entries());
              const parsedData = parse(schema, fdata);
              confirmWith(parsedData);
            }}
          >
            <TwoColumnInput>
              <Text as="div" size="2" mb="1" weight="bold">
                Name
              </Text>
              <TextField.Input
                name="name"
                placeholder="Enter account name"
                defaultValue={account.name}
              />
            </TwoColumnInput>
          </form>
        </Flex>
        <Separator size="4" mt="4" />
        <Flex gap="3" mt="4" justify="start" direction="row-reverse">
          <Dialog.Close type="submit" form={formId}>
            <Button>Save</Button>
          </Dialog.Close>
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Discard
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
});
