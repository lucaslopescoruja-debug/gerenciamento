import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { saasApi } from '@/api/saas';
import { companiesApi } from '@/api/companies';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Banknote, Plus, CheckCircle2, Clock, AlertCircle, Trash2, RefreshCw, Edit2, Shield, Settings2, Users, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import type { CompanyPayment, SaaSPlan } from '@/types/database';

export default function SaaSFinance() {
  const { isMaster } = useAuth();
  const queryClient = useQueryClient();
  
  const [isOpen, setIsOpen] = useState(false);
  const [companyId, setCompanyId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: companiesApi.getCompanies,
    enabled: isMaster
  });

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['company_payments'],
    queryFn: saasApi.getPayments,
    enabled: isMaster
  });

  const { data: saasPlans = [], isLoading: isLoadingPlans } = useQuery({
    queryKey: ['saas_plans'],
    queryFn: saasApi.getPlans,
    enabled: isMaster
  });

  // Edit Plan State
  type SortFieldType = 'name' | 'base_price' | 'base_users' | 'extra_user_price' | null;
  const [sortField, setSortField] = useState<SortFieldType>(null);
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (field: SortFieldType) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const renderSortIcon = (field: SortFieldType) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3.5 w-3.5 inline-block opacity-40 hover:opacity-100 transition-opacity" />;
    }
    return sortAsc 
      ? <ArrowUp className="ml-1 h-3.5 w-3.5 inline-block text-primary" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5 inline-block text-primary" />;
  };

  const sortedPlans = React.useMemo(() => {
    const sorted = [...saasPlans];
    if (!sortField) return sorted;

    return sorted.sort((a, b) => {
      let valA: any = '';
      let valB: any = '';
      
      switch (sortField) {
        case 'name': valA = a.name; valB = b.name; break;
        case 'base_price': valA = a.base_price; valB = b.base_price; break;
        case 'base_users': valA = a.base_users; valB = b.base_users; break;
        case 'extra_user_price': valA = a.extra_user_price; valB = b.extra_user_price; break;
      }

      valA = valA ?? '';
      valB = valB ?? '';

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortAsc
          ? valA.localeCompare(valB, 'pt-BR', { sensitivity: 'base' })
          : valB.localeCompare(valA, 'pt-BR', { sensitivity: 'base' });
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [saasPlans, sortField, sortAsc]);

  const [isEditPlanOpen, setIsEditPlanOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SaaSPlan | null>(null);

  const updatePlanMutation = useMutation({
    mutationFn: (args: {id: string, updates: Partial<SaaSPlan>}) => saasApi.updatePlan(args.id, args.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas_plans'] });
      toast.success('Plano atualizado com sucesso!');
      setIsEditPlanOpen(false);
    },
    onError: () => toast.error('Erro ao atualizar plano')
  });

  const handleSyncPayments = async () => {
    if (companies.length === 0) {
      toast.error('Nenhuma empresa carregada.');
      return;
    }
    setIsSyncing(true);
    try {
      let count = 0;
      const today = new Date();
      today.setHours(12, 0, 0, 0); // Normalizar hora para evitar desvios de fuso horário

      for (const comp of companies) {
        if (!comp.active || !comp.monthly_fee || comp.monthly_fee <= 0 || !comp.billing_day) {
          continue;
        }

        const createdDate = new Date(comp.created_at);
        createdDate.setHours(12, 0, 0, 0);

        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();

        const candidateMonths = [
          { y: currentMonth === 0 ? currentYear - 1 : currentYear, m: currentMonth === 0 ? 11 : currentMonth - 1 },
          { y: currentYear, m: currentMonth },
          { y: currentMonth === 11 ? currentYear + 1 : currentYear, m: currentMonth === 11 ? 0 : currentMonth + 1 }
        ];

        for (const monthInfo of candidateMonths) {
          const lastDay = new Date(monthInfo.y, monthInfo.m + 1, 0).getDate();
          const day = Math.min(comp.billing_day, lastDay);
          const dueDate = new Date(monthInfo.y, monthInfo.m, day, 12, 0, 0, 0);

          if (dueDate < createdDate) continue;

          const timeDiff = dueDate.getTime() - today.getTime();
          const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

          if (daysRemaining <= 7) {
            const dateStr = dueDate.toISOString().split('T')[0];
            const alreadyExists = payments.some(
              p => p.company_id === comp.id && p.due_date === dateStr
            );

            if (!alreadyExists) {
              await saasApi.createPayment({
                company_id: comp.id,
                amount: comp.monthly_fee,
                due_date: dateStr,
                status: 'pendente',
                notes: 'Gerado automaticamente pelo sistema (Mensalidade)'
              });
              count++;
            }
          }
        }
      }

      if (count > 0) {
        queryClient.invalidateQueries({ queryKey: ['company_payments'] });
        toast.success(`${count} mensalidade(s) gerada(s) com sucesso!`);
      } else {
        toast.info('Nenhuma nova mensalidade pendente de lançamento.');
      }
    } catch (err) {
      console.error('Erro ao sincronizar mensalidades:', err);
      toast.error('Erro ao sincronizar mensalidades.');
    } finally {
      setIsSyncing(false);
    }
  };

  const createPaymentMutation = useMutation({
    mutationFn: saasApi.createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company_payments'] });
      toast.success('Cobrança lançada com sucesso');
      setIsOpen(false);
    },
    onError: () => toast.error('Erro ao lançar cobrança')
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, company_id, status }: { id: string, company_id: string, status: CompanyPayment['status'] }) => {
      const updated = await saasApi.updatePayment(id, { 
        status, 
        paid_at: status === 'pago' ? new Date().toISOString() : undefined 
      });
      if (status === 'pago') {
        await companiesApi.updateCompany(company_id, { active: true });
      }
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company_payments'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Status atualizado');
    }
  });

  const deletePaymentMutation = useMutation({
    mutationFn: saasApi.deletePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company_payments'] });
      toast.success('Cobrança excluída');
    }
  });

  if (!isMaster) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || amount <= 0 || !dueDate) {
      toast.error('Preencha todos os campos corretamente');
      return;
    }
    
    createPaymentMutation.mutate({
      company_id: companyId,
      amount,
      due_date: dueDate,
      status: 'pendente',
      notes
    });
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    updatePlanMutation.mutate({
      id: editingPlan.id,
      updates: {
        name: editingPlan.name,
        base_price: editingPlan.base_price,
        base_users: editingPlan.base_users,
        extra_user_price: editingPlan.extra_user_price
      }
    });
  };

  const getCompanyDetails = (id: string) => companies.find(c => c.id === id);

  const getStatusBadge = (status: CompanyPayment['status']) => {
    switch (status) {
      case 'pago': return <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full"><CheckCircle2 className="h-3 w-3" /> Pago</span>;
      case 'atrasado': return <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full"><AlertCircle className="h-3 w-3" /> Atrasado</span>;
      default: return <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-full"><Clock className="h-3 w-3" /> Pendente</span>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Banknote className="h-7 w-7 text-primary" /> Financeiro
          </h1>
          <p className="text-muted-foreground">Controle de mensalidades e pagamentos dos clientes.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={handleSyncPayments} 
            disabled={isSyncing}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
            Verificar e Atualizar
          </Button>
          <Button onClick={() => {
            setCompanyId('');
            setAmount(0);
            setDueDate('');
            setNotes('');
            setIsOpen(true);
          }} className="gap-2">
            <Plus className="h-4 w-4" /> Lançar Mensalidade
          </Button>
        </div>
      </div>

      {/* Tabela de Preços */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-muted/20 flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Tabela de Preços Padrão</h2>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-semibold cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('name')}>
                    Plano {renderSortIcon('name')}
                  </th>
                  <th className="px-4 py-3 font-semibold text-right cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('base_price')}>
                    Mensalidade Base {renderSortIcon('base_price')}
                  </th>
                  <th className="px-4 py-3 font-semibold text-center cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('base_users')}>
                    Usuários Inclusos {renderSortIcon('base_users')}
                  </th>
                  <th className="px-4 py-3 font-semibold text-right cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('extra_user_price')}>
                    Valor Usuário Adicional {renderSortIcon('extra_user_price')}
                  </th>
                  <th className="px-4 py-3 font-semibold text-center w-16">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoadingPlans ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Carregando planos...</td></tr>
                ) : sortedPlans.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-amber-600 bg-amber-500/10 font-medium">Nenhum plano encontrado. Verifique se o comando SQL foi executado no Supabase.</td></tr>
                ) : (
                  sortedPlans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-3 h-3 rounded-full",
                            plan.id === 'ouro' ? "bg-yellow-500" :
                            plan.id === 'prata' ? "bg-slate-400" :
                            plan.id === 'bronze' ? "bg-orange-600" : "bg-primary"
                          )} />
                          <span className={cn(
                            "font-bold uppercase tracking-wider",
                            plan.id === 'ouro' ? "text-yellow-600 dark:text-yellow-400" :
                            plan.id === 'prata' ? "text-slate-600 dark:text-slate-300" :
                            plan.id === 'bronze' ? "text-orange-600 dark:text-orange-400" : "text-foreground"
                          )}>{plan.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-600 dark:text-emerald-400">
                        R$ {plan.base_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center font-medium">
                        {plan.base_users}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        + R$ {plan.extra_user_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setEditingPlan(plan);
                            setIsEditPlanOpen(true);
                          }}
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-4 italic flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Alterações nesta tabela não afetam os clientes atuais, apenas as novas empresas cadastradas ou as que tiverem seus planos alterados.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full py-10 text-center text-muted-foreground">Carregando pagamentos...</div>
        ) : payments.length === 0 ? (
          <div className="col-span-full py-10 text-center text-muted-foreground border-2 border-dashed rounded-xl">
            Nenhuma cobrança registrada.
          </div>
        ) : (
          payments.map((payment) => {
            const comp = getCompanyDetails(payment.company_id);
            return (
              <Card key={payment.id}>
                <CardContent className="p-5 flex flex-col h-full justify-between gap-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-bold text-foreground truncate">{comp?.name || 'Empresa Removida'}</p>
                      <p className="text-2xl font-black gradient-text mt-1">
                        R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    {getStatusBadge(payment.status)}
                  </div>
                  
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p><strong>Vencimento:</strong> {new Date(payment.due_date + 'T12:00:00Z').toLocaleDateString('pt-BR')}</p>
                    {payment.paid_at && <p><strong>Pago em:</strong> {new Date(payment.paid_at).toLocaleDateString('pt-BR')}</p>}
                    {payment.notes && <p className="italic mt-2 text-xs">"{payment.notes}"</p>}
                  </div>

                  <div className="pt-3 border-t flex items-center justify-between mt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        if (confirm('Tem certeza que deseja excluir esta cobrança?')) {
                          deletePaymentMutation.mutate(payment.id);
                        }
                      }} 
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2"
                      title="Excluir cobrança"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex gap-2">
                      {payment.status === 'pendente' && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => updateStatusMutation.mutate({ id: payment.id, company_id: payment.company_id, status: 'atrasado' })} className="text-red-500 hover:text-red-600">
                            Atrasado
                          </Button>
                          <Button size="sm" onClick={() => updateStatusMutation.mutate({ id: payment.id, company_id: payment.company_id, status: 'pago' })} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                            Pago
                          </Button>
                        </>
                      )}
                      {payment.status === 'atrasado' && (
                        <Button size="sm" onClick={() => updateStatusMutation.mutate({ id: payment.id, company_id: payment.company_id, status: 'pago' })} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                          Baixar Pago
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Lançar Cobrança</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            
            <div className="space-y-2">
              <Label>Empresa Cliente *</Label>
              <select 
                value={companyId} 
                onChange={e => setCompanyId(e.target.value)} 
                className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              >
                <option value="">Selecione uma empresa</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor (R$) *</Label>
                <Input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(Number(e.target.value))} required />
              </div>
              <div className="space-y-2">
                <Label>Data de Vencimento *</Label>
                <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Anotações (opcional)</Label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Referente ao mês de..." />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createPaymentMutation.isPending}>
                Lançar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditPlanOpen} onOpenChange={setIsEditPlanOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Editar Plano: {editingPlan?.name}</DialogTitle></DialogHeader>
          {editingPlan && (
            <form onSubmit={handleSavePlan} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Nome de Exibição</Label>
                <Input 
                  value={editingPlan.name} 
                  onChange={e => setEditingPlan({...editingPlan, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mensalidade Base (R$)</Label>
                  <Input 
                    type="number" step="0.01" min="0" 
                    value={editingPlan.base_price} 
                    onChange={e => setEditingPlan({...editingPlan, base_price: Number(e.target.value)})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Limite de Usuários</Label>
                  <Input 
                    type="number" min="1" 
                    value={editingPlan.base_users} 
                    onChange={e => setEditingPlan({...editingPlan, base_users: Number(e.target.value)})} 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Valor por Usuário Adicional (R$)</Label>
                <Input 
                  type="number" step="0.01" min="0" 
                  value={editingPlan.extra_user_price} 
                  onChange={e => setEditingPlan({...editingPlan, extra_user_price: Number(e.target.value)})} 
                  required 
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={() => setIsEditPlanOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={updatePlanMutation.isPending}>
                  {updatePlanMutation.isPending ? 'Salvando...' : 'Salvar Tabela'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
