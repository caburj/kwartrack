import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext, useState } from "react";
import { UserPageStoreContext } from "./store";
import { rpc } from "@/app/rpc_client";
import {
  CATEGORY_COLOR,
  PARTITION_COLOR,
  QueryResult,
  Unpacked,
  formatValue,
  getPartitionType,
} from "@/utils/common";
import { Badge, Box, Flex, IconButton, Table } from "@radix-ui/themes";
import { Cross1Icon, ArrowRightIcon } from "@radix-ui/react-icons";

type Transaction = Unpacked<
  NonNullable<Awaited<ReturnType<typeof rpc.post.findTransactions>>>[0]
>;
type Partition = Transaction["source_partition"];

function PartitionBadge({
  partition,
  user,
}: {
  partition: Partition;
  user: { id: string; dbname: string };
}) {
  if (partition) {
    const _type = getPartitionType(partition, user.id);
    const color = PARTITION_COLOR[_type];
    return <Badge color={color}>{partition.label}</Badge>;
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

  const getPartitionColumn = (transaction: Transaction) => {
    if (transaction.kind === "Transfer") {
      return (
        <Flex>
          <PartitionBadge
            partition={transaction.source_partition}
            user={user}
          />
          <Box px="1">
            <ArrowRightIcon width="16" height="16" />
          </Box>
          <PartitionBadge
            partition={transaction.counterpart?.source_partition || null}
            user={user}
          />
        </Flex>
      );
    } else {
      return (
        <PartitionBadge partition={transaction.source_partition} user={user} />
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
      <div>
        <span>Items per page</span>
        <input
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
        <button
          onClick={decrementPage}
          disabled={transactions.isLoading || currentPage === 1}
        >
          Prev
        </button>
        <span>{currentPage}</span>
        <button
          onClick={incrementPage}
          disabled={transactions.isLoading || !transactions.data?.[1]}
        >
          Next
        </button>
      </div>
      <div>
        <Table.Root variant="surface" size="1">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell width="7%">Date</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell width="13%">
                Category
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell width="37%">
                Partition
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell width="10%" justify="end">
                Value
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell width="3%"></Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <QueryResult query={transactions}>
            {([transactions]) => (
              <Table.Body>
                {transactions.map((transaction) => {
                  return (
                    <Table.Row key={transaction.id}>
                      <Table.Cell>{transaction.str_date.slice(5)}</Table.Cell>
                      <Table.Cell>
                        <Badge
                          color={CATEGORY_COLOR[transaction.category.kind]}
                        >
                          {transaction.category.name}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>{getPartitionColumn(transaction)}</Table.Cell>
                      <Table.Cell justify="end">
                        {formatValue(Math.abs(parseFloat(transaction.value)))}
                      </Table.Cell>
                      <Table.Cell>{transaction.description}</Table.Cell>
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
                              queryClient.invalidateQueries({
                                queryKey: ["transactions"],
                              });
                              queryClient.invalidateQueries({
                                queryKey: ["user", user.id],
                              });
                              queryClient.invalidateQueries({
                                queryKey: [
                                  "categoryCanBeDeleted",
                                  { categoryId: transaction.category.id },
                                ],
                              });
                              queryClient.invalidateQueries({
                                queryKey: [
                                  "categoryBalance",
                                  {
                                    categoryId: transaction.category.id,
                                  },
                                ],
                              });
                              queryClient.invalidateQueries({
                                queryKey: [
                                  "categoryKindBalance",
                                  transaction.category.kind,
                                ],
                              });
                              if (transaction.source_partition) {
                                queryClient.invalidateQueries({
                                  queryKey: [
                                    "partitionBalance",
                                    {
                                      partitionId:
                                        transaction.source_partition.id,
                                    },
                                  ],
                                });
                                queryClient.invalidateQueries({
                                  queryKey: [
                                    "partitionCanBeDeleted",
                                    {
                                      partitionId:
                                        transaction.source_partition.id,
                                    },
                                  ],
                                });
                                queryClient.invalidateQueries({
                                  queryKey: [
                                    "accountCanBeDeleted",
                                    {
                                      accountId:
                                        transaction.source_partition.account.id,
                                    },
                                  ],
                                });
                                queryClient.invalidateQueries({
                                  queryKey: [
                                    "accountBalance",
                                    {
                                      accountId:
                                        transaction.source_partition.account.id,
                                    },
                                  ],
                                });
                              }
                              if (transaction.counterpart) {
                                queryClient.invalidateQueries({
                                  queryKey: [
                                    "partitionBalance",
                                    {
                                      partitionId:
                                        transaction.counterpart.source_partition
                                          .id,
                                    },
                                  ],
                                });

                                queryClient.invalidateQueries({
                                  queryKey: [
                                    "partitionCanBeDeleted",
                                    {
                                      partitionId:
                                        transaction.counterpart.source_partition
                                          .id,
                                    },
                                  ],
                                });

                                queryClient.invalidateQueries({
                                  queryKey: [
                                    "accountCanBeDeleted",
                                    {
                                      accountId:
                                        transaction.counterpart.source_partition
                                          .account.id,
                                    },
                                  ],
                                });
                                queryClient.invalidateQueries({
                                  queryKey: [
                                    "accountBalance",
                                    {
                                      accountId:
                                        transaction.counterpart.source_partition
                                          .account.id,
                                    },
                                  ],
                                });
                              }
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
      </div>
    </>
  );
}
