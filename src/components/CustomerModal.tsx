import { useState } from "react";
import { X, User, Phone, MapPin, Star, Save, RotateCw } from "lucide-react";

interface CustomerModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
  isSaving: boolean;
}

export function CustomerModal({ onClose, onSave, isSaving }: CustomerModalProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    whatsapp: "",
    address: "",
    neighborhood: "",
    city: "",
    birthday: "",
    observations: "",
    is_vip: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card w-full max-w-2xl max-h-[90vh] rounded-[32px] border border-border shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 bg-primary text-primary-foreground flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif italic">Novo Cliente</h2>
              <p className="text-[10px] opacity-80 font-black uppercase tracking-widest">Cadastro de cliente no CRM</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome Completo */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nome Completo *</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                <input
                  required
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-muted/30 border border-border rounded-xl focus:border-primary outline-none transition-all text-sm font-bold"
                  placeholder="Ex: João Silva"
                />
              </div>
            </div>

            {/* Contatos */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Telefone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-muted/30 border border-border rounded-xl focus:border-primary outline-none transition-all text-sm font-bold"
                  placeholder="(00) 0000-0000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                <input
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-muted/30 border border-border rounded-xl focus:border-primary outline-none transition-all text-sm font-bold"
                  placeholder="(00) 90000-0000"
                />
              </div>
            </div>

            {/* Endereço */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Endereço</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                <input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-muted/30 border border-border rounded-xl focus:border-primary outline-none transition-all text-sm font-bold"
                  placeholder="Rua, número, apto..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Bairro</label>
              <input
                name="neighborhood"
                value={formData.neighborhood}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:border-primary outline-none transition-all text-sm font-bold"
                placeholder="Bairro"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Cidade</label>
              <input
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:border-primary outline-none transition-all text-sm font-bold"
                placeholder="Cidade"
              />
            </div>

            {/* Outros */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Data de Nascimento</label>
              <input
                type="date"
                name="birthday"
                value={formData.birthday}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:border-primary outline-none transition-all text-sm font-bold"
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="is_vip"
                name="is_vip"
                checked={formData.is_vip}
                onChange={handleChange}
                className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="is_vip" className="flex items-center gap-2 cursor-pointer group">
                <Star className={`w-4 h-4 transition-colors ${formData.is_vip ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground group-hover:text-yellow-500'}`} />
                <span className="text-xs font-bold text-foreground uppercase tracking-widest">Cliente VIP</span>
              </label>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Observações</label>
              <textarea
                name="observations"
                value={formData.observations}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:border-primary outline-none transition-all text-sm font-bold resize-none"
                placeholder="Notas adicionais sobre o cliente..."
              />
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 border border-border rounded-2xl hover:bg-muted transition-all text-[10px] font-black uppercase tracking-widest"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-6 py-4 bg-primary text-primary-foreground rounded-2xl hover:brightness-110 transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar Cliente
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
