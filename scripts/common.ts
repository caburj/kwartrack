import { exec } from "child_process";
import "dotenv/config";

export const execAsync = (
  command: string
): Promise<{ stdout: string; stderr: string }> => {
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
};

const EDGEDB_INSTANCE = process.env.EDGEDB_INSTANCE;

export const edgedbComm = EDGEDB_INSTANCE
  ? `edgedb -I ${EDGEDB_INSTANCE}`
  : "edgedb";

export const logResult = (result: Awaited<ReturnType<typeof execAsync>>) => {
  if (result.stdout) {
    console.log(result.stdout);
  }
  if (result.stderr) {
    console.error(result.stderr);
  }
};

export const migrateDb = async (dbName: string) => {
  console.log(`Migrating "${dbName}"...`);
  const { stdout, stderr } = await execAsync(
    `${edgedbComm} migrate -d ${dbName}`
  );
  logResult({ stdout, stderr });
};
