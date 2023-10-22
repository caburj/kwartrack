import e from "../../dbschema/edgeql-js";
import { type Input, type BaseSchema, object, string, optional } from "valibot";
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
