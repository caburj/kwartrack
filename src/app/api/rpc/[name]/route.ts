import { createRPCHandler } from '@/utils/rpc';
import { procedures } from '@/procedures';

const { GET, POST } = createRPCHandler(procedures);

export { GET, POST };
