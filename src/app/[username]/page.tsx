"use client";

import { ReactHTML, useReducer } from "react";
import { css } from "../../../styled-system/css";
import { rpc } from "../rpc_client";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";

export default function UserPage(props: { params: { username: string } }) {
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
    <div className={css({ display: "flex" })}>
      <div
        className={css({ width: "1/3", minWidth: "250px", maxWidth: "300px" })}
      >
        <QueryResult
          result={user}
          as="div"
          className={css({ padding: "10px" })}
          onLoading={<>Loading {`${username}'s accounts`}...</>}
          onUndefined={<>{`${username}'s data`} not found</>}
        >
          {(user) => (
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
                    {account.name} - {account.balance}
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
                        {partition.name} - {partition.balance}
                      </li>
                    )}
                  </ForEach>
                </li>
              )}
            </ForEach>
          )}
        </QueryResult>
      </div>
      <Transactions partitionIds={selectedPartitions} />
    </div>
  );
}

function Transactions(props: { partitionIds: string[] }) {
  const transactions = useQuery(["transactions", props.partitionIds], () => {
    return rpc.post.findTransactions({ partitionIds: props.partitionIds });
  });
  return (
    <QueryResult
      result={transactions}
      as="div"
      className={css({ padding: "10px" })}
      onLoading={<>Loading transactions...</>}
      onUndefined={<>Select a partition to show transactions</>}
    >
      {(transactions) => (
        <ForEach items={transactions} as="ul">
          {(transaction) => (
            <li key={transaction.id}>
              {transaction.source_partition.name} - {transaction.value}
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
  children: (item: T) => React.ReactNode;
}) {
  const { as: Tag } = props;
  return (
    <Tag className={props.className}>{props.items.map(props.children)}</Tag>
  );
}

function QueryResult<T>(props: {
  as: keyof ReactHTML;
  className?: string;
  result: UseQueryResult<T>;
  children: (data: NonNullable<T>) => React.ReactNode;
  onLoading: React.ReactNode;
  onUndefined: React.ReactNode;
  onError?: (error: Error) => React.ReactNode;
}) {
  const { data, isLoading, isError } = props.result;
  const { as: Tag } = props;
  let node: React.ReactNode;
  if (isLoading) {
    node = props.onLoading;
  } else if (isError) {
    node = props.onError ? props.onError(props.result.error as Error) : null;
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
