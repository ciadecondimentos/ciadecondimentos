import { createFileRoute } from "@tanstack/react-router";
import { 
  TrendingDown, 
  TrendingUp, 
  DollarSign, 
  RotateCw,
  Search,
  Trash2,
  ChevronRight,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Minus,
  Loader2,
  Truck,
  X,
  Save,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getFinanceStats, 
  getFinanceTransactions, 
  createFinanceTransaction, 
  deleteFinanceTransaction, 
  updateDeliveryCost,
  getFinanceChartData
} from "@/lib/finance.functions";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts";



export const Route = createFileRoute("/admin/financeiro")({
  head: () => ({
    meta: [
      { title: "Fluxo de Caixa - Cia. Condimentos e Especiarias" },
      { name: "description", content: "Gerenciamento financeiro e fluxo de caixa da Cia. Condimentos e Especiarias." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  loader: async ({ context: { queryClient } }) => {
    // Definimos staleTime alto no prefetch para que o TanStack Query considere o dado
    // válido por mais tempo, evitando o estado "loading" ao navegar de volta.
    const staleTime = 1000 * 60 * 5; // 5 minutos
    
    await Promise.allSettled([
      queryClient.prefetchQuery({
        queryKey: ['finance-stats', { dateFrom: '', dateTo: '', type: 'Todos os Tipos', category: 'Todas as Categorias' }],
        queryFn: () => getFinanceStats({ data: { dateFrom: '', dateTo: '', type: 'Todos os Tipos', category: 'Todas as Categorias' } }),
        staleTime,
      }),
      queryClient.prefetchQuery({
        queryKey: ['finance-transactions', { dateFrom: '', dateTo: '', type: 'Todos os Tipos', category: 'Todas as Categorias' }],
        queryFn: () => getFinanceTransactions({ data: { dateFrom: '', dateTo: '', type: 'Todos os Tipos', category: 'Todas as Categorias' } }),
        staleTime,
      }),
    ]);
  },
  component: FinanceiroPage,
});



function CashFlowCard({ icon: Icon, value, label, color, borderColor, isLoading }: { icon: any, value: string, label: string, color: string, borderColor: string, isLoading?: boolean }) {
  return (
    <div className={cn("bg-card p-8 rounded-[24px] border-b-4 shadow-sm flex flex-col items-center text-center space-y-4 transition-all duration-300", borderColor, isLoading && "opacity-50")}>
      <div className={cn("p-4 rounded-2xl", color)}>
        {isLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Icon className="w-8 h-8" />}
      </div>
      <h3 className="text-4xl font-bold font-serif italic text-foreground tracking-tight">
        {isLoading ? "..." : value}
      </h3>
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{label}</p>
    </div>
  );
}

const transactionSchema = z.object({
  date: z.string(),
  type: z.enum(['Entrada', 'Saída']),
  category: z.string(),
  description: z.string(),
  value: z.any().transform((val) => typeof val === 'string' ? Number(val.replace(',', '.')) : Number(val)),
});

function FinanceiroPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [deliveryCost, setDeliveryCost] = useState("");

  const [modalType, setModalType] = useState<'Entrada' | 'Saída'>('Entrada');
  
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    type: 'Todos os Tipos',
    category: 'Todas as Categorias'
  });

  const fetchStats = useServerFn(getFinanceStats);
  const fetchTransactions = useServerFn(getFinanceTransactions);
  const fetchChartData = useServerFn(getFinanceChartData);
  const createTransactionFn = useServerFn(createFinanceTransaction);
  const deleteTransactionFn = useServerFn(deleteFinanceTransaction);
  const updateDeliveryCostFn = useServerFn(updateDeliveryCost);


  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'Entrada',
      date: new Date().toISOString().split('T')[0],
      category: '',
      description: '',
      value: '',
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createTransactionFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-stats'] });
      queryClient.invalidateQueries({ queryKey: ['finance-transactions'] });
      toast.success("Lançamento registrado com sucesso!");
      setIsModalOpen(false);
      reset();
    },
    onError: () => toast.error("Erro ao registrar lançamento."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTransactionFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-stats'] });
      queryClient.invalidateQueries({ queryKey: ['finance-transactions'] });
      toast.success("Lançamento excluído!");
    },
    onError: () => toast.error("Erro ao excluir lançamento."),
  });

  const deliveryMutation = useMutation({
    mutationFn: (data: { purchaseIds: number[]; deliveryCost: number }) =>
      updateDeliveryCostFn({ data }),
    onSuccess: async (result) => {
      setIsDeliveryModalOpen(false);
      setSelectedTransaction(null);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['finance-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['finance-transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['finance-chart'] }),
      ]);

      if (result.success && result.count > 0) {
        toast.success(`Custo de entrega atualizado!`);
      } else {
        toast.error("Nenhum registro encontrado para atualizar.");
      }
    },
    onError: () => toast.error("Erro ao atualizar custo de entrega."),
  });

  const openAddModal = (type: 'Entrada' | 'Saída') => {
    setModalType(type);
    reset({
      type,
      date: new Date().toISOString().split('T')[0],
      category: '',
      description: '',
      value: '',
    });
    setIsModalOpen(true);
  };

  const openDeliveryModal = (transaction: any) => {
    setSelectedTransaction(transaction);
    setDeliveryCost(transaction.delivery_cost?.toString() || "");
    setIsDeliveryModalOpen(true);
  };

  const onSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  const handleDeliverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransaction) return;

    const purchaseIds: number[] = selectedTransaction.purchaseIds?.length
      ? selectedTransaction.purchaseIds
      : [Number(selectedTransaction.realId)];

    const parsed = Number(String(deliveryCost).replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error("Informe um valor válido.");
      return;
    }

    deliveryMutation.mutate({ purchaseIds, deliveryCost: parsed });
  };

  const { data: stats, isFetching: isFetchingStats, refetch: refetchStats } = useQuery({
    queryKey: ['finance-stats', filters],
    queryFn: () => fetchStats({ data: filters }),
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
    gcTime: 1000 * 60 * 30, // Manter no cache por 30 minutos
  });

  const { data: transactions, isFetching: isFetchingTransactions, refetch: refetchTransactions } = useQuery({
    queryKey: ['finance-transactions', filters],
    queryFn: () => fetchTransactions({ data: filters }),
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
    gcTime: 1000 * 60 * 30, // Manter no cache por 30 minutos
  });

  const { data: chartData, isFetching: isFetchingChart } = useQuery({
    queryKey: ['finance-chart', filters.dateFrom, filters.dateTo],
    queryFn: () => fetchChartData({ data: { dateFrom: filters.dateFrom, dateTo: filters.dateTo } }),
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
    gcTime: 1000 * 60 * 30, // Manter no cache por 30 minutos
  });

  const isLoading = isFetchingStats || isFetchingTransactions || isFetchingChart;


  const handleRefresh = () => {
    refetchStats();
    refetchTransactions();
  };

  const formattedTransactions = useMemo(() => {
    if (!transactions) return [];
    
    return transactions.filter((t: any) => {
      if (filters.type !== 'Todos os Tipos' && t.type !== filters.type) return false;
      if (filters.category !== 'Todas as Categorias' && t.category !== filters.category) return false;
      if (filters.dateFrom && t.rawDate < filters.dateFrom) return false;
      if (filters.dateTo && t.rawDate > filters.dateTo) return false;
      return true;
    });
  }, [transactions, filters]);

  const statsAfterFilter = useMemo(() => {
    if (!stats) return { totalEntries: 0, totalExits: 0, netBalance: 0 };
    return stats;
  }, [stats]);


  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };


  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar currentPath="/admin/financeiro" />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Fluxo de Caixa" />

        <main className="max-w-[1400px] w-full mx-auto p-3 sm:p-6 md:p-10 space-y-6 md:space-y-10 transition-all duration-300">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-3">
             <div className="p-2 bg-[#4d3227]/10 rounded-lg">
                <Wallet className="w-6 h-6 text-[#4d3227]" />
             </div>
             <h1 className="text-2xl font-bold font-serif italic text-[#4d3227]">Fluxo de Caixa</h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => openAddModal('Entrada')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-success text-success-foreground hover:brightness-110 transition-all text-[10px] font-black uppercase tracking-widest shadow-md shadow-success/20"
            >
              <Plus className="w-4 h-4" />
              <span>Entrada</span>
            </button>
            <button 
              onClick={() => openAddModal('Saída')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:brightness-110 transition-all text-[10px] font-black uppercase tracking-widest shadow-md shadow-primary/20"
            >
              <Minus className="w-4 h-4" />
              <span>Saída</span>
            </button>

            <button 
              onClick={handleRefresh}
              disabled={isLoading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border bg-card hover:bg-muted transition-all text-[10px] font-black uppercase tracking-widest shadow-sm disabled:opacity-50"
            >
              <RotateCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        {/* Cash Flow Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <CashFlowCard 
            icon={TrendingUp} 
            value={formatCurrency(statsAfterFilter.totalEntries)} 
            label="Total de Entradas" 
            color="bg-success/10 text-success" 
            borderColor="border-success"
            isLoading={isFetchingStats}
          />
          <CashFlowCard 
            icon={TrendingDown} 
            value={formatCurrency(statsAfterFilter.totalExits)} 
            label="Total de Saídas" 
            color="bg-primary/10 text-primary" 
            borderColor="border-primary"
            isLoading={isFetchingStats}
          />
          <CashFlowCard 
            icon={DollarSign} 
            value={formatCurrency(statsAfterFilter.netBalance)} 
            label="Saldo Líquido" 
            color="bg-info/10 text-info" 
            borderColor="border-info" 
            isLoading={isFetchingStats}
          />
        </div>

        {/* Finance Chart Section */}
        <div className="bg-card border border-border rounded-[24px] p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#4d3227]/10 rounded-lg">
                <BarChart3 className="w-6 h-6 text-[#4d3227]" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-serif italic text-[#4d3227]">Desempenho Financeiro</h2>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Entradas vs Saídas & Lucro Líquido</p>
              </div>
            </div>
          </div>

          <div className="h-[400px] w-full">
            {isFetchingChart ? (
              <div className="h-full w-full flex items-center justify-center bg-muted/20 rounded-2xl">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData || []}>
                  <defs>

                    <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--success)" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--muted-foreground)' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--muted-foreground)' }}
                    tickFormatter={(val) => `R$ ${val}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--card)', 
                      borderRadius: '16px', 
                      border: '1px solid var(--border)',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                    }}
                    labelStyle={{ fontWeight: 800, color: 'var(--foreground)', marginBottom: '8px' }}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  <Area 
                    name="Entradas"
                    type="monotone" 
                    dataKey="entradas" 
                    stroke="var(--success)" 
                    fillOpacity={1} 
                    fill="url(#colorEntradas)" 
                    strokeWidth={3}
                  />
                  <Area 
                    name="Saídas"
                    type="monotone" 
                    dataKey="saidas" 
                    stroke="var(--primary)" 
                    fillOpacity={1} 
                    fill="url(#colorSaidas)" 
                    strokeWidth={3}
                  />
                  <Area 
                    name="Lucro Líquido"
                    type="monotone" 
                    dataKey="lucro" 
                    stroke="var(--info)" 
                    fill="transparent"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Filter Bar */}

        <div className="bg-card border border-border rounded-[24px] p-4 flex flex-col xl:flex-row gap-4 items-center shadow-sm">
           <div className="flex flex-col md:flex-row gap-4 flex-1 w-full">
              <input 
                type="date" 
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="flex-1 px-4 py-3 bg-background border border-border rounded-xl outline-none focus:border-primary transition-all text-sm font-bold"
              />
              <input 
                type="date" 
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="flex-1 px-4 py-3 bg-background border border-border rounded-xl outline-none focus:border-primary transition-all text-sm font-bold"
              />
              <select 
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="flex-1 px-4 py-3 bg-background border border-border rounded-xl outline-none focus:border-primary text-sm font-bold appearance-none"
              >
                 <option>Todos os Tipos</option>
                 <option>Entrada</option>
                 <option>Saída</option>
              </select>
              <select 
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="flex-1 px-4 py-3 bg-background border border-border rounded-xl outline-none focus:border-primary text-sm font-bold appearance-none"
              >
                 <option>Todas as Categorias</option>
                 <option>Vendas</option>
                 <option>Despesas</option>
                 <option>Outros</option>
              </select>
           </div>
           
           <div className="flex gap-3 w-full xl:w-auto">
              <button 
                onClick={() => handleRefresh()}
                className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-secondary text-secondary-foreground hover:brightness-110 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
              >
                <Search className="w-4 h-4" />
                <span>Filtrar</span>
              </button>
              <button 
                onClick={() => setFilters({ dateFrom: '', dateTo: '', type: 'Todos os Tipos', category: 'Todas as Categorias' })}
                className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl border border-border bg-card hover:bg-muted transition-all text-[10px] font-black uppercase tracking-widest"
              >
                <Trash2 className="w-4 h-4" />
                <span>Limpar</span>
              </button>
           </div>
        </div>


        {/* Transactions Table */}
        <div className="bg-card border border-border rounded-[24px] overflow-hidden shadow-sm relative">
           {isFetchingTransactions && (
             <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
               <Loader2 className="w-8 h-8 text-primary animate-spin" />
             </div>
           )}
           <div className="overflow-x-auto">
             <table className="w-full border-collapse">
               <thead>
                 <tr className="bg-[#4d3227] text-[#e8b57d]">
                   <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Data</th>
                   <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Tipo</th>
                   <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Categoria</th>
                   <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Descrição</th>
                   <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em]">Valor</th>
                   <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em]">Ações</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-border/50">
                  {formattedTransactions.length > 0 ? (
                    formattedTransactions.map((t: any) => (
                      <tr 
                        key={t.id} 
                        className={cn(
                          "hover:bg-muted/30 transition-colors group",
                          t.source === 'purchase' && "cursor-pointer"
                        )}
                        onClick={() => t.source === 'purchase' && openDeliveryModal(t)}
                      >
                        <td className="px-8 py-5">
                          <span className="text-sm font-medium text-muted-foreground">{t.date}</span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                            {t.type === 'Entrada' ? (
                              <ArrowUpRight className="w-3 h-3 text-success" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3 text-primary" />
                            )}
                            <span className={cn(
                              "text-xs font-bold",
                              t.type === 'Entrada' ? "text-success" : "text-primary"
                            )}>{t.type}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-xs font-bold text-muted-foreground">{t.category}</span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">{t.description}</span>
                            {t.delivery_cost > 0 && (
                              <span className="text-[10px] text-primary font-bold flex items-center gap-1 mt-1">
                                <Truck className="w-3 h-3" />
                                Frete: {formatCurrency(t.delivery_cost)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className={cn(
                              "font-bold text-base",
                              t.type === 'Entrada' ? "text-success" : "text-primary"
                            )}>{formatCurrency(t.value)}</span>
                            {t.delivery_cost > 0 && (
                              <span className="text-[10px] text-muted-foreground line-through decoration-primary/30">
                                Bruto: {formatCurrency(t.value + t.delivery_cost)}
                              </span>
                            )}
                          </div>
                        </td>
                         <td className="px-8 py-5 text-right">
                           <div className="flex items-center justify-end gap-2">
                             {t.source === 'purchase' && (
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   openDeliveryModal(t);
                                 }}
                                 className="p-2 text-muted-foreground hover:text-primary transition-colors bg-muted/50 rounded-lg"
                                 title="Adicionar custo de entrega"
                               >
                                 <Truck className="w-4 h-4" />
                               </button>
                             )}
                             {t.source === 'manual' && (
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   if (confirm('Deseja excluir este lançamento?')) {
                                     deleteMutation.mutate(t.id);
                                   }
                                 }}
                                 disabled={deleteMutation.isPending}
                                 className="p-2 text-muted-foreground hover:text-primary transition-colors bg-muted/50 rounded-lg"
                               >
                                 <Trash2 className="w-4 h-4" />
                               </button>
                             )}
                           </div>
                         </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-8 py-10 text-center text-muted-foreground italic text-sm">
                        Nenhum lançamento encontrado.
                      </td>
                    </tr>
                  )}
               </tbody>
             </table>
           </div>
        </div>
      </main>

      {/* Modal de Lançamento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl border border-border animate-in zoom-in-95 duration-300">
            <div className={cn(
              "p-8 text-white flex items-center justify-between",
              modalType === 'Entrada' ? "bg-success" : "bg-primary"
            )}>
              <div>
                <h2 className="text-2xl font-bold font-serif italic">Novo Lançamento</h2>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{modalType === 'Entrada' ? 'Registrar Entrada de Capital' : 'Registrar Saída de Capital'}</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Data</label>
                  <input 
                    type="date" 
                    {...register('date')}
                    className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl outline-none focus:border-primary transition-all text-sm font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Valor (R$)</label>
                  <input 
                    type="text" 
                    placeholder="0,00"
                    {...register('value')}
                    className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl outline-none focus:border-primary transition-all text-sm font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Categoria</label>
                <input 
                  type="text" 
                  placeholder="Ex: Venda Direta, Aluguel, Fornecedor..."
                  {...register('category')}
                  className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl outline-none focus:border-primary transition-all text-sm font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Descrição</label>
                <textarea 
                  placeholder="Detalhes sobre o lançamento..."
                  {...register('description')}
                  rows={3}
                  className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl outline-none focus:border-primary transition-all text-sm font-bold resize-none"
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={createMutation.isPending}
                  className={cn(
                    "w-full py-4 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg transition-all hover:brightness-110 disabled:opacity-50",
                    modalType === 'Entrada' ? "bg-success shadow-success/20" : "bg-primary shadow-primary/20"
                  )}
                >
                  {createMutation.isPending ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processando...</span>
                    </div>
                  ) : (
                    <span>Confirmar Lançamento</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeliveryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card border border-border w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-[#4d3227] px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#e8b57d]/20 rounded-lg">
                  <Truck className="w-5 h-5 text-[#e8b57d]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-serif italic text-[#e8b57d]">Custo de Entrega</h2>
                  <p className="text-[10px] text-[#e8b57d]/60 font-black uppercase tracking-widest">
                    {selectedTransaction?.description}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsDeliveryModalOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[#e8b57d]" />
              </button>
            </div>

            <form onSubmit={handleDeliverySubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="bg-muted/30 p-4 rounded-2xl space-y-2">
                  <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <span>Venda Total:</span>
                    <span className="text-foreground">{formatCurrency(selectedTransaction?.value || 0)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <span>Data:</span>
                    <span className="text-foreground">{selectedTransaction?.date}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                    Valor do Combustível / Entrega (R$)
                  </label>
                  <input 
                    autoFocus
                    type="text"
                    placeholder="0,00"
                    value={deliveryCost}
                    onChange={(e) => setDeliveryCost(e.target.value)}
                    className="w-full px-6 py-4 bg-background border border-border rounded-2xl outline-none focus:border-primary transition-all text-lg font-bold"
                  />
                  <p className="text-[10px] text-muted-foreground italic px-1">
                    Este valor será deduzido do saldo líquido e aparecerá como custo associado a esta venda.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsDeliveryModalOpen(false)}
                  className="flex-1 py-4 rounded-2xl border border-border bg-card hover:bg-muted transition-all text-[10px] font-black uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={deliveryMutation.isPending}
                  className="flex-1 py-4 rounded-2xl bg-[#4d3227] text-[#e8b57d] hover:brightness-110 transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/10 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deliveryMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="max-w-[1400px] mx-auto p-10 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mt-10 transition-all duration-300">
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

