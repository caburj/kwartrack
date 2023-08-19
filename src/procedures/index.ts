import {
  findUser,
  findTransactions,
  getUserTransactions,
} from "./server_functions";

/**
 * Export here the server functions that can be called from the client via rpc.
 */
export const procedures = {
  findUser,
  findTransactions,
  getUserTransactions,
};

export type Procedures = typeof procedures;
