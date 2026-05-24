import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null;

function createMockQuery(data: unknown = []) {
  const result = {
    data,
    error: null,
    count: null,
    status: 200,
    statusText: 'OK',
  };

  const query = {
    ...result,
    select: () => query,
    insert: () => createMockQuery(null),
    update: () => query,
    delete: () => query,
    upsert: () => query,
    eq: () => query,
    neq: () => query,
    gt: () => query,
    gte: () => query,
    lt: () => query,
    lte: () => query,
    is: () => query,
    in: () => query,
    contains: () => query,
    order: () => query,
    limit: () => query,
    single: () => createMockQuery(null),
    maybeSingle: () => createMockQuery(null),
    then: (
      resolve: (value: typeof result) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise.resolve(result).then(resolve, reject),
  };

  return query;
}

function createMockClient(): ReturnType<typeof createBrowserClient> {
  return {
    from: () => createMockQuery(),
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
    },
  } as unknown as ReturnType<typeof createBrowserClient>;
}

export function createClient() {
  if (client) return client;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return createMockClient();
  }
  
  client = createBrowserClient(supabaseUrl, supabaseKey);
  return client;
}
