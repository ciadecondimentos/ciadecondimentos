import { createFileRoute } from "@tanstack/react-router";
import { type DashboardParams } from "@/lib/dashboard.functions";
import { useState, useEffect, useMemo } from "react";
import { 
  ShoppingBag, 
  Package, 
  DollarSign, 
  Clock, 
  TrendingUp,
  AlertCircle,
  Search,
  Bell,
  Menu,
  ArrowUpRight,
  MoreHorizontal,
  Users,
  LayoutDashboard,
  ShoppingCart,
  BarChart3,
  Settings,
  ChevronRight,
  Truck,
  Tag,
  RotateCw,
  Calendar as CalendarIcon
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { cn } from "@/lib/utils";
import logoAsset from "@/assets/logo-transparent.png.asset.json";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { useSidebar } from "@/hooks/use-sidebar";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/lib/dashboard.functions";
import { getProducts } from "@/lib/products.functions";
import { Suspense } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format, subDays, startOfDay, endOfDay, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";


export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard - Cia. Condimentos e Especiarias" },
      { name: "description", content: "Painel administrativo moderno para Cia. Condimentos e Especiarias." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  loader: async ({ context: { queryClient } }) => {
    // Otimização Máxima: O loader no servidor inicia o prefetch.
    // Como implementamos cache no SQL, se o dado estiver no servidor, o prefetch
    // será instantâneo. O usuário recebe o HTML com o layout e esqueletos
    // enquanto o JS hidrata e exibe os dados do cache quase que imediatamente.
    queryClient.prefetchQuery({
      queryKey: ["dashboard-stats", '7d', undefined],
      queryFn: () => getDashboardStats({ data: { period: '7d' } }),
      staleTime: 1000 * 60 * 5,
    });
  },
  component: Dashboard,
});

function StatCardSkeleton() {
  return (
    <div className="bg-card p-6 rounded-[16px] border border-border shadow-sm animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 bg-muted rounded-xl"></div>
      </div>
      <div>
        <div className="h-3 w-16 bg-muted rounded mb-2"></div>
        <div className="h-8 w-24 bg-muted rounded mb-2"></div>
        <div className="h-4 w-32 bg-muted rounded"></div>
      </div>
    </div>
  );
}

function SectionSkeleton({ className }: { className?: string | undefined }) {
  return (
    <div className={cn("bg-card rounded-[16px] p-6 border border-border shadow-sm flex flex-col h-[450px] animate-pulse", className)}>
      <div className="flex justify-between items-center mb-6">
        <div className="h-6 w-32 bg-muted rounded"></div>
        <div className="h-8 w-8 bg-muted rounded"></div>
      </div>
      <div className="flex-1 bg-muted/50 rounded-xl"></div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  subtext,
  variant = 'primary',
  isLoading = false
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  trend?: string | undefined;
  subtext: string;
  variant?: 'primary' | 'secondary' | 'dark-red';
  isLoading?: boolean;
}) {
  if (isLoading) return <StatCardSkeleton />;

  const iconStyles = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/20 text-secondary-foreground",
    "dark-red": "bg-red-dark/10 text-red-dark",
  };

  const valueColor = variant === 'secondary' ? "text-secondary-foreground" : "text-primary";

  return (
    <div className="bg-card p-6 rounded-[16px] border border-border shadow-sm transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-3 rounded-xl", iconStyles[variant])}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-xs font-bold text-success bg-success/10 px-2 py-1 rounded-full">
            <ArrowUpRight className="w-3 h-3" />
            {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider mb-1 truncate">{subtext}</p>
        <h3 className={cn("text-2xl md:text-3xl font-bold leading-tight break-all", valueColor)}>{value}</h3>
        <p className="text-muted-foreground text-xs md:text-sm mt-1 truncate">{title}</p>
      </div>
    </div>
  );
}

function Section({ title, children, action, className, isLoading = false }: { title: string; children: React.ReactNode; action?: React.ReactNode; className?: string; isLoading?: boolean }) {
  if (isLoading) return <SectionSkeleton className={className} />;
  
  return (
    <div className={cn("bg-card rounded-[16px] p-6 border border-border shadow-sm flex flex-col h-full", className)}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {action}
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}

function Dashboard() {
  const { isCollapsed } = useSidebar();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(isCollapsed);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  const fetchStats = useServerFn(getDashboardStats);
  const fetchProducts = useServerFn(getProducts);
  const queryClient = useQueryClient();

  const handlePeriodChange = (p: string) => {
    setSelectedPeriod(p);
    setDateRange(undefined);
  };

  const { data: stats, isFetching } = useQuery({
    queryKey: ["dashboard-stats", selectedPeriod, dateRange],
    queryFn: () => {
      const params: DashboardParams = { period: selectedPeriod };
      if (dateRange?.from && dateRange?.to) {
        params.dateRange = {
          from: format(dateRange.from, 'yyyy-MM-dd'),
          to: format(dateRange.to, 'yyyy-MM-dd')
        };
      }
      return fetchStats({ data: params });
    },
    staleTime: 1000 * 60,
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetchProducts(),
  });

  const productCount = products?.length || 0;

  useEffect(() => {
    const handleStateChange = () => {
      const saved = localStorage.getItem("sidebar-collapsed") === "true";
      setIsSidebarCollapsed(saved);
    };

    window.addEventListener("sidebar-state-change", handleStateChange);
    return () => window.removeEventListener("sidebar-state-change", handleStateChange);
  }, []);

  const chartTitle = useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      const days = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      if (days <= 1) return "Desempenho Diário";
      if (days <= 7) return "Desempenho Semanal";
      if (days <= 31) return "Desempenho Mensal";
      if (days <= 62) return "Desempenho Bimestral";
      if (days <= 183) return "Desempenho Semestral";
      return "Desempenho por Período";
    }
    
    if (selectedPeriod === '24h') return "Desempenho (24h)";
    if (selectedPeriod === '30d') return "Desempenho Mensal";
    return "Desempenho Semanal";
  }, [dateRange, selectedPeriod]);

  const menuItems = useMemo(() => [
    { label: 'Dashboard Geral', to: '/admin', icon: LayoutDashboard, badge: null, active: true },
    { label: 'Produtos', to: '/admin/produtos', icon: Package, badge: productCount || null, active: false },
    { label: 'Pedidos', to: '/admin/pedidos', icon: ShoppingCart, active: false },
    { label: 'Clientes', to: '/admin/clientes', icon: Users, badge: stats?.novosClientes || null, active: false },
    { label: 'Fornecedores', to: '/admin/fornecedores', icon: Truck, badge: 2, active: false },
    { label: 'Financeiro', to: '/admin/financeiro', icon: BarChart3, badge: null, active: false },
    { label: 'Promoções', to: '/admin/promocoes', icon: Tag, badge: null, active: false },
    { label: 'Relatórios', to: '/admin/relatorios', icon: BarChart3, badge: null, active: false },
    { label: 'Configurações', to: '#', icon: Settings, badge: null, active: false },
  ], [productCount, stats?.novosClientes]);

  // Removido o retorno antecipado nulo para permitir renderização com skeletons
  // if (!stats) return null;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar productCount={productCount} currentPath="/admin" />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Dashboard Geral" />

        <main className="max-w-[1400px] w-full mx-auto p-3 sm:p-6 md:p-10 space-y-6 md:space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">Visão Geral</h1>
            <p className="text-muted-foreground text-lg">Bem-vindo ao painel da Cia. de Condimentos.</p>
          </div>
          <div className="flex items-center gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-bold uppercase tracking-widest text-xs h-[42px] px-4 rounded-full border-border bg-card",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd/MM/yy")} - {format(dateRange.to, "dd/MM/yy")}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM/yy")
                      )
                    ) : (
                      <span>Calendário</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from || new Date()}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>

             <div className="flex p-1 bg-card border border-border rounded-full">
                {['24h', '7d', '30d'].map((p) => (
                  <button 
                    key={p}
                    onClick={() => handlePeriodChange(p)}
                    type="button"
                    className={cn(
                      "px-5 py-2 rounded-full text-xs font-bold tracking-widest transition-all uppercase",
                      selectedPeriod === p && !dateRange ? "bg-secondary text-secondary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 transition-opacity duration-200", isFetching && !stats && "opacity-50")}>
          {!stats && isFetching ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard 
                title="Total de Vendas" 
                value={stats?.totalVendas ?? 0} 
                icon={ShoppingBag} 
                subtext="Vendas"
                trend={stats?.vendasTrend ?? undefined}
                variant="primary"
              />
              <StatCard 
                title="Receita Total" 
                value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(stats?.receitaTotal ?? 0))} 
                icon={DollarSign} 
                subtext="Receita"
                trend={stats?.receitaTrend ?? undefined}
                variant="secondary"
              />
              <StatCard 
                title="Produtos em Estoque" 
                value={stats?.produtosEstoque ?? 0} 
                icon={Package} 
                subtext="Estoque"
                variant="dark-red"
              />
              <StatCard 
                title="Total de Clientes" 
                value={stats?.novosClientes ?? 0} 
                icon={Users} 
                subtext="Clientes"
                trend={stats?.clientesTrend ?? undefined}
                variant="secondary"
              />
            </>
          )}
        </div>


        {/* Middle Row */}
        <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-8 transition-opacity duration-200", isFetching && !stats && "opacity-50")}>
          {!stats && isFetching ? (
            <>
              <SectionSkeleton className="lg:col-span-2" />
              <SectionSkeleton />
            </>
          ) : stats ? (
            <>
              <Section 
                title={chartTitle} 
                className="lg:col-span-2"
                action={
                   <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                }
              >
                <div className="h-[350px] w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.vendasPorPeriodo}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
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
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="var(--primary)" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                        label={{ 
                          position: 'top', 
                          fill: 'var(--primary)', 
                          fontSize: 10, 
                          fontWeight: 'bold',
                          formatter: (value: any) => value > 0 ? `R$ ${value.toLocaleString('pt-BR')}` : ''
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Section>

              <Section title="Estoque por Categoria">
                <div className="space-y-8 pt-4">
                  {stats.estoqueCategorias.length > 0 ? (
                    stats.estoqueCategorias.map((item) => (
                      <div key={item.label} className="space-y-3">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="text-foreground">{item.value}%</span>
                        </div>
                        <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all duration-1000", item.color)} style={{ width: `${item.value}%` }} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                      <p className="text-xs font-bold uppercase tracking-widest">Sem dados de estoque</p>
                    </div>
                  )}
                </div>
              </Section>
            </>
          ) : null}

        </div>

        {/* Bottom Row - Tables & Alerts */}
        <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-8 transition-opacity duration-200", isFetching && !stats && "opacity-50")}>
          {!stats && isFetching ? (
            <SectionSkeleton className="lg:col-span-3" />
          ) : stats ? (
            <>
              <Section title="Últimos Pedidos" className="lg:col-span-2 overflow-hidden">
                 <div className="w-full overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                     <thead>
                       <tr className="bg-primary text-primary-foreground text-xs uppercase tracking-widest font-bold">
                         <th className="p-4 rounded-tl-xl">Pedido</th>
                         <th className="p-4">Cliente</th>
                         <th className="p-4">Total</th>
                         <th className="p-4 rounded-tr-xl">Status</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-border">
                        {stats.ultimosPedidos.length > 0 ? (
                          stats.ultimosPedidos.map((order, idx) => (
                            <tr key={idx} className="hover:bg-muted/50 transition-colors group">
                              <td className="p-4 font-bold text-primary">{order.id}</td>
                              <td className="p-4 font-medium">{order.client}</td>
                              <td className="p-4">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}</td>
                              <td className="p-4">
                                <span className={cn(
                                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                                  order.status === 'Pago' ? "bg-success/10 text-success" : 
                                  order.status === 'Pendente' ? "bg-secondary/20 text-secondary-foreground" :
                                  "bg-primary/10 text-primary"
                                )}>
                                  {order.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-10 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
                              Nenhum pedido registrado
                            </td>
                          </tr>
                        )}

                     </tbody>
                   </table>
                 </div>
              </Section>

              <Section 
                title="Avisos"
                action={
                  <button className="text-primary hover:text-secondary text-xs font-bold uppercase">
                    Limpar
                  </button>
                }
              >
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-center px-4">
                  <AlertCircle className="w-12 h-12 mb-4 text-warning opacity-30" />
                  <p className="text-sm font-bold text-foreground">Sistema em Operação</p>
                  <p className="text-xs mt-2">Nenhum alerta crítico ou atraso identificado no processamento de pedidos.</p>
                </div>
              </Section>
            </>
          ) : null}
        </div>
      </main>

      <footer className="max-w-[1400px] mx-auto p-10 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-10">
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


