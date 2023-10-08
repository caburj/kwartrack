import { exec } from "child_process";
import "dotenv/config";

const execAsync = (
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

const command = EDGEDB_INSTANCE
  ? `edgedb -I ${EDGEDB_INSTANCE}`
  : "edgedb";

const main = async () => {
  const { stdout } = await execAsync(`${command} list databases`);
  const dbNames = stdout.split("\n").filter(Boolean);
  for (const dbName of dbNames) {
    console.log(`Migrating "${dbName}"...`);
    const { stdout, stderr } = await execAsync(
      `${command} migrate -d ${dbName}`
    );
    if (stdout) {
      console.log(stdout);
    }
    if (stderr) {
      console.error(stderr);
    }
  }
};

main().catch(console.error);
