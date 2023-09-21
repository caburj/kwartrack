"use client";

import {
  MouseEventHandler,
  ReactHTML,
  ReactNode,
  useContext,
  useState,
} from "react";
import { rpc } from "../../rpc_client";
import {
  type UseQueryResult,
  useQuery,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";
import {
  boolean,
  minLength,
  number,
  object,
  optional,
  string,
  type Input,
} from "valibot";
import { UserPageStoreProvider, UserPageStoreContext } from "./store";
import { Unpacked, formatValue, groupBy } from "@/utils/common";
import { DialogProvider, useDialog } from "@/utils/useDialog";
import {
  Box,
  Flex,
  IconButton,
  ScrollArea,
  Table,
  Text,
  Checkbox,
  Separator,
  textPropDefs,
} from "@radix-ui/themes";
import { Cross1Icon, PlusIcon } from "@radix-ui/react-icons";

export default function Main(props: {
  params: { username: string; dbname: string };
}) {
  const { username, dbname } = props.params;
  return (
    <UserPageStoreProvider>
      <UserPage username={username} dbname={dbname} />
    </UserPageStoreProvider>
  );
}

export function UserPage({
  username,
  dbname,
}: {
  username: string;
  dbname: string;
}) {
  const user = useQuery(["user", username], () => {
    return rpc.post.findUser({ username, dbname });
  });
  return (
    <QueryResult
      query={user}
      onLoading={<>Loading {`${username}'s accounts`}...</>}
      onUndefined={<>{`${username}'s data`} not found</>}
    >
      {(user) => (
        <Flex gap="3">
          <DialogProvider>
            <SideBar user={user} />
          </DialogProvider>
          <Box
            position="fixed"
            top="0"
            right="0"
            bottom="0"
            style={{
              left: "350px",
            }}
          >
            <ScrollArea type="always" scrollbars="vertical">
              <Flex direction="column" p="2" pr="4">
                <TransactionForm user={user} />
                <Transactions user={user} />
              </Flex>
            </ScrollArea>
          </Box>
        </Flex>
      )}
    </QueryResult>
  );
}

type FindUserResult = NonNullable<
  Unpacked<Awaited<ReturnType<typeof rpc.post.findUser>>>
>;

function SectionLabel(props: {
  children: React.ReactNode;
  onClickPlus?: () => void;
}) {
  return (
    <Flex align="center" justify="between" p="2" px="4">
      <Text size="4" weight="bold">
        {props.children}
      </Text>
      <IconButton
        mr="2"
        variant="ghost"
        onClick={(event) => {
          event.stopPropagation();
          if (props.onClickPlus) {
            return props.onClickPlus();
          }
        }}
      >
        <PlusIcon width="18" height="18" />
      </IconButton>
    </Flex>
  );
}

const DialogLayout = (props: { children: ReactNode }) => {
  return (
    <div>
      <div>{props.children}</div>
    </div>
  );
};

const newPartitionSchema = object({
  name: string([minLength(1)]),
  isPrivate: boolean(),
  accountId: string(),
  accountName: optional(string()),
  isSharedAccount: boolean(),
});

function PartitionForm(props: {
  close: () => void;
  confirm: (data: Input<typeof newPartitionSchema>) => void;
  user: FindUserResult;
}) {
  const { user, close, confirm } = props;
  const ownedAccounts = useQuery(["accounts", user.id, true], () => {
    return rpc.post.getAccounts({
      userId: user.id,
      dbname: user.dbname,
      owned: true,
    });
  });
  const [accountId, setAccountId] = useState("for-new-account");
  return (
    <DialogLayout>
      <form
        id="partition-form"
        onSubmit={(e) => {
          e.preventDefault();
          const formdata = new FormData(e.target as HTMLFormElement);
          const parsedData = newPartitionSchema.parse({
            ...Object.fromEntries(formdata.entries()),
            isPrivate: formdata.get("isPrivate") === "on",
            isSharedAccount: formdata.get("isSharedAccount") === "on",
          });
          confirm(parsedData);
        }}
      >
        <label htmlFor="name">Partition Name</label>
        <input type="text" name="name" placeholder="E.g. Savings" />
        <label htmlFor="isPrivate">Private</label>
        <input type="checkbox" name="isPrivate" />
        <label htmlFor="accountId">Account</label>
        <select
          name="accountId"
          onChange={(e) => {
            setAccountId(e.target.value);
          }}
          defaultValue={accountId}
        >
          <option value="for-new-account">Create New Account</option>
          {ownedAccounts.data && (
            <optgroup label="My Accounts">
              {ownedAccounts.data.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        {accountId === "for-new-account" && (
          <>
            <label htmlFor="accountName">Account Name</label>
            <input
              type="text"
              name="accountName"
              placeholder="E.g. InterBank"
            />
            <label htmlFor="isSharedAccount">Shared Account</label>
            <input type="checkbox" name="isSharedAccount" />
          </>
        )}
      </form>
      <div>
        <button type="submit" form="partition-form">
          Confirm
        </button>
        <button onClick={close}>Cancel</button>
      </div>
    </DialogLayout>
  );
}

const newCategorySchema = object({
  name: string([minLength(1)]),
  kind: string(),
  isPrivate: boolean(),
});

function CategoryModal(props: {
  close: () => void;
  confirm: (data: Input<typeof newCategorySchema>) => void;
}) {
  const { close, confirm } = props;
  return (
    <DialogLayout>
      <form
        id="category-form"
        onSubmit={(e) => {
          e.preventDefault();
          const formdata = new FormData(e.target as HTMLFormElement);
          const parsedData = newCategorySchema.parse({
            ...Object.fromEntries(formdata.entries()),
            isPrivate: formdata.get("isPrivate") === "on",
          });
          confirm(parsedData);
        }}
      >
        <label htmlFor="name">Name</label>
        <input type="text" name="name" placeholder="E.g. Salary" />
        <label htmlFor="kind">Kind</label>
        <select name="kind" defaultValue="Expense">
          <option value="Income">Income</option>
          <option value="Expense">Expense</option>
          <option value="Transfer">Transfer</option>
        </select>
        <label htmlFor="isPrivate">Private</label>
        <input type="checkbox" name="isPrivate" />
      </form>
      <div>
        <button type="submit" form="category-form">
          Confirm
        </button>
        <button onClick={close}>Cancel</button>
      </div>
    </DialogLayout>
  );
}

function SideBar({ user }: { user: FindUserResult }) {
  const queryClient = useQueryClient();
  const showCategoryDialog = useDialog(CategoryModal);
  const showPartitionDialog = useDialog(PartitionForm, { user });

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      bottom="0"
      style={{ minWidth: "350px" }}
    >
      <Flex direction="column" height="100%">
        <ScrollArea type="always" scrollbars="vertical">
          <SectionLabel
            onClickPlus={async () => {
              const response = await showPartitionDialog(true);
              if (!response) return;
              const {
                name,
                isPrivate,
                accountId,
                accountName,
                isSharedAccount,
              } = response;
              let forNewAccount = false;
              if (accountId === "for-new-account") {
                forNewAccount = true;
                if (!accountName?.trim()) {
                  throw new Error("Account name is required");
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
              queryClient.invalidateQueries({
                queryKey: ["accounts", user.id],
              });
              queryClient.invalidateQueries({
                queryKey: ["partitions", user.id],
              });
            }}
          >
            Accounts
          </SectionLabel>
          <Accounts user={user} />
          <SectionLabel
            onClickPlus={async () => {
              const userAction = await showCategoryDialog();
              if (userAction) {
                const { name, kind, isPrivate } = userAction;
                await rpc.post.createCategory({
                  userId: user.id,
                  dbname: user.dbname,
                  name,
                  kind,
                  isPrivate,
                });
                queryClient.invalidateQueries({
                  queryKey: ["categories", user.id],
                });
              }
            }}
          >
            Categories
          </SectionLabel>
          <Categories user={user} />
        </ScrollArea>
        <DateRange user={user} />
      </Flex>
    </Box>
  );
}

type Account = Unpacked<
  NonNullable<Awaited<ReturnType<typeof rpc.post.getAccounts>>>
>;

function AccountLI({
  account,
  user,
}: {
  account: Account;
  user: { id: string; dbname: string };
}) {
  const queryClient = useQueryClient();
  const canBeDeleted = useQuery(
    ["accountCanBeDeleted", { accountId: account.id }],
    () => {
      return rpc.post.accountCanBeDeleted({
        accountId: account.id,
        dbname: user.dbname,
        userId: user.id,
      });
    }
  );
  const deleteAccount = useMutation(
    () => {
      return rpc.post.deleteAccount({
        accountId: account.id,
        dbname: user.dbname,
        userId: user.id,
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["accounts", user.id],
        });
      },
    }
  );
  const [store, dispatch] = useContext(UserPageStoreContext);
  return (
    <Box px="4" mb="1" key={account.id}>
      <Flex
        pr="2"
        justify="between"
        onClick={() => {
          dispatch({
            type: "TOGGLE_ACCOUNT",
            payload: account.partitions.map((p) => p.id),
          });
        }}
      >
        <Flex align="center" gap="1">
          <Text style={{ cursor: "pointer" }} weight="medium">
            {account.label}
          </Text>
          {canBeDeleted.data && (
            <DeleteButton
              onClick={async (e) => {
                e.stopPropagation();
                await deleteAccount.mutateAsync();
              }}
            />
          )}
        </Flex>
        <LoadingValue
          queryKey={[
            "accountBalance",
            {
              accountId: account.id,
            },
          ]}
          valueLoader={() =>
            rpc.post.getAccountBalance({
              accountId: account.id,
              userId: user.id,
              dbname: user.dbname,
            })
          }
        />
      </Flex>
      <Partitions accountId={account.id} user={user} />
    </Box>
  );
}

const getAccountGroup = (
  account: Account,
  userId: string
): "owned" | "common" | "others" => {
  if (account.owners.length === 1 && account.owners[0].id === userId) {
    return "owned";
  } else if (
    account.owners.length > 1 &&
    account.owners.map((o) => o.id).includes(userId)
  ) {
    return "common";
  } else {
    return "others";
  }
};

function GroupedAccounts(props: {
  title: string;
  accounts: Account[];
  user: { id: string; dbname: string };
  showTitle: boolean;
}) {
  const { title, accounts, user, showTitle } = props;
  return (
    <>
      {showTitle && (
        <Flex justify="center" align="center" mb="1">
          <Separator size="3" />
          <Box px="4">
            <Text size="1" weight="medium">
              {title.toUpperCase()}
            </Text>
          </Box>
          <Separator size="3" />
        </Flex>
      )}
      <Box>
        {accounts.map((account) => (
          <AccountLI account={account} user={user} key={account.id} />
        ))}
      </Box>
    </>
  );
}

function Accounts({ user }: { user: { id: string; dbname: string } }) {
  const accounts = useQuery(["accounts", user.id, false], () => {
    return rpc.post.getAccounts({
      userId: user.id,
      dbname: user.dbname,
      owned: false,
    });
  });
  return (
    <QueryResult
      query={accounts}
      onLoading={<>Loading accounts...</>}
      onUndefined={<>No accounts found</>}
    >
      {(accounts) => {
        const groupedAccounts = groupBy(accounts, (account) => {
          return getAccountGroup(account, user.id);
        });
        const showTitle =
          Object.values(groupedAccounts).filter(
            (accounts) => accounts.length > 0
          ).length > 1;
        return (
          <>
            {groupedAccounts.owned && (
              <GroupedAccounts
                title="Owned"
                accounts={groupedAccounts.owned || []}
                user={user}
                showTitle={showTitle}
              />
            )}
            {groupedAccounts.common && (
              <GroupedAccounts
                title="Common"
                accounts={groupedAccounts.common || []}
                user={user}
                showTitle={showTitle}
              />
            )}
            {groupedAccounts.others && (
              <GroupedAccounts
                title="Others"
                accounts={groupedAccounts.others || []}
                user={user}
                showTitle={showTitle}
              />
            )}
          </>
        );
      }}
    </QueryResult>
  );
}

function DeleteButton(props: {
  onClick: MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <IconButton color="crimson" variant="ghost" onClick={props.onClick}>
      <Cross1Icon />
    </IconButton>
  );
}

type Partition = Unpacked<
  NonNullable<Awaited<ReturnType<typeof rpc.post.getPartitions>>>
>;

function PartitionLI({
  partition,
  user,
}: {
  partition: Partition;
  user: { id: string; dbname: string };
}) {
  const queryClient = useQueryClient();
  const [store, dispatch] = useContext(UserPageStoreContext);
  const [name, setName] = useState(partition.name);
  const deletePartition = useMutation(
    () => {
      return rpc.post.deletePartition({
        partitionId: partition.id,
        dbname: user.dbname,
        userId: user.id,
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["partitions", user.id, partition.account.id],
        });
        queryClient.invalidateQueries({
          queryKey: [
            "accountCanBeDeleted",
            { accountId: partition.account.id },
          ],
        });
      },
    }
  );
  const canBeDeleted = useQuery(
    ["partitionCanBeDeleted", { partitionId: partition.id }],
    () => {
      return rpc.post.partitionCanBeDeleted({
        partitionId: partition.id,
        dbname: user.dbname,
        userId: user.id,
      });
    }
  );
  const updatePartition = useMutation(
    (name: string) => {
      return rpc.post.updatePartition({
        partitionId: partition.id,
        dbname: user.dbname,
        userId: user.id,
        name,
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["partitions", user.id],
        });
      },
    }
  );
  const isSelected = store.partitionIds.includes(partition.id);
  const color = isSelected ? "blue" : undefined;
  return (
    <Flex pr="2" justify="between">
      <Box grow="1">
        <Flex gap="1" align="center">
          <Checkbox
            mr="1"
            onClick={() => {
              dispatch({ type: "TOGGLE_PARTITIONS", payload: [partition.id] });
            }}
            checked={isSelected}
          />
          {/* TODO: Allow editing the partition. */}
          <Text align="center" color={color}>
            {partition.name}
          </Text>
          {canBeDeleted.data && (
            <DeleteButton
              onClick={async (e) => {
                e.stopPropagation();
                await deletePartition.mutateAsync();
              }}
            />
          )}
        </Flex>
      </Box>
      <LoadingValue
        color={color}
        queryKey={[
          "partitionBalance",
          {
            partitionId: partition.id,
          },
        ]}
        valueLoader={() =>
          rpc.post.getPartitionBalance({
            partitionId: partition.id,
            userId: user.id,
            dbname: user.dbname,
          })
        }
      />
    </Flex>
  );
}

function Partitions(props: {
  accountId: string;
  user: { id: string; dbname: string };
}) {
  const { accountId, user } = props;
  const partitions = useQuery(["partitions", user.id, accountId], () => {
    return rpc.post.getPartitions({
      accountId,
      userId: user.id,
      dbname: user.dbname,
    });
  });
  return (
    <QueryResult
      query={partitions}
      onLoading={<>Loading partitions...</>}
      onUndefined={<>No partitions found</>}
    >
      {(partitions) => (
        <Box>
          {partitions.map((partition) => (
            <PartitionLI partition={partition} user={user} key={partition.id} />
          ))}
        </Box>
      )}
    </QueryResult>
  );
}

function Categories({ user }: { user: { id: string; dbname: string } }) {
  const queryClient = useQueryClient();
  const categories = useQuery(["categories", user.id], () => {
    return rpc.post.getUserCategories({ userId: user.id, dbname: user.dbname });
  });
  const [store, dispatch] = useContext(UserPageStoreContext);
  const selectCategories = (kind: string) => {
    if (kind === "Income") {
      if (categories?.data?.income) {
        dispatch({
          type: "TOGGLE_CATEGORY_KIND",
          payload: categories.data.income.map((c) => c.id),
        });
      }
    } else if (kind === "Expense") {
      if (categories?.data?.expense) {
        dispatch({
          type: "TOGGLE_CATEGORY_KIND",
          payload: categories.data.expense.map((c) => c.id),
        });
      }
    } else if (kind === "Transfer") {
      if (categories?.data?.transfer) {
        dispatch({
          type: "TOGGLE_CATEGORY_KIND",
          payload: categories.data.transfer.map((c) => c.id),
        });
      }
    }
  };
  return (
    <>
      <QueryResult
        query={categories}
        onLoading={<>Loading categories...</>}
        onUndefined={<>No categories found</>}
      >
        {(categories) => (
          <Flex direction="column" px="4">
            <Flex
              pr="2"
              justify="between"
              onClick={() => selectCategories("Income")}
            >
              <Text>Income</Text>
              <LoadingValue
                queryKey={["categoryKindBalance", "Income"]}
                valueLoader={() =>
                  rpc.post.getCategoryKindBalance({
                    kind: "Income",
                    userId: user.id,
                    dbname: user.dbname,
                  })
                }
              />
            </Flex>
            <Box mb="2">
              {categories.income.map((category) => (
                <Category key={category.id} category={category} user={user} />
              ))}
            </Box>
            <Flex
              pr="2"
              justify="between"
              onClick={() => selectCategories("Expense")}
            >
              <Text>Expense</Text>
              <LoadingValue
                queryKey={["categoryKindBalance", "Expense"]}
                valueLoader={() =>
                  rpc.post.getCategoryKindBalance({
                    kind: "Expense",
                    userId: user.id,
                    dbname: user.dbname,
                  })
                }
              />
            </Flex>
            <Box mb="2">
              {categories.expense.map((category) => (
                <Category key={category.id} category={category} user={user} />
              ))}
            </Box>
            <Flex
              pr="2"
              justify="between"
              onClick={() => selectCategories("Transfer")}
            >
              <Text>Transfer</Text>
              <LoadingValue
                queryKey={["categoryKindBalance", "Transfer"]}
                valueLoader={() =>
                  rpc.post.getCategoryKindBalance({
                    kind: "Transfer",
                    userId: user.id,
                    dbname: user.dbname,
                  })
                }
              />
            </Flex>
            <Box mb="2">
              {categories.transfer.map((category) => (
                <Category key={category.id} category={category} user={user} />
              ))}
            </Box>
          </Flex>
        )}
      </QueryResult>
    </>
  );
}

function Category({
  category,
  user,
}: {
  category: { id: string; name: string };
  user: { id: string; dbname: string };
}) {
  const queryClient = useQueryClient();
  const [store, dispatch] = useContext(UserPageStoreContext);
  const [name, setName] = useState(category.name);
  const canBeDeleted = useQuery(
    ["categoryCanBeDeleted", { categoryId: category.id }],
    () => {
      return rpc.post.categoryCanBeDeleted({
        categoryId: category.id,
        dbname: user.dbname,
        userId: user.id,
      });
    }
  );
  const deleteCategory = useMutation(
    () => {
      return rpc.post.deleteCategory({
        categoryId: category.id,
        dbname: user.dbname,
        userId: user.id,
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["categories", user.id] });
      },
    }
  );
  const updateCategory = useMutation((name: string) => {
    return rpc.post.updateCategory({
      categoryId: category.id,
      dbname: user.dbname,
      userId: user.id,
      name,
    });
  });
  const color = store.categoryIds.includes(category.id) ? "blue" : undefined;
  const isSelected = store.categoryIds.includes(category.id);
  return (
    <Flex justify="between" pr="2">
      <Flex gap="1" align="center">
        <Checkbox
          mr="1"
          onClick={() => {
            dispatch({ type: "TOGGLE_CATEGORIES", payload: [category.id] });
          }}
          checked={isSelected}
        />
        <Text align="center" color={color}>
          {category.name}
        </Text>
        {canBeDeleted.data && (
          <DeleteButton
            onClick={async (e) => {
              e.stopPropagation();
              await deleteCategory.mutateAsync();
            }}
          />
        )}
      </Flex>
      <LoadingValue
        queryKey={[
          "categoryBalance",
          {
            categoryId: category.id,
          },
        ]}
        valueLoader={() =>
          rpc.post.getCategoryBalance({
            userId: user.id,
            categoryId: category.id,
            dbname: user.dbname,
          })
        }
      />
    </Flex>
  );
}

function Transactions({ user }: { user: { id: string; dbname: string } }) {
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

  type Transaction = Unpacked<NonNullable<typeof transactions.data>[0]>;

  const getPartitionColumn = (transaction: Transaction) => {
    if (transaction.kind === "Transfer") {
      if (transaction.counterpart) {
        return `${transaction.source_partition.label} -> ${transaction.counterpart.source_partition.label}`;
      } else {
        return `${transaction.source_partition.label} -> private partition`;
      }
    } else {
      return transaction.source_partition.label;
    }
  };

  const shouldHideDelete = (transaction: Transaction) => {
    const partitions = [transaction.source_partition];
    if (transaction.counterpart) {
      partitions.push(transaction.counterpart.source_partition);
    }
    return !partitions.some((p) =>
      p.account.owners.map((o) => o.id).includes(user.id)
    );
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
                        <span>
                          <span>{transaction.category.name}</span>
                        </span>
                      </Table.Cell>
                      <Table.Cell>{getPartitionColumn(transaction)}</Table.Cell>
                      <Table.Cell justify="end">
                        {formatValue(parseFloat(transaction.value))}
                      </Table.Cell>
                      <Table.Cell>{transaction.description}</Table.Cell>
                      <Table.Cell>
                        <IconButton
                          variant="ghost"
                          color="crimson"
                          hidden={shouldHideDelete(transaction)}
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
                                "partitionBalance",
                                {
                                  partitionId: transaction.source_partition.id,
                                },
                              ],
                            });
                            queryClient.invalidateQueries({
                              queryKey: [
                                "partitionCanBeDeleted",
                                {
                                  partitionId: transaction.source_partition.id,
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

function TransactionForm({ user }: { user: { id: string; dbname: string } }) {
  const queryClient = useQueryClient();
  const [store] = useContext(UserPageStoreContext);
  const partitions = useQuery(["partitions", user.id], () => {
    return rpc.post.getPartitionOptions({
      userId: user.id,
      dbname: user.dbname,
    });
  });
  const categories = useQuery(["categories", user.id], () => {
    return rpc.post.getUserCategories({ userId: user.id, dbname: user.dbname });
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
  type Category = Unpacked<
    NonNullable<Unpacked<typeof categories.data>>["expense"]
  >;

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

  const getCategoryOptionName = (category: Category) => {
    if (category.is_private) {
      return `${category.name} (Private)`;
    } else {
      return category.name;
    }
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
      <FormInput flexGrow={2} width="20%">
        <label htmlFor="categoryId">Category</label>
        <QueryResult query={categories}>
          {(categories) => (
            <select
              name="categoryId"
              onChange={(event) => {
                const selectedCategory = [
                  ...categories.income,
                  ...categories.expense,
                  ...categories.transfer,
                ].find((c) => c.id === event.target.value);
                if (!selectedCategory) return;
                setInputCategoryKind(selectedCategory.kind);
                setInputCategoryIsPrivate(selectedCategory.is_private);
              }}
              disabled={createTransaction.isLoading}
            >
              <optgroup label="Income">
                {categories.income.map((c) => (
                  <option key={c.id} value={c.id}>
                    {getCategoryOptionName(c)}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Expenses">
                {categories.expense.map((c) => (
                  <option key={c.id} value={c.id}>
                    {getCategoryOptionName(c)}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Transfers">
                {categories.transfer.map((c) => (
                  <option key={c.id} value={c.id}>
                    {getCategoryOptionName(c)}
                  </option>
                ))}
              </optgroup>
            </select>
          )}
        </QueryResult>
      </FormInput>
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

function DateRange({ user }: { user: { id: string; dbname: string } }) {
  const [store, dispatch] = useContext(UserPageStoreContext);
  return (
    <Flex direction="column" gap="1" px="4" py="2">
      <Flex justify="between">
        <label htmlFor="startDate">Start Date</label>
        <input
          type="date"
          name="startDate"
          value={store.tssDate?.toISOString().split("T")[0] ?? ""}
          onChange={(event) => {
            dispatch({
              type: "SET_TSS_DATE",
              payload: event.target.value
                ? new Date(event.target.value)
                : undefined,
            });
          }}
        />
      </Flex>
      <Flex justify="between">
        <label htmlFor="endDate">End Date</label>
        <input
          type="date"
          name="endDate"
          value={store.tseDate?.toISOString().split("T")[0] ?? ""}
          onChange={(event) => {
            dispatch({
              type: "SET_TSE_DATE",
              payload: event.target.value
                ? new Date(event.target.value)
                : undefined,
            });
          }}
        />
      </Flex>
    </Flex>
  );
}

type Color = (typeof textPropDefs)["color"]["values"][number];

function LoadingValue(props: {
  color?: Color;
  queryKey: [string, ...any];
  valueLoader: () => Promise<string>;
}) {
  return (
    <QueryResult
      query={useQuery(props.queryKey, props.valueLoader)}
      onLoading={<>...</>}
      onUndefined={<>Missing Value</>}
    >
      {(value) => {
        const parsedValue = parseFloat(value);
        let result;
        if (isNaN(parsedValue)) {
          result = value;
        } else {
          result = formatValue(parsedValue);
        }
        return <Text color={props.color}>{result}</Text>;
      }}
    </QueryResult>
  );
}

function QueryResult<T>(props: {
  as?: keyof ReactHTML;
  className?: string;
  query: UseQueryResult<T>;
  children: (data: NonNullable<T>) => React.ReactNode;
  onLoading?: React.ReactNode;
  onUndefined?: React.ReactNode;
  onError?: (error: Error) => React.ReactNode;
}) {
  const { data, isLoading, isError } = props.query;
  const { as: Tag } = props;
  let node: React.ReactNode;
  if (isLoading) {
    node = props.onLoading;
  } else if (isError) {
    node = props.onError ? props.onError(props.query.error as Error) : null;
  } else if (!data) {
    node = props.onUndefined;
  } else {
    node = props.children(data);
  }
  if (Tag === undefined) return <>{node}</>;
  return <Tag className={props.className}>{node}</Tag>;
}
