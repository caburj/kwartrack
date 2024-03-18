'use client';

import { Badge, Flex, Grid, textPropDefs, Box, Text } from '@radix-ui/themes';
import {
  UseQueryResult,
  QueryClient,
  QueryKey,
  useQuery,
} from '@tanstack/react-query';
import { ForwardedRef, ReactHTML, forwardRef, useMemo, useState } from 'react';
import { Cross2Icon } from '@radix-ui/react-icons';
import { rpc } from '@/app/rpc_client';
import { css } from '../../styled-system/css';
import {
  Combobox,
  ComboboxTrigger,
} from '../app/[username]/expense-tracker/combobox';

export type Unpacked<T> = T extends (infer U)[] ? U : T;

export function groupBy<T, K extends string>(
  items: T[],
  key: (item: T) => K,
): Record<K, T[]> {
  const result = {} as Record<K, T[]>;
  for (const item of items) {
    const k = key(item);
    if (k in result) {
      result[k].push(item);
    } else {
      result[k] = [item];
    }
  }
  return result;
}

/**
 * TODO: only allow 2 decimal places
 * TODO: parsing and formatting should be in the backend
 * Source: https://stackoverflow.com/questions/55364947/is-there-any-javascript-standard-api-to-parse-to-number-according-to-locale
 */
function createParser(locale: string) {
  const parts = new Intl.NumberFormat(locale).formatToParts(-12345.6);
  const numerals = [
    ...new Intl.NumberFormat(locale, { useGrouping: false }).format(9876543210),
  ].reverse();
  const index = new Map(numerals.map((d, i) => [d, i]));
  const group = new RegExp(
    `[${parts.find(d => d.type === 'group')!.value}]`,
    'g',
  );
  const decimal = new RegExp(
    `[${parts.find(d => d.type === 'decimal')!.value}]`,
  );
  const numeral = new RegExp(`[${numerals.join('')}]`, 'g');
  const parse = (string: string) => {
    string = string
      .trim()
      .replace(group, '')
      .replace(decimal, '.')
      .replace(numeral, x => index.get(x)!.toString());
    return string ? Number(string) : NaN;
  };
  return parse;
}

const sp = createParser('en-US');

const nf = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

export function parseValue(value: string) {
  return sp(value);
}

export function formatValue(value: number) {
  return nf.format(value);
}

export function QueryResult<T>(props: {
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
  if (Tag === undefined) {
    return <>{node}</>;
  }
  return <Tag className={props.className}>{node}</Tag>;
}

export type Partitions = Awaited<
  ReturnType<typeof rpc.post.getPartitionOptions>
>;
export type PartitionOption = Unpacked<NonNullable<Partitions>>;

export function getPartitionType(
  p: PartitionOption,
): 'owned' | 'common' | 'others' {
  if (p.account.is_owned) {
    if (p.account.owners.length === 1) {
      return 'owned';
    } else {
      return 'common';
    }
  } else {
    return 'others';
  }
}

export const CATEGORY_COLOR = {
  Income: 'green',
  Expense: 'red',
  Transfer: 'blue',
} as const;

export const PARTITION_COLOR = {
  owned: 'orange',
  common: 'indigo',
  others: 'gray',
} as const;

export type RadixColor =
  | (typeof textPropDefs)['color']['values'][number]
  | undefined;

export type Categories = Awaited<ReturnType<typeof rpc.post.getUserCategories>>;
export type Category = Unpacked<Categories['Expense']>;

export const getCategoryOptionName = (category: Category) => {
  return category.name;
};

export function invalidateMany(client: QueryClient, keys: QueryKey[]) {
  for (const key of keys) {
    client.invalidateQueries(key);
  }
}

export function useGroupedPartitions(
  partitions: Partitions,
  onlyOwned = false,
) {
  const sortedPartitions = useMemo(() => {
    const partitionsByType = groupBy(
      partitions.filter(p => (onlyOwned ? p.account.is_owned : true)),
      p => getPartitionType(p),
    );
    return [
      ...(partitionsByType.owned || []),
      ...(partitionsByType.common || []),
      ...(partitionsByType.others || []),
    ];
  }, [partitions, onlyOwned]);

  const groupedPartitions = useMemo(() => {
    return groupBy(sortedPartitions, p => p.account.id);
  }, [sortedPartitions]);

  return groupedPartitions;
}

export function usePartitions(user: { id: string; dbname: string }) {
  const partitions = useQuery(['partitions', user.id], () => {
    return rpc.post.getPartitionOptions({
      userId: user.id,
      dbname: user.dbname,
    });
  });
  return partitions.data || [];
}

export function TwoColumnInput(props: { children: React.ReactNode }) {
  return (
    <Grid asChild columns="150px 1fr" align="center">
      <label>{props.children}</label>
    </Grid>
  );
}

export function Centered(props: { children: React.ReactNode }) {
  return (
    <Flex
      position="fixed"
      top="0"
      left="0"
      bottom="0"
      right="0"
      direction="column"
      justify="center"
      align="center"
    >
      {props.children}
    </Flex>
  );
}

export function Positioned(props: {
  children: React.ReactNode;
  position: 'fixed' | 'absolute';
  top?: string;
  left?: string;
  bottom?: string;
  right?: string;
  padding?: string;
}) {
  return (
    <Flex
      position={props.position}
      style={{
        padding: props.padding,
        top: props.top,
        left: props.left,
        bottom: props.bottom,
        right: props.right,
      }}
    >
      {props.children}
    </Flex>
  );
}

export function debounce<C extends (...args: any[]) => any>(
  callback: C,
  delay: number,
) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<C>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      callback(...args);
      timeoutId = null;
    }, delay);
  };
}

export const DateInput = forwardRef(function DateInput(
  props: any,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  const { value, onClick, isPointer } = props;
  return (
    <Badge
      ref={ref}
      onClick={onClick}
      style={{ cursor: isPointer ? 'pointer' : 'auto' }}
    >
      {value || 'Today'}
    </Badge>
  );
});

export const getFirstDayOfMonth = (date: Date) => {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1));
};

export const getLastDayOfMonth = (date: Date) => {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth() + 1, 0));
};

export const plusMonths = (date: Date, n: number) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return new Date(d);
};

type UsePartitionItem = ReturnType<typeof usePartitions>[number];

export const useDefaultPartitionInput = ({
  user,
  categoryIsPrivate,
  defaultPartitionId,
}: {
  user: { id: string; dbname: string };
  categoryIsPrivate: boolean;
  defaultPartitionId?: string;
}) => {
  const partitions = usePartitions(user);

  const groupedPartitions = useGroupedPartitions(partitions);

  const initialDefaultPartition = partitions.find(
    p => p.id === defaultPartitionId,
  );

  const [selectedDefaultPartition, setSelectedDefaultPartition] = useState<
    UsePartitionItem | undefined
  >(initialDefaultPartition);

  const defaultPartitionVariant = selectedDefaultPartition?.is_private
    ? 'outline'
    : 'soft';

  const type = selectedDefaultPartition
    ? getPartitionType(selectedDefaultPartition)
    : 'others';

  const defaultPartitionColor = PARTITION_COLOR[type];

  const defaultPartitionLabel = selectedDefaultPartition
    ? `${selectedDefaultPartition.account.label} - ${selectedDefaultPartition.name}`
    : 'None';

  const inputEl = (
    <TwoColumnInput>
      <Text as="div" size="2" weight="bold">
        Default Partition
      </Text>
      <Combobox
        groupedItems={groupedPartitions}
        getGroupHeading={(_key, items) => items[0].account.label}
        getItemColor={item => {
          const type = getPartitionType(item);
          return PARTITION_COLOR[type];
        }}
        isItemIncluded={p => (categoryIsPrivate ? p.is_private : true)}
        getItemValue={p =>
          `${getPartitionType(p)} ${p.account.label} ${p.name}`
        }
        getItemDisplay={p => p.name}
        onSelectItem={p => {
          setSelectedDefaultPartition(p);
        }}
      >
        <Flex align="center" gap="1">
          <ComboboxTrigger
            color={defaultPartitionColor}
            variant={defaultPartitionVariant}
          >
            {defaultPartitionLabel}
          </ComboboxTrigger>
          <Box
            onClick={e => {
              setSelectedDefaultPartition(undefined);
              e.preventDefault();
            }}
            className={css({ cursor: 'pointer' })}
          >
            <Text color="gray">
              <Cross2Icon width="18" height="18" />
            </Text>
          </Box>
        </Flex>
      </Combobox>
    </TwoColumnInput>
  );

  return { inputEl, selectedDefaultPartition };
};
