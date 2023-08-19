"use client";

import { ReactHTML, useReducer } from "react";
import { css } from "../../../styled-system/css";
import { rpc } from "../rpc_client";
import {
  type UseQueryResult,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { object, optional, string } from "valibot";

export default function UserPage(props: { params: { username: string } }) {
  const queryClient = useQueryClient();
  const { username } = props.params;
  const user = useQuery(["user", username], () => {
    return rpc.post.findUser({ username });
  });
  const [selectedPartitions, toggleSelectedPartitions] = useReducer(
    (state: string[], action: { ids: string[] }) => {
      for (const id of action.ids) {
        if (state.includes(id)) {
          state = state.filter((_id) => _id !== id);
        } else {
          state = [...state, id];
        }
      }
      return state;
    },
    []
  );
  return (
    <QueryResult
      query={user}
      as="div"
      className={css({ display: "flex" })}
      onLoading={<>Loading {`${username}'s accounts`}...</>}
      onUndefined={<>{`${username}'s data`} not found</>}
    >
      {(user) => (
        <>
          <div
            className={css({
              padding: "10px",
              width: "1/3",
              minWidth: "250px",
              maxWidth: "300px",
            })}
          >
            <ForEach items={user.accounts} as="ul">
              {(account) => (
                <li
                  key={account.id}
                  className={css({
                    cursor: "pointer",
                    color: isSubset(
                      account.partitions.map((p) => p.id),
                      selectedPartitions
                    )
                      ? "blue"
                      : "inherit",
                  })}
                  onClick={() => {
                    const unselected = account.partitions.filter(
                      (p) => !selectedPartitions.includes(p.id)
                    );
                    if (unselected.length > 0) {
                      toggleSelectedPartitions({
                        ids: unselected.map((p) => p.id),
                      });
                    } else {
                      toggleSelectedPartitions({
                        ids: account.partitions.map((p) => p.id),
                      });
                    }
                  }}
                >
                  <div>
                    {account.name} | {account.balance}
                  </div>
                  <ForEach
                    items={account.partitions}
                    as="ul"
                    className={css({ paddingStart: "10px" })}
                  >
                    {(partition) => (
                      <li
                        key={partition.id}
                        className={css({
                          cursor: "pointer",
                          color: selectedPartitions.includes(partition.id)
                            ? "blue"
                            : "inherit",
                        })}
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleSelectedPartitions({ ids: [partition.id] });
                        }}
                      >
                        {partition.name} | {partition.balance}
                      </li>
                    )}
                  </ForEach>
                </li>
              )}
            </ForEach>
          </div>
          <div>
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                const target = event.target as HTMLFormElement;
                const formdata = new FormData(target as HTMLFormElement);
                const formObj = Object.fromEntries(formdata.entries());
                const dataSchema = object({
                  sourcePartitionId: string(),
                  categoryId: string(),
                  value: string(),
                  description: optional(string()),
                });
                const parsedData = dataSchema.parse(formObj);
                await rpc.post.createTransaction(parsedData);
                target.reset();
                queryClient.invalidateQueries({ queryKey: ["transactions"] });
                queryClient.invalidateQueries({ queryKey: ["user", username] });
              }}
            >
              <label htmlFor="sourcePartitionId">Source Partition</label>
              <select name="sourcePartitionId">
                {user.accounts
                  .flatMap((account) => account.partitions)
                  .map((p) => {
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    );
                  })}
              </select>
              <label htmlFor="value">Value</label>
              <input type="text" inputMode="numeric" name="value" />
              <label htmlFor="categoryId">Category</label>
              <select name="categoryId">
                {user.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <label htmlFor="description">Description</label>
              <input type="text" name="description" />
              <input type="submit" value="Submit" />
            </form>
            <Transactions
              selectedPartitionIds={selectedPartitions}
              userId={user.id}
            />
          </div>
        </>
      )}
    </QueryResult>
  );
}

function Transactions(props: {
  selectedPartitionIds: string[];
  userId: string;
}) {
  const { selectedPartitionIds, userId } = props;
  const transactions = useQuery(
    ["transactions", selectedPartitionIds, userId],
    () => {
      if (selectedPartitionIds.length === 0) {
        return rpc.post.getUserTransactions({ userId: userId });
      }
      return rpc.post.findTransactions({
        partitionIds: selectedPartitionIds,
      });
    }
  );
  return (
    <QueryResult
      query={transactions}
      as="div"
      className={css({ padding: "10px" })}
      onLoading={<>Loading transactions...</>}
      onUndefined={<>Select a partition to show transactions</>}
    >
      {(transactions) => (
        <ForEach items={transactions} as="ul">
          <IfEmpty>No transactions found</IfEmpty>
          {(transaction) => (
            <li key={transaction.id}>
              {transaction.source_partition.name} | {transaction.value}
            </li>
          )}
        </ForEach>
      )}
    </QueryResult>
  );
}

function ForEach<T>(props: {
  as: keyof ReactHTML;
  className?: string;
  items: T[];
  children:
    | ((item: T) => React.ReactNode)
    | [React.ReactNode, (item: T) => React.ReactNode];
}) {
  const { as: Tag } = props;
  if (typeof props.children === "function") {
    return (
      <Tag className={props.className}>{props.items.map(props.children)}</Tag>
    );
  } else {
    const [onEmpty, renderProp] = props.children;
    return (
      <Tag className={props.className}>
        {props.items.length === 0 ? onEmpty : props.items.map(renderProp)}
      </Tag>
    );
  }
}

/**
 * Dummy component to be used inside a ForEach component to render
 * something when the list is empty. Used to label the first child
 * to be used as the "onEmpty" element.
 */
function IfEmpty(props: { children: React.ReactNode }) {
  return props.children;
}

function QueryResult<T>(props: {
  as: keyof ReactHTML;
  className?: string;
  query: UseQueryResult<T>;
  children: (data: NonNullable<T>) => React.ReactNode;
  onLoading: React.ReactNode;
  onUndefined: React.ReactNode;
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
  return <Tag className={props.className}>{node}</Tag>;
}

function isSubset(subset: string[], superset: string[]) {
  return subset.every((item) => superset.includes(item));
}
