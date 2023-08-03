import { createClient } from "edgedb";
import { object, parse, string, Input, ObjectSchema } from "valibot";
import e from "../../dbschema/edgeql-js";

const client = createClient();

export const findUser = defineProcedure(
  object({ username: string() }),
  async ({ username }) => {
    const query = e.select(e.ExpensifUser, (user) => ({
      id: true,
      name: true,
      username: true,
      filter: e.op(user.username, "=", username),
    }));

    const result = await query.run(client);
    if (result.length === 0) {
      return null;
    }
    return result[0];
  }
);

/**
 * Used to define a procedure with an input (any object type).
 * E.g.
 * ```
 * // Declaration
 * import z from 'zod';
 * const bar = makeProcedure(z.object({ name: z.string() }), (_ctx, user) => {
 *  console.log(user.name);
 * });
 *
 * // Usage
 * import caller; // can be rpc or local caller.
 * caller('bar', { name: 'baz' }) // logs 'baz'
 * ```
 */
function defineProcedure<
  S extends ObjectSchema<any>,
  F extends (input: Input<S>, ctx: {}) => any
>(schema: S, fn: F) {
  return (...[input, ctx]: Parameters<F>): ReturnType<F> => {
    const parsedInput = parse(schema, input);
    return fn(parsedInput, ctx);
  };
}

/**
 * Used to define a procedure without any input.
 * E.g.
 * ```
 * // Declaration
 * const foo = makeProcedure0((_ctx) => {
 *   return 'foo';
 * });
 *
 * // Usage
 * import caller; // can be rpc or local caller.
 * const result = caller('foo');
 * console.log(result); // logs 'foo'
 * ```
 */
function defineProcedure0<F extends (ctx: {}) => any>(fn: F) {
  return (...[ctx]: Parameters<F>): ReturnType<F> => {
    return fn(ctx);
  };
}
