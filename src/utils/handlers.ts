import { Handler } from "@/utils/types";

export { createUntypedLocalHandler, createLocalHandler, createRemoteHandler };

function createUntypedLocalHandler(setting: {
  procedures: Record<string, (...args: any) => any>;
}) {
  return (name: string, ...args: any[]) => {
    const [input] = args;
    const procedure = setting.procedures[name];
    // TODO: Any use of this context?
    // > Maybe some config-related or global variables linked to current user?
    const ctx = {};
    return procedure(input, ctx);
  };
}

function createLocalHandler<
  T extends Record<string, (...args: any) => any>
>(setting: { procedures: T }): Handler<T> {
  return createUntypedLocalHandler(setting) as Handler<T>;
}

function makeQuery(url: string, name: string, arg: any) {
  return `${url}/${name}?${new URLSearchParams(arg).toString()}`;
}

function createRemoteHandler<
  T extends Record<string, (...args: any) => any>
>(setting: { url: string }): Handler<T> {
  return _createRemoteHandler(setting) as Handler<T>;
}

function _createRemoteHandler(setting: { url: string }): any {
  return async (name: string, ...args: any[]) => {
    // TODO: Handle different types of procedure results such as undefined.
    const [input] = args;
    const query = makeQuery(setting.url, name, input);
    const resp = await fetch(query);
    const json = await resp.json();
    return json;
  };
}
