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
import {
  useQuery,
  useQueryClient,
  useMutation,
  QueryKey,
} from "@tanstack/react-query";
import {
  boolean,
  minLength,
  object,
  optional,
  string,
  transform,
} from "valibot";
import { UserPageStoreContext } from "./store";
import {
  CATEGORY_COLOR,
  PARTITION_COLOR,
  QueryResult,
  RadixColor,
  Unpacked,
  formatValue,
  getCategoryOptionName,
  getPartitionType,
  groupBy,
  invalidateMany,
  useGroupedPartitions,
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
  ContextMenu,
  Badge,
} from "@radix-ui/themes";
import { ChevronRightIcon, PlusIcon } from "@radix-ui/react-icons";
import * as Accordion from "@radix-ui/react-accordion";
import { Combobox, ComboboxTrigger } from "./combobox";
import { TwoColumnInput } from "@/utils/common";
import Skeleton from "react-loading-skeleton";

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

export const SideBarFoldable = (props: {
  value: string;
  children: ReactNode;
  headerButton?: ReactNode;
}) => {
  return (
    <Accordion.Item
      value={props.value}
      className={css({
        "&[data-state=open]": {
          borderBottom: "1px solid var(--gray-a5)",
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
            borderBottom: "1px solid var(--gray-a5)",
            backgroundColor: "var(--gray-a3)",
          })}
        >
          <Accordion.Trigger>
            <Text size="3" weight="bold" className={css({ cursor: "pointer" })}>
              {props.value}
            </Text>
          </Accordion.Trigger>
          {props.headerButton}
        </Flex>
      </Accordion.Header>
      <AnimatedAccordionContent>{props.children}</AnimatedAccordionContent>
    </Accordion.Item>
  );
};

export function SideBar({
  user,
  width,
}: {
  user: FindUserResult;
  width: number;
}) {
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
        minWidth: `${width}px`,
        borderRight: "1px solid var(--gray-a5)",
        backgroundColor: "var(--gray-a2)",
      }}
    >
      <Flex direction="column" height="100%">
        <ScrollArea scrollbars="vertical">
          <Accordion.Root
            type="multiple"
            defaultValue={["Accounts", "Categories"]}
          >
            <SideBarFoldable
              value="Accounts"
              headerButton={
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
              }
            >
              <Accounts user={user} />
            </SideBarFoldable>
            <SideBarFoldable
              value="Categories"
              headerButton={
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
                              <Select.Item value="Expense">Expense</Select.Item>
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
              }
            >
              <Categories user={user} />
            </SideBarFoldable>
            <ActiveLoans user={user} />
          </Accordion.Root>
        </ScrollArea>
      </Flex>
    </Box>
  );
}

/**
 * Shows the list of loans that are not yet fully-paid.
 */
const ActiveLoans = ({ user }: { user: { id: string; dbname: string } }) => {
  const partitionsWithLoans = useQuery(["partitionsWithLoans", user.id], () => {
    return rpc.post.getPartitionsWithLoans({
      userId: user.id,
      dbname: user.dbname,
    });
  });

  return (
    <SideBarFoldable value="Active Loans">
      <Flex direction="column" my="2">
        <QueryResult
          query={partitionsWithLoans}
          onUndefined={<>No loans found</>}
        >
          {(partitions) => {
            const partitionById = groupBy(
              partitions,
              (partition) => partition.id
            );
            return (
              <FoldableList
                groupedItems={partitionById}
                openValues={[]}
                getHeaderLabel={(id) => {
                  const partition = partitionById[id][0];
                  const _type = getPartitionType2(partition, user.id);
                  const color = PARTITION_COLOR[_type];
                  const variant = partition.is_private ? "outline" : "soft";
                  return (
                    <Badge color={color} variant={variant}>
                      {partition.label}
                    </Badge>
                  );
                }}
              >
                {(partition) => (
                  <PartitionLoans partition={partition} user={user} />
                )}
              </FoldableList>
            );
          }}
        </QueryResult>
      </Flex>
    </SideBarFoldable>
  );
};

type PartitionWithLoans = Awaited<
  ReturnType<typeof rpc.post.getPartitionsWithLoans>
>[number];
type UnpaidLoan = Awaited<ReturnType<typeof rpc.post.getUnpaidLoans>>[number];

const LoanItem = ({
  user,
  lender,
  loan,
}: {
  lender: PartitionWithLoans;
  loan: UnpaidLoan;
  user: { id: string; dbname: string };
}) => {
  const queryClient = useQueryClient();
  const hiddenDialogTriggerRef = useRef<HTMLButtonElement>(null);
  const [store, dispatch] = useContext(UserPageStoreContext);
  const borrower = loan.transaction.counterpart!.source_partition;
  const lenderName = `${lender.account.name} - ${lender.name}`;
  const borrowerColor = store.loanIds.includes(loan.id)
    ? "cyan"
    : PARTITION_COLOR[getPartitionType2(borrower, user.id)];
  const borrowerVariant = borrower.is_private ? "outline" : "soft";
  const lenderColor = PARTITION_COLOR[getPartitionType2(lender, user.id)];
  const lenderVariant = lender.is_private ? "outline" : "soft";
  const categoryColor = CATEGORY_COLOR[loan.transaction.category.kind];
  const categoryVariant = loan.transaction.category.is_private
    ? "outline"
    : "soft";
  const paymentFormId = `payment-form-${loan.id}`;
  const rightClickItems = [
    {
      label: "Pay",
      onClick: (e) => {
        hiddenDialogTriggerRef.current?.click();
      },
    } as RightClickItem,
  ];

  const makeAPayment = useCallback(async () => {
    const form = document.getElementById(paymentFormId);
    const formdata = new FormData(form as HTMLFormElement);
    const schema = object({
      amount: transform(string(), (v) => parseFloat(v)),
      description: optional(string()),
    });
    const toParse = {
      ...Object.fromEntries(formdata.entries()),
    };
    const parsedData = schema.parse(toParse);
    const result = await rpc.post.makeAPayment({
      ...parsedData,
      userId: user.id,
      dbname: user.dbname,
      loanId: loan.id,
    });

    if (!result) {
      throw new Error("Something went wrong");
    }

    const transaction = loan.transaction;
    const counterpart = transaction.counterpart;

    const queryKeys: QueryKey[] = [];

    queryKeys.push(
      ["transactions"],
      ["categoryBalance", { categoryId: transaction.category.id }],
      ["categoryCanBeDeleted", { categoryId: transaction.category.id }],
      ["partitionBalance", { partitionId: transaction.source_partition.id }],
      [
        "partitionCanBeDeleted",
        { partitionId: transaction.source_partition.id },
      ],
      [
        "accountCanBeDeleted",
        { accountId: transaction.source_partition.account.id },
      ],
      [
        "accountBalance",
        { accountId: transaction.source_partition.account.id },
      ],
      ["categoryKindBalance", transaction.category.kind],
      ["unpaidLoans", user.id, lender.id],
      ["partitionsWithLoans", user.id]
    );
    if (counterpart) {
      queryKeys.push(
        ["partitionBalance", { partitionId: counterpart.source_partition.id }],
        [
          "partitionCanBeDeleted",
          { partitionId: counterpart.source_partition.id },
        ],
        [
          "accountCanBeDeleted",
          { accountId: counterpart.source_partition.account.id },
        ],
        [
          "accountBalance",
          { accountId: counterpart.source_partition.account.id },
        ]
      );
    }
    invalidateMany(queryClient, queryKeys);
  }, [paymentFormId, user, loan, queryClient, lender.id]);

  return (
    <Flex direction="column" m="2" mt="1" key={loan.id}>
      <Flex justify="between" my="1">
        <WithRightClick rightClickItems={rightClickItems}>
          <Badge
            color={borrowerColor}
            variant={borrowerVariant}
            style={{ cursor: "pointer" }}
            onClick={() => {
              return dispatch({
                type: "TOGGLE_LOAN_IDS",
                payload: [loan.id],
              });
            }}
          >
            {borrower.label}
          </Badge>
        </WithRightClick>
        <Text weight="medium">{formatValue(parseFloat(loan.amount))}</Text>
      </Flex>
      <Flex>
        <Box
          pl="1"
          className={css({
            backgroundColor: "var(--gray-a5)",
          })}
        ></Box>
        <Flex direction="column" ml="3" grow="1">
          <Flex justify="between" align="center">
            <Text>Amount Paid</Text>
            <Text>{formatValue(parseFloat(loan.amount_paid))}</Text>
          </Flex>
          <Flex justify="between" align="center">
            <Text>Remaining</Text>
            <Text>{formatValue(parseFloat(loan.remaining_amount))}</Text>
          </Flex>
        </Flex>
      </Flex>

      <Dialog.Root>
        <Dialog.Trigger>
          <button ref={hiddenDialogTriggerRef} hidden></button>
        </Dialog.Trigger>
        <Dialog.Content style={{ maxWidth: 500 }}>
          <Dialog.Title>Make a Payment</Dialog.Title>
          <Separator size="4" mb="4" />
          <Flex direction="column" gap="3" asChild>
            <form
              id={paymentFormId}
              onSubmit={(e) => {
                e.preventDefault();
                makeAPayment();
              }}
            >
              <TwoColumnInput>
                <Text as="div" size="2" mb="1" weight="bold">
                  Source
                </Text>
                <Flex>
                  <Badge color={borrowerColor} variant={borrowerVariant}>
                    <Text>{borrower.label}</Text>
                  </Badge>
                </Flex>
              </TwoColumnInput>
              <TwoColumnInput>
                <Text as="div" size="2" mb="1" weight="bold">
                  Destination
                </Text>
                <Flex>
                  <Badge color={lenderColor} variant={lenderVariant}>
                    <Text>{lenderName}</Text>
                  </Badge>
                </Flex>
              </TwoColumnInput>
              <TwoColumnInput>
                <Text as="div" size="2" mb="1" weight="bold">
                  Category
                </Text>
                <Flex>
                  <Badge color={categoryColor} variant={categoryVariant}>
                    <Text>{loan.transaction.category.name}</Text>
                  </Badge>
                </Flex>
              </TwoColumnInput>
              <TwoColumnInput>
                <Text as="div" size="2" mb="1" weight="bold">
                  Amount
                </Text>
                <TextField.Input
                  name="amount"
                  placeholder="Payment amount"
                  type="numeric"
                />
              </TwoColumnInput>
              <TwoColumnInput>
                <Text as="div" size="2" mb="1" weight="bold">
                  Description
                </Text>
                <TextField.Input name="description" placeholder="Description" />
              </TwoColumnInput>
            </form>
          </Flex>
          <Separator size="4" mt="4" />
          <Flex gap="3" mt="4" justify="start" direction="row-reverse">
            <Dialog.Close type="submit" form={paymentFormId}>
              <Button>Save Payment</Button>
            </Dialog.Close>
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Discard
              </Button>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Flex>
  );
};

const PartitionLoans = ({
  partition,
  user,
}: {
  partition: PartitionWithLoans;
  user: { id: string; dbname: string };
}) => {
  const unpaidLoans = useQuery(["unpaidLoans", user.id, partition.id], () => {
    return rpc.post.getUnpaidLoans({
      userId: user.id,
      dbname: user.dbname,
      partitionId: partition.id,
    });
  });
  return (
    <QueryResult
      query={unpaidLoans}
      onLoading={
        <Flex direction="column" my="2">
          {[...Array(1)].map((_, i) => (
            <Flex direction="column" key={i} mx="2" my="1">
              <Flex justify="between">
                <Skeleton style={{ minWidth: "150px" }} />
                <Skeleton style={{ minWidth: "50px" }} />
              </Flex>
              <Box className={css({ mb: "1" })}>
                {[...Array(2)].map((_, i) => (
                  <Flex key={i} justify="between">
                    <Skeleton style={{ minWidth: "100px" }} />
                    <Skeleton style={{ minWidth: "50px" }} />
                  </Flex>
                ))}
              </Box>
            </Flex>
          ))}
        </Flex>
      }
    >
      {(loans) =>
        loans.map((loan) => (
          <LoanItem key={loan.id} lender={partition} loan={loan} user={user} />
        ))
      }
    </QueryResult>
  );
};

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
    <QueryResult
      query={partitions}
      onLoading={<FoldableListSkeleton nItems={1} />}
    >
      {(partitions) => {
        return (
          <FoldableList
            groupedItems={{ [account.id]: partitions }}
            openValues={accountGroup !== "others" ? [account.id] : []}
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
            getHeaderExtraContent={() => {
              return (
                <GenericLoadingValue
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
                >
                  {(value) => {
                    const parsedValue = parseFloat(value);
                    let color: RadixColor;
                    let weight: "medium" | "bold" = "medium";
                    const asExpected = parsedValue >= 0;
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
      onLoading={
        <Box mb="2">
          <FoldableListSkeleton />
        </Box>
      }
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
        return (
          <Flex direction="column" mb="2">
            {sortedAccounts.map((account) => (
              <AccountLI account={account} user={user} key={account.id} />
            ))}
          </Flex>
        );
      }}
    </QueryResult>
  );
}

// TODO: Refactor this. This is just the same as getPartitionType from common.
export function getPartitionType2(
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

  const hiddenDialogTriggerRef = useRef<HTMLButtonElement>(null);

  const [selectedDestinationId, setSelectedDestinationId] = useState("");
  const [loanCategoryId, setLoanCategoryId] = useState("");

  const partitions = useQuery(["partitions", user.id], () => {
    return rpc.post.getPartitionOptions({
      userId: user.id,
      dbname: user.dbname,
    });
  });

  const categories = useQuery(["categories", user.id], () => {
    return rpc.post.getUserCategories({ userId: user.id, dbname: user.dbname });
  });

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
    ...(categories.data
      ? [
          {
            label: "Borrow",
            onClick: (e) => {
              e.stopPropagation();
              hiddenDialogTriggerRef.current?.click();
            },
          } as RightClickItem,
        ]
      : []),
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
  const variant = isSelected
    ? "solid"
    : partition.is_private
    ? "outline"
    : "soft";
  const _type = getPartitionType2(partition, user.id);
  const color = isSelected ? "cyan" : PARTITION_COLOR[_type];

  const loanFormId = `make-a-loan-form-${partition.id}`;
  const groupedPartitions = useGroupedPartitions(
    partitions.data || [],
    user.id
  );

  const selectedDestination = useMemo(() => {
    return (partitions.data || []).find((p) => p.id === selectedDestinationId);
  }, [selectedDestinationId, partitions.data]);

  const destinationName = selectedDestination?.name || "Select destination";

  const destinationVariant =
    selectedDestination && selectedDestination.is_private ? "outline" : "soft";

  const destinationType =
    selectedDestination && getPartitionType(selectedDestination, user.id);

  const destinationColor =
    (destinationType && PARTITION_COLOR[destinationType]) || "gray";

  const loanCategory = useMemo(() => {
    return (categories.data?.Transfer || []).find(
      (c) => c.id === loanCategoryId
    );
  }, [loanCategoryId, categories.data]);

  const loanCategoryName = loanCategory
    ? getCategoryOptionName(loanCategory)
    : "Select Category";

  const loanCategoryColor = loanCategory && CATEGORY_COLOR[loanCategory.kind];
  const loanCategoryVariant = loanCategory?.is_private ? "outline" : "soft";

  const makeALoan = useCallback(async () => {
    const form = document.getElementById(loanFormId);
    const formdata = new FormData(form as HTMLFormElement);
    const schema = object({
      amount: transform(string(), (v) => parseFloat(v)),
      description: optional(string()),
      toPay: transform(string(), (v) => parseFloat(v)),
      destinationPartitionId: string([minLength(1)]),
      categoryId: string([minLength(1)]),
    });
    const toParse = {
      toPay: "",
      ...Object.fromEntries(formdata.entries()),
      destinationPartitionId: selectedDestinationId,
      categoryId: loanCategoryId,
    };
    const parsedData = schema.parse(toParse);
    if (isNaN(parsedData.toPay)) {
      parsedData.toPay = parsedData.amount;
    }
    const result = await rpc.post.makeALoan({
      ...parsedData,
      userId: user.id,
      dbname: user.dbname,
      sourcePartitionId: partition.id,
    });

    if (!result) {
      throw new Error("Something went wrong");
    }
    const { transaction } = result;
    const counterpart = transaction.counterpart;

    const queryKeys: QueryKey[] = [];

    queryKeys.push(
      ["transactions"],
      ["categoryBalance", { categoryId: loanCategoryId }],
      ["categoryCanBeDeleted", { categoryId: loanCategoryId }],
      ["partitionBalance", { partitionId: partition.id }],
      ["partitionCanBeDeleted", { partitionId: partition.id }],
      [
        "accountCanBeDeleted",
        { accountId: transaction.source_partition.account.id },
      ],
      [
        "accountBalance",
        { accountId: transaction.source_partition.account.id },
      ],
      ["categoryKindBalance", transaction.category.kind],
      ["partitionsWithLoans", user.id]
    );
    if (counterpart) {
      queryKeys.push(
        ["partitionBalance", { partitionId: selectedDestinationId }],
        [
          "partitionCanBeDeleted",
          { partitionId: counterpart.source_partition.id },
        ],
        [
          "accountCanBeDeleted",
          { accountId: counterpart.source_partition.account.id },
        ],
        [
          "accountBalance",
          { accountId: counterpart.source_partition.account.id },
        ]
      );
    }
    invalidateMany(queryClient, queryKeys);
  }, [
    loanFormId,
    partition.id,
    selectedDestinationId,
    user,
    loanCategoryId,
    queryClient,
  ]);

  return (
    <Flex justify="between" m="2">
      <WithRightClick rightClickItems={rightClickItems}>
        <Badge
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
      <QueryResult
        query={useQuery(
          [
            "partitionBalance",
            {
              partitionId: partition.id,
            },
          ],
          () =>
            rpc.post.getPartitionBalance({
              partitionId: partition.id,
              userId: user.id,
              dbname: user.dbname,
            })
        )}
        onLoading={<Skeleton style={{ minWidth: "50px" }} />}
      >
        {(value) => {
          const parsedValue = parseFloat(value);
          let color: RadixColor;
          let weight: "regular" | "bold" = "regular";
          const asExpected = parsedValue >= 0;
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
      </QueryResult>
      <Dialog.Root>
        <Dialog.Trigger>
          <button ref={hiddenDialogTriggerRef} hidden></button>
        </Dialog.Trigger>
        <Dialog.Content style={{ maxWidth: 500 }}>
          <Dialog.Title>Make a Loan</Dialog.Title>
          <Separator size="4" mb="4" />
          <Flex direction="column" gap="3" asChild>
            <form
              id={loanFormId}
              onSubmit={(e) => {
                e.preventDefault();
                makeALoan();
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
                  getItemColor={(item) => {
                    const _type = getPartitionType(item, user.id);
                    return PARTITION_COLOR[_type];
                  }}
                  isItemIncluded={(p) =>
                    p.account.is_owned && p.id !== partition.id
                  }
                  getItemValue={(p) =>
                    `${getPartitionType(p, user.id)} ${p.account.label} ${
                      p.name
                    }`
                  }
                  getItemDisplay={(p) => p.name}
                  onSelectItem={(p) => setSelectedDestinationId(p.id)}
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
                  getGroupHeading={(key) => key}
                  getItemColor={(item, key) => {
                    return CATEGORY_COLOR[key];
                  }}
                  getItemValue={(c, k) => `${k} ${getCategoryOptionName(c)}`}
                  getItemDisplay={(c) => getCategoryOptionName(c)}
                  onSelectItem={(c) => {
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
            <Dialog.Close type="submit" form={loanFormId}>
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
    <Flex direction="column" mb="2">
      <QueryResult
        query={categories}
        onLoading={<FoldableListSkeleton />}
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
    </Flex>
  );
}

function FoldableList<X extends { name: string }>(props: {
  openValues: string[];
  groupedItems: Record<string, X[]>;
  getHeaderExtraContent?: (key: string) => ReactNode;
  getHeaderLabel: (key: string) => ReactNode;
  children: (item: X) => ReactNode;
}) {
  return (
    <Accordion.Root type="multiple" defaultValue={props.openValues}>
      <Flex direction="column" px="4">
        {Object.entries(props.groupedItems).map(([key, items]) => (
          <Accordion.Item value={key} key={key}>
            <Accordion.Header asChild>
              <Flex py="1" pr="2" justify="between">
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
                {props.getHeaderExtraContent &&
                  props.getHeaderExtraContent(key)}
              </Flex>
            </Accordion.Header>
            <AnimatedAccordionContent>
              <Box
                className={css({
                  my: "1",
                  border: "1px solid var(--gray-a5)",
                  borderRadius: "var(--radius-3)",
                })}
              >
                {items.map(props.children)}
              </Box>
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
  const color = isSelected ? "cyan" : CATEGORY_COLOR[category.kind];
  const variant = isSelected
    ? "solid"
    : category.is_private
    ? "outline"
    : "soft";
  return (
    <Flex justify="between" m="2">
      <WithRightClick rightClickItems={rightClickItems}>
        <Badge
          color={color}
          variant={variant}
          style={{ cursor: "pointer" }}
          onClick={(e) => {
            e.stopPropagation();
            dispatch({ type: "TOGGLE_CATEGORIES", payload: [category.id] });
          }}
        >
          {category.name}
        </Badge>
      </WithRightClick>
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

function GenericLoadingValue(props: {
  queryKey: [string, ...any];
  valueLoader: () => Promise<string>;
  children: (value: string) => ReactNode;
}) {
  return (
    <QueryResult
      query={useQuery(props.queryKey, props.valueLoader)}
      onLoading={<Skeleton style={{ minWidth: "50px" }} />}
    >
      {props.children}
    </QueryResult>
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

function FoldableListSkeleton({ nItems = 3 }: { nItems?: number }) {
  return (
    <Flex direction="column">
      {[...Array(nItems)].map((_, i) => (
        <Flex direction="column" px="4" key={i}>
          <Flex py="1" pr="2" justify="between">
            <Flex gap="1">
              <Skeleton style={{ minWidth: "100px" }} />
            </Flex>
            <Skeleton style={{ minWidth: "50px" }} />
          </Flex>
          <Box
            className={css({
              my: "1",
              py: "1",
              border: "1px solid var(--gray-a5)",
              borderRadius: "var(--radius-3)",
            })}
          >
            {[...Array(2)].map((_, i) => (
              <Box key={i} mx="2">
                <Skeleton />
              </Box>
            ))}
          </Box>
        </Flex>
      ))}
    </Flex>
  );
}
