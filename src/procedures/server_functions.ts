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

export const getUserTransactions = withValidation(
  object({ userId: string() }),
  async ({ userId }) => {
    const query = e.select(e.EUser, (user) => ({
      filter: e.op(user.id, "=", e.uuid(userId)),
      transactions: {
        id: true,
        value: true,
        source_partition: {
          id: true,
          name: true,
        },
        category: {
          id: true,
          name: true,
        },
        description: true,
      },
    }));

    const client = edgedb.createClient();
    const result = await query.run(client);
    if (result.length !== 0) {
      return result[0].transactions;
    }
  }
);

export const findTransactions = withValidation(
  object({ partitionIds: array(string()), categoryIds: array(string()) }),
  async ({ partitionIds, categoryIds }) => {
    const query = e.params(
      { pIds: e.array(e.uuid), cIds: e.array(e.uuid) },
      ({ pIds, cIds }) =>
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
          if (partitionIds.length !== 0 && categoryIds.length !== 0) {
            filter = e.op(cFilter, "and", pFilter);
          } else if (partitionIds.length !== 0) {
            filter = pFilter;
          } else if (categoryIds.length !== 0) {
            filter = cFilter;
          }
          return {
            id: true,
            value: true,
            source_partition: {
              id: true,
              name: true,
            },
            category: {
              id: true,
              name: true,
            },
            description: true,
            filter,
          };
        })
    );

    const client = edgedb.createClient();
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
    const result = await query.run(client, {
      value,
      sourcePartitionId,
      categoryId,
      description,
    });
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
