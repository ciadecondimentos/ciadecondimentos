import * as React from "react"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { type Product } from "@/lib/products.functions"
import { Package, Tag, BarChart3, Info, Calendar, Hash, ShoppingCart } from "lucide-react"

interface ProductPreviewModalProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd?: () => void
}

export function ProductPreviewModal({ product, open, onOpenChange, onAdd }: ProductPreviewModalProps) {
  if (!product) return null

  const status = product.stock === 0 
    ? 'Esgotado' 
    : (product.stock < 20 ? 'Baixo Estoque' : 'Em Estoque');

  const statusColors = {
    'Em Estoque': 'bg-success/10 text-success border-success/20',
    'Baixo Estoque': 'bg-secondary/10 text-secondary-foreground border-secondary/20',
    'Esgotado': 'bg-primary/10 text-primary border-primary/20'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-3xl flex-col overflow-hidden rounded-2xl border-border bg-card p-0 gap-0 shadow-2xl md:flex-row md:max-h-[min(760px,calc(100dvh-2rem))]">
        {/* Banner de Status */}
        <div className={`h-2 w-full ${status === 'Em Estoque' ? 'bg-success' : status === 'Baixo Estoque' ? 'bg-secondary' : 'bg-primary'}`} />
        
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* Imagem do Produto */}
          <div className="relative h-44 w-full shrink-0 overflow-hidden bg-muted/30 group sm:h-52 md:h-auto md:w-2/5">
            {product.image ? (
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                <Package className="w-24 h-24" />
              </div>
            )}
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
              <span className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] border shadow-sm backdrop-blur-md ${statusColors[status]}`}>
                {status}
              </span>
            </div>
          </div>

          {/* Informações */}
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 sm:p-6 md:p-8">
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-muted rounded text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                  #{String(product.id || '').slice(0, 8)}
                </span>
                {product.category && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-secondary uppercase tracking-widest">
                    <Tag className="w-3 h-3" />
                    {product.category}
                  </span>
                )}
              </div>
              <h2 className="pr-7 text-2xl sm:text-3xl md:text-4xl font-serif italic font-bold text-foreground leading-tight">{product.name}</h2>
              {product.sale_unit && (
                <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-[0.15em] mt-1 block">
                  Venda por {product.sale_unit}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
              <div className="bg-background border border-border rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Preço Sugerido</span>
                </div>
                <div className="text-lg sm:text-2xl font-bold text-foreground">
                  R$ {Number(product.price).toFixed(2).replace('.', ',')}
                </div>
              </div>
              <div className="bg-background border border-border rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Package className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Disponível</span>
                </div>
                <div className="text-lg sm:text-2xl font-bold text-foreground">
                  {product.stock} <span className="text-sm font-medium text-muted-foreground">{product.sale_unit === 'KG' ? 'kg' : 'un'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4 flex-1">
              {product.description && (
                <div>
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Info className="w-3 h-3" /> Descrição do Produto
                  </h3>
                  <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed font-medium bg-muted/20 p-3 sm:p-4 rounded-xl border border-border/50">
                    {product.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {product.cod && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                      <Hash className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase block">Código Interno</span>
                      <span className="text-xs font-bold">{product.cod}</span>
                    </div>
                  </div>
                )}
                {product.expiry && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase block">Validade Média</span>
                      <span className="text-xs font-bold">{product.expiry}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 sm:mt-6 md:mt-8 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-11 px-6 rounded-xl font-bold uppercase tracking-widest text-xs"
              >
                Fechar
              </Button>
              {onAdd && product.stock > 0 && (
                <Button
                  onClick={onAdd}
                  className="h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold uppercase tracking-widest text-xs"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Adicionar ao Carrinho
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
