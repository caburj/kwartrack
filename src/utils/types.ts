export type { MaybeArgs, Handler };

type MaybeArgs<P extends any[]> = P[0] extends undefined ? [] : [input: P[0]];

type Handler<T extends Record<string, (...args: any) => any>> = <
  K extends Parameters<_Handler<T>>[0]
>(
  name: K,
  ...args: Parameters<ReturnType<_Handler<T, K>>>
) => ReturnType<ReturnType<_Handler<T, K>>>;

type _Handler<
  T extends Record<string, (...args: any) => any>,
  K extends keyof T = keyof T
> = (name: K) => (...args: MaybeArgs<Parameters<T[K]>>) => ReturnType<T[K]>;
