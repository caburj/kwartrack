import { useReducer, createContext, ReactNode } from 'react';
import {
  getFirstDayOfMonth,
  getLastDayOfMonth,
  plusMonths,
} from '@/utils/common';

type UserPageStore = {
  partitionIds: string[];
  categoryIds: string[];
  loanIds: string[];
  tssDate: Date | null;
  tseDate: Date | null;
  nPerPage: number;
  currentPage: number;
  selectedCategoryId: string;
  selectedSourceId: string;
  selectedDestinationId: string;
  showOverallBalance: boolean;
  budgetProfileId?: string;
};

type UserPageAction =
  | { type: 'TOGGLE_PARTITIONS'; payload: string[] }
  | { type: 'TOGGLE_ACCOUNT'; payload: string[] }
  | { type: 'TOGGLE_CATEGORIES'; payload: string[] }
  | { type: 'TOGGLE_CATEGORY_KIND'; payload: string[] }
  | { type: 'SET_N_PER_PAGE'; payload: number }
  | { type: 'SET_TSS_DATE'; payload: Date | null }
  | { type: 'SET_TSE_DATE'; payload: Date | null }
  | { type: 'SET_THIS_MONTH' }
  | { type: 'SET_PREV_MONTH' }
  | { type: 'SET_NEXT_MONTH' }
  | { type: 'SET_SELECTED_CATEGORY_ID'; payload: string }
  | { type: 'SET_SELECTED_SOURCE_ID'; payload: string }
  | { type: 'SET_SELECTED_DESTINATION_ID'; payload: string }
  | { type: 'TOGGLE_LOAN_IDS'; payload: string[] }
  | { type: 'REMOVE_LOAN_IDS'; payload: string[] }
  | { type: 'TOGGLE_BALANCE_TO_DISPLAY' }
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'CLEAR_ACCOUNT_SELECTION' }
  | { type: 'CLEAR_CATEGORY_SELECTION' }
  | { type: 'CLEAR_LOAN_SELECTION' }
  | { type: 'SET_ACTIVE_BUDGET_PROFILE_ID'; payload: string }
  | { type: 'TOGGLE_BUDGET_PROFILE'; payload: [string, string[]] };

type UserPageDispatch = (action: UserPageAction) => void;

const initStore: UserPageStore = {
  partitionIds: [],
  categoryIds: [],
  loanIds: [],
  nPerPage: 25,
  currentPage: 1,
  tssDate: getFirstDayOfMonth(new Date()),
  tseDate: getLastDayOfMonth(new Date()),
  selectedCategoryId: '',
  selectedSourceId: '',
  selectedDestinationId: '',
  showOverallBalance: true,
};

const userPageStoreReducer = (
  state: UserPageStore,
  action: UserPageAction,
): UserPageStore => {
  switch (action.type) {
    case 'TOGGLE_PARTITIONS': {
      let { partitionIds } = state;
      for (const id of action.payload) {
        if (partitionIds.includes(id)) {
          partitionIds = partitionIds.filter(_id => _id !== id);
        } else {
          partitionIds = [...partitionIds, id];
        }
      }
      return { ...state, partitionIds, selectedSourceId: '', currentPage: 1 };
    }
    case 'TOGGLE_ACCOUNT': {
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
            id => !action.payload.includes(id),
          ),
          currentPage: 1,
        };
      } else {
        return {
          ...state,
          partitionIds: [...state.partitionIds, ...action.payload],
          currentPage: 1,
        };
      }
    }
    case 'TOGGLE_CATEGORIES': {
      let { categoryIds } = state;
      for (const id of action.payload) {
        if (categoryIds.includes(id)) {
          categoryIds = categoryIds.filter(_id => _id !== id);
        } else {
          categoryIds = [...categoryIds, id];
        }
      }
      return { ...state, categoryIds, selectedCategoryId: '', currentPage: 1 };
    }
    case 'TOGGLE_CATEGORY_KIND': {
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
            id => !action.payload.includes(id),
          ),
          currentPage: 1,
        };
      } else {
        return {
          ...state,
          categoryIds: [...state.categoryIds, ...action.payload],
          currentPage: 1,
        };
      }
    }
    case 'SET_N_PER_PAGE': {
      return { ...state, nPerPage: action.payload };
    }
    case 'SET_TSS_DATE': {
      return { ...state, tssDate: action.payload, currentPage: 1 };
    }
    case 'SET_TSE_DATE': {
      return { ...state, tseDate: action.payload, currentPage: 1 };
    }
    case 'SET_THIS_MONTH': {
      const today = new Date();
      return {
        ...state,
        tssDate: getFirstDayOfMonth(today),
        tseDate: getLastDayOfMonth(today),
        currentPage: 1,
      };
    }
    case 'SET_PREV_MONTH': {
      const d = state.tssDate || new Date();
      const x = plusMonths(d, -1);
      return {
        ...state,
        tssDate: getFirstDayOfMonth(x),
        tseDate: getLastDayOfMonth(x),
        currentPage: 1,
      };
    }
    case 'SET_NEXT_MONTH': {
      const d = state.tssDate || new Date();
      const x = plusMonths(d, 1);
      return {
        ...state,
        tssDate: getFirstDayOfMonth(x),
        tseDate: getLastDayOfMonth(x),
        currentPage: 1,
      };
    }
    case 'SET_SELECTED_CATEGORY_ID': {
      return { ...state, selectedCategoryId: action.payload };
    }
    case 'SET_SELECTED_SOURCE_ID': {
      return { ...state, selectedSourceId: action.payload };
    }
    case 'SET_SELECTED_DESTINATION_ID': {
      return { ...state, selectedDestinationId: action.payload };
    }
    case 'TOGGLE_LOAN_IDS': {
      let { loanIds } = state;
      for (const id of action.payload) {
        if (loanIds.includes(id)) {
          loanIds = loanIds.filter(_id => _id !== id);
        } else {
          loanIds = [...loanIds, id];
        }
      }
      return { ...state, loanIds, currentPage: 1 };
    }
    case 'REMOVE_LOAN_IDS': {
      return {
        ...state,
        loanIds: state.loanIds.filter(id => !action.payload.includes(id)),
        currentPage: 1,
      };
    }
    case 'TOGGLE_BALANCE_TO_DISPLAY': {
      const newShowOverallBalance = !state.showOverallBalance;
      if (newShowOverallBalance) {
        return {
          ...state,
          showOverallBalance: newShowOverallBalance,
          partitionIds: [],
          budgetProfileId: undefined,
          currentPage: 1,
        };
      } else {
        return { ...state, showOverallBalance: newShowOverallBalance };
      }
    }
    case 'SET_CURRENT_PAGE': {
      return { ...state, currentPage: action.payload };
    }
    case 'CLEAR_ACCOUNT_SELECTION': {
      return {
        ...state,
        partitionIds: [],
        budgetProfileId: undefined,
        currentPage: 1,
      };
    }
    case 'CLEAR_CATEGORY_SELECTION': {
      return { ...state, categoryIds: [], currentPage: 1 };
    }
    case 'CLEAR_LOAN_SELECTION': {
      return { ...state, loanIds: [], currentPage: 1 };
    }
    case 'SET_ACTIVE_BUDGET_PROFILE_ID': {
      return { ...state, budgetProfileId: action.payload };
    }
    case 'TOGGLE_BUDGET_PROFILE': {
      const [budgetProfileId, partitionIds] = action.payload;
      if (state.budgetProfileId === budgetProfileId) {
        return {
          ...state,
          budgetProfileId: undefined,
          partitionIds: [],
          currentPage: 1,
        };
      } else {
        return {
          ...state,
          budgetProfileId,
          partitionIds,
          currentPage: 1,
        };
      }
    }
    default: {
      return state;
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
