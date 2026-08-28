import { useState, useMemo } from "react";
import { X, Search, Plus, Minus, Trash2, Calendar, DollarSign, Tag, Check, RotateCw, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Customer } from "@/lib/customers.functions";
import type { Product } from "@/lib/products.functions";

interface RegisterPurchaseModalProps {
  customer: Customer;
  products: Product[];
  onClose: () => void;
  onSave: (data: any) => void;
  isSaving: boolean;
}

export function RegisterPurchaseModal({ customer, products, onClose, onSave, isSaving }: RegisterPurchaseModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"UN" | "KG">("UN");
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [isValueExpanded, setIsValueExpanded] = useState(false);
  
  // Form states
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState("dinheiro");
  const [paymentStatus, setPaymentStatus] = useState("pago");
  const [notes, setNotes] = useState("");

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const saleUnit = (p.sale_unit || "UN").toUpperCase();
      const matchesTab = activeTab === "KG" ? saleUnit === "KG" : saleUnit === "UN" || saleUnit === "UNIDADE";
      return matchesSearch && matchesTab;
    });
  }, [products, searchTerm, activeTab]);

  const stats = useMemo(() => {
    const unCount = products.filter(p => {
      const saleUnit = (p.sale_unit || "UN").toUpperCase();
      return saleUnit === "UN" || saleUnit === "UNIDADE";
    }).length;
    const kgCount = products.filter(p => p.sale_unit?.toUpperCase() === "KG").length;
    return { unCount, kgCount };
  }, [products]);

  const toggleProduct = (product: Product) => {
    setSelectedItems(prev => {
      const exists = prev.find(item => item.product_name === product.name);
      if (exists) {
        return prev.filter(item => item.product_name !== product.name);
      } else {
        return [...prev, {
          product_name: product.name,
          quantity: 1,
          unit_price: product.price,
          total_price: product.price
        }];
      }
    });
  };

  const updateQuantity = (productName: string, quantity: number) => {
    setSelectedItems(prev => prev.map(item => {
      if (item.product_name === productName) {
        if (!Number.isFinite(quantity)) return item;
        const q = Math.max(0.1, quantity);
        return { ...item, quantity: q, total_price: q * item.unit_price };
      }
      return item;
    }));
  };

  const adjustQuantity = (product: Product, amount: number) => {
    const selected = selectedItems.find(item => item.product_name === product.name);
    if (!selected) return;

    const isKg = product.sale_unit?.toUpperCase() === "KG";
    const step = isKg ? 0.1 : 1;
    const minimum = isKg ? 0.1 : 1;
    const nextQuantity = Math.max(minimum, Number((selected.quantity + amount * step).toFixed(2)));
    updateQuantity(product.name, nextQuantity);
  };

  const totalPrice = selectedItems.reduce((acc, item) => acc + item.total_price, 0);

  const handleSave = () => {
    if (selectedItems.length === 0) return;
    onSave({
      customer_id: customer.id,
      purchase_date: purchaseDate,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      notes,
      items: selectedItems
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card w-full max-w-2xl max-h-[95vh] rounded-[32px] border border-border shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-[#c23321] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Plus className="w-6 h-6" />
            <h2 className="text-xl font-bold font-serif">Registrar Compra</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Search */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#4d3227]">
              <Search className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Pesquisar Produtos</span>
            </div>
            <input 
              type="text" 
              placeholder="Digite o nome do produto..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm outline-none focus:border-[#c23321]"
            />
            <p className="text-[10px] text-muted-foreground">Mostrando {products.length} produto(s)</p>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setActiveTab("UN")}
              className={cn(
                "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-transparent",
                activeTab === "UN" ? "bg-[#f1c40f] text-[#4d3227]" : "bg-muted text-muted-foreground"
              )}
            >
              📦 Produtos em UN ({stats.unCount})
            </button>
            <button 
              onClick={() => setActiveTab("KG")}
              className={cn(
                "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-transparent",
                activeTab === "KG" ? "bg-[#f1c40f] text-[#4d3227]" : "bg-muted text-muted-foreground"
              )}
            >
              ⚖️ Produtos em KG ({stats.kgCount})
            </button>
          </div>

          {/* Product List */}
          <div className="space-y-3 min-h-[300px]">
             <div className="flex items-center gap-2 text-[#4d3227]">
                {activeTab === "UN" ? <Package className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {activeTab === "UN" ? "Produtos em UN" : "Produtos em KG"}
                </span>
             </div>
             <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border">
                {filteredProducts.map(product => {
                  const selected = selectedItems.find(item => item.product_name === product.name);
                  return (
                    <div 
                      key={product.id} 
                      className={cn(
                        "p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-4",
                        selected ? "bg-[#f2e8d5]/50 border-[#c23321]" : "bg-card border-border hover:bg-muted/30"
                      )}
                      onClick={() => toggleProduct(product)}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded border flex items-center justify-center transition-all",
                        selected ? "bg-[#c23321] border-[#c23321] text-white" : "border-border bg-white"
                      )}>
                        {selected && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-[#4d3227] text-sm">{product.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                          </span>
                          <span className="bg-muted px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-muted-foreground">
                            {product.sale_unit || "UN"}
                          </span>
                        </div>
                      </div>
                      {selected && (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            aria-label={`Adicionar ${product.name}`}
                            onClick={() => adjustQuantity(product, 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#c23321] text-white hover:brightness-110 transition-all"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <input 
                            type="number" 
                            step={product.sale_unit === "KG" ? "0.1" : "1"}
                            min={product.sale_unit === "KG" ? "0.1" : "1"}
                            value={selected.quantity}
                            onChange={(e) => updateQuantity(product.name, parseFloat(e.target.value))}
                            className="w-16 h-8 px-2 bg-white border border-border rounded-lg text-xs text-center"
                          />
                          <button
                            type="button"
                            aria-label={`Remover ${product.name}`}
                            onClick={() => adjustQuantity(product, -1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-white text-[#c23321] hover:bg-red-50 transition-all"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
             </div>
          </div>

          {/* Footer Area with Form */}
          <div className="pt-6 border-t border-border space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#4d3227] uppercase tracking-widest">DATA DA COMPRA *</label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-4 py-2 bg-card border border-border rounded-xl text-xs outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#4d3227] uppercase tracking-widest">FORMA DE PAGAMENTO</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 bg-card border border-border rounded-xl text-xs outline-none focus:border-primary"
                >
                  <option value="dinheiro">Dinheiro</option>
                  <option value="pix">PIX</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                  <option value="boleto">Boleto</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#4d3227] uppercase tracking-widest">STATUS DO PAGAMENTO</label>
              <select 
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full px-4 py-2 bg-card border border-border rounded-xl text-xs outline-none focus:border-primary"
              >
                <option value="pago">Pago</option>
                <option value="pendente">Pendente</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#4d3227] uppercase tracking-widest">OBSERVAÇÕES</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anotações sobre estas compras..."
                className="w-full px-4 py-2 bg-card border border-border rounded-xl text-xs outline-none focus:border-primary min-h-[80px] resize-none"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="p-4 border-t border-border bg-white flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-8 py-2 border border-border rounded-lg hover:bg-muted transition-all text-[10px] font-black uppercase tracking-widest"
          >
            CANCELAR
          </button>
          <button 
            onClick={handleSave}
            disabled={selectedItems.length === 0 || isSaving}
            className="px-8 py-2 bg-[#c23321] text-white rounded-lg hover:brightness-110 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            {isSaving ? <RotateCw className="w-3 h-3 animate-spin" /> : <span>💾</span>}
            SALVAR COMPRA
          </button>
        </div>

        {/* Floating Value Ball */}
        <div className="fixed bottom-6 right-6 z-[70]">
          {isValueExpanded ? (
            <div className="w-40 rounded-2xl border border-[#0070f3]/20 bg-[#eef6ff] px-4 py-3 shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex-1">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-tight">Valor</p>
                <p className="text-lg font-bold text-[#4d3227]">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice)}
                </p>
              </div>
              <button
                onClick={() => setIsValueExpanded(false)}
                className="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsValueExpanded(true)}
              className="w-12 h-12 rounded-full bg-[#c23321] text-white shadow-lg flex items-center justify-center hover:brightness-110 transition-all font-bold text-sm hover:scale-110 animate-pulse"
            >
              R$
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
