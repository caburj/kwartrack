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
  getPartitionOptions,
  getCategoryKindBalance,
  createCategory,
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
  getPartitionOptions,
  getCategoryKindBalance,
  createCategory,
};

export type Procedures = typeof procedures;
