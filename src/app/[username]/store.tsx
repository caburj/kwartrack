import { useReducer, createContext, ReactNode } from "react";

type UserPageStore = {
  partitionIds: string[];
  categoryIds: string[];
  tssDate: Date | undefined;
  tseDate: Date | undefined;
};

type UserPageAction =
  | { type: "TOGGLE_PARTITIONS"; payload: string[] }
  | { type: "TOGGLE_ACCOUNT"; payload: string[] }
  | { type: "TOGGLE_CATEGORIES"; payload: string[] }
  | { type: "TOGGLE_CATEGORY_KIND"; payload: string[] }
  | { type: "SET_TSS_DATE"; payload: Date | undefined }
  | { type: "SET_TSE_DATE"; payload: Date | undefined };

type UserPageDispatch = (action: UserPageAction) => void;

const firstDayOfCurrentMonth = () => {
  const date = new Date();
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1));
};

const lastDayOfCurrentMonth = () => {
  const date = new Date();
  return new Date(Date.UTC(date.getFullYear(), date.getMonth() + 1, 0));
};

const initStore: UserPageStore = {
  partitionIds: [],
  categoryIds: [],
  tssDate: firstDayOfCurrentMonth(),
  tseDate: lastDayOfCurrentMonth(),
};

const userPageStoreReducer = (
  state: UserPageStore,
  action: UserPageAction
): UserPageStore => {
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
    case "TOGGLE_ACCOUNT": {
      // payload is partitionIds in the clicked account
      let allSelected = true;
      for (const id of action.payload) {
        if (!state.partitionIds.includes(id)) {
          allSelected = false;
          break;
        }
      }
      if (allSelected) {
        return {
          ...state,
          partitionIds: state.partitionIds.filter(
            (id) => !action.payload.includes(id)
          ),
        };
      } else {
        return {
          ...state,
          partitionIds: [...state.partitionIds, ...action.payload],
        };
      }
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
    case "TOGGLE_CATEGORY_KIND": {
      let allSelected = true;
      for (const id of action.payload) {
        if (!state.categoryIds.includes(id)) {
          allSelected = false;
          break;
        }
      }
      if (allSelected) {
        return {
          ...state,
          categoryIds: state.categoryIds.filter(
            (id) => !action.payload.includes(id)
          ),
        };
      } else {
        return {
          ...state,
          categoryIds: [...state.categoryIds, ...action.payload],
        };
      }
    }
    case "SET_TSS_DATE": {
      return { ...state, tssDate: action.payload };
    }
    case "SET_TSE_DATE": {
      return { ...state, tseDate: action.payload };
    }
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
