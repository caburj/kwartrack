import { useReducer, createContext, ReactNode } from "react";

type UserPageStore = {
  partitionIds: string[];
  categoryIds: string[];
  transactionSearchStartDate: Date | undefined;
  transactionSearchEndDate: Date | undefined;
};

type UserPageAction =
  | { type: "TOGGLE_PARTITIONS"; payload: string[] }
  | { type: "TOGGLE_CATEGORIES"; payload: string[] }
  | { type: "SET_TRANSACTION_SEARCH_START_DATE"; payload: Date | undefined }
  | { type: "SET_TRANSACTION_SEARCH_END_DATE"; payload: Date | undefined };

type UserPageDispatch = (action: UserPageAction) => void;

const firstDayOfCurrentMonth = () => {
  const date = new Date();
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1));
};

const firstDayOfNextMonth = () => {
  const date = new Date();
  return new Date(Date.UTC(date.getFullYear(), date.getMonth() + 1, 1));
}

const initStore: UserPageStore = {
  partitionIds: [],
  categoryIds: [],
  transactionSearchStartDate: firstDayOfCurrentMonth(),
  transactionSearchEndDate: firstDayOfNextMonth(),
};

const userPageStoreReducer = (state: UserPageStore, action: UserPageAction) => {
  switch (action.type) {
    case "TOGGLE_PARTITIONS": {
      let partitionIds = state.partitionIds;
      for (const id of action.payload) {
        if (partitionIds.includes(id)) {
          partitionIds = partitionIds.filter((_id) => _id !== id);
        } else {
          partitionIds = [...partitionIds, id];
        }
      }
      return { ...state, partitionIds };
    }
    case "TOGGLE_CATEGORIES": {
      let categoryIds = state.categoryIds;
      for (const id of action.payload) {
        if (categoryIds.includes(id)) {
          categoryIds = categoryIds.filter((_id) => _id !== id);
        } else {
          categoryIds = [...categoryIds, id];
        }
      }
      return { ...state, categoryIds };
    }
    case "SET_TRANSACTION_SEARCH_START_DATE":
      return { ...state, transactionSearchStartDate: action.payload };
    case "SET_TRANSACTION_SEARCH_END_DATE":
      return { ...state, transactionSearchEndDate: action.payload };
    default:
      return state;
  }
};

export const UserPageStoreContext = createContext<
  [state: UserPageStore, dispatch: UserPageDispatch]
>([initStore, () => null]);

export const UserPageStoreProvider = (props: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(userPageStoreReducer, initStore);
  return (
    <UserPageStoreContext.Provider value={[state, dispatch]}>
      {props.children}
    </UserPageStoreContext.Provider>
  );
};
