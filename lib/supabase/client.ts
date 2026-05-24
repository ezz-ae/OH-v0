import { createBrowserClient } from '@supabase/ssr'
import { getMockTableData } from '@/lib/operations-intelligence'

let client: ReturnType<typeof createBrowserClient> | null = null;

type MockRow = Record<string, any>;
type MockFilter = { field: string; value: unknown };

function createMockQuery(table: string, seed: MockRow[] = getMockTableData(table)) {
  const filters: MockFilter[] = [];
  let orderBy: { field: string; ascending: boolean } | null = null;
  let rowLimit: number | null = null;
  let singleResult = false;
  let mutationData: unknown;

  function currentData() {
    let rows = [...seed];

    for (const filter of filters) {
      rows = rows.filter((row) => row?.[filter.field] === filter.value);
    }

    if (orderBy) {
      rows.sort((a, b) => {
        const aValue = a?.[orderBy!.field];
        const bValue = b?.[orderBy!.field];
        if (aValue === bValue) return 0;
        const result = aValue > bValue ? 1 : -1;
        return orderBy!.ascending ? result : -result;
      });
    }

    if (rowLimit !== null) {
      rows = rows.slice(0, rowLimit);
    }

    if (mutationData !== undefined) {
      const inserted = Array.isArray(mutationData) ? mutationData : [mutationData];
      rows = inserted.map((row, index) => ({
        id: (row as MockRow).id || `mock_${table}_${Date.now()}_${index}`,
        ...(row as MockRow),
      }));
    }

    return singleResult ? rows[0] || null : rows;
  }

  function result() {
    const data = currentData();
    return {
      data,
      error: null,
      count: Array.isArray(data) ? data.length : data ? 1 : 0,
      status: 200,
      statusText: 'OK',
    };
  }

  const query = {
    get data() {
      return result().data;
    },
    error: null,
    get count() {
      return result().count;
    },
    status: 200,
    statusText: 'OK',
    select: () => query,
    insert: (value: unknown) => {
      mutationData = value;
      return query;
    },
    update: (value: unknown) => {
      mutationData = value;
      return query;
    },
    delete: () => query,
    upsert: (value: unknown) => {
      mutationData = value;
      return query;
    },
    eq: (field: string, value: unknown) => {
      filters.push({ field, value });
      return query;
    },
    neq: () => query,
    gt: () => query,
    gte: () => query,
    lt: () => query,
    lte: () => query,
    is: () => query,
    in: () => query,
    contains: () => query,
    order: (field: string, options?: { ascending?: boolean }) => {
      orderBy = { field, ascending: options?.ascending ?? true };
      return query;
    },
    limit: (count: number) => {
      rowLimit = count;
      return query;
    },
    single: () => {
      singleResult = true;
      return query;
    },
    maybeSingle: () => {
      singleResult = true;
      return query;
    },
    then: (
      resolve: (value: ReturnType<typeof result>) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise.resolve(result()).then(resolve, reject),
  };

  return query;
}

function createMockClient(): ReturnType<typeof createBrowserClient> {
  return {
    from: (table: string) => createMockQuery(table),
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
