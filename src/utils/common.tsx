import { UseQueryResult } from "@tanstack/react-query";
import { ReactHTML } from "react";

export type Unpacked<T> = T extends (infer U)[] ? U : T;

export function groupBy<T>(
  items: T[],
  key: (item: T) => string
): Record<string, T[]> {
  const result: Record<string, T[]> = {};
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

const nf = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

export function formatValue(value: number) {
  return nf.format(Math.abs(value));
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
