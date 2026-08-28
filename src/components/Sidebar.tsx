import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { adminLogout } from "@/lib/admin-auth.functions";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Truck, 
  BarChart3, 
  Tag, 
  Settings, 
  ChevronRight,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  ShoppingBag,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import logoAsset from "@/assets/logo-transparent.png.asset.json";
import { useSidebar } from "@/hooks/use-sidebar";

interface SidebarProps {
  productCount?: number;
  currentPath?: string;
}

export function Sidebar({ productCount = 0, currentPath = "/" }: SidebarProps) {
  const { isCollapsed, toggle } = useSidebar();
  
  const logoutFn = useServerFn(adminLogout);

  const menuItems = [
    { label: 'Dashboards', to: '/admin', icon: LayoutDashboard, badge: null },
    { label: 'Produtos', to: '/admin/produtos', icon: Package, badge: productCount > 0 ? productCount : null },
    { label: 'Pedidos', to: '/admin/pedidos', icon: ShoppingCart },
    { label: 'Clientes', to: '/admin/clientes', icon: Users, badge: null },
    { label: 'Fornecedores', to: '/admin/fornecedores', icon: Truck, badge: 2 },
    { label: 'Financeiro', to: '/admin/financeiro', icon: BarChart3, badge: null },
    { label: 'Promoções', to: '/admin/promocoes', icon: Tag, badge: null },
    { label: 'Relatórios', to: '/admin/relatorios', icon: BarChart3, badge: null },
    { label: 'Configurações', to: '#', icon: Settings, badge: null },
    { label: 'Ir para Loja', to: '/', icon: ShoppingBag, badge: null },
  ];

  const handleLogout = async () => {
    try {
      await logoutFn();
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('cia_admin_logged');
      }
    } finally {
      window.location.href = '/admin/login';
    }
  };

  return (
    <aside 
      className={cn(
        "hidden lg:flex flex-col bg-[#4d3227] border-r border-border/10 fixed h-full left-0 top-0 z-30 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-72"
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={toggle}
        className="absolute -right-3 top-10 w-6 h-6 bg-[#e8b57d] text-[#4d3227] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-40 border border-[#4d3227]/20"
      >
        {isCollapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div className={cn(
        "flex flex-col items-center text-center transition-all duration-300",
        isCollapsed ? "p-2" : "p-0"
      )}>
        <div className={cn(
          "flex items-center justify-center transition-all duration-300 w-full overflow-hidden",
          isCollapsed ? "h-16" : "h-72"
        )}>
          <img 
            src={logoAsset.url} 
            alt="Logo" 
            className={cn(
              "w-full h-full object-contain transition-all duration-300",
              isCollapsed ? "scale-150 p-1" : "p-0"
            )} 
          />
        </div>
        {!isCollapsed && (
          <div className="p-8 pb-4">
            <h1 className="text-2xl font-serif font-bold text-white leading-tight animate-in fade-in duration-500">Cia de Condimentos</h1>
            <p className="text-[#e8b57d] text-xs font-bold uppercase tracking-widest mt-2 animate-in fade-in duration-500">Painel Administrativo</p>
          </div>
        )}
      </div>

      <div className="mt-4 px-4 flex-1 overflow-y-auto no-scrollbar">
        {!isCollapsed && (
          <p className="px-4 text-[10px] font-bold text-[#e8b57d]/50 uppercase tracking-[0.2em] mb-4 animate-in fade-in duration-500">Menu</p>
        )}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = item.to && (currentPath === item.to || (item.to !== '/' && currentPath.startsWith(item.to)));
            
            return (
              <div key={item.label} className="space-y-1">
                <Link
                  to={item.to}
                  className={cn(
                    "flex items-center px-4 py-3 rounded-xl transition-all duration-200 group relative",
                    isCollapsed ? "justify-center" : "justify-between",
                    isActive 
                      ? "bg-white/10 text-[#e8b57d] shadow-sm" 
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                  title={isCollapsed ? item.label : ""}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={cn(
                      "w-5 h-5 transition-transform group-hover:scale-110 flex-shrink-0",
                      isActive ? "text-[#e8b57d]" : ""
                    )} />
                    {!isCollapsed && (
                      <span className="text-sm font-bold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis animate-in fade-in slide-in-from-left-2 duration-300">
                        {item.label}
                      </span>
                    )}
                  </div>
                  
                  {!isCollapsed && (
                    item.badge ? (
                      <span className="bg-[#c62828] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                        {item.badge}
                      </span>
                    ) : (
                      <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    )
                  )}

                  {isCollapsed && item.badge && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-[#c62828] rounded-full border border-[#4d3227]" />
                  )}
                </Link>
              </div>
            );
          })}
        </nav>
      </div>

      <div className={cn(
        "p-4 border-t border-white/5",
        isCollapsed ? "px-2" : "p-6"
      )}>
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm",
            isCollapsed ? "justify-center bg-red-500/10 text-red-500 hover:bg-red-500/20" : "bg-[#3a2a23] text-[#e8b57d] hover:bg-[#2f221b]"
          )}
          title={isCollapsed ? "Sair" : ""}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Sair</span>}
        </button>
        {!isCollapsed && (
          <p className="mt-3 text-center text-[10px] font-bold text-white/30 uppercase tracking-widest">v2.4.0 • 2026</p>
        )}
      </div>
    </aside>
  );
}
