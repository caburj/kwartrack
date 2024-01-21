import { useContext } from "react";
import { UserPageStoreContext } from "./store";
import { useQuery } from "@tanstack/react-query";
import { rpc } from "@/app/rpc_client";

export const useTransactions = (user: { id: string; dbname: string }) => {
  const [store] = useContext(UserPageStoreContext);
  const transactions = useQuery(
    [
      "transactions",
      store.currentPage,
      store.categoryIds,
      store.partitionIds,
      store.loanIds,
      store.tssDate,
      store.tseDate,
      store.nPerPage,
      store.showOverallBalance,
    ],
    () => {
      return rpc.post.findTransactions({
        currentPage: store.currentPage,
        nPerPage: store.nPerPage,
        partitionIds: store.partitionIds,
        categoryIds: store.categoryIds,
        loanIds: store.loanIds,
        ownerId: user.id,
        dbname: user.dbname,
        showOverall: store.showOverallBalance,
        tssDate: store.tssDate?.toISOString(),
        tseDate: store.tseDate?.toISOString(),
      });
    }
  );
  return transactions;
};
