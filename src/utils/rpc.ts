import { NextResponse } from 'next/server';

/**
 * Only expected to be used in the server.
 * This returns the handlers for the RPC endpoint.
 */
export function createRPCHandler(
  procedures: Record<string, (arg: any) => any>,
) {
  const GET = async (
    req: Request,
    { params }: { params: { name: string } },
  ) => {
    const procedureName = params.name;
    const { searchParams } = new URL(req.url);
    const procedure = procedures[procedureName];
    if (!procedure) {
      throw new Error(`Procedure ${procedureName} not found`);
    }
    return makeResponse(() => procedure(Object.fromEntries(searchParams)));
  };

  const POST = async (
    req: Request,
    { params }: { params: { name: string } },
  ) => {
    const procedureName = params.name;
    const procedure = procedures[procedureName];
    if (!procedure) {
      throw new Error(`Procedure ${procedureName} not found`);
    }
    const input = await req.json();
    return makeResponse(() => procedure(input));
  };

  return { GET, POST };
}

/**
 * Only expected to be used in the browser.
 */
export function createRPCClient<T>(): { get: T; post: T } {
  const get = new Proxy(
    {},
    {
      get(_target: any, name: string) {
        return async (params: any) => {
          const url = new URL(`/api/rpc/${name}`, window.location.href);
          url.search = new URLSearchParams(params).toString();
          const response = await fetch(url.toString());
          return processResponse(response);
        };
      },
    },
  );

  const post = new Proxy(
    {},
    {
      get(_target: any, name: string) {
        return async (params: any) => {
          const url = new URL(`/api/rpc/${name}`, window.location.href);
          const response = await fetch(url.toString(), {
            method: 'POST',
            body: JSON.stringify(params),
          });
          return processResponse(response);
        };
      },
    },
  );

  return { get, post };
}

async function makeResponse(getResult: () => any) {
  try {
    const result = (await getResult()) ?? null;
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}

async function processResponse(response: Response) {
  if (!response.ok) {
    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    } else {
      throw new Error(response.statusText);
    }
  }
  return response.json();
}
