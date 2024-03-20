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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TwoColumnInput, invalidateMany } from '@/utils/common';
import { rpc } from '@/app/rpc_client';

const newPartitionSchema = object({
  name: string([minLength(1)]),
  isPrivate: boolean(),
  accountId: string(),
  accountName: optional(string()),
  isSharedAccount: boolean(),
});

export const newPartition = createDisturber<
  null,
  {
    user: { id: string; dbname: string };
  }
>(function NewPartitionDialog({ user, confirmWith, cancel, open }) {
  const queryClient = useQueryClient();
  const ownedAccounts = useQuery(['accounts', user.id, true], () => {
    return rpc.post.getAccounts({
      userId: user.id,
      dbname: user.dbname,
      owned: true,
    });
  });
  const [accountId, setAccountId] = useState('for-new-account');
  return (
    <Dialog.Root open={open} onOpenChange={open => !open && cancel()}>
      <Dialog.Content style={{ maxWidth: 500 }}>
        <Dialog.Title>New Partition</Dialog.Title>
        <Separator size="4" mb="4" />
        <Flex direction="column" gap="3" asChild>
          <form
            id="partition-form"
            onSubmit={async e => {
              e.preventDefault();

              const formdata = new FormData(e.target as HTMLFormElement);

              const parsedData = parse(newPartitionSchema, {
                ...Object.fromEntries(formdata.entries()),
                isPrivate: formdata.get('isPrivate') === 'on',
                isSharedAccount: formdata.get('isSharedAccount') === 'on',
              });

              const {
                name,
                isPrivate,
                accountId,
                accountName,
                isSharedAccount,
              } = parsedData;

              let forNewAccount = false;
              if (accountId === 'for-new-account') {
                forNewAccount = true;
                if (!accountName?.trim()) {
                  throw new Error('Account name is required');
                }
              }
              await rpc.post.createPartition({
                userId: user.id,
                dbname: user.dbname,
                name,
                isPrivate,
                forNewAccount,
                accountId,
                isSharedAccount,
                newAccountName: accountName,
              });
              invalidateMany(queryClient, [
                ['accounts', user.id],
                ['partitions', user.id],
              ]);
              confirmWith(null);
            }}
          >
            <TwoColumnInput>
              <Text as="div" size="2" mb="1" weight="bold">
                Name
              </Text>
              <TextField.Input name="name" placeholder="Enter partition name" />
            </TwoColumnInput>

            <TwoColumnInput>
              <Text as="div" size="2" mb="1" weight="bold">
                Private
              </Text>
              <Switch name="isPrivate" />
            </TwoColumnInput>

            <TwoColumnInput>
              <Text as="div" size="2" mb="1" weight="bold">
                Account
              </Text>
              <Select.Root
                name="accountId"
                value={accountId}
                onValueChange={value => {
                  setAccountId(value);
                }}
              >
                <Select.Trigger variant="surface" />
                <Select.Content>
                  <Select.Item value="for-new-account">
                    Create New Account
                  </Select.Item>
                  {ownedAccounts.data && (
                    <Select.Group>
                      <Select.Label>My Accounts</Select.Label>
                      {ownedAccounts.data.map(acc => (
                        <Select.Item value={acc.id} key={acc.id}>
                          {acc.name}
                        </Select.Item>
                      ))}
                    </Select.Group>
                  )}
                </Select.Content>
              </Select.Root>
            </TwoColumnInput>

            {accountId === 'for-new-account' && (
              <>
                <TwoColumnInput>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Account Name
                  </Text>
                  <TextField.Input
                    name="accountName"
                    placeholder="E.g. InterBank"
                  />
                </TwoColumnInput>
                <TwoColumnInput>
                  <Text as="div" size="2" mb="1" weight="bold">
                    Shared?
                  </Text>
                  <Switch name="isSharedAccount" />
                </TwoColumnInput>
              </>
            )}
          </form>
        </Flex>
        <Separator size="4" mt="4" />
        <Flex gap="3" mt="4" justify="start" direction="row-reverse">
          <Button type="submit" form="partition-form">
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
