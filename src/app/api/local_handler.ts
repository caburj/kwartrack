import * as procedures from '@/db/procedures';
import {
  createLocalHandler,
  createUntypedLocalHandler,
} from '@/utils/handlers';

export { untypedLocalCall, localCall };

const untypedLocalCall = createUntypedLocalHandler({ procedures });
const localCall = createLocalHandler({ procedures });
