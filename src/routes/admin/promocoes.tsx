import { createFileRoute } from "@tanstack/react-router";
import { 
  RotateCw, 
  Tag, 
  Plus,
  Boxes,
} from "lucide-react";
import logoAsset from "@/assets/logo-transparent.png.asset.json";
import { Sidebar } from "@/components/Sidebar";

export const Route = createFileRoute("/admin/promocoes")({
  head: () => ({
    meta: [
      { title: "Promoções & Kits - Cia. Condimentos e Especiarias" },
      { name: "description", content: "Gestão de promoções e kits da Cia. Condimentos e Especiarias." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PromocoesPage,
});


function Navbar({ title }: { title: string }) {
  return (
    <nav className="sticky top-0 z-20 bg-card border-b border-border px-6 py-4">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4 lg:hidden">
          <div className="w-10 h-10 overflow-hidden flex items-center justify-center">
            <img src={logoAsset.url} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-xl font-bold tracking-tight">{title}</span>
        </div>
        
        <div className="hidden lg:block">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest font-serif italic">{title}</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-success/10 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-success text-[10px] font-bold uppercase tracking-widest">Sistema Online</span>
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground hover:brightness-110 transition-all text-[10px] font-bold uppercase tracking-widest shadow-sm">
            <RotateCw className="w-3.5 h-3.5" />
            <span>Atualizar</span>
          </button>

          <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shadow-lg shadow-primary/20">
            A
          </div>
        </div>
      </div>
    </nav>
  );
}

function PromocoesPage() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar currentPath="/admin/promocoes" />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Promoções" />

        <main className="max-w-[1400px] w-full mx-auto p-3 sm:p-6 md:p-10 space-y-6 md:space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-[#4d3227]/10 rounded-lg">
                <Tag className="w-6 h-6 text-[#4d3227]" />
             </div>
             <h1 className="text-2xl font-bold font-serif italic text-[#4d3227]">Promoções</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border text-xs font-bold text-muted-foreground shadow-sm hover:bg-muted transition-all">
            <Tag className="w-3.5 h-3.5" />
            Promoções de Produto
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border text-xs font-bold text-muted-foreground shadow-sm hover:bg-muted transition-all">
            <Boxes className="w-3.5 h-3.5" />
            Kits
          </button>
        </div>

        {/* Product Promotions Section */}
        <div className="space-y-4">
          <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:brightness-110 transition-all text-[10px] font-black uppercase tracking-widest shadow-md shadow-primary/20">
            <Plus className="w-4 h-4" />
            <span>Nova Promoção</span>
          </button>

          <div className="bg-card border border-border rounded-[24px] overflow-hidden shadow-sm">
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#4d3227] text-[#e8b57d] text-[10px] font-black uppercase tracking-[0.2em] text-left">
                    <th className="px-8 py-4">Produto</th>
                    <th className="px-8 py-4">Desconto</th>
                    <th className="px-8 py-4 text-center">Preços</th>
                    <th className="px-8 py-4 text-center">Duração</th>
                    <th className="px-8 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <td colSpan={5} className="px-8 py-12 text-center text-muted-foreground text-sm font-bold italic">
                      Nenhuma promoção em produtos
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Kits Section */}
        <div className="space-y-4 mt-8">
          <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:brightness-110 transition-all text-[10px] font-black uppercase tracking-widest shadow-md shadow-primary/20">
            <Plus className="w-4 h-4" />
            <span>Novo Kit</span>
          </button>

          <div className="bg-card border border-border rounded-[24px] overflow-hidden shadow-sm">
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#4d3227] text-[#e8b57d] text-[10px] font-black uppercase tracking-[0.2em] text-left">
                    <th className="px-8 py-4">Kit</th>
                    <th className="px-8 py-4">Produtos</th>
                    <th className="px-8 py-4 text-center">Preço</th>
                    <th className="px-8 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <td colSpan={4} className="px-8 py-12 text-center text-muted-foreground text-sm font-bold italic">
                      Nenhum kit cadastrado
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}
