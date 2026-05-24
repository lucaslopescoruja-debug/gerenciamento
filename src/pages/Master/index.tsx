import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companiesApi } from '@/api/companies';
import { usersApi } from '@/api/users';
import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_PASSWORD_HASH } from '@/utils/crypto';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Plus, Users, Power, LogIn, Edit2, LogOut, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/components/ui/toaster';
import { useNavigate } from 'react-router-dom';
import type { Company } from '@/types/database';

export default function MasterPanel() {
  const { isMaster, switchCompany, exitCompany, company: currentCompany } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New Company State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [maxUsers, setMaxUsers] = useState(5);
  const [adminName, setAdminName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');

  // Edit Company State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: companiesApi.getCompanies,
    enabled: isMaster
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, active }: { id: string, active: boolean }) => companiesApi.updateCompany(id, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Status da empresa atualizado');
    }
  });

  const updateCompanyMutation = useMutation({
    mutationFn: (args: {id: string, updates: Partial<Company>}) => companiesApi.updateCompany(args.id, args.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Empresa atualizada com sucesso!');
      setIsEditModalOpen(false);
    },
    onError: () => toast.error('Erro ao atualizar empresa.')
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: companiesApi.deleteCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Empresa excluída com sucesso!');
      setIsEditModalOpen(false);
    },
    onError: () => toast.error('Erro ao excluir empresa.')
  });

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug || !adminName || !adminUsername) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Criar empresa
      const newCompany = await companiesApi.createCompany({
        name,
        slug: slug.toLowerCase().replace(/\s+/g, '-'),
        cnpj,
        max_users: maxUsers,
        active: true
      });

      // 2. Criar usuário admin para a empresa
      await usersApi.createUser({
        name: adminName,
        username: adminUsername,
        password_hash: DEFAULT_PASSWORD_HASH,
        role: 'admin',
        active: true,
        permissions: {
          can_view_dashboard: true,
          can_manage_loads: true,
          can_do_conference: true,
          can_manage_products: true,
          can_manage_users: true,
          can_do_delivery: true
        },
        reset_requested: false
      }, newCompany.id);

      toast.success('Empresa e administrador criados com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setIsModalOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error('Erro ao criar empresa. O Slug já pode estar em uso.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCompany = (comp: Company) => {
    setEditingCompany(comp);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;
    
    updateCompanyMutation.mutate({
      id: editingCompany.id,
      updates: {
        name: editingCompany.name,
        slug: editingCompany.slug,
        cnpj: editingCompany.cnpj,
        max_users: editingCompany.max_users
      }
    });
  };

  const handleSwitchCompany = async (id: string, name: string) => {
    const success = await switchCompany(id);
    if (success) {
      toast.success(`Contexto alterado para ${name}`);
      // Invalidate all queries to fetch new company data
      queryClient.clear();
      navigate('/');
    } else {
      toast.error('Erro ao mudar de empresa');
    }
  };

  const handleExitCompany = () => {
    exitCompany();
    toast.success('Você saiu da empresa e voltou ao acesso Global.');
    queryClient.clear();
  };

  const resetForm = () => {
    setName(''); setSlug(''); setCnpj(''); setMaxUsers(5);
    setAdminName(''); setAdminUsername('');
  };

  if (!isMaster) {
    return <div className="p-6 text-center text-red-500">Acesso negado. Apenas super administradores podem ver esta página.</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Gestão SaaS</h1>
          <p className="text-muted-foreground">Gerencie seus clientes e empresas cadastradas.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nova Empresa
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-10 text-muted-foreground">Carregando empresas...</div>
        ) : companies?.length === 0 ? (
          <div className="col-span-full text-center py-10 text-muted-foreground">Nenhuma empresa encontrada.</div>
        ) : (
          companies?.map((comp) => (
            <Card key={comp.id} className={`transition-all ${comp.id === currentCompany?.id ? 'border-primary ring-1 ring-primary/20' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      {comp.name}
                    </CardTitle>
                    <CardDescription className="mt-1">Slug: {comp.slug}</CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    {comp.id === currentCompany?.id && (
                      <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-medium">Atual</span>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleEditCompany(comp)} className="h-8 w-8">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-muted/50 p-2 rounded-lg">
                    <span className="text-muted-foreground block text-xs">CNPJ</span>
                    <span className="font-medium">{comp.cnpj || '-'}</span>
                  </div>
                  <div className="bg-muted/50 p-2 rounded-lg">
                    <span className="text-muted-foreground block text-xs">Max Usuários</span>
                    <span className="font-medium flex items-center gap-1">
                      <Users className="h-3 w-3" /> {comp.max_users}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={comp.active} 
                      onChange={(e) => toggleStatusMutation.mutate({ id: comp.id, active: e.target.checked })}
                    />
                    <span className="text-sm font-medium">{comp.active ? 'Ativa' : 'Inativa'}</span>
                  </div>
                  
                  {comp.id !== currentCompany?.id && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleSwitchCompany(comp.id, comp.name)}
                      className="gap-2"
                    >
                      <LogIn className="h-4 w-4" /> Acessar
                    </Button>
                  )}
                  {comp.id === currentCompany?.id && (
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={handleExitCompany}
                      className="gap-2"
                    >
                      <LogOut className="h-4 w-4" /> Sair
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar Nova Empresa</DialogTitle>
            <DialogDescription>
              Crie um novo ambiente de cliente e o primeiro usuário administrador dele.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateCompany} className="space-y-4 mt-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm border-b pb-1">Dados da Empresa</h3>
              <div className="space-y-2">
                <Label>Nome Fantasia/Razão Social *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Logística XYZ" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Slug (Login) *</Label>
                  <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="Ex: log-xyz" required />
                </div>
                <div className="space-y-2">
                  <Label>Limite de Usuários</Label>
                  <Input type="number" min={1} value={maxUsers} onChange={e => setMaxUsers(Number(e.target.value))} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="Opcional" />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="font-semibold text-sm border-b pb-1">Primeiro Administrador</h3>
              <div className="space-y-2">
                <Label>Nome Completo *</Label>
                <Input value={adminName} onChange={e => setAdminName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Usuário de Login *</Label>
                <Input value={adminUsername} onChange={e => setAdminUsername(e.target.value)} required />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Criando...' : 'Criar Empresa'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
          </DialogHeader>
          
          {editingCompany && (
            <form onSubmit={handleSaveEdit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Nome Fantasia/Razão Social *</Label>
                <Input 
                  value={editingCompany.name} 
                  onChange={e => setEditingCompany({...editingCompany, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Slug (Login) *</Label>
                  <Input 
                    value={editingCompany.slug} 
                    onChange={e => setEditingCompany({...editingCompany, slug: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Limite de Usuários</Label>
                  <Input 
                    type="number" 
                    min={1} 
                    value={editingCompany.max_users} 
                    onChange={e => setEditingCompany({...editingCompany, max_users: Number(e.target.value)})} 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input 
                  value={editingCompany.cnpj || ''} 
                  onChange={e => setEditingCompany({...editingCompany, cnpj: e.target.value})} 
                />
              </div>

              <div className="flex justify-between items-center pt-4 border-t mt-4">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => {
                    if (confirm('Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita e todos os dados serão perdidos.')) {
                      deleteCompanyMutation.mutate(editingCompany.id);
                    }
                  }} 
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-2"
                  title="Excluir Empresa"
                >
                  <Trash2 className="h-4 w-4" /> Excluir
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={updateCompanyMutation.isPending}>
                    {updateCompanyMutation.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
