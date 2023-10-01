"use client";

import { rpc } from "../../rpc_client";
import { css } from "../../../../styled-system/css";
import {
  MouseEventHandler,
  useContext,
  useState,
  useRef,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { boolean, minLength, object, optional, string } from "valibot";
import { UserPageStoreContext } from "./store";
import {
  CATEGORY_COLOR,
  PARTITION_COLOR,
  QueryResult,
  RadixColor,
  Unpacked,
  formatValue,
  groupBy,
  invalidateMany,
} from "@/utils/common";
import {
  Box,
  Flex,
  IconButton,
  ScrollArea,
  Text,
  Separator,
  Dialog,
  TextField,
  Button,
  Select,
  Switch,
  Grid,
  ContextMenu,
  Badge,
} from "@radix-ui/themes";
import { ChevronRightIcon, Cross1Icon, PlusIcon } from "@radix-ui/react-icons";
import * as Accordion from "@radix-ui/react-accordion";

type FindUserResult = NonNullable<
  Unpacked<Awaited<ReturnType<typeof rpc.post.findUser>>>
>;

type Account = Unpacked<
  NonNullable<Awaited<ReturnType<typeof rpc.post.getAccounts>>>
>;

type Partition = Unpacked<
  NonNullable<Awaited<ReturnType<typeof rpc.post.getPartitions>>>
>;

type Category = Awaited<
  ReturnType<typeof rpc.post.getUserCategories>
>["Income"][number];

const newPartitionSchema = object({
  name: string([minLength(1)]),
  isPrivate: boolean(),
  accountId: string(),
  accountName: optional(string()),
  isSharedAccount: boolean(),
});

const newCategorySchema = object({
  name: string([minLength(1)]),
  kind: string(),
  isPrivate: boolean(),
});

export function SideBar({ user }: { user: FindUserResult }) {
  const queryClient = useQueryClient();
  const categoryFormRef = useRef<HTMLFormElement>(null);
  const partitionFormRef = useRef<HTMLFormElement>(null);
  const ownedAccounts = useQuery(["accounts", user.id, true], () => {
    return rpc.post.getAccounts({
      userId: user.id,
      dbname: user.dbname,
      owned: true,
    });
  });
  const [accountId, setAccountId] = useState("for-new-account");
  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      bottom="0"
      style={{
        minWidth: "350px",
        borderRight: "1px solid var(--gray-a5)",
        backgroundColor: "var(--gray-a2)",
      }}
    >
      <Flex direction="column" height="100%">
        <ScrollArea scrollbars="vertical">
          <Accordion.Root
            type="multiple"
            defaultValue={["accounts", "categories"]}
          >
            <Accordion.Item
              value="accounts"
              className={css({
                "&[data-state=open]": {
                  borderBottom: "1px solid var(--gray-a6)",
                },
              })}
            >
              <Accordion.Header>
                <Flex
                  align="center"
                  justify="between"
                  py="1"
                  px="4"
                  className={css({
                    borderBottom: "1px solid var(--gray-a6)",
                    backgroundColor: "var(--gray-a3)",
                  })}
                >
                  <Accordion.Trigger>
                    <Text
                      size="3"
                      weight="bold"
                      className={css({ cursor: "pointer" })}
                    >
                      Accounts
                    </Text>
                  </Accordion.Trigger>
                  <Dialog.Root>
                    <Dialog.Trigger>
                      <IconButton radius="full" variant="ghost">
                        <PlusIcon width="18" height="18" />
                      </IconButton>
                    </Dialog.Trigger>
                    <Dialog.Content style={{ maxWidth: 500 }}>
                      <Dialog.Title>New Partition</Dialog.Title>
                      <Separator size="4" mb="4" />
                      <Flex direction="column" gap="3" asChild>
                        <form
                          id="partition-form"
                          ref={partitionFormRef}
                          onSubmit={async (e) => {
                            e.preventDefault();

                            const formdata = new FormData(
                              e.target as HTMLFormElement
                            );

                            const parsedData = newPartitionSchema.parse({
                              ...Object.fromEntries(formdata.entries()),
                              isPrivate: formdata.get("isPrivate") === "on",
                              isSharedAccount:
                                formdata.get("isSharedAccount") === "on",
                            });

                            const {
                              name,
                              isPrivate,
                              accountId,
                              accountName,
                              isSharedAccount,
                            } = parsedData;

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
                            invalidateMany(queryClient, [
                              ["accounts", user.id],
                              ["partitions", user.id],
                            ]);
                          }}
                        >
                          <TwoColumnInput>
                            <Text as="div" size="2" mb="1" weight="bold">
                              Name
                            </Text>
                            <TextField.Input
                              name="name"
                              placeholder="Enter partition name"
                            />
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
                              onValueChange={(value) => {
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
                                    {ownedAccounts.data.map((acc) => (
                                      <Select.Item value={acc.id} key={acc.id}>
                                        {acc.name}
                                      </Select.Item>
                                    ))}
                                  </Select.Group>
                                )}
                              </Select.Content>
                            </Select.Root>
                          </TwoColumnInput>

                          {accountId === "for-new-account" && (
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
                      <Flex
                        gap="3"
                        mt="4"
                        justify="start"
                        direction="row-reverse"
                      >
                        <Dialog.Close type="submit" form="partition-form">
                          <Button>Save</Button>
                        </Dialog.Close>
                        <Dialog.Close>
                          <Button variant="soft" color="gray">
                            Cancel
                          </Button>
                        </Dialog.Close>
                      </Flex>
                    </Dialog.Content>
                  </Dialog.Root>
                </Flex>
              </Accordion.Header>
              <AnimatedAccordionContent>
                <Accounts user={user} />
              </AnimatedAccordionContent>
            </Accordion.Item>
            <Accordion.Item value="categories">
              <Accordion.Header>
                <Flex
                  align="center"
                  justify="between"
                  py="1"
                  px="4"
                  mb="1"
                  className={css({
                    borderBottom: "1px solid var(--gray-a6)",
                    backgroundColor: "var(--gray-a3)",
                  })}
                >
                  <Accordion.Trigger>
                    <Text
                      size="3"
                      weight="bold"
                      className={css({ cursor: "pointer" })}
                    >
                      Categories
                    </Text>
                  </Accordion.Trigger>
                  <Dialog.Root>
                    <Dialog.Trigger>
                      <IconButton radius="full" variant="ghost">
                        <PlusIcon width="18" height="18" />
                      </IconButton>
                    </Dialog.Trigger>
                    <Dialog.Content style={{ maxWidth: 500 }}>
                      <Dialog.Title>New Category</Dialog.Title>
                      <Separator size="4" mb="4" />
                      <Flex direction="column" gap="3" asChild>
                        <form
                          id="category-form"
                          ref={categoryFormRef}
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const formdata = new FormData(
                              e.target as HTMLFormElement
                            );
                            const parsedData = newCategorySchema.parse({
                              ...Object.fromEntries(formdata.entries()),
                              isPrivate: formdata.get("isPrivate") === "on",
                            });
                            const { name, kind, isPrivate } = parsedData;
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
                          }}
                        >
                          <TwoColumnInput>
                            <Text as="div" size="2" mb="1" weight="bold">
                              Name
                            </Text>
                            <TextField.Input
                              name="name"
                              placeholder="Enter category name"
                            />
                          </TwoColumnInput>
                          <TwoColumnInput>
                            <Text as="div" size="2" mb="1" weight="bold">
                              Kind
                            </Text>
                            <Select.Root defaultValue="Income" name="kind">
                              <Select.Trigger variant="surface" />
                              <Select.Content>
                                <Select.Item value="Income">Income</Select.Item>
                                <Select.Item value="Expense">
                                  Expense
                                </Select.Item>
                                <Select.Item value="Transfer">
                                  Transfer
                                </Select.Item>
                              </Select.Content>
                            </Select.Root>
                          </TwoColumnInput>
                          <TwoColumnInput>
                            <Text as="div" size="2" mb="1" weight="bold">
                              Private
                            </Text>
                            <Switch name="isPrivate" />
                          </TwoColumnInput>
                        </form>
                      </Flex>
                      <Separator size="4" mt="4" />
                      <Flex
                        gap="3"
                        mt="4"
                        justify="start"
                        direction="row-reverse"
                      >
                        <Dialog.Close type="submit" form="category-form">
                          <Button>Save</Button>
                        </Dialog.Close>
                        <Dialog.Close>
                          <Button variant="soft" color="gray">
                            Cancel
                          </Button>
                        </Dialog.Close>
                      </Flex>
                    </Dialog.Content>
                  </Dialog.Root>
                </Flex>
              </Accordion.Header>
              <AnimatedAccordionContent>
                <Categories user={user} />
              </AnimatedAccordionContent>
            </Accordion.Item>
          </Accordion.Root>
        </ScrollArea>
        <DateRange user={user} />
      </Flex>
    </Box>
  );
}

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

  const rightClickItems = [
    ...(canBeDeleted.data
      ? [
          {
            label: "Delete",
            color: "red" as RadixColor,
            onClick: (e) => {
              e.stopPropagation();
              return deleteAccount.mutateAsync();
            },
          } as RightClickItem,
        ]
      : []),
  ];

  const partitions = useQuery(["partitions", user.id, account.id], () => {
    return rpc.post.getPartitions({
      accountId: account.id,
      userId: user.id,
      dbname: user.dbname,
    });
  });
  const [store, dispatch] = useContext(UserPageStoreContext);

  const areAllPartitionsSelected = useMemo(() => {
    if (partitions?.data && partitions.data.length > 0) {
      return partitions.data.every((p) => store.partitionIds.includes(p.id));
    }
    return false;
  }, [partitions?.data, store.partitionIds]);

  const accountGroup = getAccountGroup(account, user.id);

  return (
    <QueryResult query={partitions}>
      {(partitions) => {
        return (
          <FoldableList
            groupedItems={{ [account.id]: partitions }}
            openValues={accountGroup !== "others" ? [account.id] : []}
            getHeaderExtraContent={() => {
              return (
                <LoadingValue
                  expect={(value) => value >= 0}
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
              );
            }}
            getHeaderLabel={() => {
              return (
                <WithRightClick rightClickItems={rightClickItems}>
                  <Text
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      dispatch({
                        type: "TOGGLE_ACCOUNT",
                        payload: account.partitions.map((p) => p.id),
                      });
                    }}
                    weight="medium"
                    color={areAllPartitionsSelected ? "cyan" : undefined}
                  >
                    {account.label}
                  </Text>
                </WithRightClick>
              );
            }}
          >
            {(partition) => {
              return (
                <PartitionLI
                  partition={partition}
                  user={user}
                  key={partition.id}
                />
              );
            }}
          </FoldableList>
        );
      }}
    </QueryResult>
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
        const sortedAccounts = [
          ...(groupedAccounts.owned || []),
          ...(groupedAccounts.common || []),
          ...(groupedAccounts.others || []),
        ];
        return sortedAccounts.map((account) => (
          <AccountLI account={account} user={user} key={account.id} />
        ));
      }}
    </QueryResult>
  );
}

// TODO: Refactor this. This is just the same as getPartitionType from common.
export function getPartitionType(
  p: Partition,
  userId: string
): "owned" | "common" | "others" {
  if (p.owners.length === 1 && p.owners[0].id === userId) {
    return "owned";
  } else if (
    p.owners.length > 1 &&
    p.owners.map((o) => o.id).includes(userId)
  ) {
    return "common";
  }
  return "others";
}

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
        invalidateMany(queryClient, [
          ["partitions", user.id, partition.account.id],
          ["accountCanBeDeleted", { accountId: partition.account.id }],
        ]);
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
  const rightClickItems = [
    ...(canBeDeleted.data
      ? [
          {
            label: "Delete",
            color: "red" as RadixColor,
            onClick: (e) => {
              e.stopPropagation();
              return deletePartition.mutateAsync();
            },
          } as RightClickItem,
        ]
      : []),
  ];
  const isSelected = store.partitionIds.includes(partition.id);
  const variant = partition.is_private ? "outline" : "soft";
  const _type = getPartitionType(partition, user.id);
  const color = PARTITION_COLOR[_type];
  return (
    <Flex justify="between">
      <Flex gap="2">
        <Box
          pl="1"
          className={css({
            backgroundColor: isSelected
              ? "var(--cyan-8)"
              : canBeDeleted.data
              ? "var(--red-8)"
              : "var(--gray-a6)",
          })}
        />
        <WithRightClick rightClickItems={rightClickItems}>
          <Badge
            my="1"
            color={color}
            variant={variant}
            style={{ cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              dispatch({ type: "TOGGLE_PARTITIONS", payload: [partition.id] });
            }}
          >
            {partition.name}
          </Badge>
        </WithRightClick>
      </Flex>
      <LoadingValue
        expect={(value) => value >= 0}
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

function categoryValueProps({
  value,
  kind,
  defaultWeight,
}: {
  value: string;
  kind: string;
  defaultWeight: "medium" | "regular";
}) {
  const parsedValue = parseFloat(value);
  let color: RadixColor;
  let weight: "medium" | "bold" | "regular" = defaultWeight;
  let asExpected = false;
  if (kind === "Income") {
    asExpected = parsedValue >= 0;
  } else if (kind === "Expense") {
    asExpected = parsedValue <= 0;
  } else {
    asExpected = parsedValue === 0;
  }
  if (!asExpected) {
    color = "red";
    weight = "bold";
  }
  let result;
  if (isNaN(parsedValue)) {
    result = value;
  } else {
    result = formatValue(asExpected ? Math.abs(parsedValue) : parsedValue);
  }
  return {
    color,
    weight,
    formatted: result,
  };
}

function CategoryValue(props: {
  value: string;
  kind: string;
  defaultWeight: "medium" | "regular";
}) {
  const { color, weight, formatted } = categoryValueProps(props);
  return (
    <Text color={color} weight={weight}>
      {formatted}
    </Text>
  );
}

function Categories({ user }: { user: { id: string; dbname: string } }) {
  const categories = useQuery(["categories", user.id], () => {
    return rpc.post.getUserCategories({ userId: user.id, dbname: user.dbname });
  });
  const [store, dispatch] = useContext(UserPageStoreContext);
  const selectCategories = (kind: string) => {
    if (kind === "Income") {
      if (categories?.data?.Income) {
        dispatch({
          type: "TOGGLE_CATEGORY_KIND",
          payload: categories.data.Income.map((c) => c.id),
        });
      }
    } else if (kind === "Expense") {
      if (categories?.data?.Expense) {
        dispatch({
          type: "TOGGLE_CATEGORY_KIND",
          payload: categories.data.Expense.map((c) => c.id),
        });
      }
    } else if (kind === "Transfer") {
      if (categories?.data?.Transfer) {
        dispatch({
          type: "TOGGLE_CATEGORY_KIND",
          payload: categories.data.Transfer.map((c) => c.id),
        });
      }
    }
  };

  const areAllCategoriesSelected = useCallback(
    (kind: string) => {
      if (kind === "Income") {
        if (categories?.data?.Income) {
          return categories.data.Income.every((c) =>
            store.categoryIds.includes(c.id)
          );
        }
      } else if (kind === "Expense") {
        if (categories?.data?.Expense) {
          return categories.data.Expense.every((c) =>
            store.categoryIds.includes(c.id)
          );
        }
      } else if (kind === "Transfer") {
        if (categories?.data?.Transfer) {
          return categories.data.Transfer.every((c) =>
            store.categoryIds.includes(c.id)
          );
        }
      }
      return false;
    },
    [categories?.data, store.categoryIds]
  );

  return (
    <>
      <QueryResult
        query={categories}
        onLoading={<>Loading categories...</>}
        onUndefined={<>No categories found</>}
      >
        {(categories) => (
          <FoldableList
            groupedItems={categories}
            openValues={["Income", "Expense", "Transfer"]}
            getHeaderExtraContent={(kind) => (
              <GenericLoadingValue
                queryKey={["categoryKindBalance", kind]}
                valueLoader={() =>
                  rpc.post.getCategoryKindBalance({
                    kind,
                    userId: user.id,
                    dbname: user.dbname,
                  })
                }
              >
                {(value) => (
                  <CategoryValue
                    value={value}
                    kind={kind}
                    defaultWeight="medium"
                  />
                )}
              </GenericLoadingValue>
            )}
            getHeaderLabel={(kind) => (
              <Text
                weight="medium"
                color={areAllCategoriesSelected(kind) ? "cyan" : undefined}
                onClick={(e) => {
                  e.stopPropagation();
                  selectCategories(kind);
                }}
                className={css({ cursor: "pointer " })}
              >
                {kind}
              </Text>
            )}
          >
            {(category) => (
              <CategoryLI key={category.id} category={category} user={user} />
            )}
          </FoldableList>
        )}
      </QueryResult>
    </>
  );
}

function FoldableList<X extends { name: string }>(props: {
  openValues: string[];
  groupedItems: Record<string, X[]>;
  getHeaderExtraContent: (key: string) => ReactNode;
  getHeaderLabel: (key: string) => ReactNode;
  children: (item: X) => ReactNode;
}) {
  return (
    <Accordion.Root type="multiple" defaultValue={props.openValues}>
      <Flex direction="column" px="4">
        {Object.entries(props.groupedItems).map(([key, items]) => (
          <Accordion.Item value={key} key={key}>
            <Accordion.Header asChild>
              <Flex
                pb="1"
                mb="1"
                justify="between"
                className={css({
                  "&[data-state=open]": {
                    borderBottom: "1px solid var(--gray-a4)",
                  },
                })}
              >
                <Flex gap="1">
                  <Accordion.Trigger
                    className={css({
                      "& svg": {
                        transition: "transform 200ms ease",
                      },
                      "&[data-state=open]": {
                        "& svg": {
                          transform: "rotate(90deg)",
                        },
                      },
                    })}
                  >
                    <ChevronRightIcon
                      className={css({
                        cursor: "pointer",
                      })}
                    />
                  </Accordion.Trigger>
                  {props.getHeaderLabel(key)}
                </Flex>
                {props.getHeaderExtraContent(key)}
              </Flex>
            </Accordion.Header>
            <AnimatedAccordionContent>
              <Box mb="2">{items.map(props.children)}</Box>
            </AnimatedAccordionContent>
          </Accordion.Item>
        ))}
      </Flex>
    </Accordion.Root>
  );
}

function AnimatedAccordionContent(props: { children: ReactNode }) {
  return (
    <Accordion.Content
      className={css({
        "&[data-state=open]": {
          animation: "slideDown 200ms ease",
        },
        "&[data-state=closed]": {
          animation: "slideUp 200ms ease",
        },
        // needed to prevent the content from being visible during the animation
        overflow: "hidden",
      })}
    >
      {props.children}
    </Accordion.Content>
  );
}

type RightClickItem = {
  label: string;
  color?: RadixColor;
  onClick: MouseEventHandler<HTMLDivElement>;
};

function RightClick(props: {
  items: RightClickItem[];
  children: React.ReactNode;
}) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>{props.children}</ContextMenu.Trigger>
      <ContextMenu.Content>
        {props.items.map((item) => (
          <ContextMenu.Item
            key={item.label}
            color={item.color}
            onClick={item.onClick}
          >
            {item.label}
          </ContextMenu.Item>
        ))}
      </ContextMenu.Content>
    </ContextMenu.Root>
  );
}

function WithRightClick(props: {
  rightClickItems: RightClickItem[];
  children: React.ReactNode;
}) {
  if (props.rightClickItems.length === 0) {
    return <>{props.children}</>;
  } else {
    return (
      <RightClick items={props.rightClickItems}>{props.children}</RightClick>
    );
  }
}

function CategoryLI({
  category,
  user,
}: {
  category: Category;
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
  const isSelected = store.categoryIds.includes(category.id);
  const canBeRemoved = canBeDeleted.data;
  const rightClickItems = [
    ...(canBeRemoved
      ? [
          {
            label: "Delete",
            color: "red" as RadixColor,
            onClick: (e) => {
              e.stopPropagation();
              deleteCategory.mutateAsync();
            },
          } as RightClickItem,
        ]
      : []),
  ];
  return (
    <Flex justify="between">
      <Flex gap="2">
        <Box
          pl="1"
          className={css({
            backgroundColor: isSelected
              ? "var(--cyan-8)"
              : canBeRemoved
              ? "var(--red-8)"
              : "var(--gray-a6)",
          })}
        />
        <WithRightClick rightClickItems={rightClickItems}>
          <Badge
            my="1"
            color={CATEGORY_COLOR[category.kind]}
            variant={category.is_private ? "outline" : "soft"}
            style={{ cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              dispatch({ type: "TOGGLE_CATEGORIES", payload: [category.id] });
            }}
          >
            {category.name}
          </Badge>
        </WithRightClick>
      </Flex>
      <GenericLoadingValue
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
      >
        {(value) => (
          <CategoryValue
            value={value}
            kind={category.kind}
            defaultWeight="regular"
          />
        )}
      </GenericLoadingValue>
    </Flex>
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

function GenericLoadingValue(props: {
  queryKey: [string, ...any];
  valueLoader: () => Promise<string>;
  children: (value: string) => ReactNode;
}) {
  return (
    <QueryResult
      query={useQuery(props.queryKey, props.valueLoader)}
      onLoading={<>...</>}
      onUndefined={<>Missing Value</>}
    >
      {props.children}
    </QueryResult>
  );
}

function LoadingValue(props: {
  expect: (value: number) => boolean;
  queryKey: [string, ...any];
  valueLoader: () => Promise<string>;
}) {
  return (
    <GenericLoadingValue {...props}>
      {(value) => {
        const parsedValue = parseFloat(value);
        let color: RadixColor;
        let weight: "regular" | "bold" = "regular";
        const asExpected = props.expect(parsedValue);
        if (!asExpected) {
          color = "red";
          weight = "bold";
        }
        let result;
        if (isNaN(parsedValue)) {
          result = value;
        } else {
          result = formatValue(
            asExpected ? Math.abs(parsedValue) : parsedValue
          );
        }
        return (
          <Text color={color} weight={weight}>
            {result}
          </Text>
        );
      }}
    </GenericLoadingValue>
  );
}

function TwoColumnInput(props: { children: React.ReactNode }) {
  return (
    <Grid asChild columns="125px 1fr" align="center">
      <label>{props.children}</label>
    </Grid>
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

function getAccountGroup(
  account: Account,
  userId: string
): "owned" | "common" | "others" {
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
}
