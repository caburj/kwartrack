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
  boolean,
} from "valibot";
import { Transaction } from "edgedb/dist/transaction";

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
  object({ username: string(), dbname: string() }),
  async ({ username, dbname }) => {
    const client = edgedb.createClient({ database: dbname });
    const query = e.select(e.EUser, (user) => ({
      id: true,
      email: true,
      username: true,
      accounts: {
        id: true,
        name: true,
        owners: {
          id: true,
          username: true,
        },
        partitions: {
          id: true,
          name: true,
        },
      },
      filter: e.op(user.username, "=", username),
    }));

    const result = await query.run(client);
    if (result.length !== 0) {
      return { ...result[0], dbname };
    }
  }
);

export const findUserByEmail = withValidation(
  object({ email: string() }),
  async ({ email }) => {
    const masterdbClient = edgedb.createClient({ database: "masterdb" });

    const query = e.select(e.masterdb.EUser, (user) => ({
      id: true,
      username: true,
      dbnames: user["<users[is masterdb::EDatabase]"].name,
      filter: e.op(user.email, "=", email),
    }));

    const result = await query.run(masterdbClient);
    if (result.length !== 0) {
      const { id, username, dbnames } = result[0];
      const dbname = dbnames[0];
      return { id, username, dbname };
    }
  }
);

type Account = {
  name: string;
  owners: {
    name: string;
  }[];
  is_owned: boolean;
};

const computeAccountLabel = (acc: Account) => {
  return acc.owners.length === 1 && !acc.is_owned
    ? `${acc.owners[0].name}'s ${acc.name}`
    : acc.name;
};

export const getAccounts = withValidation(
  object({ userId: string(), dbname: string(), owned: boolean() }),
  async ({ userId, dbname, owned }) => {
    // return all accounts
    const query = e.select(e.EAccount, (account) => ({
      id: true,
      name: true,
      owners: {
        id: true,
        username: true,
        name: true,
      },
      partitions: {
        id: true,
        name: true,
      },
      is_owned: true,
      filter: owned ? account.is_owned : undefined,
      order_by: {
        expression: account.name,
        direction: e.ASC,
      },
    }));

    const client = edgedb
      .createClient({ database: dbname })
      .withGlobals({ current_user_id: userId });

    const result = await query.run(client);
    if (result.length !== 0) {
      return result.map((acc) => {
        return { ...acc, label: computeAccountLabel(acc) };
      });
    }
  }
);

export const getPartitions = withValidation(
  object({ userId: string(), accountId: string(), dbname: string() }),
  async ({ userId, accountId, dbname }) => {
    const query = e.select(e.EPartition, (partition) => {
      const belongToAccount = e.op(
        partition.account.id,
        "=",
        e.uuid(accountId)
      );
      // get all private partitions of the user
      return {
        id: true,
        name: true,
        owners: {
          id: true,
          username: true,
        },
        account: {
          id: true,
        },
        is_private: true,
        is_owned: true,
        filter: e.op(belongToAccount, "and", partition.is_visible),
        order_by: {
          expression: partition.name,
          direction: e.ASC,
        },
      };
    });
    const result = await query.run(
      edgedb
        .createClient({ database: dbname })
        .withGlobals({ current_user_id: userId })
    );
    if (result.length !== 0) {
      return result;
    }
  }
);

// TODO: Match type of getPartitions, getPartitionOptions and findTransactions.
export const getPartitionOptions = withValidation(
  object({ userId: string(), dbname: string() }),
  async ({ userId, dbname }) => {
    const query = e.select(e.EPartition, (partition) => {
      return {
        id: true,
        name: true,
        account: {
          id: true,
          name: true,
          owners: {
            id: true,
            name: true,
          },
          is_owned: true,
        },
        is_private: true,
        filter: partition.is_visible,
        order_by: {
          expression: partition.name,
          direction: e.ASC,
        },
      };
    });
    const result = await query.run(
      edgedb
        .createClient({ database: dbname })
        .withGlobals({ current_user_id: userId })
    );
    return result.map((p) => {
      return {
        ...p,
        account: {
          ...p.account,
          label: computeAccountLabel(p.account),
        },
      };
    });
  }
);

export const findTransactions = withValidation(
  object({
    currentPage: number([minValue(1)]),
    nPerPage: number([minValue(1)]),
    partitionIds: array(string()),
    categoryIds: array(string()),
    ownerId: string(),
    dbname: string(),
    tssDate: optional(string()),
    tseDate: optional(string()),
  }),
  async ({
    currentPage,
    nPerPage,
    partitionIds,
    categoryIds,
    ownerId,
    dbname,
    tssDate,
    tseDate,
  }) => {
    const query = e.params(
      { pIds: e.array(e.uuid), cIds: e.array(e.uuid) },
      ({ pIds, cIds }) =>
        e.select(e.ETransaction, (transaction) => {
          let baseFilter = e.op(
            e.op(
              transaction.is_visible,
              "and",
              e.op("not", transaction.is_counterpart)
            ),
            "or",
            e.op(
              e.op("exists", transaction.counterpart),
              "and",
              e.any(transaction.counterpart.is_visible)
            )
          );
          if (tssDate) {
            baseFilter = e.op(
              baseFilter,
              "and",
              e.op(transaction.date, ">=", new Date(tssDate))
            );
          }
          if (tseDate) {
            baseFilter = e.op(
              baseFilter,
              "and",
              e.op(
                transaction.date,
                "<",
                // add one day to the end date to include it in the range
                new Date(new Date(tseDate).getTime() + 86400000)
              )
            );
          }
          let filter;
          const cFilter = e.op(
            transaction.category.id,
            "in",
            e.array_unpack(cIds)
          );
          const pFilter = e.op(
            e.op(
              transaction.source_partition.id,
              "union",
              transaction.counterpart.source_partition.id
            ),
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

          const partitionFields = {
            id: true,
            name: true,
            account: {
              id: true,
              name: true,
              owners: {
                id: true,
                name: true,
              },
              is_owned: true,
            },
            is_private: true,
          } as const;

          return {
            id: true,
            value: true,
            source_partition: partitionFields,
            counterpart: {
              id: true,
              value: true,
              source_partition: partitionFields,
              is_visible: true,
            },
            category: {
              id: true,
              name: true,
              kind: true,
            },
            is_visible: true,
            description: true,
            kind: transaction.category.kind,
            str_date: e.to_str(transaction.date, "YYYY-mm-dd"),
            filter,
            order_by: {
              expression: transaction.date,
              direction: e.DESC,
            },
            offset: (currentPage - 1) * nPerPage,
            limit: nPerPage + 1,
          };
        })
    );

    const client = edgedb
      .createClient({ database: dbname })
      .withGlobals({ current_user_id: ownerId });
    const result = await query.run(client, {
      pIds: partitionIds,
      cIds: categoryIds,
    });
    const hasNextPage = result.length === nPerPage + 1;
    if (result.length !== 0) {
      return [
        result
          .map((tx) => {
            return {
              ...tx,
              source_partition: tx.is_visible
                ? {
                    ...tx.source_partition,
                    label: `${tx.source_partition.name} (${computeAccountLabel(
                      tx.source_partition.account
                    )})`,
                    account: {
                      ...tx.source_partition.account,
                      label: computeAccountLabel(tx.source_partition.account),
                    },
                  }
                : null,
              counterpart:
                tx.counterpart && tx.counterpart.is_visible
                  ? {
                      ...tx.counterpart,
                      source_partition: {
                        ...tx.counterpart.source_partition,
                        label: `${
                          tx.counterpart.source_partition.name
                        } (${computeAccountLabel(
                          tx.counterpart.source_partition.account
                        )})`,
                        account: {
                          ...tx.counterpart.source_partition.account,
                          label: computeAccountLabel(
                            tx.counterpart.source_partition.account
                          ),
                        },
                      },
                    }
                  : null,
            };
          })
          .slice(0, nPerPage),
        hasNextPage,
      ] as const;
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
    dbname: string(),
  }),
  async ({
    value,
    sourcePartitionId,
    categoryId,
    description,
    userId,
    destinationPartitionId,
    dbname,
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

    const selectTransactionQuery = e.params(
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
            kind: true,
          },
          description: true,
        }))
    );

    const partitionQuery = e.params(
      {
        id: e.uuid,
      },
      ({ id }) =>
        e.select(e.EPartition, (partition) => ({
          filter_single: e.op(
            e.op(partition.is_visible, "and", partition.is_private),
            "and",
            e.op(partition.id, "=", id)
          ),
        }))
    );

    const client = edgedb
      .createClient({ database: dbname })
      .withGlobals({ current_user_id: userId });

    const result = await client.transaction(async (tx) => {
      const selectedCategory = await e
        .select(e.ECategory, (category) => ({
          filter_single: e.op(category.id, "=", e.uuid(categoryId)),
          kind: true,
          is_private: true,
        }))
        .run(tx);

      if (!selectedCategory) {
        throw new Error("Category not found.");
      }

      if (selectedCategory.is_private) {
        // both the source and destination partitions must be owned by the user
        const sourcePartition = await partitionQuery.run(tx, {
          id: sourcePartitionId,
        });
        if (!sourcePartition) {
          throw new Error(
            "Selected source partition should be privately owned by the user."
          );
        }
        if (destinationPartitionId) {
          const destinationPartition = await partitionQuery.run(tx, {
            id: destinationPartitionId,
          });
          if (!destinationPartition) {
            throw new Error(
              "Selected destination partition should be privately owned by the user."
            );
          }
        }
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

      const transaction = await selectTransactionQuery.run(tx, {
        id: transactionId,
      });
      let counterpart;
      if (counterpartId) {
        counterpart = await selectTransactionQuery.run(tx, {
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
  object({ transactionId: string(), userId: string(), dbname: string() }),
  async ({ transactionId, userId, dbname }) => {
    const deleteQuery = e.params({ id: e.uuid }, ({ id }) =>
      e.delete(e.ETransaction, (transaction) => {
        return {
          filter_single: e.op(transaction.id, "=", id),
        };
      })
    );

    return edgedb
      .createClient({ database: dbname })
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
  object({ userId: string(), dbname: string() }),
  async ({ userId, dbname }) => {
    const client = edgedb.createClient({ database: dbname }).withGlobals({
      current_user_id: userId,
    });
    const result = await client.transaction(async (tx) => {
      const fields = {
        id: true,
        name: true,
        kind: true,
        is_private: true,
      } as const;
      const expense = await e
        .select(e.ECategory, (category) => ({
          ...fields,
          filter: e.op(
            category.is_visible,
            "and",
            e.op(category.kind, "=", e.ECategoryKind.Expense)
          ),
          order_by: {
            expression: category.name,
            direction: e.ASC,
          },
        }))
        .run(tx);
      const income = await e
        .select(e.ECategory, (category) => ({
          ...fields,
          filter: e.op(
            category.is_visible,
            "and",
            e.op(category.kind, "=", e.ECategoryKind.Income)
          ),
          order_by: {
            expression: category.name,
            direction: e.ASC,
          },
        }))
        .run(tx);
      const transfer = await e
        .select(e.ECategory, (category) => ({
          ...fields,
          filter: e.op(
            category.is_visible,
            "and",
            e.op(category.kind, "=", e.ECategoryKind.Transfer)
          ),
          order_by: {
            expression: category.name,
            direction: e.ASC,
          },
        }))
        .run(tx);
      return {
        income,
        expense,
        transfer,
      };
    });
    return result;
  }
);

const _categoryCanBeDeleted = async (
  tx: Transaction,
  categoryId: string
): Promise<[boolean, string]> => {
  const findCategory = e.params({ id: e.uuid }, ({ id }) =>
    e.select(e.ECategory, (category) => ({
      filter_single: e.op(category.id, "=", id),
    }))
  );
  const transactionsCount = e.params({ id: e.uuid }, ({ id }) =>
    e.count(
      e.select(e.ETransaction, (transaction) => ({
        filter: e.op(transaction.category.id, "=", id),
      }))
    )
  );
  const category = await findCategory.run(tx, { id: categoryId });
  if (!category) {
    return [false, "Category not found."];
  }
  const count = await transactionsCount.run(tx, { id: categoryId });
  if (count !== 0) {
    return [false, "Category has linked transactions."];
  }
  return [true, ""];
};

export const categoryCanBeDeleted = withValidation(
  object({ categoryId: string(), userId: string(), dbname: string() }),
  async ({ categoryId, userId, dbname }) => {
    const client = edgedb.createClient({ database: dbname }).withGlobals({
      current_user_id: userId,
    });
    const result = await client.transaction(async (tx) =>
      _categoryCanBeDeleted(tx, categoryId)
    );
    return result[0];
  }
);

export const deleteCategory = withValidation(
  object({ categoryId: string(), userId: string(), dbname: string() }),
  async ({ categoryId, dbname, userId }) => {
    const deleteQuery = e.params({ id: e.uuid }, ({ id }) =>
      e.delete(e.ECategory, (category) => ({
        filter_single: e.op(
          e.op("not", e.op("exists", category["<category[is ETransaction]"])),
          "and",
          e.op(category.id, "=", id)
        ),
      }))
    );
    const client = edgedb.createClient({ database: dbname }).withGlobals({
      current_user_id: userId,
    });
    return client.transaction(async (tx) => {
      const [canBeDeleted, errMsg] = await _categoryCanBeDeleted(
        tx,
        categoryId
      );
      if (!canBeDeleted) {
        throw new Error(errMsg);
      }
      return deleteQuery.run(tx, { id: categoryId });
    });
  }
);

export const getCategoryBalance = withValidation(
  object({
    categoryId: string(),
    userId: string(),
    dbname: string(),
  }),
  async ({ categoryId, userId, dbname }) => {
    const query = e.params({ id: e.uuid }, ({ id }) => {
      const transactions = e.select(e.ETransaction, (transaction) => ({
        filter: e.op(
          transaction.is_visible,
          "and",
          e.op(transaction.category.id, "=", id)
        ),
      }));
      return e.sum(transactions.value);
    });

    const client = edgedb.createClient({ database: dbname }).withGlobals({
      current_user_id: userId,
    });

    return await query.run(client, { id: categoryId });
  }
);

export const createUserCategory = withValidation(
  object({
    userId: string(),
    name: string(),
    kind: string(),
    dbname: string(),
  }),
  async ({ userId, name, kind, dbname }) => {
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
    const result = await query.run(edgedb.createClient({ database: dbname }), {
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
    dbname: string(),
  }),
  async ({ partitionId, userId, dbname }) => {
    const balanceQuery = e.params({ id: e.uuid }, ({ id }) => {
      const transactions = e.select(e.ETransaction, (transaction) => ({
        filter: e.op(
          transaction.is_visible,
          "and",
          e.op(transaction.source_partition.id, "=", id)
        ),
      }));
      return e.sum(transactions.value);
    });

    const client = edgedb.createClient({ database: dbname }).withGlobals({
      current_user_id: userId,
    });
    return await balanceQuery.run(client, { id: partitionId });
  }
);

export const getAccountBalance = withValidation(
  object({
    accountId: string(),
    userId: string(),
    dbname: string(),
  }),
  async ({ accountId, userId, dbname }) => {
    const query = e.params({ id: e.uuid }, ({ id }) => {
      const tx = e.select(e.ETransaction, (transaction) => ({
        filter: e.op(
          transaction.is_visible,
          "and",
          e.op(transaction.source_partition.account.id, "=", id)
        ),
      }));
      return e.sum(tx.value);
    });
    const client = edgedb.createClient({ database: dbname }).withGlobals({
      current_user_id: userId,
    });
    return await query.run(client, { id: accountId });
  }
);

export const getCategoryKindBalance = withValidation(
  object({
    userId: string(),
    kind: string(),
    dbname: string(),
  }),
  async ({ userId, kind, dbname }) => {
    const query = e.params({ kind: e.ECategoryKind }, ({ kind }) => {
      const tx = e.select(e.ETransaction, (transaction) => ({
        filter: e.op(
          transaction.is_visible,
          "and",
          e.op(transaction.category.kind, "=", kind)
        ),
      }));
      return e.sum(tx.value);
    });
    const client = edgedb.createClient({ database: dbname }).withGlobals({
      current_user_id: userId,
    });
    return await query.run(client, { kind: kind as any });
  }
);

export const createNewUser = withValidation(
  object({ username: string(), email: string(), name: string() }),
  async ({ username, email, name }) => {
    const masterdbClient = edgedb.createClient({
      database: "masterdb",
    });

    const result = await e
      .params(
        { username: e.str, email: e.str, name: e.str },
        ({ username, email, name }) =>
          e.insert(e.masterdb.EUser, {
            username,
            email,
            name,
          })
      )
      .run(masterdbClient, {
        username,
        email,
        name,
      });

    const createNewDB = async () => {
      while (true) {
        try {
          const random6digitHex = Math.floor(Math.random() * 16777215).toString(
            16
          );
          const dbname = `db_${random6digitHex}`;
          await masterdbClient.execute(`CREATE DATABASE ${dbname};`);
          return dbname;
        } catch (error) {}
      }
    };

    const dbname = await createNewDB();

    await e
      .params(
        {
          name: e.str,
          user_id: e.uuid,
        },
        ({ name, user_id }) =>
          e.insert(e.masterdb.EDatabase, {
            name,
            users: e.select(e.masterdb.EUser, (user) => ({
              filter: e.op(user.id, "=", user_id),
            })),
          })
      )
      .run(masterdbClient, {
        name: dbname,
        user_id: result.id,
      });

    const migrations = await e
      .select(e.schema.Migration, (migration) => ({
        name: true,
        script: true,
        parent_names: migration.parents.name,
        next_migration_names: migration["<parents[is schema::Migration]"].name,
      }))
      .run(masterdbClient);

    type Migration = (typeof migrations)[number];

    const migrationByName = new Map<string, Migration>();
    for (const m of migrations) {
      migrationByName.set(m.name, m);
    }

    const firstMigration = migrations.find((m) => m.parent_names.length === 0);
    if (!firstMigration) {
      throw new Error("No initial migration found.");
    }
    const migrationScripts: string[] = [];

    let currentMigration: Migration | undefined = firstMigration;
    while (currentMigration) {
      const onto =
        firstMigration === currentMigration
          ? "initial"
          : currentMigration.parent_names[0];

      const script = `CREATE MIGRATION ${currentMigration.name} ONTO ${onto} {
        ${currentMigration.script}
      };`;

      migrationScripts.push(script);
      const nextMigrationName = currentMigration.next_migration_names[0];
      if (!nextMigrationName) {
        break;
      }
      currentMigration = migrationByName.get(nextMigrationName);
    }

    // migrate the new database
    const dbClient = edgedb.createClient({ database: dbname });
    await dbClient.execute(migrationScripts.join("\n"));

    const { id: userId } = await e
      .params(
        { username: e.str, email: e.str, name: e.str },
        ({ username, email, name }) =>
          e.insert(e.EUser, {
            username,
            email,
            name,
          })
      )
      .run(dbClient, {
        username,
        email,
        name,
      });

    return {
      dbname,
      user: {
        id: userId,
        username,
      },
    };
  }
);

export const createCategory = withValidation(
  object({
    userId: string(),
    name: string(),
    dbname: string(),
    kind: string(),
    isPrivate: boolean(),
  }),
  async ({ userId, name, dbname, kind, isPrivate }) => {
    const query = e.params(
      {
        name: e.str,
        kind: e.ECategoryKind,
      },
      ({ name, kind }) =>
        e.insert(e.ECategory, {
          name,
          kind,
          is_private: isPrivate,
          owners: e.select(e.EUser, (user) => ({
            filter: e.op(user.id, "=", e.uuid(userId)),
          })),
        })
    );
    const result = await query.run(edgedb.createClient({ database: dbname }), {
      name,
      kind: kind as any,
    });
    return result;
  }
);

export const createPartition = withValidation(
  object({
    userId: string(),
    name: string(),
    dbname: string(),
    isPrivate: boolean(),
    forNewAccount: boolean(),
    accountId: string(),
    isSharedAccount: boolean(),
    newAccountName: optional(string()),
  }),
  async ({
    userId,
    name,
    dbname,
    isPrivate,
    accountId: inputAccountId,
    forNewAccount,
    isSharedAccount,
    newAccountName,
  }) => {
    const client = edgedb.createClient({ database: dbname });

    const newPartitionQuery = e.params(
      {
        name: e.str,
        isPrivate: e.bool,
        accountId: e.optional(e.uuid),
      },
      ({ name, isPrivate, accountId }) =>
        e.insert(e.EPartition, {
          name,
          is_private: isPrivate,
          account: e.select(e.EAccount, (account) => ({
            filter_single: e.op(account.id, "=", accountId),
          })),
        })
    );

    const newAccountQuery = e.params(
      {
        name: e.str,
        userId: e.uuid,
      },
      ({ name, userId }) =>
        e.insert(e.EAccount, {
          name,
          owners: isSharedAccount
            ? e.select(e.EUser)
            : e.select(e.EUser, (user) => ({
                filter: e.op(user.id, "=", userId),
              })),
        })
    );

    await client
      .withGlobals({
        current_user_id: userId,
      })
      .transaction(async (tx) => {
        let accountId: string;
        if (forNewAccount) {
          if (!newAccountName) {
            throw new Error("New account name is required.");
          }
          const { id } = await newAccountQuery.run(tx, {
            name: newAccountName,
            userId,
          });
          accountId = id;
        } else {
          accountId = inputAccountId;
        }
        const { id } = await newPartitionQuery.run(tx, {
          name,
          isPrivate,
          accountId,
        });
      });

    return true;
  }
);

const _canDeletePartition = async (
  partitionId: string,
  tx: Transaction | edgedb.Client
) => {
  const transactionsCountQuery = e.params({ id: e.uuid }, ({ id }) =>
    e.count(
      e.select(e.ETransaction, (transaction) => ({
        filter: e.op(transaction.source_partition.id, "=", id),
      }))
    )
  );
  const isOwnedQuery = e.params({ id: e.uuid }, ({ id }) =>
    e.select(e.EPartition, (partition) => ({
      filter_single: e.op(
        e.op(partition.id, "=", id),
        "and",
        partition.is_owned
      ),
    }))
  );

  const isOwned = await isOwnedQuery.run(tx, { id: partitionId });
  const count = await transactionsCountQuery.run(tx, { id: partitionId });
  return Boolean(isOwned) && count === 0;
};

export const partitionCanBeDeleted = withValidation(
  object({ partitionId: string(), userId: string(), dbname: string() }),
  async ({ partitionId, userId, dbname }) => {
    return _canDeletePartition(
      partitionId,
      edgedb.createClient({ database: dbname }).withGlobals({
        current_user_id: userId,
      })
    );
  }
);

export const deletePartition = withValidation(
  object({ partitionId: string(), userId: string(), dbname: string() }),
  async ({ partitionId, userId, dbname }) => {
    const deleteQuery = e.params({ id: e.uuid }, ({ id }) =>
      e.delete(e.EPartition, (partition) => ({
        filter_single: e.op(partition.id, "=", id),
      }))
    );
    return edgedb
      .createClient({ database: dbname })
      .withGlobals({
        current_user_id: userId,
      })
      .transaction(async (tx) => {
        const canDelete = await _canDeletePartition(partitionId, tx);
        if (!canDelete) {
          throw new Error("Partition has linked transactions.");
        }
        await deleteQuery.run(tx, { id: partitionId });
      });
  }
);

export const updatePartition = withValidation(
  object({
    userId: string(),
    partitionId: string(),
    name: string(),
    dbname: string(),
  }),
  async ({ userId, partitionId, name, dbname }) => {
    const updateNameQuery = e.params(
      {
        id: e.uuid,
        name: e.str,
      },
      ({ id, name }) =>
        e.update(e.EPartition, (partition) => ({
          filter_single: e.op(
            partition.is_owned,
            "and",
            e.op(partition.id, "=", id)
          ),
          set: {
            name,
          },
        }))
    );
    return updateNameQuery.run(
      edgedb
        .createClient({ database: dbname })
        .withGlobals({ current_user_id: userId }),
      {
        id: partitionId,
        name: name.trim(),
      }
    );
  }
);

const _canDeleteAccount = async (
  accountId: string,
  tx: Transaction | edgedb.Client
) => {
  const count = await e
    .params({ accountId: e.uuid }, ({ accountId }) =>
      e.count(
        e.select(e.EAccount, (account) => ({
          filter: e.op(
            e.op(account.id, "=", accountId),
            "and",
            e.op(account.is_empty, "and", account.is_owned)
          ),
        }))
      )
    )
    .run(tx, { accountId });

  return count === 1;
};

export const accountCanBeDeleted = withValidation(
  object({ accountId: string(), userId: string(), dbname: string() }),
  async ({ accountId, userId, dbname }) => {
    return _canDeleteAccount(
      accountId,
      edgedb.createClient({ database: dbname }).withGlobals({
        current_user_id: userId,
      })
    );
  }
);

export const deleteAccount = withValidation(
  object({ accountId: string(), userId: string(), dbname: string() }),
  async ({ accountId, userId, dbname }) => {
    const deleteQuery = e.params({ id: e.uuid }, ({ id }) =>
      e.delete(e.EAccount, (account) => ({
        filter_single: e.op(account.id, "=", id),
      }))
    );
    return edgedb
      .createClient({ database: dbname })
      .withGlobals({
        current_user_id: userId,
      })
      .transaction(async (tx) => {
        const canDelete = await _canDeleteAccount(accountId, tx);
        if (!canDelete) {
          throw new Error("Account has linked transactions.");
        }
        await deleteQuery.run(tx, { id: accountId });
      });
  }
);

export const updateCategory = withValidation(
  object({
    userId: string(),
    categoryId: string(),
    name: string(),
    dbname: string(),
  }),
  async ({ userId, categoryId, name, dbname }) => {
    const updateNameQuery = e.params(
      {
        id: e.uuid,
        name: e.str,
      },
      ({ id, name }) =>
        e.update(e.ECategory, (category) => ({
          filter_single: e.op(category.id, "=", id),
          set: {
            name,
          },
        }))
    );
    return updateNameQuery.run(
      edgedb
        .createClient({ database: dbname })
        .withGlobals({ current_user_id: userId }),
      {
        id: categoryId,
        name,
      }
    );
  }
);
