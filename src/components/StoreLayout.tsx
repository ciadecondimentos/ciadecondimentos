import { Link } from '@tanstack/react-router';
import { useHydrated } from "@/hooks/use-hydrated";
import { ShoppingCart, Phone } from 'lucide-react';
import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import logoAsset from "@/assets/logo-transparent.png.asset.json";
import { Button } from '@/components/ui/button';

export function StoreLayout({
  children,
  cartCount = 0,
  cartTotal = 0,
  onCartClick,
}: {
  children: ReactNode;
  cartCount?: number;
  cartTotal?: number;
  onCartClick?: () => void;
}) {
  const isHydrated = useHydrated();

  return (
    <div className={cn("store-shell min-h-screen font-['Wix_Madefor_Text']", !isHydrated && "opacity-0 transition-opacity duration-300")}>
      {/* Top Banner */}
      <div className="bg-[#8E1611] text-[#e8b57d] py-2 px-3 text-center text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em]">
        Entregas em toda a região • Qualidade garantida
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#FFF8E7]/90 backdrop-blur-md border-b border-[#DFB316]/20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-20 sm:h-24 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          {/* Logo */}
          <Link to="/" className="flex min-w-0 items-center gap-2 sm:gap-3 group">
            <div className="w-14 h-14 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
              <img src={logoAsset.url} alt="Cia de Condimentos" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base sm:text-xl font-bold text-[#8E1611] leading-tight">Cia de Condimentos</h1>
              <p className="truncate text-[9px] sm:text-[10px] font-bold text-[#539D17] uppercase tracking-wider">Temperos & Especiarias</p>
            </div>
          </Link>

          {/* Cart */}
          <Button
            onClick={onCartClick}
            variant="ghost"
            className="shrink-0 h-11 gap-2 rounded-full px-3 sm:px-4 text-[#8E1611] hover:bg-[#8E1611]/5"
            aria-label="Abrir carrinho"
          >
            <span className="relative">
              <ShoppingCart className="w-5 h-5" />
              {isHydrated && cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#539D17] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </span>
            {isHydrated && cartCount > 0 && (
              <span className="hidden sm:block text-sm font-bold">R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
            )}
          </Button>
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
