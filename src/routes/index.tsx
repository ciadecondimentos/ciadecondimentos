import { createFileRoute } from '@tanstack/react-router';
import { ShoppingCart, User, Search, Menu, X, Phone, Filter } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { getProducts, type Product } from '@/lib/products.functions';
import { toast } from 'sonner';
import { createStoreOrder } from '@/lib/store.functions';
import { StoreLayout } from '@/components/StoreLayout';
import { ProductPreviewModal } from '@/components/ProductPreviewModal';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: "Cia de Condimentos — Loja de Temperos e Especiarias" },
      { name: "description", content: "Compre temperos, especiarias e ervas selecionadas com entrega na região. Pagamento por PIX, cartão ou dinheiro." },
      { property: "og:title", content: "Cia de Condimentos — Loja de Temperos e Especiarias" },
      { property: "og:description", content: "Compre temperos, especiarias e ervas selecionadas com entrega na região." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context: { queryClient } }) => {
    return queryClient.ensureQueryData({
      queryKey: ['store-products'],
      queryFn: () => getProducts(),
    });
  },
  component: StoreIndex,
});

function StoreIndex() {
  const isHydrated = useHydrated();
  const createOrderFn = useServerFn(createStoreOrder);
  const loaderProducts = Route.useLoaderData();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['store-products'],
    queryFn: () => getProducts(),
    initialData: loaderProducts,
  });

  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantityProduct, setQuantityProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'money' | 'card'>('pix');
  const [cashReceived, setCashReceived] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(products.map((p: Product) => p.category).filter((c): c is string => Boolean(c)));
    return Array.from(cats);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p: Product) => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.category?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !selectedCategory || p.category === selectedCategory;
        const matchesUnit = !selectedUnit || p.sale_unit?.toUpperCase() === selectedUnit.toUpperCase();
        return matchesSearch && matchesCategory && matchesUnit;
      })
      .sort((a, b) => {
        const unitA = (a.sale_unit || 'UN').toUpperCase();
        const unitB = (b.sale_unit || 'UN').toUpperCase();
        
        if (unitA === 'UN' && unitB === 'KG') return -1;
        if (unitA === 'KG' && unitB === 'UN') return 1;
        
        return a.name.localeCompare(b.name);
      });
  }, [products, searchQuery, selectedCategory, selectedUnit]);

  const productsByUnit = useMemo(() => filteredProducts.filter((p: Product) => p.sale_unit?.toUpperCase() === 'UN'), [filteredProducts]);
  const productsByKg = useMemo(() => filteredProducts.filter((p: Product) => p.sale_unit?.toUpperCase() === 'KG'), [filteredProducts]);

  const addToCart = (product: Product, amount = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id
          ? { ...item, quantity: item.quantity + amount }
          : item);
      }
      return [...prev, { product, quantity: amount }];
    });
    toast.success(`${product.name} adicionado ao carrinho!`);
  };

  const openQuantityModal = (product: Product) => {
    setSelectedProduct(null);
    setQuantityProduct(product);
    setQuantity(1);
  };

  const removeFromCart = (productId: string | number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  }, [cart]);

  const finalizeOrder = async (method: 'pix' | 'money' | 'card') => {
    await createOrderFn({
      data: {
        customerName: (document.getElementById('customer-name') as HTMLInputElement)?.value || "Cliente Online",
        items: cart.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          unit: item.product.sale_unit || 'UN'
        })),
        total: cartTotal,
        paymentMethod: method,
        status: 'pending'
      }
    });
    setCart([]);
    setCashReceived('');
    setIsCheckoutOpen(false);
  };

  const handleCheckout = async () => {
    const received = Number(cashReceived.replace(',', '.'));
    if (paymentMethod === 'money' && (!Number.isFinite(received) || received < cartTotal)) {
      toast.error(`Informe pelo menos R$ ${cartTotal.toFixed(2).replace('.', ',')} em dinheiro.`);
      return;
    }

    try {
      await finalizeOrder(paymentMethod);
      toast.success("Pedido realizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao processar pedido.");
    }
  };

  if (isLoading) {
    return (
      <StoreLayout cartCount={0}>
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Carregando catálogo...</p>
      </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout cartCount={cart.length}>
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
      {/* Search and Filters */}
      

      {/* Hero */}
      <section className="relative rounded-[32px] overflow-hidden bg-[#8E1611] min-h-[350px] flex items-center justify-center">
        <div className="relative z-10 w-full max-w-4xl px-4 flex flex-col items-center">
          <div className="flex flex-col items-center space-y-4 mb-8">
            <h2 className="text-4xl md:text-5xl font-serif text-[#DFB316] leading-tight flex items-center gap-3">
              <Search className="w-8 h-8 md:w-10 md:h-10" />
              Encontre seu Sabor
            </h2>
            <p className="text-white text-sm md:text-base font-medium opacity-90">
              Busque pelos condimentos e especiarias que você procura
            </p>
          </div>
          
          <div className="relative w-full max-w-2xl">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8E1611]" />
            <input 
              type="text"
              placeholder="Digite o nome do produto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-6 h-16 rounded-full bg-white text-[#8E1611] placeholder-[#8E1611]/50 focus:outline-none focus:ring-4 focus:ring-[#DFB316]/30 transition-all text-lg shadow-2xl"
            />
          </div>
        </div>
        
        {/* Pattern Background overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ 
               backgroundImage: `radial-gradient(#DFB316 1px, transparent 1px)`, 
               backgroundSize: '24px 24px' 
             }} 
        />
      </section>

      {/* Filter Bar */}
      <section className="bg-[#FFF8E7] py-4 px-6 border-y border-[#DFB316]/20">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <div className="flex items-center gap-8 overflow-x-auto scrollbar-hide">
            <Button
              onClick={() => {
                setSelectedCategory(null);
                setSelectedUnit(null);
              }}
              className={cn(
                "bg-transparent hover:bg-transparent text-sm font-bold uppercase tracking-widest transition-all border-none p-0 h-auto",
                selectedCategory === null && selectedUnit === null
                  ? "text-[#8E1611] underline underline-offset-8 decoration-2" 
                  : "text-[#8E1611]/60 hover:text-[#8E1611]"
              )}
            >
              TODOS
            </Button>
            {categories.map((cat: string) => (
              <Button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "bg-transparent hover:bg-transparent text-sm font-bold uppercase tracking-widest transition-all border-none p-0 h-auto",
                  selectedCategory === cat 
                    ? "text-[#8E1611] underline underline-offset-8 decoration-2" 
                    : "text-[#8E1611]/60 hover:text-[#8E1611]"
                )}
              >
                {cat}
              </Button>
            ))}
            {['KG', 'UN'].map((unit) => (
              <Button
                key={unit}
                onClick={() => setSelectedUnit(selectedUnit === unit ? null : unit)}
                className={cn(
                  "bg-transparent hover:bg-transparent text-sm font-bold uppercase tracking-widest transition-all border-none p-0 h-auto",
                  selectedUnit === unit 
                    ? "text-[#8E1611] underline underline-offset-8 decoration-2" 
                    : "text-[#8E1611]/60 hover:text-[#8E1611]"
                )}
              >
                {unit}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Section Title */}
      <div className="flex flex-col items-center space-y-3 pt-4">
        <h3 className="text-4xl font-serif text-[#8E1611]">Nossos Produtos</h3>
        <div className="w-20 h-0.5 bg-[#DFB316]" />
      </div>

      {/* Products Grid */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {filteredProducts.map((product: Product) => (
          <ProductCard
            key={product.id}
            product={product}
            onClick={() => setSelectedProduct(product)}
            onAdd={() => openQuantityModal(product)}
          />
        ))}
      </section>

      <ProductPreviewModal
        product={selectedProduct}
        open={selectedProduct !== null}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
        onAdd={() => selectedProduct && openQuantityModal(selectedProduct)}
      />

      {quantityProduct && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-[#A71A14] px-5 py-4 text-white">
              <h3 className="font-serif text-lg font-bold">Escolher Quantidade</h3>
              <Button variant="ghost" size="icon" onClick={() => setQuantityProduct(null)} className="text-white hover:bg-white/10 hover:text-white">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="space-y-5 px-5 py-7 text-center">
              <p className="text-sm font-semibold text-[#4d3227]">{quantityProduct.name}</p>
              <div className="mx-auto h-24 w-24 overflow-hidden rounded-lg bg-[#FFF8E7]">
                {quantityProduct.image ? <img src={quantityProduct.image} alt={quantityProduct.name} className="h-full w-full object-cover" /> : <ShoppingCart className="m-7 h-10 w-10 text-[#DFB316]" />}
              </div>
              <p className="text-base font-bold text-[#8E1611]">{quantityProduct.sale_unit?.toUpperCase() || 'UN'} R$ {Number(quantityProduct.price).toFixed(2).replace('.', ',')}</p>
              <div className="flex items-center justify-center gap-7">
                <Button size="icon" onClick={() => setQuantity(value => Math.max(1, value - 1))} className="h-9 w-9 bg-[#DFB316] text-[#4d3227] hover:bg-[#DFB316]/80">−</Button>
                <span className="min-w-5 text-xl font-bold text-[#4d3227]">{quantity}</span>
                <Button size="icon" onClick={() => setQuantity(value => Math.min(quantityProduct.stock, value + 1))} className="h-9 w-9 bg-[#DFB316] text-[#4d3227] hover:bg-[#DFB316]/80">+</Button>
              </div>
              <div className="rounded-lg bg-[#FFF8E7] py-3"><span className="block text-[10px] font-bold uppercase text-[#4d3227]/60">Valor Total</span><strong className="text-lg text-[#A71A14]">R$ {(Number(quantityProduct.price) * quantity).toFixed(2).replace('.', ',')}</strong></div>
              <div className="space-y-2">
                <Button onClick={() => { addToCart(quantityProduct, quantity); setQuantityProduct(null); }} className="h-12 w-full bg-[#A71A14] font-bold text-white hover:bg-[#8E1611]">Adicionar ao Carrinho</Button>
                <Button variant="ghost" onClick={() => setQuantityProduct(null)} className="h-10 w-full bg-[#e5e5e5] font-bold text-[#4d3227] hover:bg-[#d8d8d8]">Cancelar</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Modal / Sidebar */}
      {isHydrated && cart.length > 0 && (
        <div className="fixed bottom-8 right-8 z-50">
          <Button 
            onClick={() => setIsCheckoutOpen(true)}
            className="h-16 px-8 rounded-full bg-[#8E1611] text-white shadow-2xl hover:scale-105 transition-transform flex items-center gap-4 border-2 border-[#DFB316]"
          >
            <div className="relative">
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute -top-2 -right-2 bg-[#539D17] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#8E1611]">
                {cart.length}
              </span>
            </div>
            <div className="text-left border-l border-white/20 pl-4">
              <p className="text-[10px] font-bold text-[#DFB316] uppercase tracking-widest leading-none mb-1">Finalizar</p>
              <p className="text-lg font-bold leading-none">R$ {cartTotal.toFixed(2)}</p>
            </div>
          </Button>
        </div>
      )}

      {/* Checkout Dialog */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-[#4d3227]/10 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-[#4d3227]">Finalizar Compra</h3>
                <p className="text-xs font-bold text-[#539D17] uppercase tracking-widest mt-1">Total: R$ {cartTotal.toFixed(2)}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsCheckoutOpen(false)} className="rounded-full">
                <X className="w-6 h-6" />
              </Button>
            </div>
            
            <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-[#4d3227]/50 uppercase tracking-widest">Informações de Contato</p>
                <input 
                  type="text"
                  placeholder="Seu nome completo"
                  className="w-full px-4 h-12 rounded-xl border border-[#4d3227]/10 focus:outline-none focus:ring-2 focus:ring-[#e8b57d]/20 transition-all text-sm"
                  id="customer-name"
                />
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-bold text-[#4d3227]/50 uppercase tracking-widest">Forma de Pagamento</p>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'pix', label: 'PIX', desc: 'Na hora' },
                    { id: 'money', label: 'Dinheiro', desc: 'Entrega' },
                    { id: 'card', label: 'Cartão', desc: 'Entrega' }
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id as any)}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all text-left",
                        paymentMethod === method.id 
                          ? "border-[#8E1611] bg-[#8E1611]/5" 
                          : "border-[#DFB316]/10 hover:border-[#8E1611]/30"
                      )}
                    >
                      <p className="text-sm font-bold text-[#4d3227]">{method.label}</p>
                      <p className="text-[10px] font-medium text-muted-foreground">{method.desc}</p>
                    </button>
                  ))}
                </div>
               </div>

               {paymentMethod === 'money' && (
                 <div className="space-y-3 rounded-2xl bg-[#FFF8E7] p-4">
                   <div className="flex items-center justify-between">
                     <p className="text-[10px] font-bold uppercase tracking-widest text-[#4d3227]/60">Pagamento em dinheiro</p>
                     <span className="text-xs font-bold text-[#539D17]">Troco: R$ {Math.max(0, (Number(cashReceived.replace(',', '.')) || 0) - cartTotal).toFixed(2).replace('.', ',')}</span>
                   </div>
                   <input
                     type="text"
                     inputMode="decimal"
                     value={cashReceived}
                     onChange={(event) => setCashReceived(event.target.value)}
                     placeholder="Valor recebido (ex.: 50,00)"
                     className="h-12 w-full rounded-xl border border-[#DFB316]/30 bg-white px-4 text-sm text-[#4d3227] focus:outline-none focus:ring-2 focus:ring-[#DFB316]/30"
                   />
                   <p className="text-xs text-[#4d3227]/60">O pedido será confirmado após a conferência do valor na entrega.</p>
                 </div>
               )}

               {paymentMethod === 'card' && (
                 <div className="rounded-2xl bg-[#FFF8E7] p-4 text-sm text-[#4d3227]">
                   Pagamento presencial na entrega. Não é necessário informar dados do cartão.
                 </div>
               )}

               <div className="space-y-4">
                 <p className="text-[10px] font-bold text-[#4d3227]/50 uppercase tracking-widest">Resumo do Pedido</p>
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex justify-between items-center text-sm">
                      <span className="font-medium text-[#4d3227]">{item.quantity}x {item.product.name}</span>
                      <span className="font-bold">R$ {(item.product.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-8 bg-[#4d3227]/5">
              <Button 
                onClick={handleCheckout}
                className="w-full h-14 bg-[#8E1611] hover:bg-[#A71A14] text-white rounded-2xl font-bold uppercase tracking-widest text-sm"
              >
                Confirmar Pedido • R$ {cartTotal.toFixed(2)}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </StoreLayout>
  );
}

function ProductCard({ product, onClick, onAdd }: { product: Product, onClick: () => void, onAdd: () => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onClick();
      }}
      className="group bg-white rounded-2xl shadow-sm border border-[#DFB316]/10 overflow-hidden flex flex-col transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer"
    >
      <div className="aspect-[4/5] bg-[#F5F5F5] relative overflow-hidden">
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#8E1611]/10">
            <ShoppingCart className="w-16 h-16" />
          </div>
        )}
        <div className="absolute bottom-4 right-4 w-10 h-10 bg-[#DFB316] text-[#4d3227] rounded-full flex items-center justify-center text-[10px] font-bold shadow-md">
          {product.sale_unit?.toUpperCase() || 'UN'}
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-1 space-y-3">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-[#DFB316] uppercase tracking-widest">{product.category || 'Temperos'}</p>
          <h4 className="font-bold text-[#2D2D2D] text-lg leading-tight line-clamp-2">{product.name}</h4>
        </div>
        
        {product.description && (
          <p className="text-[10px] text-[#666666] line-clamp-1 italic">{product.description}</p>
        )}
        
        <div className="pt-2 mt-auto flex items-center justify-between border-t border-[#DFB316]/5">
          <div className="space-y-0.5">
            <p className="text-[9px] font-bold text-[#666666] uppercase tracking-widest">R$</p>
            <p className="text-2xl font-black text-[#8E1611] leading-none">
              {Number(product.price).toFixed(2)}
            </p>
          </div>
          <Button
            onClick={(event) => {
              event.stopPropagation();
              onAdd();
            }}
            className="h-10 px-6 rounded-lg bg-[#8E1611] hover:bg-[#A71A14] text-white font-bold uppercase tracking-widest text-[10px] transition-all"
          >
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
}
