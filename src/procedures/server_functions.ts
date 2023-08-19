import * as edgedb from "edgedb";
import e from "../../dbschema/edgeql-js";
import { type Input, type BaseSchema, object, string, array } from "valibot";

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

export const findTransactions = withValidation(
  object({ partitionIds: array(string()) }),
  async ({ partitionIds }) => {
    const query = e.params({ ids: e.array(e.uuid) }, ({ ids }) =>
      e.select(e.ETransaction, (transaction) => ({
        id: true,
        value: true,
        source_partition: {
          id: true,
          name: true,
        },
        filter: e.op(
          transaction.source_partition.id,
          "in",
          e.array_unpack(ids)
        ),
      }))
    );

    const client = edgedb.createClient();
    const result = await query.run(client, { ids: partitionIds });
    if (result.length !== 0) {
      return result;
    }
  }
);
