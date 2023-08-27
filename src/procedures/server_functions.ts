import * as edgedb from "edgedb";
import e from "../../dbschema/edgeql-js";
import {
  type Input,
  type BaseSchema,
  object,
  string,
  array,
  optional,
  number,
  minValue,
} from "valibot";

function withValidation<S extends BaseSchema, R extends any>(
  paramSchema: S,
  fn: (param: Input<S>) => R
) {
  return (param: Input<S>) => {
    const result = paramSchema.parse(param);
    return fn(result);
  };
}

const baseClient = edgedb.createClient();

export const findUser = withValidation(
  object({ username: string() }),
  async ({ username }) => {
    const query = e.select(e.EUser, (user) => ({
      id: true,
      email: true,
      username: true,
      categories: {
        id: true,
        name: true,
        kind: true,
      },
      accounts: {
        id: true,
        name: true,
        balance: true,
        owners: {
          id: true,
          username: true,
        },
        partitions: {
          id: true,
          name: true,
          balance: true,
        },
      },
      filter: e.op(user.username, "=", username),
    }));

    const result = await query.run(baseClient);
    if (result.length !== 0) {
      return result[0];
    }
  }
);

export const findUserByEmail = withValidation(
  object({ email: string() }),
  async ({ email }) => {
    const query = e.select(e.EUser, (user) => ({
      id: true,
      username: true,
      filter: e.op(user.email, "=", email),
    }));

    const result = await query.run(baseClient);
    if (result.length !== 0) {
      return result[0];
    }
  }
);

export const getAccounts = withValidation(
  object({ userId: string() }),
  async ({ userId }) => {
    // return all accounts
    const query = e.select(e.EAccount, (account) => ({
      id: true,
      name: true,
      owners: {
        id: true,
        username: true,
      },
    }));

    const client = baseClient.withGlobals({ current_user_id: userId });
    const result = await query.run(client);
    if (result.length !== 0) {
      return result;
    }
  }
);

export const getPartitions = withValidation(
  object({ userId: string(), accountId: string() }),
  async ({ userId, accountId }) => {
    const query = e.select(e.EPartition, (partition) => {
      const belongToAccount = e.op(
        partition.account.id,
        "=",
        e.uuid(accountId)
      );
      // get all private partitions of the user
      const visibleToUser = e.op(
        e.op("not", partition.is_private),
        "or",
        e.op(partition.owners.id, "=", e.uuid(userId))
      );
      return {
        id: true,
        name: true,
        owners: {
          id: true,
          username: true,
        },
        is_private: true,
        filter: e.op(belongToAccount, "and", visibleToUser),
      };
    });
    const result = await query.run(baseClient);
    if (result.length !== 0) {
      return result;
    }
  }
);

export const getVisiblePartitions = withValidation(
  object({ userId: string() }),
  async ({ userId }) => {
    const query = e.select(e.EPartition, (partition) => {
      // get all private partitions of the user
      const visibleToUser = e.op(
        e.op("not", partition.is_private),
        "or",
        e.op(partition.owners.id, "=", e.uuid(userId))
      );
      return {
        id: true,
        name: true,
        owners: {
          id: true,
          username: true,
        },
        filter: visibleToUser,
      };
    });
    const result = await query.run(baseClient);
    if (result.length !== 0) {
      return result;
    }
  }
);

export const findTransactions = withValidation(
  object({
    partitionIds: array(string()),
    categoryIds: array(string()),
    ownerId: string(),
    tssDate: optional(string()),
    tseDate: optional(string()),
  }),
  async ({ partitionIds, categoryIds, ownerId, tssDate, tseDate }) => {
    const query = e.params(
      { pIds: e.array(e.uuid), cIds: e.array(e.uuid) },
      ({ pIds, cIds }) =>
        e.select(e.ETransaction, (transaction) => {
          const baseFilter = e.op("not", transaction.is_counterpart);
          let filter;
          const cFilter = e.op(
            transaction.category.id,
            "in",
            e.array_unpack(cIds)
          );
          const pFilter = e.op(
            transaction.source_partition.id,
            "in",
            e.array_unpack(pIds)
          );
          if (partitionIds.length !== 0 && categoryIds.length !== 0) {
            filter = e.op(baseFilter, "and", e.op(cFilter, "and", pFilter));
          } else if (partitionIds.length !== 0) {
            filter = e.op(baseFilter, "and", pFilter);
          } else if (categoryIds.length !== 0) {
            filter = e.op(baseFilter, "and", cFilter);
          } else {
            filter = baseFilter;
          }
          return {
            id: true,
            value: true,
            source_partition: {
              id: true,
              name: true,
              account: {
                id: true,
                name: true,
              },
            },
            counterpart: {
              id: true,
              value: true,
              source_partition: {
                id: true,
                name: true,
                account: {
                  id: true,
                  name: true,
                },
              },
            },
            category: {
              id: true,
              name: true,
            },
            description: true,
            kind: transaction.category.kind,
            str_date: e.to_str(transaction.date, "YYYY-mm-dd"),
            filter,
            order_by: {
              expression: transaction.date,
              direction: e.DESC,
            },
          };
        })
    );

    const client = baseClient.withGlobals({
      current_user_id: ownerId,
      tss_date: tssDate && new Date(tssDate),
      tse_date: tseDate && new Date(tseDate),
    });
    const result = await query.run(client, {
      pIds: partitionIds,
      cIds: categoryIds,
    });
    if (result.length !== 0) {
      return result;
    }
  }
);

export const createTransaction = withValidation(
  object({
    value: number([minValue(0)]),
    sourcePartitionId: string(),
    categoryId: string(),
    description: optional(string()),
    userId: string(),
    destinationPartitionId: optional(string()),
  }),
  async ({
    value,
    sourcePartitionId,
    categoryId,
    description,
    userId,
    destinationPartitionId,
  }) => {
    if (sourcePartitionId === destinationPartitionId) {
      throw new Error("Source and destination partitions cannot be the same.");
    }

    const createQuery = e.params(
      {
        value: e.decimal,
        sourcePartitionId: e.uuid,
        categoryId: e.uuid,
        description: e.optional(e.str),
        counterpartId: e.optional(e.uuid),
      },
      ({ value, sourcePartitionId, description, categoryId, counterpartId }) =>
        e.insert(e.ETransaction, {
          value,
          description,
          category: e.select(e.ECategory, (category) => ({
            filter_single: e.op(category.id, "=", categoryId),
          })),
          source_partition: e.select(e.EPartition, (partition) => ({
            filter_single: e.op(partition.id, "=", sourcePartitionId),
          })),
          counterpart: e.select(e.ETransaction, (transaction) => ({
            filter_single: e.op(transaction.id, "=", counterpartId),
          })),
        })
    );

    const selectQuery = e.params(
      {
        id: e.uuid,
      },
      ({ id }) =>
        e.select(e.ETransaction, (transaction) => ({
          filter_single: e.op(transaction.id, "=", id),
          id: true,
          value: true,
          source_partition: {
            id: true,
            name: true,
            account: {
              id: true,
              name: true,
            },
          },
          category: {
            id: true,
            name: true,
          },
          description: true,
        }))
    );

    const client = baseClient.withGlobals({ current_user_id: userId });
    const result = await client.transaction(async (tx) => {
      const selectedCategory = await e
        .select(e.ECategory, (category) => ({
          filter_single: e.op(category.id, "=", e.uuid(categoryId)),
          kind: true,
        }))
        .run(tx);

      if (!selectedCategory) {
        throw new Error("Category not found.");
      }

      let realValue: number;
      if (selectedCategory.kind === "Income") {
        realValue = Math.abs(value);
      } else {
        realValue = -Math.abs(value);
      }

      let transactionId: string;
      let counterpartId: string | undefined;
      if (destinationPartitionId) {
        const { id } = await createQuery.run(tx, {
          value: (-realValue).toString(),
          sourcePartitionId: destinationPartitionId,
          categoryId,
          description,
        });
        counterpartId = id;
      }
      const { id } = await createQuery.run(tx, {
        value: realValue.toString(),
        sourcePartitionId,
        categoryId,
        description,
        counterpartId: counterpartId,
      });
      transactionId = id;

      const transaction = await selectQuery.run(tx, {
        id: transactionId,
      });
      let counterpart;
      if (counterpartId) {
        counterpart = await selectQuery.run(tx, {
          id: counterpartId,
        });
      }
      return {
        transaction: transaction || undefined,
        counterpart: counterpart || undefined,
      };
    });
    return result;
  }
);

export const deleteTransaction = withValidation(
  object({ transactionId: string(), userId: string() }),
  async ({ transactionId, userId }) => {
    const deleteQuery = e.params({ id: e.uuid }, ({ id }) =>
      e.delete(e.ETransaction, (transaction) => {
        return {
          filter_single: e.op(transaction.id, "=", id),
        };
      })
    );

    return baseClient
      .withGlobals({ current_user_id: userId })
      .transaction(async (tx) => {
        const toDelete = await e
          .select(e.ETransaction, (transaction) => ({
            filter_single: e.op(transaction.id, "=", e.uuid(transactionId)),
            kind: transaction.category.kind,
            counterpart: {
              id: true,
            },
          }))
          .run(tx);
        if (!toDelete) {
          throw new Error("Transaction not found.");
        }
        await deleteQuery.run(tx, { id: transactionId });
        if (toDelete.kind === "Transfer") {
          if (!toDelete.counterpart) {
            throw new Error(
              "Unable to delete transfer transaction. Counterpart not found."
            );
          } else {
            await deleteQuery.run(tx, { id: toDelete.counterpart.id });
          }
        }
      });
  }
);

export const getUserCategories = withValidation(
  object({ userId: string() }),
  async ({ userId }) => {
    const result = await baseClient.transaction(async (tx) => {
      const fields = {
        id: true,
        name: true,
        kind: true,
      } as const;
      const expense = await e
        .select(e.ECategory, (category) => ({
          ...fields,
          filter: e.op(category.kind, "=", e.ECategoryKind.Expense),
        }))
        .run(tx);
      const income = await e
        .select(e.ECategory, (category) => ({
          ...fields,
          filter: e.op(category.kind, "=", e.ECategoryKind.Income),
        }))
        .run(tx);
      const transfer = await e
        .select(e.ECategory, (category) => ({
          ...fields,
          filter: e.op(category.kind, "=", e.ECategoryKind.Transfer),
        }))
        .run(tx);
      return {
        expense,
        income,
        transfer,
      };
    });
    return result;
  }
);

export const deleteCategory = withValidation(
  object({ categoryId: string() }),
  async ({ categoryId }) => {
    const query = e.params({ id: e.uuid }, ({ id }) =>
      e.delete(e.ECategory, (category) => ({
        filter_single: e.op(
          e.op("not", e.op("exists", category.transactions)),
          "and",
          e.op(category.id, "=", id)
        ),
      }))
    );
    const result = await query.run(baseClient, { id: categoryId });
    return result;
  }
);

export const getCategoryBalance = withValidation(
  object({
    categoryId: string(),
    userId: string(),
    tssDate: optional(string()),
    tseDate: optional(string()),
  }),
  async ({ categoryId, userId, tssDate, tseDate }) => {
    const query = e.params({ id: e.uuid }, ({ id }) =>
      e.select(e.ECategory, (category) => ({
        filter: e.op(category.id, "=", id),
        balance: true,
      }))
    );
    const client = baseClient.withGlobals({
      current_user_id: userId,
      tss_date: tssDate ? new Date(tssDate) : undefined,
      tse_date: tseDate ? new Date(tseDate) : undefined,
    });
    const result = await query.run(client, { id: categoryId });
    if (result.length !== 0) {
      return result[0].balance;
    }
  }
);

export const createUserCategory = withValidation(
  object({ userId: string(), name: string(), kind: string() }),
  async ({ userId, name, kind }) => {
    const query = e.params({ id: e.uuid, name: e.str }, ({ id, name }) =>
      e.insert(e.ECategory, {
        name,
        kind:
          kind === "Expense"
            ? "Expense"
            : kind === "Income"
            ? "Income"
            : "Transfer",
      })
    );
    const result = await query.run(baseClient, {
      id: userId,
      name,
    });
    return result;
  }
);

export const getPartitionBalance = withValidation(
  object({
    partitionId: string(),
    userId: string(),
    tssDate: optional(string()),
    tseDate: optional(string()),
  }),
  async ({ partitionId, userId, tssDate, tseDate }) => {
    const query = e.params({ id: e.uuid }, ({ id }) =>
      e.select(e.EPartition, (partition) => ({
        filter: e.op(partition.id, "=", id),
        balance: true,
      }))
    );
    const client = baseClient.withGlobals({
      current_user_id: userId,
      tss_date: tssDate ? new Date(tssDate) : undefined,
      tse_date: tseDate ? new Date(tseDate) : undefined,
    });
    const result = await query.run(client, { id: partitionId });
    if (result.length !== 0) {
      return result[0].balance;
    }
  }
);

export const getAccountBalance = withValidation(
  object({
    accountId: string(),
    userId: string(),
    tssDate: optional(string()),
    tseDate: optional(string()),
  }),
  async ({ accountId, userId, tssDate, tseDate }) => {
    const query = e.params({ id: e.uuid }, ({ id }) =>
      e.select(e.EAccount, (account) => ({
        filter: e.op(account.id, "=", id),
        balance: true,
      }))
    );
    const client = baseClient.withGlobals({
      current_user_id: userId,
      tss_date: tssDate ? new Date(tssDate) : undefined,
      tse_date: tseDate ? new Date(tseDate) : undefined,
    });
    const result = await query.run(client, { id: accountId });
    if (result.length !== 0) {
      return result[0].balance;
    }
  }
);

export const getUserAccounts = withValidation(
  object({ userId: string() }),
  async ({ userId }) => {
    const query = e.params({ id: e.uuid }, ({ id }) =>
      e.select(e.EUser, (user) => ({
        filter: e.op(user.id, "=", id),
        accounts: {
          id: true,
          name: true,
          balance: true,
          owners: {
            id: true,
            username: true,
          },
          partitions: {
            id: true,
            name: true,
            balance: true,
          },
        },
      }))
    );
    const result = await query.run(baseClient, { id: userId });
    if (result.length !== 0) {
      return result[0].accounts;
    }
  }
);
