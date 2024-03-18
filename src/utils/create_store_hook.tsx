import { useReducer, createContext, ReactNode, useContext } from 'react';

export function createStore<Store, Action>(
  init: Store,
  reducer: (state: Store, action: Action) => Store,
) {
  const StoreContext = createContext<[Store, (action: Action) => void]>([
    init,
    () => null,
  ]);
  const StoreProvider = (props: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(reducer, init);
    return (
      <StoreContext.Provider value={[state, dispatch]}>
        {props.children}
      </StoreContext.Provider>
    );
  };
  const useStore = () => {
    return useContext(StoreContext);
  };
  return [StoreProvider, useStore] as const;
}
