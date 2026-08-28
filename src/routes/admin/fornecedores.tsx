import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Factory,
  ShoppingCart,
  HeartCrack,
  AlertTriangle,
  Download,
  Plus,
  RotateCw,
  Search,
  Eye,
  Pencil,
  Trash2,
  LayoutDashboard,
  Package,
  Users,
  BarChart3,
  Settings,
  ChevronRight,
  Menu,
  Truck,
  CheckCircle2,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";

export const Route = createFileRoute("/admin/fornecedores")({
  head: () => ({
    meta: [
      { title: "Central de Fornecedores - Cia. Condimentos e Especiarias" },
      { name: "description", content: "Gerencie fornecedores, compras e valores em aberto da Cia. Condimentos e Especiarias." },
      { property: "og:title", content: "Central de Fornecedores - Cia. Condimentos e Especiarias" },
      { property: "og:description", content: "Gerencie fornecedores, compras e valores em aberto da Cia. Condimentos e Especiarias." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: FornecedoresPage,
});


function StatCard({ icon: Icon, value, label, iconClass, borderClass }: { icon: any; value: string; label: string; iconClass: string; borderClass: string }) {
  return (
    <div className={cn("bg-card p-8 rounded-[24px] border border-border border-t-4 shadow-sm flex flex-col items-center text-center gap-4", borderClass)}>
      <div className={cn("p-4 rounded-2xl", iconClass)}>
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-3xl font-bold font-serif italic text-foreground tracking-tight">{value}</h3>
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{label}</p>
    </div>
  );
}

function FornecedoresPage() {
  const suppliers = [
    { company: "Empório do tempero", city: "Pernambuco", contact: "Júnior", phone: "N/A", status: "Em dia", total: "R$ 0,00", open: "R$ 0,00" },
    { company: "Junior. Imporio do tempero", city: "Recife", contact: "N/A", phone: "81 9655-0480", status: "Em dia", total: "R$ 0,00", open: "R$ 0,00" },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar currentPath="/admin/fornecedores" />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Fornecedores" />

        <main className="max-w-[1400px] w-full mx-auto p-3 sm:p-6 md:p-10 space-y-6 md:space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#4d3227]/10 rounded-lg">
              <Factory className="w-6 h-6 text-[#4d3227]" />
            </div>
            <h1 className="text-2xl font-bold font-serif italic text-[#4d3227]">Central de Fornecedores</h1>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-secondary-foreground hover:brightness-110 transition-all text-[10px] font-black uppercase tracking-widest shadow-md shadow-secondary/10">
              <Download className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>
            <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:brightness-110 transition-all text-[10px] font-black uppercase tracking-widest shadow-md shadow-primary/20">
              <Plus className="w-4 h-4" />
              <span>Novo Fornecedor</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard icon={Factory} value="2" label="Total de Fornecedores" iconClass="bg-secondary/20 text-secondary" borderClass="border-t-secondary" />
          <StatCard icon={ShoppingCart} value="R$ 0,00" label="Total Comprado" iconClass="bg-success/10 text-success" borderClass="border-t-success" />
          <StatCard icon={HeartCrack} value="R$ 0,00" label="Em Aberto" iconClass="bg-primary/10 text-primary" borderClass="border-t-primary" />
          <StatCard icon={AlertTriangle} value="0" label="Fornecedores em Débito" iconClass="bg-secondary/20 text-secondary" borderClass="border-t-primary" />
        </div>

        <div className="bg-card border border-border rounded-[24px] p-4 flex flex-col xl:flex-row gap-4 items-center shadow-sm">
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <span className="w-full sm:w-auto text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">Filtrar por período</span>
            <input type="date" className="flex-1 min-w-0 px-4 py-3 bg-background border border-border rounded-xl outline-none focus:border-primary transition-all text-sm font-bold" />
            <span className="text-xs font-bold text-muted-foreground">até</span>
            <input type="date" className="flex-1 min-w-0 px-4 py-3 bg-background border border-border rounded-xl outline-none focus:border-primary transition-all text-sm font-bold" />
          </div>

          <div className="flex flex-col md:flex-row gap-4 flex-1 w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-primary absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar empresa, contato, cidade..."
                className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl outline-none focus:border-primary transition-all text-sm font-medium"
              />
            </div>
            <select className="px-4 py-3 bg-background border border-border rounded-xl outline-none focus:border-primary text-sm font-bold appearance-none">
              <option>Todos Fornecedores</option>
              <option>Em dia</option>
              <option>Em débito</option>
            </select>
          </div>
        </div>

        <div className="bg-card border border-border rounded-[24px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#4d3227] text-[#e8b57d]">
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Empresa</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Contato</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Telefone</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Situação</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em]">Total Comprado</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em]">Em Aberto</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {suppliers.map((s, idx) => (
                  <tr key={idx} className="hover:bg-muted/30 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground">{s.company}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{s.city}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-medium text-muted-foreground">{s.contact}</td>
                    <td className="px-8 py-5 text-sm font-medium text-muted-foreground">{s.phone}</td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-success">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {s.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right text-sm font-bold text-foreground">{s.total}</td>
                    <td className="px-8 py-5 text-right text-sm font-bold text-primary">{s.open}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <button aria-label="Visualizar" className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground transition-all">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button aria-label="Editar" className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground transition-all">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button aria-label="Excluir" className="p-2 rounded-lg bg-primary text-primary-foreground hover:brightness-110 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="max-w-[1400px] mx-auto p-10 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mt-10">
        <div className="flex items-center gap-8">
          <a href="#" className="hover:text-primary transition-colors">Suporte Técnico</a>
          <a href="#" className="hover:text-primary transition-colors">Termos de Uso</a>
          <a href="#" className="hover:text-primary transition-colors">Políticas</a>
        </div>
        <div className="text-center md:text-right">
          © 2026 Cia. de Condimentos e Especiarias • Plataforma de Gestão E-commerce
        </div>
      </footer>
      </div>
    </div>
  );
}
