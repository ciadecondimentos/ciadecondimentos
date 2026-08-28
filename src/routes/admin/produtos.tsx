import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { 
  Search, 
  Plus, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  ArrowLeft,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Truck,
  BarChart3,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getProducts, upsertProduct, deleteProduct, type Product } from "@/lib/products.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ProductModal } from "@/components/ProductModal";
import { ProductPreviewModal } from "@/components/ProductPreviewModal";
import { useSidebar } from "@/hooks/use-sidebar";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";


export const Route = createFileRoute("/admin/produtos")({
  head: () => ({
    meta: [
      { title: "Produtos - Cia. Condimentos e Especiarias" },
      { name: "description", content: "Gerenciamento de produtos da Cia. Condimentos e Especiarias." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData({
      queryKey: ["products"],
      queryFn: () => getProducts(),
    });
  },
  component: ProductsPage,
});



function ProductsPage() {
  const queryClient = useQueryClient();
  const { data: products = [], isFetching } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts(),
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todas Categorias");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const saveProductFn = useServerFn(upsertProduct);
  const deleteProductFn = useServerFn(deleteProduct);

  // Filtragem
  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (product.id && String(product.id).toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === "Todas Categorias" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Paginação
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const onCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategoryFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleEdit = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const handlePreview = (product: Product) => {
    setSelectedProduct(product);
    setIsPreviewOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string | number) => {
    e.preventDefault();
    e.stopPropagation();
    setProductToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const onSaveProduct = async (data: any) => {
    try {
      await saveProductFn({ data });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(data.id ? "Produto atualizado com sucesso!" : "Produto cadastrado com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar produto.");
    }
  };

  const onConfirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteProductFn({ data: productToDelete });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto excluído com sucesso!");
    } catch (error) {
      toast.error("Erro ao excluir produto.");
    } finally {
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };


  const { isCollapsed } = useSidebar();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(isCollapsed);

  useEffect(() => {
    const handleStateChange = () => {
      const saved = localStorage.getItem("sidebar-collapsed") === "true";
      setIsSidebarCollapsed(saved);
    };

    window.addEventListener("sidebar-state-change", handleStateChange);
    return () => window.removeEventListener("sidebar-state-change", handleStateChange);
  }, []);

  const navMenuItems = [
    { label: 'Dashboard E-Commerce', to: '/admin', icon: LayoutDashboard, active: false },
    { label: 'Produtos', to: '/admin/produtos', icon: Package, active: true },
    { label: 'Pedidos', to: '/admin/pedidos', icon: ShoppingCart, active: false },
    { label: 'Clientes', to: '/admin/clientes', icon: Users, active: false },
    { label: 'Fornecedores', to: '/admin/fornecedores', icon: Truck, active: false },
    { label: 'Financeiro', to: '/admin/financeiro', icon: BarChart3, active: false },
    { label: 'Configurações', to: '#', icon: Settings, active: false },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar productCount={products.length} currentPath="/admin/produtos" />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Produtos" />

        <main className="max-w-[1400px] w-full mx-auto p-3 sm:p-6 md:p-10 space-y-6 md:space-y-8 transition-all duration-300">


        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-foreground tracking-tight mb-1 font-serif italic">Produtos</h1>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                 <span className="text-muted-foreground text-sm font-bold uppercase tracking-widest">Sistema Online</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted transition-all text-sm font-bold text-foreground">
              <RotateCw className="w-4 h-4" />
              <span>Atualizar</span>
            </button>
            <button 
              onClick={handleAddNew}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-primary/20"
            >
              <Plus className="w-5 h-5" />
              <span>Novo Produto</span>
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-card border border-border rounded-[20px] p-4 flex flex-col md:flex-row gap-4 items-center shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar produto pelo nome ou código..." 
              value={searchTerm}
              onChange={onSearchChange}
              className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-56">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select 
                value={categoryFilter}
                onChange={onCategoryChange}
                className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl outline-none focus:border-primary appearance-none text-sm font-medium cursor-pointer"
              >
                <option value="Todas Categorias">Todas Categorias</option>
                <option value="Temperos">Temperos</option>
                <option value="Pimentas">Pimentas</option>
                <option value="Ervas">Ervas</option>
                <option value="Molhos">Molhos</option>
                <option value="Especiarias">Especiarias</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-card border border-border rounded-[20px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#4d3227] text-[#e8b57d]">
                  <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-widest">Produto</th>
                  <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-widest">Cod</th>
                  <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-widest">Categoria</th>
                  <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-widest">Preço</th>
                  <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-widest">Estoque</th>
                  <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-widest">Status</th>
                  <th className="px-6 py-5 text-right text-xs font-bold uppercase tracking-widest">Ações</th>
                </tr>
              </thead>
              <tbody className={cn("divide-y divide-border transition-opacity duration-200", isFetching && "opacity-50")}>
                {paginatedProducts.map((product: Product) => {
                  const status = product.stock === 0 
                    ? 'Esgotado' 
                    : (product.stock < 20 ? 'Baixo Estoque' : 'Em Estoque');
                  
                  return (
                    <tr key={product.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div 
                            onClick={() => handlePreview(product)}
                            className="w-12 h-12 rounded-lg bg-[#e8b57d]/10 overflow-hidden flex-shrink-0 border border-border group-hover:border-[#c62828] transition-colors flex items-center justify-center cursor-pointer"
                          >
                            {product.image ? (
                              <img 
                                src={product.image} 
                                alt={product.name} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Sem+Imagem';
                                }}
                              />
                            ) : (
                              <Package className="w-6 h-6 text-[#e8b57d]/40" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span 
                              onClick={() => handlePreview(product)}
                              className="font-bold text-foreground group-hover:text-primary transition-colors cursor-pointer"
                            >
                              {product.name}
                            </span>
                            {product.sale_unit && (
                              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                {product.sale_unit}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-muted-foreground">#{String(product.id || '').slice(0, 8)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary-foreground text-xs font-bold uppercase tracking-wider">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-foreground">R$ {Number(product.price).toFixed(2).replace('.', ',')}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Package className={cn(
                            "w-4 h-4",
                            product.stock === 0 ? "text-primary" : 
                            product.stock < 20 ? "text-secondary" : "text-success"
                          )} />
                          <span className="font-bold">{product.stock} un</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                          status === 'Em Estoque' ? "bg-success/10 text-success" : 
                          status === 'Baixo Estoque' ? "bg-secondary/10 text-secondary-foreground" :
                          "bg-primary/10 text-primary"
                        )}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handlePreview(product)}
                            className="p-2 rounded-lg hover:bg-success/10 hover:text-success text-muted-foreground transition-all"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => handleEdit(e, product)}
                            className="p-2 rounded-lg hover:bg-secondary/10 hover:text-secondary-foreground text-muted-foreground transition-all"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => handleDeleteClick(e, product.id)}
                            className="p-2 rounded-lg hover:bg-primary/10 hover:text-primary text-muted-foreground transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-6 py-5 bg-muted/20 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center sm:text-left">
                Exibindo {paginatedProducts.length} de {filteredProducts.length} produtos
              </span>
              {filteredProducts.length > 10 && (
                <button
                  onClick={() => {
                    if (itemsPerPage === 10) {
                      setItemsPerPage(filteredProducts.length);
                      setCurrentPage(1);
                    } else {
                      setItemsPerPage(10);
                      setCurrentPage(1);
                    }
                  }}
                  className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors border-b border-primary/30 hover:border-primary pb-0.5"
                >
                  {itemsPerPage === 10 ? "Exibir todos os produtos" : "Ver paginado (10 por página)"}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-50 text-muted-foreground transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={cn(
                    "w-8 h-8 rounded-full text-xs font-bold transition-all",
                    currentPage === page 
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                      : "hover:bg-muted text-muted-foreground"
                  )}
                >
                  {page}
                </button>
              ))}

              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-50 text-muted-foreground transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-[1400px] mx-auto p-10 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-10">

        <div className="flex items-center gap-8">
          <a href="#" className="hover:text-primary transition-colors">Suporte Técnico</a>
          <a href="#" className="hover:text-primary transition-colors">Termos de Uso</a>
          <a href="#" className="hover:text-primary transition-colors">Políticas</a>
        </div>
        <div className="text-center md:text-right">
          © 2026 Cia. de Condimentos e Especiarias • Plataforma de Gestão E-commerce
        </div>
      </footer>
        <ProductModal 
          product={selectedProduct} 
          open={isModalOpen} 
          onOpenChange={setIsModalOpen}
          onSave={onSaveProduct}
        />

        <ProductPreviewModal
          product={selectedProduct}
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
        />

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border rounded-[20px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-serif font-bold text-foreground">Excluir Produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold uppercase tracking-widest border-border">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={onConfirmDelete}
              className="bg-primary hover:brightness-110 text-primary-foreground rounded-xl font-bold uppercase tracking-widest"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}
