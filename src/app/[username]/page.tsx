"use client";

import { ReactHTML } from "react";
import { css } from "../../../styled-system/css";
import { rpc } from "../rpc_client";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";

export default function UserPage(props: { params: { username: string } }) {
  const { username } = props.params;
  const user = useQuery(["user", username], () => {
    return rpc.post.findUser({ username });
  });
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
          onNoData={<>{`${username}'s data`} not found</>}
        >
          {(user) => (
            <ForEach items={user.accounts} as="ul">
              {(account) => (
                <li key={account.id}>
                  <div>
                    {account.name} - {account.balance}
                  </div>
                  <ForEach
                    items={account.partitions}
                    as="ul"
                    className={css({ paddingStart: "10px" })}
                  >
                    {(partition) => (
                      <li key={partition.id}>
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
      <div>Transactions here</div>
    </div>
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
  onNoData: React.ReactNode;
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
    node = props.onNoData;
  } else {
    node = props.children(data);
  }
  return <Tag className={props.className}>{node}</Tag>;
}
