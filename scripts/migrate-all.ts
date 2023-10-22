import { edgedbComm, execAsync, migrateDb } from "./common";

const main = async () => {
  const { stdout } = await execAsync(`${edgedbComm} list databases`);
  const dbNames = stdout.split("\n").filter(Boolean);
  for (const dbName of dbNames) {
    await migrateDb(dbName);
  }
};

main().catch(console.error);
