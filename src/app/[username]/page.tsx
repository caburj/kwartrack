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
  const [selectedCategories, toggleSelectedCategories] = useReducer(
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
                    marginBottom: "0.5rem",
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
                    className={css({ paddingStart: "1rem" })}
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
            <Categories
              userId={user.id}
              selectedCategoryIds={selectedCategories}
              toggleSelectedCategories={toggleSelectedCategories}
            />
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
                queryClient.invalidateQueries({ queryKey: ["user", username] });
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
            <Transactions
              selectedPartitionIds={selectedPartitions}
              selectedCategoryIds={selectedCategories}
              userId={user.id}
            />
          </div>
        </>
      )}
    </QueryResult>
  );
}

function Categories(props: {
  userId: string;
  selectedCategoryIds: string[];
  toggleSelectedCategories: (arg: { ids: string[] }) => void;
}) {
  const queryClient = useQueryClient();
  const { userId, selectedCategoryIds, toggleSelectedCategories } = props;
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
            {(category) => (
              <Category
                category={category}
                userId={userId}
                selectedCategoryIds={selectedCategoryIds}
                toggleSelectedCategories={toggleSelectedCategories}
              />
            )}
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

function Category(props: {
  category: { id: string; name: string };
  userId: string;
  selectedCategoryIds: string[];
  toggleSelectedCategories: (arg: { ids: string[] }) => void;
}) {
  const queryClient = useQueryClient();
  const { category, userId, selectedCategoryIds, toggleSelectedCategories } =
    props;
  const categoryBalance = useQuery(["categoryBalance", category.id], () => {
    return rpc.post.getCategoryBalance({ categoryId: category.id });
  });

  return (
    <li
      key={category.id}
      className={css({
        color: selectedCategoryIds.includes(category.id) ? "blue" : "inherit",
      })}
      onClick={() => {
        toggleSelectedCategories({ ids: [category.id] });
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
        onLoading={<>Loading balance...</>}
        onUndefined={<>No balance found</>}
      >
        {(balance) => <> | {balance}</>}
      </QueryResult>
    </li>
  );
}

function Transactions(props: {
  selectedPartitionIds: string[];
  selectedCategoryIds: string[];
  userId: string;
}) {
  const queryClient = useQueryClient();
  const { selectedPartitionIds, selectedCategoryIds, userId } = props;
  const transactions = useQuery(
    ["transactions", selectedPartitionIds, selectedCategoryIds, userId],
    () => {
      if (
        selectedPartitionIds.length === 0 &&
        selectedCategoryIds.length === 0
      ) {
        return rpc.post.getUserTransactions({ userId: userId });
      }
      return rpc.post.findTransactions({
        partitionIds: selectedPartitionIds,
        categoryIds: selectedCategoryIds,
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
