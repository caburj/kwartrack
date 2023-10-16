import { useEffect, useMemo, useRef } from "react";
import { debounce } from "./common";

export const useDebounce = <X extends (...args: any[]) => any>(
  callback: X,
  ms: number
) => {
  const ref = useRef<X>();

  useEffect(() => {
    ref.current = callback;
  }, [callback]);

  const debouncedCallback = useMemo(() => {
    const func = (...args: Parameters<X>) => {
      ref.current?.(...args);
    };

    return debounce(func, ms);
  }, [ms]);

  return debouncedCallback;
};
