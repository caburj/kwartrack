import {
  Badge,
  Button,
  Dialog,
  Flex,
  Separator,
  Text,
  TextField,
} from '@radix-ui/themes';
import { createDisturber } from 'disturb';
import { minLength, object, optional, parse, string, transform } from 'valibot';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  CATEGORY_COLOR,
  PARTITION_COLOR,
  TwoColumnInput,
  getCategoryOptionName,
  getPartitionType,
  useGroupedPartitions,
  usePartitions,
} from '@/utils/common';
import { Partition } from '@/utils/derived_types';
import {
  Combobox,
  ComboboxTrigger,
} from '@/app/[username]/expense-tracker/combobox';
import { getPartitionType2 } from '@/app/[username]/expense-tracker/side_bar';
import { rpc } from '@/app/rpc_client';

export const getLoanInput = createDisturber<
  {
    amount: number;
    categoryId: string;
    destinationPartitionId: string;
    description?: string;
    toPay?: number;
  },
  {
    partition: Partition;
    user: { id: string; dbname: string };
    partitionIds: string[];
  }
>(function GetLoanInputDialog({
  confirmWith,
  cancel,
  open,
  partition,
  user,
  partitionIds,
}) {
  const formId = `form-${partition.id}`;
  const partitions = usePartitions(user);
  const categories = useQuery(['categories', user.id], () => {
    return rpc.post.getUserCategories({ userId: user.id, dbname: user.dbname });
  });
  const groupedPartitions = useGroupedPartitions(partitions);
  const [selectedDestinationId, setSelectedDestinationId] = useState('');
  const [loanCategoryId, setLoanCategoryId] = useState('');
  const isSelected = partitionIds.includes(partition.id);
  const variant = isSelected
    ? 'solid'
    : partition.is_private
    ? 'outline'
    : 'soft';
  const _type = getPartitionType2(partition);
  const color = isSelected ? 'cyan' : PARTITION_COLOR[_type];

  const selectedDestination = useMemo(() => {
    return partitions.find(p => p.id === selectedDestinationId);
  }, [selectedDestinationId, partitions]);

  const destinationName = selectedDestination?.name || 'Select destination';

  const destinationVariant = selectedDestination?.is_private
    ? 'outline'
    : 'soft';

  const destinationType =
    selectedDestination && getPartitionType(selectedDestination);

  const destinationColor =
    (destinationType && PARTITION_COLOR[destinationType]) || 'gray';

  const loanCategory = useMemo(() => {
    return (categories.data?.Transfer || []).find(c => c.id === loanCategoryId);
  }, [loanCategoryId, categories.data]);

  const loanCategoryName = loanCategory
    ? getCategoryOptionName(loanCategory)
    : 'Select Category';

  const loanCategoryColor = loanCategory && CATEGORY_COLOR[loanCategory.kind];
  const loanCategoryVariant = loanCategory?.is_private ? 'outline' : 'soft';

  return (
    <Dialog.Root open={open} onOpenChange={open => !open && cancel()}>
      <Dialog.Content style={{ maxWidth: 500 }}>
        <Dialog.Title>Make a Loan</Dialog.Title>
        <Separator size="4" mb="4" />
        <Flex direction="column" gap="3" asChild>
          <form
            id={formId}
            onSubmit={async e => {
              e.preventDefault();
              const form = document.getElementById(formId);
              const formdata = new FormData(form as HTMLFormElement);
              const schema = object({
                amount: transform(string(), v => parseFloat(v)),
                description: optional(string()),
                toPay: transform(string(), v => parseFloat(v)),
                destinationPartitionId: string([minLength(1)]),
                categoryId: string([minLength(1)]),
              });
              const toParse = {
                toPay: '',
                ...Object.fromEntries(formdata.entries()),
                destinationPartitionId: selectedDestinationId,
                categoryId: loanCategoryId,
              };
              const parsedData = parse(schema, toParse);
              if (isNaN(parsedData.toPay)) {
                parsedData.toPay = parsedData.amount;
              }
              confirmWith(parsedData);
            }}
          >
            <TwoColumnInput>
              <Text as="div" size="2" mb="1" weight="bold">
                Source
              </Text>
              <Flex>
                <Badge variant={variant} color={color}>
                  <Text>{partition.name}</Text>
                </Badge>
              </Flex>
            </TwoColumnInput>
            <TwoColumnInput>
              <Text as="div" size="2" mb="1" weight="bold">
                Destination
              </Text>
              <Combobox
                groupedItems={groupedPartitions}
                getGroupHeading={(key, items) => items[0].account.label}
                getItemColor={item => {
                  const _type = getPartitionType(item);
                  return PARTITION_COLOR[_type];
                }}
                isItemIncluded={p =>
                  p.account.is_owned && p.id !== partition.id
                }
                getItemValue={p =>
                  `${getPartitionType(p)} ${p.account.label} ${p.name}`
                }
                getItemDisplay={p => p.name}
                onSelectItem={p => setSelectedDestinationId(p.id)}
              >
                <Flex>
                  <ComboboxTrigger
                    color={destinationColor}
                    variant={destinationVariant}
                  >
                    {destinationName}
                  </ComboboxTrigger>
                </Flex>
              </Combobox>
            </TwoColumnInput>
            <TwoColumnInput>
              <Text as="div" size="2" mb="1" weight="bold">
                Category
              </Text>
              <Combobox
                groupedItems={{ Transfer: categories.data?.Transfer || [] }}
                getGroupHeading={key => key}
                getItemColor={(item, key) => {
                  return CATEGORY_COLOR[key];
                }}
                getItemValue={(c, k) => `${k} ${getCategoryOptionName(c)}`}
                getItemDisplay={c => getCategoryOptionName(c)}
                onSelectItem={c => {
                  setLoanCategoryId(c.id);
                }}
              >
                <Flex>
                  <ComboboxTrigger
                    color={loanCategoryColor}
                    variant={loanCategoryVariant}
                  >
                    {loanCategoryName}
                  </ComboboxTrigger>
                </Flex>
              </Combobox>
            </TwoColumnInput>
            <TwoColumnInput>
              <Text as="div" size="2" mb="1" weight="bold">
                Amount
              </Text>
              <TextField.Input
                name="amount"
                placeholder="Amount to borrow"
                type="numeric"
              />
            </TwoColumnInput>
            <TwoColumnInput>
              <Text as="div" size="2" mb="1" weight="bold">
                Description
              </Text>
              <TextField.Input
                name="description"
                placeholder="Enter description"
              />
            </TwoColumnInput>
            <TwoColumnInput>
              <Text as="div" size="2" mb="1" weight="bold">
                To pay
              </Text>
              <TextField.Input
                name="toPay"
                placeholder="Amount to pay"
                type="numeric"
              />
            </TwoColumnInput>
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
