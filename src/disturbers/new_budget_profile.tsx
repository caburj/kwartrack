import {
  Badge,
  Button,
  Dialog,
  Flex,
  Separator,
  Switch,
  Text,
  TextField,
  Tooltip,
} from '@radix-ui/themes';
import { useMemo } from 'react';
import { createDisturber } from 'disturb';
import { boolean, object, parse, string } from 'valibot';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { useQueryClient } from '@tanstack/react-query';
import { TwoColumnInput, invalidateMany, usePartitions } from '@/utils/common';
import { rpc } from '@/app/rpc_client';
import { css } from '../../styled-system/css';

export const newBudgetProfile = createDisturber<
  null,
  {
    user: { id: string; dbname: string };
    partitionIds: string[];
  }
>(function NewBudgetProfileDialog({
  user,
  confirmWith,
  cancel,
  open,
  partitionIds,
}) {
  const queryClient = useQueryClient();

  const userPartitions = usePartitions(user);

  console.log('userPartitions', userPartitions);

  const selectedPartitions = useMemo(() => {
    return userPartitions.filter(p => partitionIds.includes(p.id));
  }, [userPartitions, partitionIds]);

  console.log('selectedPartitions', selectedPartitions);

  return (
    <Dialog.Root open={open} onOpenChange={open => !open && cancel()}>
      <Dialog.Content style={{ maxWidth: 500 }}>
        <Dialog.Title>New Budget Profile</Dialog.Title>
        <Separator size="4" mb="4" />
        <Flex direction="column" gap="3" asChild>
          <form
            id="budget-profile-form"
            onSubmit={async e => {
              e.preventDefault();

              const formdata = new FormData(e.target as HTMLFormElement);

              const parsedData = parse(
                object({ name: string(), isForAll: boolean() }),
                {
                  ...Object.fromEntries(formdata.entries()),
                  isForAll: formdata.get('isForAll') === 'on',
                },
              );

              const { name, isForAll } = parsedData;

              await rpc.post.createBudgetProfile({
                userId: user.id,
                dbname: user.dbname,
                isForAll,
                name,
                partitionIds: selectedPartitions.map(p => p.id),
              });
              invalidateMany(queryClient, [['budgetProfiles', user.id]]);
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
                Is for all?
              </Text>
              <Switch name="isForAll" defaultChecked={true} />
            </TwoColumnInput>

            <TwoColumnInput>
              <Flex align="center" gap="1">
                <Text size="2" mb="1" weight="bold">
                  Partitions
                </Text>
                <Tooltip
                  content={
                    <span>{'Corresponds to the selected partitions.'}</span>
                  }
                >
                  <InfoCircledIcon />
                </Tooltip>
              </Flex>
              <Flex
                gap="2"
                className={css({
                  flexWrap: 'wrap',
                })}
              >
                {selectedPartitions.map(p => (
                  <Badge key={p.id}>{`${p.account.label} - ${p.name}`}</Badge>
                ))}
              </Flex>
            </TwoColumnInput>
          </form>
        </Flex>
        <Separator size="4" mt="4" />
        <Flex gap="3" mt="4" justify="start" direction="row-reverse">
          <Button type="submit" form="budget-profile-form">
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
