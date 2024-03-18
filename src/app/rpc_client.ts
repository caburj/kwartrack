import { createRPCClient } from '@/utils/rpc';
import { type Procedures } from '@/procedures';

export const rpc = createRPCClient<Procedures>();
