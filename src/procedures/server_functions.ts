import * as edgedb from "edgedb";
import e from "../../dbschema/edgeql-js";
import {
  type Input,
  type BaseSchema,
  object,
  string,
  array,
  optional,
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

    const client = edgedb.createClient();
    const result = await query.run(client);
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

    const client = edgedb.createClient();
    const result = await query.run(client);
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

    const client = edgedb.createClient();
    const result = await query.run(client);
    if (result.length !== 0) {
      return result;
    }
  }
);

export const getPartitions = withValidation(
  object({ userId: string(), accountId: string() }),
  async ({ userId, accountId }) => {
    // return all public partitions of the account and private partitions of the user
    const query = e.select(e.EPartition, (partition) => {
      // get all partitions in the account
      const belongToAccount = e.op(
        partition.account.id,
        "=",
        e.uuid(accountId)
      );
      // get all private partitions of the user
      const visibleToUser = e.op(
        e.op(partition.owners.id, "=", e.uuid(userId)),
        "or",
        e.op(
          e.op("not", partition.is_private),
          "and",
          e.op(partition.owners.id, "!=", e.uuid(userId))
        )
      );
      return {
        id: true,
        name: true,
        owners: {
          id: true,
          username: true,
        },
        filter: e.op(belongToAccount, "and", visibleToUser),
      };
    });
    const client = edgedb.createClient();
    const result = await query.run(client);
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
        e.op(partition.owners.id, "=", e.uuid(userId)),
        "or",
        e.op(
          e.op("not", partition.is_private),
          "and",
          e.op(partition.owners.id, "!=", e.uuid(userId))
        )
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
    const client = edgedb.createClient();
    const result = await query.run(client);
    if (result.length !== 0) {
      return result;
    }
  }
);

export const getUserTransactions = withValidation(
  object({ userId: string() }),
  async ({ userId }) => {
    // get transactions visible to the user
    // visible if source_partition is not private or user is owner of source_partition
    const query = e.select(e.ETransaction, (transaction) => ({
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
      filter: e.op(
        e.op("not", transaction.source_partition.is_private),
        "or",
        e.op(transaction.source_partition.owners.id, "=", e.uuid(userId))
      ),
    }));

    const client = edgedb.createClient();
    const result = await query.run(client);
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
  }),
  async ({ partitionIds, categoryIds, ownerId }) => {
    const query = e.params(
      { pIds: e.array(e.uuid), cIds: e.array(e.uuid), ownerId: e.uuid },
      ({ pIds, cIds, ownerId }) =>
        e.select(e.ETransaction, (transaction) => {
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
          const visibleToUser = e.op(
            e.op("not", transaction.source_partition.is_private),
            "or",
            e.op(transaction.source_partition.owners.id, "=", ownerId)
          );
          if (partitionIds.length !== 0 && categoryIds.length !== 0) {
            filter = e.op(cFilter, "and", pFilter);
          } else if (partitionIds.length !== 0) {
            filter = pFilter;
          } else {
            filter = cFilter;
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
            category: {
              id: true,
              name: true,
            },
            description: true,
            filter: e.op(filter, "and", visibleToUser),
          };
        })
    );

    const client = edgedb.createClient();
    const result = await query.run(client, {
      pIds: partitionIds,
      cIds: categoryIds,
      ownerId,
    });
    if (result.length !== 0) {
      return result;
    }
  }
);

export const createTransaction = withValidation(
  object({
    value: string(),
    sourcePartitionId: string(),
    categoryId: string(),
    description: optional(string()),
  }),
  async ({ value, sourcePartitionId, categoryId, description }) => {
    const query = e.params(
      {
        value: e.decimal,
        sourcePartitionId: e.uuid,
        categoryId: e.uuid,
        description: e.optional(e.str),
      },
      ({ value, sourcePartitionId, description, categoryId }) =>
        e.insert(e.ETransaction, {
          value,
          description,
          category: e.select(e.ECategory, (category) => ({
            filter_single: e.op(category.id, "=", categoryId),
          })),
          source_partition: e.select(e.EPartition, (partition) => ({
            filter_single: e.op(partition.id, "=", sourcePartitionId),
          })),
        })
    );

    const client = edgedb.createClient();
    const { id: transactionId } = await query.run(client, {
      value,
      sourcePartitionId,
      categoryId,
      description,
    });
    const result = await e
      .select(e.ETransaction, (transaction) => ({
        filter_single: e.op(transaction.id, "=", e.uuid(transactionId)),
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
      .run(client);
    return result;
  }
);

export const deleteTransaction = withValidation(
  object({ transactionId: string() }),
  async ({ transactionId }) => {
    const query = e.params({ id: e.uuid }, ({ id }) =>
      e.delete(e.ETransaction, (transaction) => {
        return {
          filter_single: e.op(transaction.id, "=", id),
        };
      })
    );

    const client = edgedb.createClient();
    const result = await query.run(client, { id: transactionId });
    return result;
  }
);

export const getUserCategories = withValidation(
  object({ userId: string() }),
  async ({ userId }) => {
    const query = e.params({ id: e.uuid }, ({ id }) =>
      e.select(e.EUser, (user) => ({
        filter: e.op(user.id, "=", id),
        categories: {
          id: true,
          name: true,
        },
      }))
    );
    const client = edgedb.createClient();
    const result = await query.run(client, { id: userId });
    if (result.length !== 0) {
      return result[0].categories;
    }
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
    const client = edgedb.createClient();
    const result = await query.run(client, { id: categoryId });
    return result;
  }
);

export const getCategoryBalance = withValidation(
  object({ categoryId: string() }),
  async ({ categoryId }) => {
    const query = e.params({ id: e.uuid }, ({ id }) =>
      e.select(e.ECategory, (category) => ({
        filter: e.op(category.id, "=", id),
        balance: true,
      }))
    );
    const client = edgedb.createClient();
    const result = await query.run(client, { id: categoryId });
    if (result.length !== 0) {
      return result[0].balance;
    }
  }
);

export const createUserCategory = withValidation(
  object({ userId: string(), name: string() }),
  async ({ userId, name }) => {
    const query = e.params({ id: e.uuid, name: e.str }, ({ id, name }) =>
      e.insert(e.ECategory, { name })
    );
    const client = edgedb.createClient();
    const result = await query.run(client, { id: userId, name });
    return result;
  }
);

export const getPartitionBalance = withValidation(
  object({ partitionId: string() }),
  async ({ partitionId }) => {
    const query = e.params({ id: e.uuid }, ({ id }) =>
      e.select(e.EPartition, (partition) => ({
        filter: e.op(partition.id, "=", id),
        balance: true,
      }))
    );
    const client = edgedb.createClient();
    const result = await query.run(client, { id: partitionId });
    if (result.length !== 0) {
      return result[0].balance;
    }
  }
);

export const getAccountBalance = withValidation(
  object({ accountId: string() }),
  async ({ accountId }) => {
    const query = e.params({ id: e.uuid }, ({ id }) =>
      e.select(e.EAccount, (account) => ({
        filter: e.op(account.id, "=", id),
        balance: true,
      }))
    );
    const client = edgedb.createClient();
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
    const client = edgedb.createClient();
    const result = await query.run(client, { id: userId });
    if (result.length !== 0) {
      return result[0].accounts;
    }
  }
);
