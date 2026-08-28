import { sql } from './src/lib/db.server';

async function main() {
  try {
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('Tabelas no banco:', tables.map(t => t.table_name));

    const columns = await sql`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name IN ('customers', 'clientes')
    `;
    console.log('Colunas de clientes:', columns);

    const customers = await sql`
      SELECT * FROM customers LIMIT 5;
    `;
    console.log('Amostra de clientes:', customers);
    
    process.exit(0);
  } catch (err) {
    console.error('Erro ao verificar clientes:', err);
    process.exit(1);
  }
}

main();
