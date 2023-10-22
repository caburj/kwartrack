import * as edgedb from "edgedb";
import e from "../dbschema/edgeql-js";
import { _createInvitation } from "../src/procedures/common";
import { edgedbComm, execAsync, logResult, migrateDb } from "./common";
import arg from "arg";
import { object, string } from "valibot";

async function main() {
  const dbname = await createNewDb();
  const masterdbClient = edgedb.createClient({ database: "edgedb" });

  const result = await masterdbClient.transaction(async (tx) => {
    const { id: dbId } = await e
      .insert(e.masterdb.EDatabase, {
        name: dbname,
      })
      .run(masterdbClient);

    const args = arg({
      "--code": String,
      "--email": String,
      "--inviter": String,
    });

    const cleanArgs = Object.fromEntries(
      Object.entries(args).map(([key, value]) => [
        key.replace(/^--/, ""),
        value,
      ])
    );

    const argsSchema = object({
      code: string(),
      email: string(),
      inviter: string(),
    });

    const { code, email, inviter } = argsSchema.parse(cleanArgs);

    const invitation = await _createInvitation(
      {
        code,
        email,
        dbId: dbId,
        inviterEmail: inviter,
      },
      tx
    );
    return invitation;
  });

  const hasError = !result || "error" in result;

  if (hasError) {
    if (!result) {
      console.error("Error: No invitation created.");
    } else if ("error" in result) {
      console.error('Error:', result.error);
    }
    // Ugly, but this is to ensure that the nothing is accessing the db before it's dropped.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const dropdbResult = await execAsync(`echo Yes | ${edgedbComm} database drop ${dbname}`);
    logResult(dropdbResult);
    process.exit(1);
  } else {
    console.log(
      "Invitation created:",
      `/invitation/accept?code=${result.code}`
    );
    process.exit(0);
  }
}

async function createNewDb() {
  const random6digitHex = Math.floor(Math.random() * 16777215).toString(16);
  const dbname = `db_${random6digitHex}`;
  const createResult = await execAsync(
    `${edgedbComm} database create ${dbname}`
  );
  logResult(createResult);
  await migrateDb(dbname);
  return dbname;
}

main().catch(console.error);
