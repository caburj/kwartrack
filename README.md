# Change in thinking

- Simple as possible
- edgedb
- nextjs
- authentication, simple as possible
- no centralized server, user deploys his own

# RPC API Proposal

```ts
// declaration of server procedures
const procedures = {
  getUser: (id) => {
    return { id, name: 'John' }
  },
  assertUser: (id) => {
    // you want to use getUser here
    procedures.getUser(id)
  }
}

// consume the procedure from the client
const client = createClient<typeof procedures>();
const user = await client.getUser(1);
const assertedUser = await client.assertUser(1);

// at client.callMethod
// create the request
// fetch('/api/rpc', { method: 'POST', body: JSON.stringify({ method: 'getUser', args: [1] }) })

// route handler of the rpc request
// file: api/rpc/route.ts
// import { procedures } from './procedures.ts'
// export default async (req, res) => {
//   const { method, args } = req.body;
//   const result = await procedures[method](...args);
```