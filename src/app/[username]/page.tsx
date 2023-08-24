"use client";

import { Fragment, ReactHTML, useContext, useState } from "react";
import { css } from "../../../styled-system/css";
import { rpc } from "../rpc_client";
import {
  type UseQueryResult,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { object, optional, string } from "valibot";
import { StoreSelectedProvider, StoreSelectedContext } from "./store";

export default function Main(props: { params: { username: string } }) {
  const { username } = props.params;
  return (
    <StoreSelectedProvider>
      <UserPage username={username} />
    </StoreSelectedProvider>
  );
}

export function UserPage({ username }: { username: string }) {
  const queryClient = useQueryClient();
  const user = useQuery(["user", username], () => {
    return rpc.post.findUser({ username });
  });
  const [selected, dispatch] = useContext(StoreSelectedContext);
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
            <ul>
              {user.accounts.map((account) => (
                <li
                  key={account.id}
                  className={css({
                    marginBottom: "0.5rem",
                    cursor: "pointer",
                    color: isSubset(
                      account.partitions.map((p) => p.id),
                      selected.partitionIds
                    )
                      ? "blue"
                      : "inherit",
                  })}
                  onClick={() => {
                    const unselected = account.partitions.filter(
                      (p) => !selected.partitionIds.includes(p.id)
                    );
                    if (unselected.length > 0) {
                      dispatch({
                        type: "TOGGLE_PARTITIONS",
                        payload: unselected.map((p) => p.id),
                      });
                    } else {
                      dispatch({
                        type: "TOGGLE_PARTITIONS",
                        payload: account.partitions.map((p) => p.id),
                      });
                    }
                  }}
                >
                  <div>
                    {account.name} |
                    <LoadingValue
                      queryKey={["accountBalance", account.id]}
                      valueLoader={() =>
                        rpc.post.getAccountBalance({ accountId: account.id })
                      }
                    />
                  </div>
                  <ul className={css({ paddingStart: "1rem" })}>
                    {account.partitions.map((partition) => (
                      <li
                        key={partition.id}
                        className={css({
                          cursor: "pointer",
                          color: selected.partitionIds.includes(partition.id)
                            ? "blue"
                            : "inherit",
                        })}
                        onClick={(event) => {
                          event.stopPropagation();
                          dispatch({
                            type: "TOGGLE_PARTITIONS",
                            payload: [partition.id],
                          });
                        }}
                      >
                        {partition.name} |
                        <LoadingValue
                          queryKey={["partitionBalance", partition.id]}
                          valueLoader={() =>
                            rpc.post.getPartitionBalance({
                              partitionId: partition.id,
                            })
                          }
                        />
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
            <Categories userId={user.id} />
          </div>
          <div>
            <TransactionForm user={user} />
            <Transactions userId={user.id} />
          </div>
        </>
      )}
    </QueryResult>
  );
}

function Categories({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const categories = useQuery(["categories", userId], () => {
    return rpc.post.getUserCategories({ userId });
  });
  return (
    <>
      <QueryResult
        query={categories}
        as="div"
        className={css({ padding: "1rem" })}
        onLoading={<>Loading categories...</>}
        onUndefined={<>No categories found</>}
      >
        {(categories) => (
          <ul>
            {categories.map((category) => (
              <Category key={category.id} category={category} userId={userId} />
            ))}
          </ul>
        )}
      </QueryResult>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          const target = event.target as HTMLFormElement;
          const formdata = new FormData(target as HTMLFormElement);
          const formObj = Object.fromEntries(formdata.entries());
          const dataSchema = object({ name: string() });
          const parsedData = dataSchema.parse(formObj);
          await rpc.post.createUserCategory({
            userId,
            name: parsedData.name,
          });
          target.reset();
          queryClient.invalidateQueries({ queryKey: ["categories", userId] });
        }}
      >
        <label htmlFor="name">Category Name</label>
        <input type="text" name="name" />
        <input type="submit" value="Create"></input>
      </form>
    </>
  );
}

function Category({
  category,
  userId,
}: {
  category: { id: string; name: string };
  userId: string;
}) {
  const queryClient = useQueryClient();
  const [selected, dispatch] = useContext(StoreSelectedContext);
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <li
      key={category.id}
      className={css({
        cursor: "pointer",
        color: selected.categoryIds.includes(category.id) ? "blue" : "inherit",
        textDecoration: isDeleting ? "line-through" : "inherit",
      })}
      onClick={() => {
        dispatch({ type: "TOGGLE_CATEGORIES", payload: [category.id] });
      }}
    >
      {/* TODO: This delete button should be conditionally shown. Only categories without linked transactions can be deleted. */}
      <button
        onClick={async (event) => {
          event.stopPropagation();
          setIsDeleting(true);
          await rpc.post.deleteCategory({ categoryId: category.id });
          queryClient.invalidateQueries({ queryKey: ["categories", userId] });
        }}
      >
        x
      </button>{" "}
      | {category.name} |
      <LoadingValue
        queryKey={["categoryBalance", category.id]}
        valueLoader={() =>
          rpc.post.getCategoryBalance({ categoryId: category.id })
        }
      />
    </li>
  );
}

function Transactions({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [selected] = useContext(StoreSelectedContext);
  const transactions = useQuery(
    ["transactions", selected.partitionIds, selected.categoryIds, userId],
    () => {
      if (
        selected.partitionIds.length === 0 &&
        selected.categoryIds.length === 0
      ) {
        return rpc.post.getUserTransactions({ userId: userId });
      }
      return rpc.post.findTransactions({
        partitionIds: selected.partitionIds,
        categoryIds: selected.categoryIds,
        ownerId: userId,
      });
    }
  );
  return (
    <QueryResult
      query={transactions}
      as="div"
      className={css({ padding: "1rem" })}
      onLoading={<>Loading transactions...</>}
      onUndefined={<>Select a partition to show transactions</>}
    >
      {(transactions) => (
        <ul>
          {transactions.map((transaction) => (
            <li key={transaction.id}>
              <button
                onClick={async () => {
                  await rpc.post.deleteTransaction({
                    transactionId: transaction.id,
                  });
                  queryClient.invalidateQueries({ queryKey: ["transactions"] });
                  queryClient.invalidateQueries({ queryKey: ["user", userId] });
                  queryClient.invalidateQueries({
                    queryKey: [
                      "partitionBalance",
                      transaction.source_partition.id,
                    ],
                  });
                  queryClient.invalidateQueries({
                    queryKey: [
                      "accountBalance",
                      transaction.source_partition.account.id,
                    ],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["categoryBalance", transaction.category.id],
                  });
                }}
              >
                x
              </button>{" "}
              | {transaction.source_partition.name} | {transaction.value} |{" "}
              {transaction.category.name} | {transaction.description}
            </li>
          ))}
        </ul>
      )}
    </QueryResult>
  );
}

function TransactionForm({ user }: { user: { id: string } }) {
  const queryClient = useQueryClient();
  const accounts = useQuery(["accounts", user.id], () => {
    return rpc.post.getUserAccounts({ userId: user.id });
  });
  const categories = useQuery(["categories", user.id], () => {
    return rpc.post.getUserCategories({ userId: user.id });
  });
  return (
    <form
      className={css({ display: "flex", flexDirection: "column" })}
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
        const newTransaction = await rpc.post.createTransaction(parsedData);
        target.reset();
        if (newTransaction) {
          queryClient.invalidateQueries({ queryKey: ["transactions"] });
          queryClient.invalidateQueries({
            queryKey: ["categoryBalance", parsedData.categoryId],
          });
          queryClient.invalidateQueries({
            queryKey: ["partitionBalance", parsedData.sourcePartitionId],
          });
          queryClient.invalidateQueries({
            queryKey: [
              "accountBalance",
              newTransaction.source_partition.account.id,
            ],
          });
        }
      }}
    >
      <label htmlFor="sourcePartitionId">Source Partition</label>
      <QueryResult query={accounts}>
        {(accounts) => (
          <select name="sourcePartitionId">
            {accounts.flatMap((account) =>
              account.partitions.map((partition) => (
                <option key={partition.id} value={partition.id}>
                  {partition.name}
                </option>
              ))
            )}
          </select>
        )}
      </QueryResult>
      <label htmlFor="value">Value</label>
      <input type="text" inputMode="numeric" name="value" />
      <label htmlFor="categoryId">Category</label>
      <QueryResult query={categories}>
        {(categories) => (
          <select name="categoryId">
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </QueryResult>
      <label htmlFor="description">Description</label>
      <input type="text" name="description" />
      <input type="submit" value="Submit" />
    </form>
  );
}

function LoadingValue<R>(props: {
  queryKey: string[];
  valueLoader: () => Promise<R>;
}) {
  return (
    <QueryResult
      query={useQuery(props.queryKey, props.valueLoader)}
      as="span"
      className={css({ marginLeft: "0.5rem" })}
      onLoading={<>...</>}
      onUndefined={<>Missing Value</>}
    >
      {(value) => <>{value}</>}
    </QueryResult>
  );
}

function QueryResult<T>(props: {
  as?: keyof ReactHTML;
  className?: string;
  query: UseQueryResult<T>;
  children: (data: NonNullable<T>) => React.ReactNode;
  onLoading?: React.ReactNode;
  onUndefined?: React.ReactNode;
  onError?: (error: Error) => React.ReactNode;
}) {
  const { data, isLoading, isError } = props.query;
  const { as: Tag = Fragment } = props;
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
