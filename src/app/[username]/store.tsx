import { useReducer, createContext, ReactNode } from "react";

type StoreSelected = {
  partitionIds: string[];
  categoryIds: string[];
};

type ActionSelected =
  | { type: "TOGGLE_PARTITIONS"; payload: string[] }
  | { type: "TOGGLE_CATEGORIES"; payload: string[] }

type DispatchSelected = (action: ActionSelected) => void;

const initSelected: StoreSelected = {
  partitionIds: [],
  categoryIds: [],
};

const reducerSelected = (state: StoreSelected, action: ActionSelected) => {
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
    case "TOGGLE_CATEGORIES":{
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
    default:
      return state;
  }
};

export const StoreSelectedContext = createContext<[state: StoreSelected, dispatch: DispatchSelected]>([
  initSelected,
  () => null,
]);

export const StoreSelectedProvider = (props: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducerSelected, initSelected);
  return (
    <StoreSelectedContext.Provider value={[state, dispatch]}>
      {props.children}
    </StoreSelectedContext.Provider>
  );
};
