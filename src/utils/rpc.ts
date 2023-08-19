import { NextResponse } from "next/server";

/**
 * Only expected to be used in the server.
 * This returns the handlers for the RPC endpoint.
 */
export function createRPCHandler(
  procedures: Record<string, (arg: any) => any>
) {
  const GET = async (
    req: Request,
    { params }: { params: { name: string } }
  ) => {
    const procedureName = params.name;
    const { searchParams } = new URL(req.url);
    const procedure = procedures[procedureName];
    if (!procedure) {
      throw new Error(`Procedure ${procedureName} not found`);
    }
    const result = await procedure(Object.fromEntries(searchParams));
    return NextResponse.json(result);
  };

  const POST = async (
    req: Request,
    { params }: { params: { name: string } }
  ) => {
    const procedureName = params.name;
    const procedure = procedures[procedureName];
    if (!procedure) {
      throw new Error(`Procedure ${procedureName} not found`);
    }
    const input = await req.json();
    const result = await procedure(input);
    if (result === undefined) {
      return NextResponse.json(null);
    }
    return NextResponse.json(result);
  };

  return { GET, POST };
}

/**
 * Only expected to be used in the browser.
 */
export function createRPCClient<T extends any>(): { get: T; post: T } {
  const get = new Proxy(
    {},
    {
      get(_target: any, name: string) {
        return async (params: any) => {
          const url = new URL(`/api/rpc/${name}`, window.location.href);
          url.search = new URLSearchParams(params).toString();
          const response = await fetch(url.toString());
          return response.json();
        };
      },
    }
  );

  const post = new Proxy(
    {},
    {
      get(_target: any, name: string) {
        return async (params: any) => {
          const url = new URL(`/api/rpc/${name}`, window.location.href);
          const response = await fetch(url.toString(), {
            method: "POST",
            body: JSON.stringify(params),
          });
          return response.json();
        };
      },
    }
  );

  return { get, post };
}
