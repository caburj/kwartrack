import * as edgedb from 'edgedb';
import e from '../dbschema/edgeql-js';
import {
  _createInitialData,
  _createInvitation,
} from '../src/procedures/common';
import { createNewDb } from './common';
import arg from 'arg';
import { object, string, parse } from 'valibot';

async function main() {
  const dbname = await createNewDb();
  const masterdbClient = edgedb.createClient({ database: 'edgedb' });

  const createMasterUserQuery = e.params(
    { username: e.str, email: e.str, name: e.str },
    ({ username, email, name }) =>
      e.insert(e.masterdb.EUser, {
        username,
        email,
        name,
      }),
  );

  const args = arg({
    '--email': String,
    '--username': String,
    '--name': String,
  });

  const cleanArgs = Object.fromEntries(
    Object.entries(args).map(([key, value]) => [key.replace(/^--/, ''), value]),
  );

  const argsSchema = object({
    email: string(),
    username: string(),
    name: string(),
  });

  const { email, username, name } = parse(argsSchema, cleanArgs);

  await masterdbClient.transaction(async tx => {
    const { id: dbId } = await e
      .insert(e.masterdb.EDatabase, {
        name: dbname,
      })
      .run(masterdbClient);

    const { id: userId } = await createMasterUserQuery.run(tx, {
      email,
      username,
      name,
    });

    await e
      .update(e.masterdb.EDatabase, db => ({
        filter_single: e.op(db.id, '=', e.uuid(dbId)),
        set: {
          users: {
            '+=': e.select(e.masterdb.EUser, user => ({
              filter: e.op(user.id, '=', e.uuid(userId)),
            })),
          },
        },
      }))
      .run(tx);
  });

  const dbClient = edgedb.createClient({ database: dbname });
  await dbClient.transaction(async tx => {
    return _createInitialData(
      {
        asFirstUser: true,
        email: email,
        name: name,
        username: username,
      },
      tx,
    );
  });
}

main().catch(console.error);
