import { Link } from '@tanstack/react-router';
import { useHydrated } from "@/hooks/use-hydrated";
import { ShoppingCart, User, Search, Menu, X, Phone } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import logoAsset from "@/assets/logo-transparent.png.asset.json";
import { Button } from '@/components/ui/button';

export function StoreLayout({ children, cartCount = 0 }: { children: ReactNode; cartCount?: number }) {
  const isHydrated = useHydrated();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className={cn("store-shell min-h-screen font-['Wix_Madefor_Text']", !isHydrated && "opacity-0 transition-opacity duration-300")}>
      {/* Top Banner */}
      <div className="bg-[#8E1611] text-[#e8b57d] py-2 px-4 text-center text-[10px] font-bold uppercase tracking-[0.2em]">
        Entregas em toda a região • Qualidade garantida
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#FFF8E7]/80 backdrop-blur-md border-b border-[#DFB316]/20">
        <div className="max-w-7xl mx-auto px-4 h-24 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group relative">
            <div className="w-24 h-24 flex items-center justify-center group-hover:scale-105 transition-transform z-10">
              <img src={logoAsset.url} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="hidden sm:block pt-0">
              <h1 className="text-xl font-bold text-[#8E1611] leading-tight">Cia de Condimentos</h1>
              <p className="text-[10px] font-bold text-[#539D17] uppercase tracking-wider">Temperos & Especiarias</p>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <input 
              type="text" 
              placeholder="Buscar especiarias..." 
              className="w-full pl-10 pr-4 py-2 rounded-full border border-[#4d3227]/10 focus:outline-none focus:ring-2 focus:ring-[#e8b57d]/20 transition-all text-sm"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" className="text-[#8E1611] rounded-full hover:bg-[#8E1611]/5">
              <User className="w-5 h-5" />
            </Button>
            
            <Button variant="ghost" size="icon" className="text-[#8E1611] rounded-full hover:bg-[#8E1611]/5 relative">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#539D17] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Button>

            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden text-[#8E1611] rounded-full hover:bg-[#8E1611]/5"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

      </header>


      {/* Content */}
      <main>
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#8E1611] text-white pt-16 pb-8 px-4 mt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12 border-b border-white/10 pb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 flex items-center justify-center p-1 bg-white rounded-lg">
                <img src={logoAsset.url} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <h2 className="text-xl font-bold">Cia de Condimentos</h2>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              As melhores especiarias e condimentos selecionados para elevar o sabor da sua cozinha. Qualidade e frescor em cada grão.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[#e8b57d] uppercase tracking-widest text-xs mb-6">Categorias</h3>
            <ul className="space-y-3 text-sm text-white/70">
              <li><a href="#" className="hover:text-white transition-colors">Temperos Caseiros</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Especiarias Exóticas</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Ervas Desidratadas</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pimentas Selecionadas</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-[#e8b57d] uppercase tracking-widest text-xs mb-6">Atendimento</h3>
            <ul className="space-y-3 text-sm text-white/70">
              <li><a href="#" className="hover:text-white transition-colors">Minha Conta</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Rastrear Pedido</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Política de Entrega</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-[#e8b57d] uppercase tracking-widest text-xs mb-6">Siga-nos</h3>
            <div className="flex items-center gap-4 mb-6">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Phone className="w-5 h-5" />
              </a>
            </div>
            <p className="text-xs text-white/40 uppercase tracking-widest">
              Segunda a Sexta: 08:00 - 18:00
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
          <p>© 2026 Cia de Condimentos. Todos os direitos reservados.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
