import {
  findUser,
  findTransactions,
  createTransaction,
  deleteTransaction,
  getUserCategories,
  deleteCategory,
  getCategoryBalance,
  createUserCategory,
  getPartitionBalance,
  getAccountBalance,
  getAccounts,
  getPartitions,
  getVisiblePartitions,
} from "./server_functions";

/**
 * Export here the server functions that can be called from the client via rpc.
 */
export const procedures = {
  findUser,
  findTransactions,
  createTransaction,
  deleteTransaction,
  getUserCategories,
  deleteCategory,
  getCategoryBalance,
  createUserCategory,
  getPartitionBalance,
  getAccountBalance,
  getAccounts,
  getPartitions,
  getVisiblePartitions,
};

export type Procedures = typeof procedures;
