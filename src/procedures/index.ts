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
};

export type Procedures = typeof procedures;
