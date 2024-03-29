import {
  QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useContext, useState } from 'react';
import {
  Badge,
  Flex,
  IconButton,
  Popover,
  Text,
  Table,
} from '@radix-ui/themes';
import { Cross1Icon, ChevronRightIcon } from '@radix-ui/react-icons';
import { GiPayMoney } from 'react-icons/gi';
import { BiMoneyWithdraw } from 'react-icons/bi';

import DatePicker from 'react-datepicker';
import Skeleton from 'react-loading-skeleton';
import { toast } from 'sonner';
import {
  CATEGORY_COLOR,
  DateInput,
  PARTITION_COLOR,
  Partitions,
  QueryResult,
  Unpacked,
  formatValue,
  getCategoryOptionName,
  getPartitionType,
  invalidateMany,
  parseValue,
  useGroupedPartitions,
  usePartitions,
} from '@/utils/common';
import { rpc } from '@/app/rpc_client';
import { css } from '../../../../styled-system/css';
import { TransactionForm } from './transaction_form';
import { Combobox } from './combobox';
import { UserPageStoreContext } from './store';
import { useTransactions } from './use_transactions';

type Transaction = Unpacked<
  NonNullable<Awaited<ReturnType<typeof rpc.post.findTransactions>>>[0]
>;
type Partition = Transaction['source_partition'];

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
    },
  );
  const _type = getPartitionType(partition);
  const color = PARTITION_COLOR[_type];
  const groupedPartitions = useGroupedPartitions(partitions, !isCounterpart);
  const selectedCategory = transaction.category;
  const variant = partition.is_private ? 'outline' : 'soft';
  return (
    <Combobox
      groupedItems={groupedPartitions}
      getGroupHeading={(key, items) => items[0].account.label}
      getItemColor={item => {
        const _type = getPartitionType(item);
        return PARTITION_COLOR[_type];
      }}
      isItemIncluded={p => !selectedCategory.is_private || p.is_private}
      getItemValue={p => `${getPartitionType(p)} ${p.account.label} ${p.name}`}
      getItemDisplay={p => p.name}
      onSelectItem={async par => {
        await updateTransaction.mutateAsync({
          transaction,
          partitionId: par.id,
          isCounterpart,
        });
        invalidateMany(queryClient, [
          ['transactions'],
          ['groupedTransactions'],
          ['partitionBalance', { partitionId: par.id }],
          ['partitionBalance', { partitionId: partition.id }],
          ['accountBalance', { accountId: par.account.id }],
          ['accountBalance', { accountId: partition.account.id }],
        ]);
      }}
    >
      <Popover.Trigger>
        <Badge color={color} variant={variant} style={{ cursor: 'pointer' }}>
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
    const _type = getPartitionType(partition);
    const color = PARTITION_COLOR[_type];
    if (isEditable(transaction) && !partition.archived) {
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
        <Badge color={color} variant="surface">
          {partition.label}
        </Badge>
      );
    }
  } else {
    return (
      <Badge color="gray" variant="outline">
        Private
      </Badge>
    );
  }
}

function isEditable(transaction: Transaction) {
  return (
    !(transaction.is_loan && transaction.has_payments) &&
    !transaction.is_payment &&
    (transaction.source_partition?.account.is_owned || false)
  );
}

const CategoryText = ({ transaction }: { transaction: Transaction }) => {
  const categoryLabel = transaction.category.name;
  const icon = transaction.is_loan ? (
    <BiMoneyWithdraw />
  ) : (
    (transaction.is_payment && <GiPayMoney />) || null
  );
  return (
    <>
      {categoryLabel} {icon}
    </>
  );
};

export function TransactionsTable({
  user,
}: {
  user: { id: string; dbname: string };
}) {
  const queryClient = useQueryClient();
  const [, dispatch] = useContext(UserPageStoreContext);

  const [isDeleting, setIsDeleting] = useState(false);

  const transactions = useTransactions(user);

  const categories = useQuery(['categories', user.id], () => {
    return rpc.post.getUserCategories({ userId: user.id, dbname: user.dbname });
  });

  const partitions = usePartitions(user);

  const updateTransactionDate = useMutation(
    async (arg: { transactionId: string; newDate: Date }) => {
      return rpc.post.updateTransactionDate({
        transactionId: arg.transactionId,
        userId: user.id,
        dbname: user.dbname,
        date: arg.newDate.toISOString(),
      });
    },
    {
      onSuccess: () => {
        invalidateMany(queryClient, [
          ['transactions'],
          ['groupedTransactions'],
        ]);
      },
    },
  );

  const updateTransaction = useMutation(
    async (arg: { transaction: Transaction; categoryId: string }) => {
      const { transaction, categoryId } = arg;
      if (transaction.category.id === categoryId) {
        return;
      }
      return rpc.post.updateTransaction({
        transactionId: transaction.id,
        categoryId,
        userId: user.id,
        dbname: user.dbname,
      });
    },
  );

  const getPartitionColumn = (transaction: Transaction) => {
    if (transaction.kind === 'Transfer') {
      return (
        <Flex>
          <PartitionBadge
            partitions={partitions}
            transaction={transaction}
            partition={transaction.source_partition}
            user={user}
            isCounterpart={false}
          />
          <Flex align="center">
            <ChevronRightIcon />
          </Flex>
          <PartitionBadge
            partitions={partitions}
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
          partitions={partitions}
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
      Boolean,
    ) as Transaction[];
    return (
      transactions.some(t => t.source_partition?.account.is_owned) &&
      (transaction.is_payment || isEditable(transaction))
    );
  };

  return (
    <Table.Root variant="surface" size="1" m="4">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Category</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Partition</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell justify="end" style={{ minWidth: '11ch' }}>
            Amount
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        <TransactionForm user={user} />
        <QueryResult
          query={transactions}
          onLoading={Array.from({ length: 10 }).map((_, i) => (
            <Table.Row key={i}>
              <Table.Cell>
                <Skeleton />
              </Table.Cell>
              <Table.Cell>
                <Skeleton />
              </Table.Cell>
              <Table.Cell>
                <Skeleton />
              </Table.Cell>
              <Table.Cell>
                <Skeleton />
              </Table.Cell>
              <Table.Cell>
                <Skeleton />
              </Table.Cell>
              <Table.Cell></Table.Cell>
            </Table.Row>
          ))}
        >
          {([transactions]) => {
            if (transactions.length > 0) {
              return transactions.map(transaction => {
                const allowedCategories =
                  categories.data?.[transaction.category.kind] ?? [];
                const variant = transaction.category.is_private
                  ? 'outline'
                  : 'soft';
                const amountColor = transaction.counterpart
                  ? 'blue'
                  : parseValue(transaction.value) < 0
                  ? 'red'
                  : 'green';
                return (
                  <Table.Row
                    key={transaction.id}
                    className={css({
                      '& td': { whiteSpace: 'nowrap' },
                      '& .delete-button': {
                        opacity: '0',
                        transition: 'opacity 0.2s ease-in-out',
                      },
                      '&:hover': {
                        '& .delete-button': {
                          opacity: '1',
                        },
                      },
                    })}
                  >
                    <Table.Cell>
                      <DatePicker
                        popperProps={{
                          // to make sure the datepicker is always visible and don't hide behind the table
                          strategy: 'fixed',
                        }}
                        selected={new Date(transaction.str_date)}
                        onChange={date => {
                          if (!date) {
                            return;
                          }
                          updateTransactionDate.mutate({
                            transactionId: transaction.id,
                            newDate: date,
                          });
                        }}
                        dateFormat="yyyy-MM-dd"
                        customInput={
                          <DateInput isPointer={isEditable(transaction)} />
                        }
                        readOnly={!isEditable(transaction)}
                      />
                    </Table.Cell>
                    <Table.Cell>
                      {isEditable(transaction) ? (
                        <Combobox
                          groupedItems={{
                            [transaction.category.kind]: allowedCategories,
                          }}
                          getGroupHeading={key => key}
                          getItemDisplay={cat => getCategoryOptionName(cat)}
                          getItemValue={cat =>
                            `${
                              transaction.category.kind
                            } ${getCategoryOptionName(cat)}`
                          }
                          getItemColor={cat => CATEGORY_COLOR[cat.kind]}
                          onSelectItem={async cat => {
                            await updateTransaction.mutateAsync({
                              transaction,
                              categoryId: cat.id,
                            });
                            invalidateMany(queryClient, [
                              ['transactions'],
                              ['groupedTransactions'],
                              [
                                'categoryBalance',
                                { categoryId: transaction.category.id },
                              ],
                              ['categoryBalance', { categoryId: cat.id }],
                              [
                                'categoryCanBeDeleted',
                                { categoryId: transaction.category.id },
                              ],
                              ['categoryCanBeDeleted', { categoryId: cat.id }],
                            ]);
                          }}
                        >
                          <Popover.Trigger>
                            <Badge
                              color={CATEGORY_COLOR[transaction.category.kind]}
                              variant={variant}
                              style={{ cursor: 'pointer' }}
                            >
                              <CategoryText transaction={transaction} />
                            </Badge>
                          </Popover.Trigger>
                        </Combobox>
                      ) : (
                        <Badge
                          color={CATEGORY_COLOR[transaction.category.kind]}
                          variant="surface"
                        >
                          <CategoryText transaction={transaction} />
                        </Badge>
                      )}
                    </Table.Cell>
                    <Table.Cell>{getPartitionColumn(transaction)}</Table.Cell>
                    <Table.Cell justify="end">
                      <Text color={amountColor} weight="medium">
                        {isEditable(transaction) ? (
                          <EditableAmountField {...{ transaction, user }} />
                        ) : (
                          formatValue(Math.abs(parseValue(transaction.value)))
                        )}
                      </Text>
                    </Table.Cell>
                    <Table.Cell style={{ minWidth: '300px' }}>
                      {isEditable(transaction) ? (
                        <EditableDescriptionField {...{ transaction, user }} />
                      ) : (
                        transaction.description
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      {shouldShowDelete(transaction) && (
                        <IconButton
                          className="delete-button"
                          variant="ghost"
                          color="crimson"
                          onClick={async () => {
                            setIsDeleting(true);
                            const result = await rpc.post.deleteTransaction({
                              transactionId: transaction.id,
                              userId: user.id,
                              dbname: user.dbname,
                            });
                            const queryKeys = getQueryKeysToInvalidate(
                              transaction,
                              user,
                            );
                            if (result) {
                              if ('loanId' in result && result.loanId) {
                                dispatch({
                                  type: 'REMOVE_LOAN_IDS',
                                  payload: [result.loanId],
                                });
                              }
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
              });
            } else {
              return (
                <Table.Row>
                  <Table.Cell colSpan={6} align="center">
                    <Text>No transactions found</Text>
                  </Table.Cell>
                </Table.Row>
              );
            }
          }}
        </QueryResult>
      </Table.Body>
    </Table.Root>
  );
}

const EditableAmountField = (props: {
  transaction: Transaction;
  user: { id: string; dbname: string };
}) => {
  const { transaction, user } = props;
  const originalValue = formatValue(Math.abs(parseValue(transaction.value)));
  const [value, setValue] = useState(originalValue);

  const queryClient = useQueryClient();
  const updateTransactionValue = useMutation(
    async () => {
      const parsedValue = parseValue(value);
      if (isNaN(parsedValue)) {
        toast.error('Invalid value');
        return false;
      }

      return rpc.post.updateTransactionValue({
        transactionId: transaction.id,
        userId: user.id,
        dbname: user.dbname,
        value: parseValue(value),
      });
    },
    {
      onSuccess: success => {
        const newValue = success ? value : originalValue;
        setValue(formatValue(Math.abs(parseValue(newValue))));

        if (!success) {
          return;
        }
        const queryKeys = getQueryKeysToInvalidate(transaction, user);
        invalidateMany(queryClient, queryKeys);
      },
    },
  );

  return (
    <input
      inputMode="decimal"
      type="text"
      value={value}
      style={{ width: '100%' }}
      onInput={e => {
        setValue(e.currentTarget.value);
      }}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          updateTransactionValue.mutate();
        }
      }}
      onBlur={() => {
        updateTransactionValue.mutate();
      }}
    />
  );
};

const EditableDescriptionField = (props: {
  transaction: Transaction;
  user: { id: string; dbname: string };
}) => {
  const { transaction, user } = props;
  const [value, setValue] = useState(transaction.description || '');

  const queryClient = useQueryClient();
  const updateTransaction = useMutation(
    async (arg: { transaction: Transaction; description: string }) => {
      const { transaction, description } = arg;
      return rpc.post.updateTransaction({
        transactionId: transaction.id,
        userId: user.id,
        dbname: user.dbname,
        description,
      });
    },
    {
      onSuccess: () => {
        invalidateMany(queryClient, [
          ['transactions'],
          ['groupedTransactions'],
        ]);
      },
    },
  );

  return (
    <input
      type="text"
      value={value}
      style={{ width: '100%' }}
      onInput={e => {
        setValue(e.currentTarget.value);
      }}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          updateTransaction.mutate({
            transaction,
            description: value,
          });
        }
      }}
      onBlur={() => {
        updateTransaction.mutate({
          transaction,
          description: value,
        });
      }}
    />
  );
};

const getQueryKeysToInvalidate = (
  transaction: Transaction,
  user: { id: string; dbname: string },
) => {
  const queryKeys: QueryKey[] = [
    ['transactions'],
    ['groupedTransactions'],
    ['user', user.id],
    ['categoryCanBeDeleted', { categoryId: transaction.category.id }],
    [
      'categoryBalance',
      {
        categoryId: transaction.category.id,
      },
    ],
    ['categoryKindBalance', { kind: transaction.category.kind }],
  ];
  if (transaction.source_partition) {
    queryKeys.push(
      [
        'partitionBalance',
        {
          partitionId: transaction.source_partition.id,
        },
      ],
      [
        'accountCanBeDeleted',
        {
          accountId: transaction.source_partition.account.id,
        },
      ],
      [
        'accountBalance',
        {
          accountId: transaction.source_partition.account.id,
        },
      ],
      ['partitionsWithLoans', user.id],
    );
  }
  if (transaction.counterpart) {
    queryKeys.push(
      [
        'partitionBalance',
        {
          partitionId: transaction.counterpart.source_partition.id,
        },
      ],
      [
        'accountCanBeDeleted',
        {
          accountId: transaction.counterpart.source_partition.account.id,
        },
      ],
      [
        'accountBalance',
        {
          accountId: transaction.counterpart.source_partition.account.id,
        },
      ],
      ['unpaidLoans', user.id, transaction.counterpart.source_partition.id],
    );
  }
  return queryKeys;
};
