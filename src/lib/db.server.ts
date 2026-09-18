import postgres from 'postgres';

const DEFAULT_URL =
  'postgresql://ciadecondimentos_db_0ebp_user:wQQ4IqGO7eKNOXQ50jG6PQpAitiS5iEm@dpg-d802cpfaqgkc739nr4u0-a.oregon-postgres.render.com/ciadecondimentos_db_0ebp';

function normalize(raw: string): string {
  try {
    const url = new URL(raw);
    // Render Postgres only listens on 5432; pooler port 6543 is not available.
    if (!url.port || url.port === '6543') url.port = '5432';
    return url.toString();
  } catch {
    return raw;
  }
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const queryCache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutos para considerar "fresco"
const STALE_TTL = 1000 * 60 * 30; // 30 minutos para servir "stale"

function createClient() {
  const connectionString = normalize(process.env['DATABASE_URL'] || DEFAULT_URL);
  return postgres(connectionString, {
    ssl: 'require',
    max: 1,
    idle_timeout: 5,
    connect_timeout: 30,
    prepare: false,
    fetch_types: false,
  });
}

const MUTATION_PATTERN = /\b(insert|update|delete|create|alter|drop|truncate)\b/i;

export async function sql<T = any>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T> {
  const isMutation = MUTATION_PATTERN.test(strings.join(' '));
  const queryKey = JSON.stringify({ strings, values });
  const cached = isMutation ? undefined : queryCache.get(queryKey);
  const now = Date.now();

  // Cache fresco: retorno imediato (somente leituras)
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }

  // Conexão criada e encerrada dentro da mesma requisição
  // (Cloudflare Workers não permite reutilizar sockets entre requisições).
  const client = createClient();
  try {
    const freshData = await (client(strings, ...(values as never[])) as unknown as Promise<T>);
    if (isMutation) {
      // Escritas nunca são cacheadas e invalidam todas as leituras
      queryCache.clear();
    } else {
      queryCache.set(queryKey, { data: freshData, timestamp: now });
    }
    return freshData;
  } catch (err) {
    console.error('SQL Query Error:', err);
    // Se houver dado antigo utilizável, evita quebrar a tela
    if (cached && now - cached.timestamp < STALE_TTL) {
      return cached.data as T;
    }
    throw err;
  } finally {
    try {
      await client.end({ timeout: 5 });
    } catch {
      /* ignora falha ao encerrar */
    }
  }
}
