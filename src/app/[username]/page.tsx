"use client";

import { ReactHTML, useReducer, useContext } from "react";
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
            <ForEach items={user.accounts} as="ul">
              {(account) => (
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
                    {account.name} | {account.balance}
                  </div>
                  <ForEach
                    items={account.partitions}
                    as="ul"
                    className={css({ paddingStart: "1rem" })}
                  >
                    {(partition) => (
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
                        {partition.name} | {partition.balance}
                      </li>
                    )}
                  </ForEach>
                </li>
              )}
            </ForEach>
            <Categories userId={user.id} />
          </div>
          <div>
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
                await rpc.post.createTransaction(parsedData);
                target.reset();
                queryClient.invalidateQueries({ queryKey: ["transactions"] });
                queryClient.invalidateQueries({
                  queryKey: ["user", username],
                });
                queryClient.invalidateQueries({
                  queryKey: ["categoryBalance", parsedData.categoryId],
                });
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
          <ForEach items={categories} as="ul">
            {(category) => <Category category={category} userId={userId} />}
          </ForEach>
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
  const categoryBalance = useQuery(["categoryBalance", category.id], () => {
    return rpc.post.getCategoryBalance({ categoryId: category.id });
  });
  const [selected, dispatch] = useContext(StoreSelectedContext);

  return (
    <li
      key={category.id}
      className={css({
        color: selected.categoryIds.includes(category.id) ? "blue" : "inherit",
      })}
      onClick={() => {
        dispatch({ type: "TOGGLE_CATEGORIES", payload: [category.id] });
      }}
    >
      {/* TODO: This delete button should be conditionally shown. Only categories without linked transactions can be deleted. */}
      <button
        onClick={async (event) => {
          event.stopPropagation();
          await rpc.post.deleteCategory({ categoryId: category.id });
          queryClient.invalidateQueries({ queryKey: ["categories", userId] });
        }}
      >
        x
      </button>{" "}
      | {category.name}
      <QueryResult
        query={categoryBalance}
        as="span"
        className={css({ marginLeft: "1rem" })}
        onLoading={<>...</>}
        onUndefined={<>No balance found</>}
      >
        {(balance) => <> | {balance}</>}
      </QueryResult>
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
        <ForEach items={transactions} as="ul">
          <IfEmpty>No transactions found</IfEmpty>
          {(transaction) => (
            <li key={transaction.id}>
              <button
                onClick={async () => {
                  await rpc.post.deleteTransaction({
                    transactionId: transaction.id,
                  });
                  queryClient.invalidateQueries({ queryKey: ["transactions"] });
                  queryClient.invalidateQueries({ queryKey: ["user", userId] });
                }}
              >
                x
              </button>{" "}
              | {transaction.source_partition.name} | {transaction.value} |{" "}
              {transaction.category.name} | {transaction.description}
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
