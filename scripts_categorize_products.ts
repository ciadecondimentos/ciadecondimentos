import { sql } from './src/lib/db.server';

const CATEGORIES = ["Temperos", "Pimentas", "Ervas", "Molhos", "Especiarias"];

async function updateCategories() {
  try {
    const products = await sql`SELECT id, name, category FROM products`;
    console.log(`Checking ${products.length} products...`);

    for (const product of products) {
      let newCategory = "";
      const name = product.name.toLowerCase();

      // Simple heuristic for categorization
      if (name.includes("pimenta") || name.includes("paprica") || name.includes("chili")) {
        newCategory = "Pimentas";
      } else if (name.includes("ervas") || name.includes("oregano") || name.includes("louro") || name.includes("manjericao") || name.includes("alecrim") || name.includes("salsa") || name.includes("coentro") || name.includes("tomilho") || name.includes("hortela") || name.includes("boldo") || name.includes("camomila") || name.includes("hibisco") || name.includes("cha")) {
        newCategory = "Ervas";
      } else if (name.includes("molho") || name.includes("shoyu") || name.includes("ketchup") || name.includes("mostarda")) {
        newCategory = "Molhos";
      } else if (name.includes("cravo") || name.includes("canela") || name.includes("noz moscada") || name.includes("cominho") || name.includes("cardamomo") || name.includes("anis") || name.includes("curcuma") || name.includes("acafrao") || name.includes("gengibre")) {
        newCategory = "Especiarias";
      } else {
        newCategory = "Temperos"; // Default/Catch-all for mistos
      }

      if (product.category !== newCategory) {
        console.log(`Updating "${product.name}": ${product.category} -> ${newCategory}`);
        await sql`UPDATE products SET category = ${newCategory} WHERE id = ${product.id}`;
      }
    }
    console.log("Categorization complete.");
  } catch (error) {
    console.error("Error updating categories:", error);
  } finally {
    process.exit(0);
  }
}

updateCategories();
