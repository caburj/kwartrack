import { createRemoteHandler } from "@/utils/handlers";
import * as procedures from "@/db/procedures";

export { rpc };

const rpc = createRemoteHandler<typeof procedures>({
  url: `${process.env.NEXT_PUBLIC_HOST!}/api/rpc`,
});
