import postgres from 'postgres';

const DEFAULT_URL = 'postgresql://ciadecondimentos_db_0ebp_user:wQQ4IqGO7eKNOXQ50jG6PQpAitiS5iEm@dpg-d802cpfaqgkc739nr4u0-a.oregon-postgres.render.com:5432/ciadecondimentos_db_0ebp';

const sql = postgres(DEFAULT_URL, {
  ssl: 'require',
  connect_timeout: 15,
});

async function run() {
  try {
    const products = await sql`SELECT id, name, image FROM products LIMIT 100`;
    console.log('Sample Products:', JSON.stringify(products, null, 2));
    
    const countNull = await sql`SELECT count(*) FROM products WHERE image IS NULL`;
    const countEmpty = await sql`SELECT count(*) FROM products WHERE image = ''`;
    const countWithUrl = await sql`SELECT count(*) FROM products WHERE image IS NOT NULL AND image != ''`;
    
    console.log('Stats:');
    console.log('- NULL image:', countNull[0].count);
    console.log('- Empty string image:', countEmpty[0].count);
    console.log('- With URL image:', countWithUrl[0].count);
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}

run();
