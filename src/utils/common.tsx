import { rpc } from "@/app/rpc_client";
import { Badge, Flex, Grid, textPropDefs } from "@radix-ui/themes";
import { UseQueryResult, QueryClient, QueryKey } from "@tanstack/react-query";
import { ForwardedRef, ReactHTML, forwardRef, useMemo } from "react";

export type Unpacked<T> = T extends (infer U)[] ? U : T;

export function groupBy<T, K extends string>(
  items: T[],
  key: (item: T) => K
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
    `[${parts.find((d) => d.type === "group")!.value}]`,
    "g"
  );
  const decimal = new RegExp(
    `[${parts.find((d) => d.type === "decimal")!.value}]`
  );
  const numeral = new RegExp(`[${numerals.join("")}]`, "g");
  const parse = (string: string) => {
    return (string = string
      .trim()
      .replace(group, "")
      .replace(decimal, ".")
      .replace(numeral, (x) => index.get(x)!.toString()))
      ? +string
      : NaN;
  };
  return parse;
}

const sp = createParser("en-US");

const nf = new Intl.NumberFormat("en-US", {
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
  if (Tag === undefined) return <>{node}</>;
  return <Tag className={props.className}>{node}</Tag>;
}

export type Partitions = Awaited<
  ReturnType<typeof rpc.post.getPartitionOptions>
>;
export type PartitionOption = Unpacked<NonNullable<Partitions>>;

export function getPartitionType(
  p: PartitionOption,
  userId: string
): "owned" | "common" | "others" {
  if (p.account.owners.length === 1 && p.account.owners[0].id === userId) {
    return "owned";
  } else if (
    p.account.owners.length > 1 &&
    p.account.owners.map((o) => o.id).includes(userId)
  ) {
    return "common";
  }
  return "others";
}

export const CATEGORY_COLOR = {
  Income: "green",
  Expense: "red",
  Transfer: "blue",
} as const;

export const PARTITION_COLOR = {
  owned: "orange",
  common: "indigo",
  others: "gray",
} as const;

export type RadixColor =
  | (typeof textPropDefs)["color"]["values"][number]
  | undefined;

export type Categories = Awaited<ReturnType<typeof rpc.post.getUserCategories>>;
export type Category = Unpacked<Categories["Expense"]>;

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
  userId: string,
  onlyOwned = false
) {
  const sortedPartitions = useMemo(() => {
    const partitionsByType = groupBy(
      partitions.filter((p) => (onlyOwned ? p.account.is_owned : true)),
      (p) => getPartitionType(p, userId)
    );
    return [
      ...(partitionsByType.owned || []),
      ...(partitionsByType.common || []),
      ...(partitionsByType.others || []),
    ];
  }, [partitions, userId, onlyOwned]);

  const groupedPartitions = useMemo(() => {
    return groupBy(sortedPartitions, (p) => p.account.id);
  }, [sortedPartitions]);

  return groupedPartitions;
}

export function TwoColumnInput(props: { children: React.ReactNode }) {
  return (
    <Grid asChild columns="125px 1fr" align="center">
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
  position: "fixed" | "absolute";
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
  delay: number
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
  { value, onClick }: any,
  ref: ForwardedRef<HTMLButtonElement>
) {
  return (
    <Badge ref={ref} onClick={onClick}>
      {value || "Today"}
    </Badge>
  );
});
