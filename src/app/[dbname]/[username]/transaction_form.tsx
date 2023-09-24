import { rpc } from "@/app/rpc_client";
import { QueryResult, Unpacked, groupBy } from "@/utils/common";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { number, object, optional, string } from "valibot";
import { Box, Button, Flex, Grid, Popover, ScrollArea } from "@radix-ui/themes";
import { Command } from "cmdk";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";

function FormInput(props: {
  children: React.ReactNode;
  flexGrow?: number;
  width: string;
}) {
  return <div>{props.children}</div>;
}

type PartitionOption = Unpacked<
  NonNullable<Awaited<ReturnType<typeof rpc.post.getPartitionOptions>>>
>;

function PartitionOptGroup(props: {
  groupedPartitions: PartitionOption[];
  label: string;
  onlyPrivate: boolean;
}) {
  const { groupedPartitions, label, onlyPrivate } = props;
  return (
    <optgroup label={label}>
      {Object.entries(groupBy(groupedPartitions, (p) => p.account.id)).map(
        ([accountId, partitions]) => {
          const partitionsToShow = partitions.filter((p) =>
            onlyPrivate ? p.is_private : true
          );
          if (partitionsToShow.length === 0) return null;
          const options = [
            // insert at the beginning the account name
            {
              id: accountId,
              name: partitions[0].account.label,
              isDisabled: true,
            },
            ...partitionsToShow.map((p) => ({
              id: p.id,
              name: p.name,
              isDisabled: false,
            })),
          ];
          return options.map((p) => (
            <option key={p.id} value={p.id} disabled={p.isDisabled}>
              {p.name}
            </option>
          ));
        }
      )}
    </optgroup>
  );
}

type Category = Unpacked<
  NonNullable<Awaited<ReturnType<typeof rpc.post.getUserCategories>>>["expense"]
>;

const getCategoryOptionName = (category: Category) => {
  if (category.is_private) {
    return `${category.name} (Private)`;
  } else {
    return category.name;
  }
};

function CategoryComboBox(props: { user: { id: string; dbname: string } }) {
  const { user } = props;
  const categories = useQuery(["categories", user.id], () => {
    return rpc.post.getUserCategories({ userId: user.id, dbname: user.dbname });
  });

  const [open, setOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const categoryName = useMemo(() => {
    if (categories.data) {
      const selectedCategory = [
        ...categories.data.expense,
        ...categories.data.income,
        ...categories.data.transfer,
      ].find((c) => c.id === selectedCategoryId);
      if (selectedCategory) {
        return getCategoryOptionName(selectedCategory);
      }
    }
    return "Select Category";
  }, [categories, selectedCategoryId]);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger>
        <Button variant="outline" style={{ width: "200px" }}>
          {categoryName}
        </Button>
      </Popover.Trigger>
      <Popover.Content style={{ padding: "0px" }}>
        <Command loop className="linear">
          <Flex p="2" px="4" gap="1" className="border-b border-gray-200">
            <Grid align="center">
              <MagnifyingGlassIcon width="18" height="18" />
            </Grid>
            <Command.Input />
          </Flex>
          <ScrollArea
            scrollbars="vertical"
            style={{
              height: "200px",
              width: "200px",
            }}
          >
            <Box px="4" pb="4">
              <Command.List>
                <Command.Group heading="Income">
                  {categories.data?.income.map((c) => (
                    <Command.Item
                      key={c.id}
                      value={getCategoryOptionName(c)}
                      onSelect={(value) => {
                        setSelectedCategoryId(c.id);
                        setOpen(false);
                      }}
                    >
                      {getCategoryOptionName(c)}
                    </Command.Item>
                  ))}
                </Command.Group>
                <Command.Group heading="Expense">
                  {categories.data?.expense.map((c) => (
                    <Command.Item
                      key={c.id}
                      value={getCategoryOptionName(c)}
                      onSelect={(value) => {
                        setSelectedCategoryId(c.id);
                        setOpen(false);
                      }}
                    >
                      {getCategoryOptionName(c)}
                    </Command.Item>
                  ))}
                </Command.Group>
                <Command.Group heading="Transfer">
                  {categories.data?.transfer.map((c) => (
                    <Command.Item
                      key={c.id}
                      value={getCategoryOptionName(c)}
                      onSelect={(value) => {
                        setSelectedCategoryId(c.id);
                        setOpen(false);
                      }}
                    >
                      {getCategoryOptionName(c)}
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>
            </Box>
          </ScrollArea>
        </Command>
      </Popover.Content>
    </Popover.Root>
  );
}

export function TransactionForm({
  user,
}: {
  user: { id: string; dbname: string };
}) {
  const queryClient = useQueryClient();
  const partitions = useQuery(["partitions", user.id], () => {
    return rpc.post.getPartitionOptions({
      userId: user.id,
      dbname: user.dbname,
    });
  });
  const createTransaction = useMutation(rpc.post.createTransaction);
  const [inputCategoryKind, setInputCategoryKind] = useState("");
  const [inputCategoryIsPrivate, setInputCategoryIsPrivate] = useState(false);
  const [inputValue, setInputValue] = useState("");

  let value: number | undefined = undefined;
  try {
    value = parseFloat(inputValue);
  } catch (_error) {}

  type Partition = NonNullable<Unpacked<typeof partitions.data>>;

  const getPartitionOptions = (
    partitions: Partition[],
    userId: string,
    onlyPrivate: boolean
  ) => {
    const groupedPartitions = groupBy(partitions, (p) => {
      if (p.account.owners.length === 1 && p.account.owners[0].id === userId) {
        return "owned";
      } else if (
        p.account.owners.length > 1 &&
        p.account.owners.map((o) => o.id).includes(userId)
      ) {
        return "common";
      } else {
        return "others";
      }
    });

    const ownedPartitions = groupedPartitions.owned || [];
    const commonPartitions = groupedPartitions.common || [];
    const othersPartitions = groupedPartitions.others || [];
    return (
      <>
        <PartitionOptGroup
          label="-- Owned --"
          groupedPartitions={ownedPartitions}
          onlyPrivate={onlyPrivate}
        />
        <PartitionOptGroup
          label="-- Common --"
          groupedPartitions={commonPartitions}
          onlyPrivate={onlyPrivate}
        />
        <PartitionOptGroup
          label="-- Others --"
          groupedPartitions={othersPartitions}
          onlyPrivate={onlyPrivate}
        />
      </>
    );
  };

  const shouldDisableSubmit = () => {
    return !value || value <= 0 || isNaN(value) || createTransaction.isLoading;
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const target = event.target as HTMLFormElement;
    const formdata = new FormData(target as HTMLFormElement);
    const formObj = Object.fromEntries(formdata.entries());
    const dataSchema = object({
      sourcePartitionId: string(),
      destinationPartitionId: optional(string()),
      categoryId: string(),
      value: number(),
      description: optional(string()),
      userId: string(),
    });
    const parsedData = dataSchema.parse({
      ...formObj,
      userId: user.id,
      value,
    });
    const { transaction, counterpart } = await createTransaction.mutateAsync({
      ...parsedData,
      dbname: user.dbname,
    });
    target.reset();
    if (transaction) {
      setInputValue("");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({
        queryKey: ["categoryBalance", { categoryId: parsedData.categoryId }],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "categoryCanBeDeleted",
          { categoryId: parsedData.categoryId },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "partitionBalance",
          { partitionId: parsedData.sourcePartitionId },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "partitionCanBeDeleted",
          { partitionId: parsedData.sourcePartitionId },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "accountCanBeDeleted",
          { accountId: transaction.source_partition.account.id },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "accountBalance",
          { accountId: transaction.source_partition.account.id },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["categoryKindBalance", transaction.category.kind],
      });
    }
    if (counterpart) {
      queryClient.invalidateQueries({
        queryKey: [
          "partitionBalance",
          { partitionId: parsedData.destinationPartitionId },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "partitionCanBeDeleted",
          { partitionId: counterpart.source_partition.id },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "accountCanBeDeleted",
          { accountId: counterpart.source_partition.account.id },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "accountBalance",
          { accountId: counterpart.source_partition.account.id },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["categoryKindBalance", counterpart.category.kind],
      });
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <CategoryComboBox user={user} />
      <FormInput flexGrow={2} width="20%">
        <label htmlFor="sourcePartitionId">Source Partition</label>
        <QueryResult query={partitions}>
          {(partitions) => (
            <select
              name="sourcePartitionId"
              disabled={createTransaction.isLoading}
            >
              {getPartitionOptions(partitions, user.id, inputCategoryIsPrivate)}
            </select>
          )}
        </QueryResult>
      </FormInput>

      {inputCategoryKind == "Transfer" ? (
        <FormInput flexGrow={2} width="20%">
          <label htmlFor="destinationPartitionId">Destination Partition</label>
          <QueryResult query={partitions}>
            {(partitions) => (
              <select
                name="destinationPartitionId"
                disabled={createTransaction.isLoading}
              >
                {getPartitionOptions(
                  partitions,
                  user.id,
                  inputCategoryIsPrivate
                )}
              </select>
            )}
          </QueryResult>
        </FormInput>
      ) : null}
      <FormInput flexGrow={1} width="10%">
        <label htmlFor="value">Value</label>
        <input
          type="text"
          inputMode="numeric"
          name="value"
          value={inputValue}
          onInput={(event) => {
            setInputValue((event.target as HTMLInputElement).value);
          }}
          disabled={createTransaction.isLoading}
        />
      </FormInput>
      <FormInput flexGrow={4} width="40%">
        <label htmlFor="description">Description</label>
        <input
          type="text"
          name="description"
          disabled={createTransaction.isLoading}
        />
      </FormInput>
      <button type="submit" disabled={shouldDisableSubmit()}>
        Submit
      </button>
    </form>
  );
}
