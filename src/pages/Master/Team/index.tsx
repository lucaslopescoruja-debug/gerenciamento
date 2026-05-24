import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { saasApi } from '@/api/saas';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Plus, Pencil, Trash2, ShieldCheck } from 'lucide-react';
import { toast } from '@/components/ui/toaster';
import { hashPassword } from '@/utils/crypto';
import type { User } from '@/types/database';

export default function SaaSTeam() {
  const { isMaster, user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  
  // Permissões
  const [perms, setPerms] = useState({
    can_manage_saas_finance: true,
    can_manage_saas_clients: true,
    can_manage_saas_staff: false
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['system_users'],
    queryFn: saasApi.getSystemUsers,
    enabled: isMaster
  });

  const createMutation = useMutation({
    mutationFn: saasApi.createSystemUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system_users'] });
      toast.success('Funcionário cadastrado com sucesso');
      setIsOpen(false);
    },
    onError: () => toast.error('Erro ao cadastrar funcionário')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<User> }) => saasApi.updateSystemUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system_users'] });
      toast.success('Funcionário atualizado com sucesso');
      setIsOpen(false);
    },
    onError: () => toast.error('Erro ao atualizar funcionário')
  });

  const deleteMutation = useMutation({
    mutationFn: saasApi.deleteSystemUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system_users'] });
      toast.success('Funcionário removido com sucesso');
    }
  });

  if (!isMaster) return null;

  const openNew = () => {
    setEditing(null);
    setName('');
    setUsername('');
    setPerms({
      can_manage_saas_finance: true,
      can_manage_saas_clients: true,
      can_manage_saas_staff: false
    });
    setIsOpen(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setName(u.name);
    setUsername(u.username);
    setPerms({
      can_manage_saas_finance: u.permissions?.can_manage_saas_finance ?? false,
      can_manage_saas_clients: u.permissions?.can_manage_saas_clients ?? false,
      can_manage_saas_staff: u.permissions?.can_manage_saas_staff ?? false,
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    const baseData: Partial<User> = {
      name,
      username,
      role: 'admin',
      permissions: {
        can_view_dashboard: true,
        can_manage_loads: true,
        can_do_conference: true,
        can_manage_products: true,
        can_manage_users: true,
        can_do_delivery: true,
        ...perms
      }
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, data: baseData });
    } else {
      createMutation.mutate({ ...baseData, password_hash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', active: true } as any);
    }
  };

  const deleteUser = (id: string) => {
    if (id === currentUser?.id) {
      toast.error('Você não pode apagar a si mesmo.');
      return;
    }
    if (window.confirm('Tem certeza que deseja remover este funcionário?')) {
      deleteMutation.mutate(id);
    }
  };

  const toggleActive = (id: string, currentActive: boolean) => {
    if (id === currentUser?.id) {
      toast.error('Você não pode desativar a si mesmo.');
      return;
    }
    updateMutation.mutate({ id, data: { active: !currentActive } });
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" /> Acessos Globais
          </h1>
          <p className="text-muted-foreground">Controle de acessos da sua equipe interna.</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Funcionário
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full py-10 text-center text-muted-foreground">Carregando...</div>
        ) : users.length === 0 ? (
          <div className="col-span-full py-10 text-center text-muted-foreground border-2 border-dashed rounded-xl">
            Sua equipe aparecerá aqui.
          </div>
        ) : (
          users.map((u) => (
            <Card key={u.id} className={!u.active ? 'opacity-60' : ''}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{u.name}</p>
                  <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(u)} className="h-8 w-8">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => toggleActive(u.id, u.active)} className="h-8 w-8">
                    <div className={`h-2.5 w-2.5 rounded-full ${u.active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteUser(u.id)} disabled={deleteMutation.isPending} className="h-8 w-8">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={o => { setIsOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Novo'} Funcionário da Plataforma</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            
            <div className="space-y-2">
              <Label>Nome Completo *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} required />
            </div>
            
            <div className="space-y-2">
              <Label>Usuário de Login *</Label>
              <Input value={username} onChange={e => setUsername(e.target.value)} required />
            </div>

            <div className="space-y-3 pt-4 border-t">
              <Label className="text-sm font-semibold">Permissões de Master</Label>
              <div className="space-y-2 bg-muted/30 p-3 rounded-lg border">
                <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors">
                  <input type="checkbox" checked={perms.can_manage_saas_clients} onChange={e => setPerms({...perms, can_manage_saas_clients: e.target.checked})} className="rounded border-border text-primary focus:ring-primary h-4 w-4" />
                  Pode criar e editar Empresas clientes
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors">
                  <input type="checkbox" checked={perms.can_manage_saas_finance} onChange={e => setPerms({...perms, can_manage_saas_finance: e.target.checked})} className="rounded border-border text-primary focus:ring-primary h-4 w-4" />
                  Pode ver e registrar Pagamentos Financeiros
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors">
                  <input type="checkbox" checked={perms.can_manage_saas_staff} onChange={e => setPerms({...perms, can_manage_saas_staff: e.target.checked})} className="rounded border-border text-primary focus:ring-primary h-4 w-4" />
                  Pode gerenciar Equipe (Outros Super Admins)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
