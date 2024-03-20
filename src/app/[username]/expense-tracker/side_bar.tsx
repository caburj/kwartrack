'use client';

import {
  MouseEventHandler,
  useContext,
  useState,
  useRef,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';
import {
  useQuery,
  useQueryClient,
  useMutation,
  QueryKey,
} from '@tanstack/react-query';
import { boolean, object, string, parse } from 'valibot';
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
  Switch,
  ContextMenu,
  Badge,
  Tooltip,
} from '@radix-ui/themes';
import {
  ChevronRightIcon,
  Cross2Icon,
  PlusIcon,
  InfoCircledIcon,
} from '@radix-ui/react-icons';
import * as Accordion from '@radix-ui/react-accordion';
import Skeleton from 'react-loading-skeleton';
import { toast } from 'sonner';
import {
  CATEGORY_COLOR,
  PARTITION_COLOR,
  QueryResult,
  RadixColor,
  formatValue,
  groupBy,
  invalidateMany,
  usePartitions,
  TwoColumnInput,
} from '@/utils/common';

import {
  UserIDAndDBName,
  Account,
  Partition,
  Category,
} from '@/utils/derived_types';
import { editAccount } from '@/disturbers/edit_account';
import { editPartition } from '@/disturbers/edit_partition';
import { editCategory } from '@/disturbers/edit_category';
import { getPaymentInput } from '@/disturbers/get_payment_input';
import { getLoanInput } from '@/disturbers/get_loan_input';
import { newPartition } from '@/disturbers/new_partition';
import { newCategory } from '@/disturbers/new_category';
import { rpc } from '../../rpc_client';
import { css } from '../../../../styled-system/css';
import { AnimatedAccordionContent } from './accordion';
import { UserPageStoreContext } from './store';

export const SideBarFoldable = (props: {
  value: string;
  children: ReactNode;
  clearSelections?: () => void;
  showClearSelections?: boolean;
  headerButton?: ReactNode;
}) => {
  const headerTextRef = useRef<HTMLDivElement>(null);
  return (
    <Accordion.Item
      value={props.value}
      className={css({
        '&[data-state=open]': {
          borderBottom: '1px solid var(--gray-a5)',
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
            borderBottom: '1px solid var(--gray-a5)',
            backgroundColor: 'var(--gray-a3)',
            cursor: 'pointer',
          })}
          onClick={() => {
            headerTextRef.current?.click();
          }}
        >
          <Accordion.Trigger asChild>
            <Flex align="center" justify="between" gap="4">
              <Text
                size="3"
                weight="bold"
                className={css({ cursor: 'pointer' })}
                ref={headerTextRef}
              >
                {props.value}
              </Text>
              {props.showClearSelections && (
                <Tooltip content="Clear selections">
                  <Button
                    variant="ghost"
                    onClick={e => {
                      e.stopPropagation();
                      props.clearSelections?.();
                    }}
                  >
                    <Cross2Icon width="15" height="15" /> clear
                  </Button>
                </Tooltip>
              )}
            </Flex>
          </Accordion.Trigger>
          <Flex onClick={e => e.stopPropagation()}>{props.headerButton}</Flex>
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
  user: UserIDAndDBName;
  width: number;
}) {
  const [store, dispatch] = useContext(UserPageStoreContext);

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      bottom="0"
      style={{
        minWidth: `${width}px`,
        borderRight: '1px solid var(--gray-a5)',
        backgroundColor: 'var(--gray-a2)',
      }}
    >
      <Flex direction="column" height="100%">
        <ScrollArea scrollbars="vertical">
          <Accordion.Root type="multiple" defaultValue={['Accounts']}>
            <SideBarFoldable
              value="Accounts"
              showClearSelections={store.partitionIds.length > 0}
              clearSelections={() => {
                dispatch({ type: 'CLEAR_ACCOUNT_SELECTION' });
              }}
              headerButton={
                <IconButton
                  radius="full"
                  variant="ghost"
                  onClick={() => {
                    return newPartition({ user });
                  }}
                >
                  <PlusIcon width="18" height="18" />
                </IconButton>
              }
            >
              <Accounts user={user} />
            </SideBarFoldable>
            <SideBarFoldable
              value="Categories"
              showClearSelections={store.categoryIds.length > 0}
              clearSelections={() => {
                dispatch({ type: 'CLEAR_CATEGORY_SELECTION' });
              }}
              headerButton={
                <IconButton
                  radius="full"
                  variant="ghost"
                  onClick={() => newCategory({ user })}
                >
                  <PlusIcon width="18" height="18" />
                </IconButton>
              }
            >
              <Categories user={user} />
            </SideBarFoldable>
            {!store.showOverallBalance && <BudgetProfiles user={user} />}
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
  const partitionsWithLoans = useQuery(['partitionsWithLoans', user.id], () => {
    return rpc.post.getPartitionsWithLoans({
      userId: user.id,
      dbname: user.dbname,
    });
  });

  const [store, dispatch] = useContext(UserPageStoreContext);

  return (
    <SideBarFoldable
      value="Active Loans"
      showClearSelections={store.loanIds.length > 0}
      clearSelections={() => {
        dispatch({ type: 'CLEAR_LOAN_SELECTION' });
      }}
    >
      <Flex direction="column" my="2">
        <QueryResult
          query={partitionsWithLoans}
          onUndefined={<>No loans found</>}
        >
          {partitions => {
            const partitionById = groupBy(
              partitions,
              partition => partition.id,
            );
            return (
              <FoldableList
                groupedItems={partitionById}
                openValues={[]}
                getHeaderLabel={id => {
                  const partition = partitionById[id][0];
                  const _type = getPartitionType2(partition);
                  const color = PARTITION_COLOR[_type];
                  const variant = partition.is_private ? 'outline' : 'soft';
                  return (
                    <Badge color={color} variant={variant}>
                      {partition.label}
                    </Badge>
                  );
                }}
              >
                {partition => (
                  <PartitionLoans
                    partition={partition}
                    user={user}
                    key={partition.id}
                  />
                )}
              </FoldableList>
            );
          }}
        </QueryResult>
      </Flex>
    </SideBarFoldable>
  );
};

/**
 * Shows the list of loans that are not yet fully-paid.
 */
const BudgetProfiles = ({ user }: { user: { id: string; dbname: string } }) => {
  const [store, dispatch] = useContext(UserPageStoreContext);
  const queryClient = useQueryClient();
  const budgetProfileFormRef = useRef<HTMLFormElement>(null);

  const userPartitions = usePartitions(user);

  const budgetProfiles = useQuery(['budgetProfiles', user.id], () => {
    return rpc.post.getBudgetProfiles({
      userId: user.id,
      dbname: user.dbname,
    });
  });

  const selectedPartitions = useMemo(() => {
    return userPartitions.filter(p => store.partitionIds.includes(p.id));
  }, [userPartitions, store.partitionIds]);

  return (
    <SideBarFoldable
      value="Budget Profiles"
      headerButton={
        !store.budgetProfileId && (
          <Dialog.Root>
            <Dialog.Trigger>
              <IconButton radius="full" variant="ghost">
                <PlusIcon width="18" height="18" />
              </IconButton>
            </Dialog.Trigger>
            <Dialog.Content style={{ maxWidth: 500 }}>
              <Dialog.Title>New Budget Profile</Dialog.Title>
              <Separator size="4" mb="4" />
              <Flex direction="column" gap="3" asChild>
                <form
                  id="budget-profile-form"
                  ref={budgetProfileFormRef}
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
                          <span>
                            {'Corresponds to the selected partitions.'}
                          </span>
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
                        <Badge
                          key={p.id}
                        >{`${p.account.label} - ${p.name}`}</Badge>
                      ))}
                    </Flex>
                  </TwoColumnInput>
                </form>
              </Flex>
              <Separator size="4" mt="4" />
              <Flex gap="3" mt="4" justify="start" direction="row-reverse">
                <Dialog.Close type="submit" form="budget-profile-form">
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
        )
      }
    >
      <Flex direction="column" my="2" mx="4">
        <Flex gap="2" className={css({ flexWrap: 'wrap' })}>
          {budgetProfiles.data?.map(profile => (
            <Badge
              key={profile.id}
              onClick={() => {
                dispatch({
                  type: 'TOGGLE_BUDGET_PROFILE',
                  payload: [profile.id, profile.partitions.map(p => p.id)],
                });
                invalidateMany(queryClient, [
                  ['budgetAmount'],
                  ['transactions'],
                  ['groupedTransactions'],
                ]);
              }}
              variant={store.budgetProfileId === profile.id ? 'solid' : 'soft'}
              style={{ cursor: 'pointer' }}
            >
              {profile.name}
            </Badge>
          ))}
        </Flex>
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
  const [store, dispatch] = useContext(UserPageStoreContext);
  const borrower = loan.transaction.counterpart!.source_partition;
  const lenderName = `${lender.account.name} - ${lender.name}`;
  const borrowerColor = store.loanIds.includes(loan.id)
    ? 'cyan'
    : PARTITION_COLOR[getPartitionType2(borrower)];
  const borrowerVariant = borrower.is_private ? 'outline' : 'soft';
  const lenderColor = PARTITION_COLOR[getPartitionType2(lender)];
  const lenderVariant = lender.is_private ? 'outline' : 'soft';
  const categoryColor = CATEGORY_COLOR[loan.transaction.category.kind];
  const categoryVariant = loan.transaction.category.is_private
    ? 'outline'
    : 'soft';
  const rightClickItems = [
    {
      label: 'Pay',
      onClick: async () => {
        // TODO: Reduce args to loan and lender.
        const resp = await getPaymentInput({
          loanId: loan.id,
          defaultAmount: loan.remaining_amount,
          borrower: {
            name: borrower.name,
            color: borrowerColor,
            variant: borrowerVariant,
          },
          lender: {
            name: lenderName,
            color: lenderColor,
            variant: lenderVariant,
          },
          category: {
            name: loan.transaction.category.name,
            color: categoryColor,
            variant: categoryVariant,
          },
        });
        if (resp) {
          await makeAPayment(resp);
        }
      },
    } as RightClickItem,
  ];

  const makeAPayment = useCallback(
    async (data: { amount: number; description?: string }) => {
      const result = await rpc.post.makeAPayment({
        ...data,
        userId: user.id,
        dbname: user.dbname,
        loanId: loan.id,
      });

      if (!result) {
        throw new Error('Something went wrong');
      }

      const { transaction } = loan;
      const { counterpart } = transaction;

      const queryKeys: QueryKey[] = [];

      queryKeys.push(
        ['transactions'],
        ['groupedTransactions'],
        ['categoryBalance', { categoryId: transaction.category.id }],
        ['categoryCanBeDeleted', { categoryId: transaction.category.id }],
        ['partitionBalance', { partitionId: transaction.source_partition.id }],
        [
          'accountCanBeDeleted',
          { accountId: transaction.source_partition.account.id },
        ],
        [
          'accountBalance',
          { accountId: transaction.source_partition.account.id },
        ],
        ['categoryKindBalance', { kind: transaction.category.kind }],
        ['unpaidLoans', user.id, lender.id],
        ['partitionsWithLoans', user.id],
      );
      if (counterpart) {
        queryKeys.push(
          [
            'partitionBalance',
            { partitionId: counterpart.source_partition.id },
          ],
          [
            'accountCanBeDeleted',
            { accountId: counterpart.source_partition.account.id },
          ],
          [
            'accountBalance',
            { accountId: counterpart.source_partition.account.id },
          ],
        );
      }
      invalidateMany(queryClient, queryKeys);
    },
    [user, loan, queryClient, lender.id],
  );

  return (
    <Flex direction="column" m="2" mt="1" key={loan.id}>
      <Flex justify="between" my="1">
        <WithRightClick rightClickItems={rightClickItems}>
          <Badge
            color={borrowerColor}
            variant={borrowerVariant}
            style={{ cursor: 'pointer' }}
            onClick={() => {
              return dispatch({
                type: 'TOGGLE_LOAN_IDS',
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
            backgroundColor: 'var(--gray-a5)',
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
  const unpaidLoans = useQuery(['unpaidLoans', user.id, partition.id], () => {
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
                <Skeleton style={{ minWidth: '150px' }} />
                <Skeleton style={{ minWidth: '50px' }} />
              </Flex>
              <Box className={css({ mb: '1' })}>
                {[...Array(2)].map((_, i) => (
                  <Flex key={i} justify="between">
                    <Skeleton style={{ minWidth: '100px' }} />
                    <Skeleton style={{ minWidth: '50px' }} />
                  </Flex>
                ))}
              </Box>
            </Flex>
          ))}
        </Flex>
      }
    >
      {loans =>
        loans.map(loan => (
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
    ['accountCanBeDeleted', { accountId: account.id }],
    () => {
      return rpc.get.accountCanBeDeleted({
        accountId: account.id,
        dbname: user.dbname,
        userId: user.id,
      });
    },
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
          queryKey: ['accounts', user.id],
        });
      },
    },
  );

  const update = useMutation(
    async ({ name }: { name: string }) => {
      return rpc.post.updateAccount({
        userId: user.id,
        dbname: user.dbname,
        accountId: account.id,
        name,
      });
    },
    {
      onSuccess: () => {
        invalidateMany(queryClient, [
          ['transactions'],
          ['groupedTransactions'],
          ['accounts', user.id],
        ]);
      },
    },
  );

  const rightClickItems = [
    ...(account.is_owned
      ? [
          {
            label: 'Edit',
            onClick: async e => {
              e.stopPropagation();
              const resp = await editAccount({ account });
              if (resp) {
                update.mutate(resp);
              }
            },
          } as RightClickItem,
        ]
      : []),
    ...(canBeDeleted.data
      ? [
          {
            label: 'Delete',
            color: 'red' as RadixColor,
            onClick: e => {
              e.stopPropagation();
              return deleteAccount.mutateAsync();
            },
          } as RightClickItem,
        ]
      : []),
  ];

  const partitions = useQuery(['partitions', user.id, account.id], () => {
    return rpc.post.getPartitions({
      accountId: account.id,
      userId: user.id,
      dbname: user.dbname,
    });
  });
  const [store, dispatch] = useContext(UserPageStoreContext);

  const areAllPartitionsSelected = useMemo(() => {
    if (partitions?.data && partitions.data.length > 0) {
      return partitions.data.every(p => store.partitionIds.includes(p.id));
    }
    return false;
  }, [partitions?.data, store.partitionIds]);

  const accountGroup = getAccountGroup(account);

  return (
    <QueryResult
      query={partitions}
      onLoading={<FoldableListSkeleton nItems={1} />}
    >
      {partitions => {
        return (
          <>
            <FoldableList
              groupedItems={{ [account.id]: partitions }}
              openValues={accountGroup !== 'others' ? [account.id] : []}
              getHeaderLabel={() => {
                return (
                  <WithRightClick rightClickItems={rightClickItems}>
                    <Text
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        dispatch({
                          type: 'TOGGLE_ACCOUNT',
                          payload: account.partitions.map(p => p.id),
                        });
                        invalidateMany(queryClient, [
                          ['categoryBalance'],
                          ['categoryKindBalance'],
                        ]);
                      }}
                      weight="medium"
                      color={areAllPartitionsSelected ? 'cyan' : undefined}
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
                      'accountBalance',
                      {
                        accountId: account.id,
                        isOverall: store.showOverallBalance,
                        tssDate: store.tssDate,
                        tseDate: store.tseDate,
                      },
                    ]}
                    valueLoader={() =>
                      rpc.post.getAccountBalance({
                        accountId: account.id,
                        userId: user.id,
                        dbname: user.dbname,
                        isOverall: store.showOverallBalance,
                        tssDate: store.tssDate?.toISOString(),
                        tseDate: store.tseDate?.toISOString(),
                      })
                    }
                  >
                    {value => {
                      const parsedValue = parseFloat(value);
                      const color = parsedValue >= 0 ? undefined : 'red';
                      return (
                        <Text color={color} weight="medium">
                          {isNaN(parsedValue)
                            ? value
                            : formatValue(Math.abs(parsedValue))}
                        </Text>
                      );
                    }}
                  </GenericLoadingValue>
                );
              }}
            >
              {partition => {
                return (
                  <PartitionLI
                    partition={partition}
                    user={user}
                    key={partition.id}
                  />
                );
              }}
            </FoldableList>
          </>
        );
      }}
    </QueryResult>
  );
}

function Accounts({ user }: { user: { id: string; dbname: string } }) {
  const accounts = useQuery(['accounts', user.id, false], () => {
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
      {accounts => {
        const groupedAccounts = groupBy(accounts, account => {
          return getAccountGroup(account);
        });
        const sortedAccounts = [
          ...(groupedAccounts.owned || []),
          ...(groupedAccounts.common || []),
          ...(groupedAccounts.others || []),
        ];
        return (
          <Flex direction="column" mb="2">
            {sortedAccounts.map(account => (
              <AccountLI account={account} user={user} key={account.id} />
            ))}
          </Flex>
        );
      }}
    </QueryResult>
  );
}

// TODO: Refactor this. This is just the same as getPartitionType from common.
export function getPartitionType2(p: Partition): 'owned' | 'common' | 'others' {
  if (p.is_owned) {
    if (p.owners.length === 1) {
      return 'owned';
    } else {
      return 'common';
    }
  } else {
    return 'others';
  }
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

  const updatePartition = useMutation(
    async ({ name, isPrivate }: { name: string; isPrivate: boolean }) => {
      return rpc.post.updatePartition({
        partitionId: partition.id,
        dbname: user.dbname,
        userId: user.id,
        name,
        isPrivate,
      });
    },
    {
      onSuccess: () => {
        invalidateMany(queryClient, [
          ['partitions', user.id, partition.account.id],
          ['transactions'],
          ['groupedTransactions'],
          ['unpaidLoans', user.id, partition.id],
          ['partitionsWithLoans', user.id],
        ]);
      },
    },
  );

  const categories = useQuery(['categories', user.id], () => {
    return rpc.post.getUserCategories({ userId: user.id, dbname: user.dbname });
  });

  const deletePartition = useMutation(
    (archive: boolean) => {
      return rpc.post.deletePartition({
        partitionId: partition.id,
        dbname: user.dbname,
        userId: user.id,
        archive,
      });
    },
    {
      onSuccess: () => {
        invalidateMany(queryClient, [
          ['transactions'],
          ['groupedTransactions'],
          ['partitions', user.id],
          ['accountCanBeDeleted', { accountId: partition.account.id }],
        ]);
      },
    },
  );

  const rightClickItems = [
    ...(categories.data
      ? [
          {
            label: 'Borrow',
            onClick: async e => {
              e.stopPropagation();
              const resp = await getLoanInput({ partition, user });
              if (resp) {
                await makeALoan(resp);
              }
            },
          } as RightClickItem,
        ]
      : []),
    ...(partition.is_owned
      ? [
          {
            label: 'Edit',
            onClick: async e => {
              e.stopPropagation();
              const resp = await editPartition({ partition });
              console.log('resp', resp);
              if (resp) {
                updatePartition.mutate(resp);
              }
            },
          } as RightClickItem,
          {
            label: 'Delete',
            color: 'red' as RadixColor,
            onClick: async e => {
              e.stopPropagation();
              const isDeleted = await deletePartition.mutateAsync(false);
              if (!isDeleted) {
                toast(
                  `There are transactions linked to '${partition.name}', are you sure you want to delete it?`,
                  {
                    action: {
                      label: 'Yes',
                      onClick: async () => {
                        const isArchived = await deletePartition.mutateAsync(
                          true,
                        );
                        if (!isArchived) {
                          toast.error('Failed to delete partition.');
                        }
                      },
                    },
                    cancel: { label: 'No' },
                  },
                );
              }
            },
          } as RightClickItem,
        ]
      : []),
  ];
  const isSelected = store.partitionIds.includes(partition.id);
  const variant = isSelected
    ? 'solid'
    : partition.is_private
    ? 'outline'
    : 'soft';
  const _type = getPartitionType2(partition);
  const color = isSelected ? 'cyan' : PARTITION_COLOR[_type];

  const makeALoan = useCallback(
    async (data: {
      amount: number;
      categoryId: string;
      destinationPartitionId: string;
      description?: string;
      toPay?: number;
    }) => {
      const result = await rpc.post.makeALoan({
        ...data,
        userId: user.id,
        dbname: user.dbname,
        sourcePartitionId: partition.id,
      });

      if (!result) {
        throw new Error('Something went wrong');
      }
      const { transaction } = result;
      const { counterpart } = transaction;

      const queryKeys: QueryKey[] = [];

      queryKeys.push(
        ['transactions'],
        ['groupedTransactions'],
        ['categoryBalance', { categoryId: data.categoryId }],
        ['categoryCanBeDeleted', { categoryId: data.categoryId }],
        ['partitionBalance', { partitionId: partition.id }],
        [
          'accountCanBeDeleted',
          { accountId: transaction.source_partition.account.id },
        ],
        [
          'accountBalance',
          { accountId: transaction.source_partition.account.id },
        ],
        ['categoryKindBalance', { kind: transaction.category.kind }],
        ['partitionsWithLoans', user.id],
      );
      if (counterpart) {
        queryKeys.push(
          ['partitionBalance', { partitionId: data.destinationPartitionId }],
          [
            'accountCanBeDeleted',
            { accountId: counterpart.source_partition.account.id },
          ],
          [
            'accountBalance',
            { accountId: counterpart.source_partition.account.id },
          ],
        );
      }
      invalidateMany(queryClient, queryKeys);
    },
    [partition.id, user, queryClient],
  );

  return (
    <Flex justify="between" m="2">
      <WithRightClick rightClickItems={rightClickItems}>
        <Badge
          color={color}
          variant={variant}
          style={{ cursor: 'pointer' }}
          onClick={e => {
            e.stopPropagation();
            dispatch({ type: 'TOGGLE_PARTITIONS', payload: [partition.id] });
            if (!store.showOverallBalance && store.budgetProfileId) {
              // If the user selected a budget profile, toggling a partition will
              // include/exclude it from the budget profile.
              rpc.post.toggleBudgetPartitions({
                userId: user.id,
                dbname: user.dbname,
                partitionIds: [partition.id],
                profileId: store.budgetProfileId,
              });
            }
            invalidateMany(queryClient, [
              ['categoryBalance'],
              ['categoryKindBalance'],
            ]);
          }}
        >
          {partition.name}
        </Badge>
      </WithRightClick>
      <QueryResult
        query={useQuery(
          [
            'partitionBalance',
            {
              partitionId: partition.id,
              showOverallBalance: store.showOverallBalance,
              tssDate: store.tssDate,
              tseDate: store.tseDate,
            },
          ],
          () =>
            rpc.post.getPartitionBalance({
              partitionId: partition.id,
              userId: user.id,
              dbname: user.dbname,
              isOverall: store.showOverallBalance,
              tssDate: store.tssDate?.toISOString(),
              tseDate: store.tseDate?.toISOString(),
            }),
        )}
        onLoading={<Skeleton style={{ minWidth: '50px' }} />}
      >
        {value => {
          const parsedValue = parseFloat(value);
          const color = parsedValue >= 0 ? undefined : 'red';
          return (
            <Text color={color}>
              {isNaN(parsedValue) ? value : formatValue(Math.abs(parsedValue))}
            </Text>
          );
        }}
      </QueryResult>
    </Flex>
  );
}

function CategoryValue(props: { value: string; weight: 'medium' | 'regular' }) {
  const parsedValue = parseFloat(props.value);
  const color: RadixColor = parsedValue >= 0 ? undefined : 'red';
  return (
    <Text color={color} weight={props.weight}>
      {isNaN(parsedValue) ? props.value : formatValue(Math.abs(parsedValue))}
    </Text>
  );
}

function Categories({ user }: { user: { id: string; dbname: string } }) {
  const categories = useQuery(['categories', user.id], () => {
    return rpc.post.getUserCategories({ userId: user.id, dbname: user.dbname });
  });
  const [store, dispatch] = useContext(UserPageStoreContext);
  const selectCategories = (kind: string) => {
    if (kind === 'Income') {
      if (categories?.data?.Income) {
        dispatch({
          type: 'TOGGLE_CATEGORY_KIND',
          payload: categories.data.Income.map(c => c.id),
        });
      }
    } else if (kind === 'Expense') {
      if (categories?.data?.Expense) {
        dispatch({
          type: 'TOGGLE_CATEGORY_KIND',
          payload: categories.data.Expense.map(c => c.id),
        });
      }
    } else if (kind === 'Transfer') {
      if (categories?.data?.Transfer) {
        dispatch({
          type: 'TOGGLE_CATEGORY_KIND',
          payload: categories.data.Transfer.map(c => c.id),
        });
      }
    }
  };

  const areAllCategoriesSelected = useCallback(
    (kind: string) => {
      if (kind === 'Income') {
        if (categories?.data?.Income) {
          return categories.data.Income.every(c =>
            store.categoryIds.includes(c.id),
          );
        }
      } else if (kind === 'Expense') {
        if (categories?.data?.Expense) {
          return categories.data.Expense.every(c =>
            store.categoryIds.includes(c.id),
          );
        }
      } else if (kind === 'Transfer') {
        if (categories?.data?.Transfer) {
          return categories.data.Transfer.every(c =>
            store.categoryIds.includes(c.id),
          );
        }
      }
      return false;
    },
    [categories?.data, store.categoryIds],
  );

  return (
    <Flex direction="column" mb="2">
      <QueryResult
        query={categories}
        onLoading={<FoldableListSkeleton />}
        onUndefined={<>No categories found</>}
      >
        {categories => (
          <FoldableList
            groupedItems={categories}
            openValues={['Income', 'Expense', 'Transfer']}
            getHeaderExtraContent={kind => (
              <GenericLoadingValue
                queryKey={[
                  'categoryKindBalance',
                  {
                    kind,
                    isOverall: store.showOverallBalance,
                    partitionIds: store.partitionIds,
                    tssDate: store.tssDate,
                    tseDate: store.tseDate,
                  },
                ]}
                valueLoader={() =>
                  rpc.post.getCategoryKindBalance({
                    kind,
                    userId: user.id,
                    dbname: user.dbname,
                    partitionIds: store.partitionIds,
                    isOverall: store.showOverallBalance,
                    tssDate: store.tssDate?.toISOString(),
                    tseDate: store.tseDate?.toISOString(),
                  })
                }
              >
                {value => <CategoryValue value={value} weight="medium" />}
              </GenericLoadingValue>
            )}
            getHeaderLabel={kind => (
              <Text
                weight="medium"
                color={areAllCategoriesSelected(kind) ? 'cyan' : undefined}
                onClick={e => {
                  e.stopPropagation();
                  selectCategories(kind);
                }}
                className={css({ cursor: 'pointer ' })}
              >
                {kind}
              </Text>
            )}
          >
            {category => (
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
                      '& svg': {
                        transition: 'transform 200ms ease',
                      },
                      '&[data-state=open]': {
                        '& svg': {
                          transform: 'rotate(90deg)',
                        },
                      },
                    })}
                  >
                    <ChevronRightIcon
                      className={css({
                        cursor: 'pointer',
                      })}
                    />
                  </Accordion.Trigger>
                  {props.getHeaderLabel(key)}
                </Flex>
                {props.getHeaderExtraContent?.(key)}
              </Flex>
            </Accordion.Header>
            <AnimatedAccordionContent>
              <Box
                className={css({
                  my: '1',
                  border: '1px solid var(--gray-a5)',
                  borderRadius: 'var(--radius-3)',
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
        {props.items.map(item => (
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

  const updateCategory = useMutation(
    async (arg: {
      name: string;
      isPrivate: boolean;
      defaultCategoryId?: string;
    }) => {
      return rpc.post.updateCategory({
        categoryId: category.id,
        dbname: user.dbname,
        userId: user.id,
        name: arg.name,
        isPrivate: arg.isPrivate,
        defaultPartitionId: arg.defaultCategoryId,
      });
    },
    {
      onSuccess: () => {
        invalidateMany(queryClient, [
          ['categories', user.id],
          ['transactions'],
          ['groupedTransactions'],
        ]);
      },
    },
  );

  const canBeDeleted = useQuery(
    ['categoryCanBeDeleted', { categoryId: category.id }],
    () => {
      return rpc.get.categoryCanBeDeleted({
        categoryId: category.id,
        dbname: user.dbname,
        userId: user.id,
      });
    },
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
        queryClient.invalidateQueries({ queryKey: ['categories', user.id] });
      },
    },
  );
  const isSelected = store.categoryIds.includes(category.id);
  const canBeRemoved = canBeDeleted.data;
  const rightClickItems = [
    ...(category.is_owned
      ? [
          {
            label: 'Edit',
            onClick: async e => {
              e.stopPropagation();
              const resp = await editCategory({ category, user });
              if (resp) {
                await updateCategory.mutateAsync(resp);
              }
            },
          } as RightClickItem,
        ]
      : []),
    ...(canBeRemoved
      ? [
          {
            label: 'Delete',
            color: 'red' as RadixColor,
            onClick: e => {
              e.stopPropagation();
              deleteCategory.mutateAsync();
            },
          } as RightClickItem,
        ]
      : []),
  ];
  const color = isSelected ? 'cyan' : CATEGORY_COLOR[category.kind];
  const variant = isSelected
    ? 'solid'
    : category.is_private
    ? 'outline'
    : 'soft';
  return (
    <Flex justify="between" m="2">
      <Flex gap="2">
        <WithRightClick rightClickItems={rightClickItems}>
          <Badge
            color={color}
            variant={variant}
            style={{ cursor: 'pointer' }}
            onClick={e => {
              e.stopPropagation();
              dispatch({ type: 'TOGGLE_CATEGORIES', payload: [category.id] });
            }}
          >
            {category.name}
          </Badge>
        </WithRightClick>
        {store.budgetProfileId && (
          <Budget
            category={category}
            user={user}
            budgetProfileId={store.budgetProfileId}
          />
        )}
      </Flex>
      <GenericLoadingValue
        queryKey={[
          'categoryBalance',
          {
            categoryId: category.id,
            partitionIds: store.partitionIds,
            isOverall: store.showOverallBalance,
            tssDate: store.tssDate,
            tseDate: store.tseDate,
          },
        ]}
        valueLoader={() =>
          rpc.post.getCategoryBalance({
            userId: user.id,
            categoryId: category.id,
            partitionIds: store.partitionIds,
            dbname: user.dbname,
            isOverall: store.showOverallBalance,
            tssDate: store.tssDate?.toISOString(),
            tseDate: store.tseDate?.toISOString(),
          })
        }
      >
        {value => <CategoryValue value={value} weight="regular" />}
      </GenericLoadingValue>
    </Flex>
  );
}

function Budget({
  category,
  budgetProfileId,
  user,
}: {
  category: Category;
  budgetProfileId: string;
  user: { id: string; dbname: string };
}) {
  const query = useQuery(
    ['budgetAmount', [category.id, budgetProfileId]],
    async () => {
      return rpc.post.getBudget({
        userId: user.id,
        dbname: user.dbname,
        categoryId: category.id,
        profileId: budgetProfileId,
      });
    },
  );
  return (
    <QueryResult
      query={query}
      onLoading={<Skeleton style={{ minWidth: '50px' }} />}
      onUndefined={
        <BudgetTextAmount
          budgetId={''}
          user={user}
          initAmount={'0'}
          categoryId={category.id}
          profileId={budgetProfileId}
        />
      }
    >
      {budget => (
        <BudgetTextAmount
          budgetId={budget.id}
          user={user}
          initAmount={budget.amount.toString()}
          categoryId={category.id}
          profileId={budgetProfileId}
        />
      )}
    </QueryResult>
  );
}

function BudgetTextAmount({
  budgetId,
  categoryId,
  profileId,
  user,
  initAmount,
}: {
  initAmount: string;
  categoryId: string;
  profileId: string;
  budgetId: string;
  user: { id: string; dbname: string };
}) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState(initAmount);

  const updateBudgetAmount = useMutation(
    async () => {
      return rpc.post.updateBudget({
        dbname: user.dbname,
        userId: user.id,
        budgetId,
        categoryId,
        profileId,
        amount: parseFloat(amount),
      });
    },
    {
      onSuccess: () => {
        invalidateMany(queryClient, [
          ['budgetAmount', [categoryId, profileId]],
        ]);
      },
    },
  );

  return (
    <TextField.Root>
      <TextField.Input
        name="budgetAmount"
        type="numeric"
        size="1"
        style={{
          maxWidth: '75px',
          textAlign: 'right',
          padding: '0 4px',
        }}
        value={amount}
        onInput={event => {
          setAmount(event.currentTarget.value);
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            updateBudgetAmount.mutate();
          }
        }}
        onBlur={() => {
          updateBudgetAmount.mutate();
        }}
      />
    </TextField.Root>
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
      onLoading={<Skeleton style={{ minWidth: '50px' }} />}
    >
      {props.children}
    </QueryResult>
  );
}

function getAccountGroup(account: Account): 'owned' | 'common' | 'others' {
  if (account.is_owned) {
    if (account.owners.length === 1) {
      return 'owned';
    } else {
      return 'common';
    }
  } else {
    return 'others';
  }
}

function FoldableListSkeleton({ nItems = 3 }: { nItems?: number }) {
  return (
    <Flex direction="column">
      {[...Array(nItems)].map((_, i) => (
        <Flex direction="column" px="4" key={i}>
          <Flex py="1" pr="2" justify="between">
            <Flex gap="1">
              <Skeleton style={{ minWidth: '100px' }} />
            </Flex>
            <Skeleton style={{ minWidth: '50px' }} />
          </Flex>
          <Box
            className={css({
              my: '1',
              py: '1',
              border: '1px solid var(--gray-a5)',
              borderRadius: 'var(--radius-3)',
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
