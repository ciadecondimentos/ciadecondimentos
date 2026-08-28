import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useLocation } from "@tanstack/react-router";
import { 
  Bell,
  BarChart3,
  LayoutDashboard,
  Search,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Tag,
  Truck,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logoAsset from "@/assets/logo-transparent.png.asset.json";
import { useSidebar } from "@/hooks/use-sidebar";

interface NavbarProps {
  title?: string;
  menuItems?: any[];
  mobileMenuId?: string;
}

export function Navbar({ title = "Dashboard", menuItems = [], mobileMenuId = "mobile-menu" }: NavbarProps) {
  const { isCollapsed } = useSidebar();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(isCollapsed);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const defaultMenuItems = [
    { label: "Dashboard Geral", to: "/admin", icon: LayoutDashboard },
    { label: "Produtos", to: "/admin/produtos", icon: Package },
    { label: "Pedidos", to: "/admin/pedidos", icon: ShoppingCart },
    { label: "Clientes", to: "/admin/clientes", icon: Users },
    { label: "Fornecedores", to: "/admin/fornecedores", icon: Truck },
    { label: "Financeiro", to: "/admin/financeiro", icon: BarChart3 },
    { label: "Promoções", to: "/admin/promocoes", icon: Tag },
    { label: "Relatórios", to: "/admin/relatorios", icon: BarChart3 },
    { label: "Configurações", to: "#", icon: Settings },
  ];
  const navigationItems = menuItems.length > 0 ? menuItems : defaultMenuItems;

  useEffect(() => {
    // Initial sync
    setIsSidebarCollapsed(localStorage.getItem("sidebar-collapsed") === "true");

    const handleStateChange = () => {
      const saved = localStorage.getItem("sidebar-collapsed") === "true";
      setIsSidebarCollapsed(saved);
    };

    window.addEventListener("sidebar-state-change", handleStateChange);
    return () => window.removeEventListener("sidebar-state-change", handleStateChange);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  return (
    <nav className={cn(
      "sticky top-0 z-20 bg-card border-b border-border px-3 py-3 sm:px-6 sm:py-4 transition-all duration-300 ease-in-out",
      isSidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
    )}>
      <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-4 lg:hidden min-w-0">
          <div className="w-10 h-10 overflow-hidden flex items-center justify-center">
            <img src={logoAsset.url} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-base sm:text-xl font-bold tracking-tight truncate">{title}</span>
        </div>
        
        <div className="hidden lg:block">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Início / {title}</h2>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-4 shrink-0">
          <div className="hidden md:flex items-center gap-2 bg-background border border-border rounded-full px-4 py-2 w-72 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Search className="w-4 h-4 text-primary" />
            <input 
              type="text" 
              placeholder="Pesquisar..." 
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <button aria-label="Notificações" className="min-h-11 min-w-11 p-2.5 rounded-full hover:bg-muted text-warning transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-card" />
            </button>
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-sm font-bold text-foreground border border-border cursor-pointer hover:border-primary transition-all">
              JD
            </div>
            <button
              type="button"
              aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={isMenuOpen}
              className="lg:hidden min-h-11 min-w-11 p-2 text-foreground hover:bg-muted rounded-lg transition-colors"
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        id={mobileMenuId}
        aria-hidden={!isMenuOpen}
        className={cn(
          "lg:hidden max-h-[calc(100vh-5rem)] overflow-y-auto overscroll-contain bg-card border-b border-border px-3 sm:px-6 py-3 sm:py-4 animate-in slide-in-from-top duration-300 mt-3",
          !isMenuOpen && "hidden"
        )}
      >
        <div className="flex flex-col gap-4">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to));

            return (
            <Link 
              key={item.label} 
              to={item.to} 
              className={cn(
                "text-sm font-bold tracking-wide py-2 transition-all flex items-center gap-3",
                isActive || item.active ? "text-primary" : "text-muted-foreground hover:text-secondary"
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
