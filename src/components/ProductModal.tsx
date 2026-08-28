import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type Product } from "@/lib/products.functions"
import { ImagePlus, Loader2 } from "lucide-react"
import { useServerFn } from "@tanstack/react-start"
import { uploadImage } from "@/lib/upload.functions"
import { toast } from "sonner"

const productSchema = z.object({
  id: z.any().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  category: z.string().nullable().optional(),
  price: z.coerce.number().min(0, "Preço deve ser positivo"),
  stock: z.coerce.number().min(0, "Estoque deve ser positivo"),
  description: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  cod: z.string().nullable().optional(),
  weight: z.string().nullable().optional(),
  origin: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  expiry: z.string().nullable().optional(),
  active: z.boolean(),
  sale_unit: z.string().nullable().optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductModalProps {
  product?: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: ProductFormValues) => Promise<void>
}

export function ProductModal({ product, open, onOpenChange, onSave }: ProductModalProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      id: product?.id !== undefined ? String(product.id) : undefined,
      name: product?.name || "",
      category: product?.category || "",
      price: product?.price || 0,
      stock: product?.stock || 0,
      description: product?.description || "",
      image: product?.image || "",
      barcode: product?.barcode || "",
      cod: product?.cod || "",
      weight: product?.weight || "",
      origin: product?.origin || "",
      brand: product?.brand || "",
      expiry: product?.expiry || "",
      active: product?.active ?? true,
      sale_unit: product?.sale_unit || "Unidade",
    },
  })

  React.useEffect(() => {
    if (open) {
      form.reset({
        id: product?.id !== undefined ? String(product.id) : undefined,
        name: product?.name || "",
        category: product?.category || "",
        price: product?.price || 0,
        stock: product?.stock || 0,
        description: product?.description || "",
        image: product?.image || "",
        barcode: product?.barcode || "",
        cod: product?.cod || "",
        weight: product?.weight || "",
        origin: product?.origin || "",
        brand: product?.brand || "",
        expiry: product?.expiry || "",
        active: product?.active ?? true,
        sale_unit: product?.sale_unit || "Unidade",
      })
    }
  }, [open, product, form])

  const uploadFile = useServerFn(uploadImage)
  const [isUploading, setIsUploading] = React.useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append("file", file)
      
      const result = await uploadFile({ data: formData })
      if (result && typeof result === 'object' && 'url' in result) {
        form.setValue("image", result.url as string)
        toast.success("Imagem enviada com sucesso!")
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Erro ao enviar imagem. Verifique as configurações do Cloudinary.")
    } finally {
      setIsUploading(false)
    }
  }

  const onSubmit = async (values: ProductFormValues) => {
    try {
      await onSave(values)
      onOpenChange(false)
    } catch (error) {
      console.error("Form submission error:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border rounded-[20px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif font-bold text-foreground">
            {product ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-full">
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nome do Produto</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-background border-border rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger className="bg-background border-border rounded-xl">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Temperos">Temperos</SelectItem>
                        <SelectItem value="Pimentas">Pimentas</SelectItem>
                        <SelectItem value="Ervas">Ervas</SelectItem>
                        <SelectItem value="Molhos">Molhos</SelectItem>
                        <SelectItem value="Especiarias">Especiarias</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sale_unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Unidade de Venda</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "Unidade"}>
                      <FormControl>
                        <SelectTrigger className="bg-background border-border rounded-xl">
                          <SelectValue placeholder="Selecione a unidade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Unidade">Unidade</SelectItem>
                        <SelectItem value="KG">KG</SelectItem>
                        <SelectItem value="Gramas">Gramas</SelectItem>
                        <SelectItem value="Pacote">Pacote</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Preço (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} className="bg-background border-border rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Estoque</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} className="bg-background border-border rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Código Interno</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} className="bg-background border-border rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Código de Barras</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} className="bg-background border-border rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem className="col-span-full">
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex justify-between items-center">
                      <span>Imagem do Produto</span>
                      {isUploading && <span className="flex items-center gap-1 text-primary animate-pulse"><Loader2 className="w-3 h-3 animate-spin" /> Enviando...</span>}
                    </FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input {...field} value={field.value || ""} className="bg-background border-border rounded-xl" placeholder="https://exemplo.com/imagem.jpg" />
                      </FormControl>
                      <div className="relative">
                        <Input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="rounded-xl border-dashed border-2 aspect-square p-2 h-full hover:bg-muted"
                          disabled={isUploading}
                        >
                          <ImagePlus className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="col-span-full">
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Descrição</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} className="bg-background border-border rounded-xl min-h-[100px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl font-bold uppercase tracking-widest border-border hover:bg-muted transition-colors">
                Cancelar
              </Button>
              <Button type="submit" className="bg-primary hover:brightness-110 text-primary-foreground rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-primary/20 transition-all">
                {product ? "Salvar Alterações" : "Cadastrar Produto"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
