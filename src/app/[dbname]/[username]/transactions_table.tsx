import {
  QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useContext, useState } from "react";
import { UserPageStoreContext } from "./store";
import { rpc } from "@/app/rpc_client";
import {
  CATEGORY_COLOR,
  PARTITION_COLOR,
  Partitions,
  QueryResult,
  Unpacked,
  formatValue,
  getCategoryOptionName,
  getPartitionType,
  invalidateMany,
  useGroupedPartitions,
} from "@/utils/common";
import {
  Badge,
  Box,
  Flex,
  IconButton,
  Popover,
  Text,
  Table,
  TextField,
  ScrollArea,
} from "@radix-ui/themes";
import {
  Cross1Icon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from "@radix-ui/react-icons";
import { Combobox } from "./combobox";
import { css } from "../../../../styled-system/css";

type Transaction = Unpacked<
  NonNullable<Awaited<ReturnType<typeof rpc.post.findTransactions>>>[0]
>;
type Partition = Transaction["source_partition"];

function EditablePartitionBadge({
  partitions,
  transaction,
  partition,
  user,
  isCounterpart,
}: {
  partitions: Partitions;
  transaction: Transaction;
  partition: NonNullable<Partition>;
  user: { id: string; dbname: string };
  isCounterpart: boolean;
}) {
  const queryClient = useQueryClient();

  const updateTransaction = useMutation(
    async (arg: {
      transaction: Transaction;
      partitionId: string;
      isCounterpart: boolean;
    }) => {
      const { transaction, partitionId } = arg;
      if (
        isCounterpart
          ? transaction.counterpart?.source_partition.id === partitionId ?? true
          : transaction.source_partition?.id === partitionId ?? true
      ) {
        return;
      }

      const transactionId = isCounterpart
        ? transaction.counterpart?.id
        : transaction.id;

      if (!transactionId) {
        console.error("transactionId can't be undefined");
        return;
      }

      return rpc.post.updateTransaction({
        transactionId,
        partitionId,
        userId: user.id,
        dbname: user.dbname,
      });
    }
  );
  const _type = getPartitionType(partition, user.id);
  const color = PARTITION_COLOR[_type];
  const groupedPartitions = useGroupedPartitions(partitions, user.id);
  const selectedCategory = transaction.category;
  const variant = partition.is_private ? "outline" : "soft";
  return (
    <Combobox
      groupedItems={groupedPartitions}
      getGroupHeading={(key, items) => items[0].account.label}
      getItemColor={(item) => {
        const _type = getPartitionType(item, user.id);
        return PARTITION_COLOR[_type];
      }}
      isItemIncluded={(p) => !selectedCategory.is_private || p.is_private}
      getItemValue={(p) =>
        `${getPartitionType(p, user.id)} ${p.account.label} ${p.name}`
      }
      getItemDisplay={(p) => p.name}
      onSelectItem={async (par) => {
        await updateTransaction.mutateAsync({
          transaction,
          partitionId: par.id,
          isCounterpart,
        });
        invalidateMany(queryClient, [
          ["transactions"],
          ["partitionBalance", { partitionId: par.id }],
          ["partitionBalance", { partitionId: partition.id }],
          ["partitionCanBeDeleted", { partitionId: par.id }],
          ["partitionCanBeDeleted", { partitionId: partition.id }],
          ["accountBalance", { accountId: par.account.id }],
          ["accountBalance", { accountId: partition.account.id }],
        ]);
      }}
    >
      <Popover.Trigger>
        <Badge color={color} variant={variant} style={{ cursor: "pointer" }}>
          {partition.label}
        </Badge>
      </Popover.Trigger>
    </Combobox>
  );
}

function PartitionBadge({
  partitions,
  transaction,
  partition,
  user,
  isCounterpart,
}: {
  partitions: Partitions;
  transaction: Transaction;
  partition: Partition;
  user: { id: string; dbname: string };
  isCounterpart: boolean;
}) {
  if (partition) {
    return (
      <EditablePartitionBadge
        partitions={partitions}
        transaction={transaction}
        partition={partition}
        user={user}
        isCounterpart={isCounterpart}
      />
    );
  } else {
    return (
      <Badge color="gray" variant="outline">
        Private
      </Badge>
    );
  }
}

export function TransactionsTable({
  user,
}: {
  user: { id: string; dbname: string };
}) {
  const queryClient = useQueryClient();
  const [store, dispatch] = useContext(UserPageStoreContext);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const incrementPage = () => {
    setCurrentPage((currentPage) => currentPage + 1);
  };

  const decrementPage = () => {
    setCurrentPage((currentPage) => currentPage - 1);
  };

  const transactions = useQuery(["transactions", store, currentPage], () => {
    return rpc.post.findTransactions({
      currentPage,
      nPerPage: store.nPerPage,
      partitionIds: store.partitionIds,
      categoryIds: store.categoryIds,
      ownerId: user.id,
      dbname: user.dbname,
      tssDate: store.tssDate?.toISOString(),
      tseDate: store.tseDate?.toISOString(),
    });
  });

  const categories = useQuery(["categories", user.id], () => {
    return rpc.post.getUserCategories({ userId: user.id, dbname: user.dbname });
  });

  const partitions = useQuery(["partitions", user.id], () => {
    return rpc.post.getPartitionOptions({
      userId: user.id,
      dbname: user.dbname,
    });
  });

  const updateTransaction = useMutation(
    async (arg: { transaction: Transaction; categoryId: string }) => {
      const { transaction, categoryId } = arg;
      if (transaction.category.id === categoryId) return;
      return rpc.post.updateTransaction({
        transactionId: transaction.id,
        categoryId,
        userId: user.id,
        dbname: user.dbname,
      });
    }
  );

  const getPartitionColumn = (transaction: Transaction) => {
    if (transaction.kind === "Transfer") {
      return (
        <Flex>
          <PartitionBadge
            partitions={partitions.data ?? []}
            transaction={transaction}
            partition={transaction.source_partition}
            user={user}
            isCounterpart={false}
          />
          <Box px="1">
            <ArrowRightIcon width="16" height="16" />
          </Box>
          <PartitionBadge
            partitions={partitions.data ?? []}
            transaction={transaction}
            partition={transaction.counterpart?.source_partition || null}
            user={user}
            isCounterpart={true}
          />
        </Flex>
      );
    } else {
      return (
        <PartitionBadge
          partitions={partitions.data ?? []}
          transaction={transaction}
          partition={transaction.source_partition}
          user={user}
          isCounterpart={false}
        />
      );
    }
  };

  const shouldShowDelete = (transaction: Transaction) => {
    const transactions = [transaction, transaction.counterpart].filter(
      Boolean
    ) as Transaction[];
    return transactions.some((t) => t.source_partition?.account.is_owned);
  };

  return (
    <>
      <Flex justify="between" m="2">
        <Flex gap="3" align="center">
          <Text weight="medium">Items per page</Text>
          <TextField.Root>
            <TextField.Input
              placeholder="Search the docs…"
              type="number"
              min="1"
              max="100"
              value={store.nPerPage}
              onChange={(event) => {
                const value = parseInt(event.target.value);
                if (isNaN(value)) return;
                dispatch({ type: "SET_N_PER_PAGE", payload: value });
              }}
            />
          </TextField.Root>
        </Flex>
        <Flex gap="3" align="center">
          <IconButton
            onClick={decrementPage}
            disabled={transactions.isLoading || currentPage === 1}
          >
            <ArrowLeftIcon width="16" height="16" />
          </IconButton>
          <Text>{currentPage}</Text>
          <IconButton
            onClick={incrementPage}
            disabled={transactions.isLoading || !transactions.data?.[1]}
          >
            <ArrowRightIcon width="16" height="16" />
          </IconButton>
        </Flex>
      </Flex>
      <ScrollArea>
        <Table.Root variant="surface" size="1" mb="4">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Category</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Partition</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell justify="end">
                Value
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <QueryResult query={transactions}>
            {([transactions]) => (
              <Table.Body>
                {transactions.map((transaction) => {
                  const allowedCategories =
                    categories.data?.[transaction.category.kind] ?? [];
                  const variant = transaction.category.is_private
                    ? "outline"
                    : "soft";
                  return (
                    <Table.Row
                      key={transaction.id}
                      className={css({ "& td": { whiteSpace: "nowrap" } })}
                    >
                      <Table.Cell>{transaction.str_date.slice(5)}</Table.Cell>
                      <Table.Cell>
                        <Combobox
                          groupedItems={{
                            [transaction.category.kind]: allowedCategories,
                          }}
                          getGroupHeading={(key) => key}
                          getItemDisplay={(cat) => getCategoryOptionName(cat)}
                          getItemValue={(cat) =>
                            `${
                              transaction.category.kind
                            } ${getCategoryOptionName(cat)}`
                          }
                          getItemColor={(cat) => CATEGORY_COLOR[cat.kind]}
                          onSelectItem={async (cat) => {
                            await updateTransaction.mutateAsync({
                              transaction,
                              categoryId: cat.id,
                            });
                            invalidateMany(queryClient, [
                              ["transactions"],
                              [
                                "categoryBalance",
                                { categoryId: transaction.category.id },
                              ],
                              ["categoryBalance", { categoryId: cat.id }],
                              [
                                "categoryCanBeDeleted",
                                { categoryId: transaction.category.id },
                              ],
                              ["categoryCanBeDeleted", { categoryId: cat.id }],
                            ]);
                          }}
                        >
                          <Popover.Trigger>
                            <Badge
                              color={CATEGORY_COLOR[transaction.category.kind]}
                              variant={variant}
                              style={{ cursor: "pointer" }}
                            >
                              {transaction.category.name}
                            </Badge>
                          </Popover.Trigger>
                        </Combobox>
                      </Table.Cell>
                      <Table.Cell>{getPartitionColumn(transaction)}</Table.Cell>
                      <Table.Cell justify="end">
                        {formatValue(Math.abs(parseFloat(transaction.value)))}
                      </Table.Cell>
                      <Table.Cell style={{ minWidth: "300px" }}>
                        {transaction.description}
                      </Table.Cell>
                      <Table.Cell>
                        {shouldShowDelete(transaction) && (
                          <IconButton
                            variant="ghost"
                            color="crimson"
                            onClick={async () => {
                              setIsDeleting(true);
                              await rpc.post.deleteTransaction({
                                transactionId: transaction.id,
                                userId: user.id,
                                dbname: user.dbname,
                              });
                              const queryKeys: QueryKey[] = [
                                ["transactions"],
                                ["user", user.id],
                                [
                                  "categoryCanBeDeleted",
                                  { categoryId: transaction.category.id },
                                ],
                                [
                                  "categoryBalance",
                                  {
                                    categoryId: transaction.category.id,
                                  },
                                ],
                                [
                                  "categoryKindBalance",
                                  transaction.category.kind,
                                ],
                              ];
                              if (transaction.source_partition) {
                                queryKeys.push(
                                  [
                                    "partitionBalance",
                                    {
                                      partitionId:
                                        transaction.source_partition.id,
                                    },
                                  ],
                                  [
                                    "partitionCanBeDeleted",
                                    {
                                      partitionId:
                                        transaction.source_partition.id,
                                    },
                                  ],
                                  [
                                    "accountCanBeDeleted",
                                    {
                                      accountId:
                                        transaction.source_partition.account.id,
                                    },
                                  ],
                                  [
                                    "accountBalance",
                                    {
                                      accountId:
                                        transaction.source_partition.account.id,
                                    },
                                  ]
                                );
                              }
                              if (transaction.counterpart) {
                                queryKeys.push(
                                  [
                                    "partitionBalance",
                                    {
                                      partitionId:
                                        transaction.counterpart.source_partition
                                          .id,
                                    },
                                  ],
                                  [
                                    "partitionCanBeDeleted",
                                    {
                                      partitionId:
                                        transaction.counterpart.source_partition
                                          .id,
                                    },
                                  ],
                                  [
                                    "accountCanBeDeleted",
                                    {
                                      accountId:
                                        transaction.counterpart.source_partition
                                          .account.id,
                                    },
                                  ],
                                  [
                                    "accountBalance",
                                    {
                                      accountId:
                                        transaction.counterpart.source_partition
                                          .account.id,
                                    },
                                  ]
                                );
                              }
                              invalidateMany(queryClient, queryKeys);
                              setIsDeleting(false);
                            }}
                            disabled={isDeleting}
                          >
                            <Cross1Icon width="16" height="16" />
                          </IconButton>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            )}
          </QueryResult>
        </Table.Root>
      </ScrollArea>
    </>
  );
}
