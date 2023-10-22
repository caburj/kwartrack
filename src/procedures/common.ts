import e from "../../dbschema/edgeql-js";
import {
  type Input,
  type BaseSchema,
  object,
  string,
  optional,
  boolean,
} from "valibot";
import { Transaction } from "edgedb/dist/transaction";

export function withValidation<
  S extends BaseSchema,
  R extends any,
  O extends any[]
>(paramSchema: S, fn: (param: Input<S>, ...otherParams: O) => R) {
  return (param: Input<S>, ...otherParams: O) => {
    const result = paramSchema.parse(param);
    return fn(result, ...otherParams);
  };
}

export const createInvitationSchema = object({
  inviterEmail: string(),
  email: string(),
  code: string(),
  dbId: optional(string()),
});

export const _createInvitation = withValidation(
  createInvitationSchema,
  async ({ inviterEmail, email, code, dbId }, tx: Transaction) => {
    const inviterQuery = e.select(e.masterdb.EUser, (user) => ({
      filter_single: e.op(user.email, "=", inviterEmail),
    }));
    const existingUserQuery = e.select(e.masterdb.EUser, (user) => ({
      filter_single: e.op(user.email, "=", email),
    }));
    const existingInvitationQuery = e.select(e.masterdb.EInvitation, (i) => ({
      filter_single: e.op(i.email, "=", email),
      is_accepted: true,
    }));
    const createInvitationQuery = e.params(
      {
        email: e.str,
        code: e.str,
      },
      ({ email, code }) =>
        e.insert(e.masterdb.EInvitation, {
          email,
          code,
          inviter: e.select(e.masterdb.EUser, (user) => ({
            filter_single: e.op(user.email, "=", inviterEmail),
          })),
          db: dbId
            ? e.select(e.masterdb.EDatabase, (db) => ({
                filter_single: e.op(db.id, "=", e.uuid(dbId)),
              }))
            : undefined,
        })
    );
    const inviter = await inviterQuery.run(tx);
    if (!inviter) {
      return { error: "Inviter is unknown" };
    }
    const existingUser = await existingUserQuery.run(tx);
    if (existingUser) {
      return { error: "User with given email already exists" };
    }
    const existingInvitation = await existingInvitationQuery.run(tx);
    if (existingInvitation && !existingInvitation.is_accepted) {
      return { error: "Invitation exists and is not yet accepted" };
    }

    // ensure db exists if dbId is provided
    if (dbId) {
      const db = await e
        .select(e.masterdb.EDatabase, (db) => ({
          filter_single: e.op(db.id, "=", e.uuid(dbId)),
        }))
        .run(tx);
      if (!db) {
        return { error: "Database not found" };
      }
    }

    const { id: invitationId } = await createInvitationQuery.run(tx, {
      email,
      code,
    });
    return e
      .select(e.masterdb.EInvitation, (i) => ({
        filter_single: e.op(i.id, "=", e.uuid(invitationId)),
        id: true,
        code: true,
        email: true,
        inviter: {
          id: true,
          name: true,
          username: true,
        },
      }))
      .run(tx);
  }
);

export const makeCreateCategoryQuery = (args: {
  isPrivate: boolean;
  userId: string;
}) => {
  const { isPrivate, userId } = args;
  return e.params(
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
};

export const createDefaultCategories = async (
  tx: Transaction,
  userId: string
) => {
  const incomeCategories = ["Initial Balance", "Salary", "Other Income"];
  const expenseCategories = [
    "Grocery",
    "Rent",
    "Bills",
    "Misc",
    "Restaurants",
    "Transportation",
    "Travel",
    "Health",
    "Shopping",
  ];
  const transferCategories = ["Transfer"];

  const createCategory = makeCreateCategoryQuery({
    userId,
    isPrivate: false,
  });

  for (const category of incomeCategories) {
    await createCategory.run(tx, { name: category, kind: "Income" });
  }
  for (const category of expenseCategories) {
    await createCategory.run(tx, { name: category, kind: "Expense" });
  }
  for (const category of transferCategories) {
    await createCategory.run(tx, { name: category, kind: "Transfer" });
  }
};

export const _createPartition = withValidation(
  object({
    userId: string(),
    name: string(),
    isPrivate: boolean(),
    forNewAccount: boolean(),
    accountId: string(),
    isSharedAccount: boolean(),
    newAccountName: optional(string()),
  }),
  async (
    {
      userId,
      name,
      isPrivate,
      accountId: inputAccountId,
      forNewAccount,
      isSharedAccount,
      newAccountName,
    },
    tx: Transaction
  ) => {
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
          owners: !isSharedAccount
            ? e.select(e.EUser, (user) => ({
                filter: e.op(user.id, "=", userId),
              }))
            : undefined,
        })
    );

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
    await newPartitionQuery.run(tx, {
      name,
      isPrivate,
      accountId,
    });

    return true;
  }
);

// create user, default categories and partition
export const _createInitialData = withValidation(
  object({
    username: string(),
    email: string(),
    name: string(),
    asFirstUser: boolean(),
  }),
  async ({ username, email, name, asFirstUser }, tx: Transaction) => {
    const { id: userId } = await e
      .params({ email: e.str, name: e.str }, ({ email, name }) =>
        e.insert(e.EUser, {
          username,
          email,
          name,
        })
      )
      .run(tx, {
        email,
        name,
      });

    if (asFirstUser) {
      await createDefaultCategories(tx, userId);
      // Create one partition for onboarding.
      await _createPartition(
        {
          forNewAccount: true,
          isPrivate: false,
          name: "Main",
          userId: userId,
          newAccountName: "Bank Account",
          isSharedAccount: false,
          // TODO: Seems to be unused. Remove?
          accountId: "for-new-account",
        },
        tx
      );
    }
  }
);
