import {
  findUser,
  findTransactions,
  getUserTransactions,
  createTransaction,
  deleteTransaction,
  getUserCategories,
  deleteCategory,
  getCategoryBalance,
  createUserCategory,
  getPartitionBalance,
  getAccountBalance,
} from "./server_functions";

/**
 * Export here the server functions that can be called from the client via rpc.
 */
export const procedures = {
  findUser,
  findTransactions,
  getUserTransactions,
  createTransaction,
  deleteTransaction,
  getUserCategories,
  deleteCategory,
  getCategoryBalance,
  createUserCategory,
  getPartitionBalance,
  getAccountBalance,
};

export type Procedures = typeof procedures;
