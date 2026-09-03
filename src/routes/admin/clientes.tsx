import { createFileRoute } from "@tanstack/react-router";
import { 
  Users, 
  Star, 
  Coins, 
  HeartCrack,
  Search, 
  RotateCw, 
  Download, 
  Plus,
  Filter,
  Eye,
  Edit,
  Trash2,
  X,
  Check
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { cn } from "@/lib/utils";
import { getCustomers, getCustomerStats, getCustomerPurchases, getSalesByPeriod, type Customer, type CustomerPurchase, createCustomer } from "@/lib/customers.functions";
import { getProducts, type Product } from "@/lib/products.functions";
import { registerPurchase, updatePurchaseGroup } from "@/lib/purchases.functions";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { RegisterPurchaseModal } from "@/components/RegisterPurchaseModal";
import { CustomerModal } from "@/components/CustomerModal";
import { toast } from "sonner";



export const Route = createFileRoute("/admin/clientes")({
  head: () => ({
    meta: [
      { title: "Central de Clientes - Cia. Condimentos e Especiarias" },
      { name: "description", content: "Gerenciamento de clientes da Cia. Condimentos e Especiarias." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["customers"],
      queryFn: () => getCustomers(),
    });
    await context.queryClient.ensureQueryData({
      queryKey: ["customerStats"],
      queryFn: () => getCustomerStats(),
    });
    await context.queryClient.ensureQueryData({
      queryKey: ["salesByPeriod", "Semana"],
      queryFn: () => getSalesByPeriod({ data: "Semana" }),
    });
  },
  component: ClientesPage,
});


function StatCard({ icon: Icon, value, label, subtext, color }: { icon: any, value: string, label: string, subtext?: string, color: string }) {
  return (
    <div className="bg-card p-6 rounded-[24px] border border-border shadow-sm flex flex-col items-center text-center space-y-2">
      <div className={cn("p-4 rounded-2xl mb-2", color)}>
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-3xl font-bold font-serif italic text-foreground">{value}</h3>
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
      {subtext && <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">{subtext}</p>}
    </div>
  );
}

function buildWhatsAppLink(customer: Customer, date: string, items: CustomerPurchase[]) {
  const rawPhone = (customer.whatsapp || customer.phone || "").replace(/\D/g, "");
  if (!rawPhone) return null;
  const phone = rawPhone.length <= 11 ? `55${rawPhone}` : rawPhone;

  const formatBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const total = items.reduce((acc, item) => acc + Number(item.total_price), 0);

  const lines = [
    `*Pedido - Cia. de Condimentos e Especiarias*`,
    ``,
    `Cliente: ${customer.full_name}`,
    `Data: ${date}`,
    ``,
    `*Itens:*`,
    ...items.map(item =>
      `• ${item.product_name} — ${item.quantity}x ${formatBRL(Number(item.unit_price))} = ${formatBRL(Number(item.total_price))}`
    ),
    ``,
    `*Total: ${formatBRL(total)}*`,
    `Pagamento: ${(items[0]?.payment_method || "dinheiro").toUpperCase()} (${items.every(i => i.payment_status === 'pago') ? 'Pago' : 'Pendente'})`,
    ``,
    `Obrigado pela preferência!`
  ];

  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`;
}

function PurchaseHistoryModal({ customer, onClose, onRegisterClick, onEditGroup }: { customer: Customer, onClose: () => void, onRegisterClick: () => void, onEditGroup: (group: { date: string, items: CustomerPurchase[] }) => void }) {
  const fetchPurchases = useServerFn(getCustomerPurchases);
  const { data: purchases, isLoading } = useQuery({
    queryKey: ["customer-purchases", customer.id],
    queryFn: () => fetchPurchases({ data: customer.id }),
  });

  const totalComprado = purchases?.reduce((acc, p) => acc + Number(p.total_price), 0) || 0;
  const numeroCompras = purchases?.length || 0;
  const totalPago = purchases?.filter(p => p.payment_status === 'pago').reduce((acc, p) => acc + Number(p.total_price), 0) || 0;
  const emAberto = totalComprado - totalPago;
  const ticketMedio = numeroCompras > 0 ? totalComprado / numeroCompras : 0;

  const groupedPurchases = useMemo(() => {
    if (!purchases) return [];
    const groups: Record<string, CustomerPurchase[]> = {};
    purchases.forEach(p => {
      const date = new Date(p.purchase_date).toLocaleDateString('pt-BR');
      if (!groups[date]) groups[date] = [];
      groups[date].push(p);
    });
    return Object.entries(groups).sort((a, b) => {
      // Sort by date descending
      const dateA = a[1][0]?.purchase_date;
      const dateB = b[1][0]?.purchase_date;
      if (!dateA || !dateB) return 0;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

  }, [purchases]);


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card w-full max-w-4xl max-h-[90vh] rounded-[32px] border border-border shadow-2xl overflow-hidden flex flex-col">
        {/* Header - Red Background */}
        <div className="p-4 bg-[#c23321] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-lg">📊</span>
            </div>
            <h2 className="text-xl font-bold font-serif">{customer.full_name}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Stat Cards Row 1 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#f2e8d5] p-5 rounded-2xl border-l-4 border-[#c23321]">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">TOTAL COMPRADO</p>
              <p className="text-2xl font-bold text-[#4d3227]">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalComprado)}
              </p>
            </div>
            <div className="bg-[#f2e8d5] p-5 rounded-2xl border-l-4 border-[#f1c40f]">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">NÚMERO DE COMPRAS</p>
              <p className="text-2xl font-bold text-[#4d3227]">{numeroCompras}</p>
            </div>
          </div>

          {/* Main Stat Cards Row 2 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#e8f5e9] p-5 rounded-2xl border-l-4 border-success">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">PAGO</p>
              <p className="text-2xl font-bold text-success">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPago)}
              </p>
            </div>
            <div className="bg-[#fff9e6] p-5 rounded-2xl border-l-4 border-[#f1c40f]">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">EM ABERTO</p>
              <p className="text-2xl font-bold text-[#f1c40f]">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(emAberto)}
              </p>
            </div>
          </div>


          {/* Secondary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-muted/30 p-4 rounded-xl text-center">
              <p className="text-lg font-bold text-[#4d3227]">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ticketMedio)}
              </p>
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">TICKET MÉDIO</p>
            </div>
            <div className="bg-muted/30 p-4 rounded-xl text-center opacity-60">
              <p className="text-lg font-bold text-[#4d3227]">R$ 0,00</p>
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">ESTE MÊS</p>
            </div>
            <div className="bg-muted/30 p-4 rounded-xl text-center">
              <p className="text-lg font-bold text-[#4d3227]">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalComprado)}
              </p>
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">ESTE ANO</p>
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-[#f2e8d5]/50 p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 text-[#4d3227]">
              <span className="text-lg">📋</span>
              <h3 className="font-bold text-sm font-serif italic">Informações do Cliente</h3>
            </div>
            <div className="space-y-2 text-xs">
              <p className="text-muted-foreground">
                <span className="font-bold text-[#4d3227]">Endereço:</span> {customer.address || "Não informado"}
                {customer.neighborhood ? `, ${customer.neighborhood}` : ""}
                {customer.city ? ` - ${customer.city}` : ""}
              </p>
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#4d3227]">WhatsApp:</span>
                {customer.whatsapp || customer.phone ? (
                  <button className="flex items-center gap-2 px-3 py-1 bg-[#f1c40f] text-[#4d3227] rounded-lg text-[10px] font-black uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    CONVERSAR
                  </button>
                ) : (
                  <span className="text-muted-foreground">Não informado</span>
                )}
              </div>
              <p className="text-muted-foreground">
                <span className="font-bold text-[#4d3227]">Telefone:</span> {customer.phone || customer.whatsapp || "Não informado"}
              </p>
            </div>
          </div>

          {/* History Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2 text-[#4d3227]">
                <span className="text-lg">📦</span>
                <h3 className="font-bold text-sm font-serif italic">Histórico de Compras</h3>
              </div>
              <button 
                onClick={onRegisterClick}
                className="flex items-center gap-2 px-4 py-2 bg-[#c23321] text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg">
                <Plus className="w-3 h-3" />
                REGISTRAR COMPRA
              </button>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <RotateCw className="w-6 h-6 animate-spin text-primary" />
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Carregando...</p>
              </div>
            ) : groupedPurchases.length === 0 ? (
              <p className="text-center py-10 text-xs font-bold text-muted-foreground">Nenhuma compra registrada.</p>
            ) : (
              <div className="space-y-8">
                {groupedPurchases.map(([date, items]) => {
                  const dayTotal = items.reduce((acc, item) => acc + Number(item.total_price), 0);
                  const isPaid = items.every(item => item.payment_status === 'pago');
                  const totalItems = items.length;
                  const totalUnits = items.reduce((acc, item) => acc + Number(item.quantity), 0);

                  return (
                    <div key={date} className="border border-border/50 rounded-2xl overflow-hidden bg-white shadow-sm">
                      <div className="p-4 bg-muted/5 flex items-center justify-between border-b border-border/30">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">🗓️</span>
                            <span className="text-xs font-bold text-[#4d3227]">{date}</span>
                          </div>
                          <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-tight">
                            {totalItems} produtos • {totalUnits} unidades
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#c23321]">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dayTotal)}
                          </p>
                          <p className={cn(
                            "text-[8px] font-black uppercase tracking-wider",
                            isPaid ? "text-success" : "text-[#f1c40f]"
                          )}>
                            {isPaid ? '✓ PAGO' : 'PENDENTE'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-4 space-y-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => onEditGroup({ date: items[0]?.purchase_date || "", items })}
                            className="flex-1 py-2 bg-[#f1c40f] text-[#4d3227] rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-105 transition-all">
                            <Edit className="w-3 h-3" /> EDITAR
                          </button>
                          <button 
                            onClick={() => {
                              const link = buildWhatsAppLink(customer, date, items);
                              if (link) {
                                window.open(link, "_blank", "noopener,noreferrer");
                              } else {
                                toast.error("Cliente sem telefone/WhatsApp cadastrado.");
                              }
                            }}
                            className="flex-1 py-2 bg-success text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-105 transition-all">
                            <span className="text-xs">📱</span> WHATSAPP
                          </button>
                        </div>

                        <div className="divide-y divide-border/20">
                          {items.map((purchase) => (
                            <div key={purchase.id} className="py-3 flex items-center justify-between group">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-[#4d3227]">{purchase.product_name} ({purchase.quantity}x)</span>
                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                                  {purchase.payment_method || "dinheiro"}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <p className="text-[9px] text-muted-foreground font-medium">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(purchase.unit_price))} × {purchase.quantity}
                                  </p>
                                  <p className="text-xs font-bold text-[#c23321]">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(purchase.total_price))}
                                  </p>
                                </div>
                                <div className="flex gap-1">
                                  <button className="p-1.5 hover:bg-muted rounded-md text-muted-foreground transition-colors">
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-md text-muted-foreground transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>


        <div className="p-4 border-t border-border bg-white flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-2 border border-border rounded-lg hover:bg-muted transition-all text-[10px] font-black uppercase tracking-widest"
          >
            FECHAR
          </button>
        </div>
      </div>
    </div>
  );
}




function ClientesPage() {
  const fetchCustomers = useServerFn(getCustomers);
  const fetchStats = useServerFn(getCustomerStats);
  const fetchProducts = useServerFn(getProducts);
  const savePurchase = useServerFn(registerPurchase);
  const queryClient = useQueryClient();
  const fetchSalesByPeriod = useServerFn(getSalesByPeriod);
  const [salesPeriod, setSalesPeriod] = useState("Semana");
  
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => fetchCustomers(),
  });

  const { data: statsData } = useQuery({
    queryKey: ["customerStats"],
    queryFn: () => fetchStats(),
  });

  const { data: allCustomers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => fetchCustomers(),
  });

  const stats = useMemo(() => {
    if (!allCustomers || !statsData) return statsData;
    const totalBillingFromCustomers = allCustomers.reduce((acc: number, c: Customer) => acc + (Number(c.total_billing) || 0), 0);
    const totalOpenBalanceFromCustomers = allCustomers.reduce((acc: number, c: Customer) => acc + (Number(c.open_balance) || 0), 0);
    return {
      ...statsData,
      total_billing: totalBillingFromCustomers,
      open_balance: totalOpenBalanceFromCustomers
    };
  }, [allCustomers, statsData]);

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetchProducts(),
  });

  const { data: salesByPeriod = [] } = useQuery({
    queryKey: ["salesByPeriod", salesPeriod],
    queryFn: () => fetchSalesByPeriod({ data: salesPeriod }),
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<{ date: string, items: CustomerPurchase[] } | null>(null);
  const updatePurchase = useServerFn(updatePurchaseGroup);

  const updateMutation = useMutation({
    mutationFn: (data: any) => updatePurchase({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customerStats"] });
      if (selectedCustomer) {
        queryClient.invalidateQueries({ queryKey: ["customer-purchases", selectedCustomer.id] });
      }
      toast.success("Pedido atualizado com sucesso!");
      setEditingGroup(null);
    },
    onError: (error) => {
      console.error("Erro ao atualizar pedido:", error);
      toast.error("Erro ao atualizar pedido.");
    }
  });

  const registerMutation = useMutation({
    mutationFn: (data: any) => savePurchase({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customerStats"] });
      if (selectedCustomer) {
        queryClient.invalidateQueries({ queryKey: ["customer-purchases", selectedCustomer.id] });
      }
      toast.success("Compra registrada com sucesso!");
      setRegisterModalOpen(false);
    },
    onError: (error) => {
      console.error("Erro ao registrar compra:", error);
      toast.error("Erro ao registrar compra.");
    }
  });

  const createCustomerMutation = useMutation({
    mutationFn: (data: any) => createCustomer({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customerStats"] });
      toast.success("Cliente cadastrado com sucesso!");
      setCustomerModalOpen(false);
    },
    onError: (error) => {
      console.error("Erro ao cadastrar cliente:", error);
      toast.error("Erro ao cadastrar cliente.");
    }
  });

  const filteredCustomers = (customers || []).filter((customer: Customer) => {
    const matchesSearch = 
      customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.city && customer.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.phone && customer.phone.includes(searchTerm));
    
    const matchesStatus = 
      filterStatus === "Todos" || 
      (filterStatus === "Ativos" && !customer.is_inactive) || 
      (filterStatus === "Inativos" && customer.is_inactive) ||
      (filterStatus === "VIP" && customer.is_vip);

    return matchesSearch && matchesStatus;
  });



  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar currentPath="/admin/clientes" />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Central de Clientes" />

        <main className="max-w-[1400px] w-full mx-auto p-3 sm:p-6 md:p-10 space-y-6 md:space-y-8">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-[#4d3227]" />
            <h1 className="text-2xl font-bold font-serif italic text-[#4d3227]">Central de Clientes</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-secondary-foreground hover:brightness-110 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm">
              <Download className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>
            <button 
              onClick={() => setCustomerModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:brightness-110 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm">
              <Plus className="w-4 h-4" />
              <span>Novo Cliente</span>
            </button>
          </div>
        </div>

        {/* Sales Chart Mock */}
        <div className="bg-card p-8 rounded-[24px] border border-border shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold font-serif italic text-[#4d3227]">Vendas por Período</h2>
            <div className="flex gap-1 bg-muted/30 p-1 rounded-lg border border-border">
              {['Semana', 'Mês', 'Ano'].map((t) => (
                <button 
                  key={t} 
                  onClick={() => setSalesPeriod(t)}
                  className={cn(
                    "px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-all",
                    salesPeriod === t ? "bg-white text-[#4d3227] shadow-sm rounded-md" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByPeriod}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 'bold' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 'bold' }}
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <Tooltip 
                  cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                  contentStyle={{ 
                    backgroundColor: 'var(--card)', 
                    borderColor: 'var(--border)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value: any) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0)), 'Vendas']}
                />
                <Bar 
                  dataKey="value" 
                  radius={[8, 8, 0, 0]}
                  barSize={40}
                  label={{ 
                    position: 'top', 
                    fill: 'var(--foreground)', 
                    fontSize: 10, 
                    fontWeight: 'bold',
                    formatter: (value: any) => value > 0 ? value.toLocaleString('pt-BR') : ''
                  }}
                >
                  {salesByPeriod?.map((_entry: unknown, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index % 2 === 0 ? '#4d3227' : '#e8b57d'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard icon={Users} value={stats?.['total']?.toString() || "0"} label="Total de Clientes" color="text-[#6b4e71] bg-[#6b4e71]/10" />
          <StatCard icon={Star} value={stats?.['vips']?.toString() || "0"} label="Clientes VIP" color="text-[#f1c40f] bg-[#f1c40f]/10" />
          <StatCard icon={Coins} value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(stats?.['total_billing'] || 0))} label="Faturamento Total" color="text-[#e67e22] bg-[#e67e22]/10" />
          <StatCard icon={HeartCrack} value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(stats?.['open_balance'] || 0))} label="Inadimplência" color="text-[#e74c3c] bg-[#e74c3c]/10" />
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
            <input 
              type="text" 
              placeholder="Buscar cliente, cidade, telefone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl outline-none focus:border-primary transition-all text-sm shadow-sm"
            />
          </div>
          <div className="relative w-full md:w-64">
             <select 
               value={filterStatus}
               onChange={(e) => setFilterStatus(e.target.value)}
               className="w-full pl-4 pr-10 py-3 bg-card border border-border rounded-xl outline-none focus:border-primary appearance-none text-sm font-bold text-foreground shadow-sm"
             >
                <option value="Todos">Todos Clientes</option>
                <option value="Ativos">Ativos</option>
                <option value="Inativos">Inativos</option>
                <option value="VIP">VIPs</option>
             </select>
             <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>

        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-[24px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#4d3227] text-[#e8b57d]">
                  <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Cliente</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Contato</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Situação</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Faturamento</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Em Aberto</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Compras</th>
                  <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                    {filteredCustomers.map((client: Customer) => (
                      <tr key={client.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#4d3227]">{client.full_name}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">{client.city || "Cidade não informada"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-muted-foreground">{client.phone || client.whatsapp || "N/A"}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-1.5 text-success">
                        <span className="text-sm font-bold">✓</span>
                        <span className="text-[11px] font-bold">Adimplente</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-[#4d3227]">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(client.total_billing || 0))}
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-primary">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(client.open_balance || 0))}
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-[#4d3227]">
                      {client.purchase_count} {client.purchase_count === 1 ? 'compra' : 'compras'}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setSelectedCustomer(client)}
                          className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-all"
                          title="Ver histórico de compras"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-all">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-primary/10 hover:text-primary text-muted-foreground transition-all">
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

      {selectedCustomer && (
        <PurchaseHistoryModal 
          customer={selectedCustomer} 
          onClose={() => setSelectedCustomer(null)} 
          onRegisterClick={() => setRegisterModalOpen(true)}
        />
      )}

      {selectedCustomer && registerModalOpen && (
        <RegisterPurchaseModal
          customer={selectedCustomer}
          products={products || []}
          onClose={() => setRegisterModalOpen(false)}
          onSave={(data) => registerMutation.mutate(data)}
          isSaving={registerMutation.isPending}
        />
      )}

      {customerModalOpen && (
        <CustomerModal
          onClose={() => setCustomerModalOpen(false)}
          onSave={(data) => createCustomerMutation.mutate(data)}
          isSaving={createCustomerMutation.isPending}
        />
      )}
      </div>
    </div>
  );
}

