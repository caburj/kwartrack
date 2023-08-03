import { untypedLocalCall } from "@/app/api/local_handler";
import { parse, string } from "valibot";

export async function GET(
  req: Request,
  { params }: { params: { name: string } }
) {
  const procedureName = params.name;
  const { searchParams } = new URL(req.url);
  const queryName = parse(string(), procedureName);
  const result = await untypedLocalCall(
    queryName,
    Object.fromEntries(searchParams)
  );
  return new Response(JSON.stringify(result));
}
