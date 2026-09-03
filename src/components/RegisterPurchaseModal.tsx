import { useMemo, useRef, useState } from "react";
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
  title?: string;
  initialItems?: any[];
  initialDate?: string;
  initialPaymentMethod?: string;
  initialPaymentStatus?: string;
  initialNotes?: string;
}

const toFiniteNumber = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;

  const normalized = value.trim().replace(/^R\$\s*/i, "");
  const parsed = normalized.includes(",")
    ? Number(normalized.replace(/\./g, "").replace(",", "."))
    : Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function RegisterPurchaseModal({ customer, products, onClose, onSave, isSaving, title, initialItems, initialDate, initialPaymentMethod, initialPaymentStatus, initialNotes }: RegisterPurchaseModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"UN" | "KG">("UN");
  const [selectedItems, setSelectedItems] = useState<any[]>(initialItems || []);
  const [isValueExpanded, setIsValueExpanded] = useState(false);
  const [valuePopupPosition, setValuePopupPosition] = useState<{ left: number; top: number } | null>(null);
  const valuePopupRef = useRef<HTMLDivElement>(null);
  const valueDragRef = useRef({ pointerId: -1, startX: 0, startY: 0, startLeft: 0, startTop: 0 });
  const valueWasDraggedRef = useRef(false);
  
  // Form states
  const [purchaseDate, setPurchaseDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState(initialPaymentMethod || "dinheiro");
  const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus || "pago");
  const [notes, setNotes] = useState(initialNotes || "");

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
        const unitPrice = toFiniteNumber(product.price);
        return [...prev, {
          product_name: product.name,
          quantity: 1,
          unit_price: unitPrice,
          total_price: unitPrice
        }];
      }
    });
  };

  const updateQuantity = (productName: string, quantity: number) => {
    setSelectedItems(prev => prev.map(item => {
      if (item.product_name === productName) {
        if (!Number.isFinite(quantity)) return item;
        const q = Math.max(0.1, quantity);
        const safeUnitPrice = toFiniteNumber(item.unit_price);
        return { ...item, quantity: q, unit_price: safeUnitPrice, total_price: q * safeUnitPrice };
      }
      return item;
    }));
  };

  const adjustQuantity = (product: Product, amount: number) => {
    const selected = selectedItems.find(item => item.product_name === product.name);
    if (!selected) return;

    const isKg = product.sale_unit?.toUpperCase() === "KG";
    const step = 1;
    const minimum = isKg ? 0.1 : 1;
    const nextQuantity = Math.max(minimum, Number((selected.quantity + amount * step).toFixed(2)));
    updateQuantity(product.name, nextQuantity);
  };

  const totalPrice = selectedItems.reduce((acc, item) => {
    const quantity = toFiniteNumber(item.quantity);
    const unitPrice = toFiniteNumber(item.unit_price);
    return acc + quantity * unitPrice;
  }, 0);

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

  const handleValuePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const popup = valuePopupRef.current;
    if (!popup) return;

    const bounds = popup.getBoundingClientRect();
    valueDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: bounds.left,
      startTop: bounds.top
    };
    valueWasDraggedRef.current = false;
    popup.setPointerCapture(event.pointerId);
  };

  const handleValuePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (valueDragRef.current.pointerId !== event.pointerId) return;

    const popup = valuePopupRef.current;
    if (!popup) return;

    const bounds = popup.getBoundingClientRect();
    const nextLeft = valueDragRef.current.startLeft + event.clientX - valueDragRef.current.startX;
    const nextTop = valueDragRef.current.startTop + event.clientY - valueDragRef.current.startY;
    const left = Math.max(0, Math.min(nextLeft, window.innerWidth - bounds.width));
    const top = Math.max(0, Math.min(nextTop, window.innerHeight - bounds.height));

    if (Math.abs(event.clientX - valueDragRef.current.startX) > 3 || Math.abs(event.clientY - valueDragRef.current.startY) > 3) {
      valueWasDraggedRef.current = true;
    }
    setValuePopupPosition({ left, top });
  };

  const handleValuePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (valueDragRef.current.pointerId === event.pointerId) {
      valueDragRef.current.pointerId = -1;
      if (valuePopupRef.current?.hasPointerCapture(event.pointerId)) {
        valuePopupRef.current.releasePointerCapture(event.pointerId);
      }
    }
  };

  const handleValueClick = () => {
    if (valueWasDraggedRef.current) {
      valueWasDraggedRef.current = false;
      return;
    }
    setIsValueExpanded(prev => !prev);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative bg-card w-full max-w-2xl max-h-[95vh] rounded-2xl sm:rounded-[32px] border border-border shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-[#c23321] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Plus className="w-6 h-6" />
            <h2 className="text-xl font-bold font-serif">{title || "Registrar Compra"}</h2>
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
                        "p-3 sm:p-4 rounded-xl border transition-all cursor-pointer flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-4",
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
                      <div className="min-w-0 flex-1">
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
                        <div className="flex w-full sm:w-auto shrink-0 items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            aria-label={`Remover ${product.name}`}
                            onClick={() => adjustQuantity(product, -1)}
                            className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg border border-border bg-white text-[#c23321] hover:bg-red-50 transition-all"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input 
                            type="number" 
                            step={product.sale_unit?.toUpperCase() === "KG" ? "0.1" : "1"}
                            min={product.sale_unit?.toUpperCase() === "KG" ? "0.1" : "1"}
                            value={selected.quantity}
                            onChange={(e) => updateQuantity(product.name, parseFloat(e.target.value))}
                            className="h-8 w-12 sm:w-16 shrink-0 px-1 sm:px-2 bg-white border border-border rounded-lg text-xs text-center"
                          />
                          <button
                            type="button"
                            aria-label={`Adicionar ${product.name}`}
                            onClick={() => adjustQuantity(product, 1)}
                            className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg bg-[#c23321] text-white hover:brightness-110 transition-all"
                          >
                            <Plus className="w-4 h-4" />
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

      </div>

      {/* Floating Value Popup */}
      <div
        ref={valuePopupRef}
        onPointerDown={handleValuePointerDown}
        onPointerMove={handleValuePointerMove}
        onPointerUp={handleValuePointerUp}
        onPointerCancel={handleValuePointerUp}
        onClick={handleValueClick}
        style={valuePopupPosition ?? { left: 12, top: 72 }}
        className="fixed z-[70] cursor-grab touch-none select-none active:cursor-grabbing"
      >
          {isValueExpanded ? (
            <div className="w-40 rounded-2xl border-2 border-[#c99d00] bg-[#f1c40f] px-4 py-3 shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex-1">
                <p className="text-[9px] font-black text-[#4d3227] uppercase tracking-widest leading-tight">Valor</p>
                <p className="text-lg font-bold text-[#4d3227]">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice)}
                </p>
              </div>
              <button
                onClick={(event) => { event.stopPropagation(); setIsValueExpanded(false); }}
                className="flex-shrink-0 w-6 h-6 bg-[#c23321] text-white rounded-full flex items-center justify-center hover:brightness-110 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              aria-label="Ver valor total"
              className="w-14 h-14 rounded-full bg-[#f1c40f] border-2 border-[#c99d00] text-[#4d3227] shadow-lg flex items-center justify-center hover:brightness-105 transition-all font-bold text-sm"
            >
              R$
            </button>
          )}
      </div>
    </div>
  );
}
