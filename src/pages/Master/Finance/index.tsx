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
import { Banknote, Plus, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/toaster';
import type { CompanyPayment } from '@/types/database';

export default function SaaSFinance() {
  const { isMaster } = useAuth();
  const queryClient = useQueryClient();
  
  const [isOpen, setIsOpen] = useState(false);
  const [companyId, setCompanyId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

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
    mutationFn: ({ id, status }: { id: string, status: CompanyPayment['status'] }) => 
      saasApi.updatePayment(id, { 
        status, 
        paid_at: status === 'pago' ? new Date().toISOString() : undefined 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company_payments'] });
      toast.success('Status atualizado');
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

                  {payment.status === 'pendente' && (
                    <div className="pt-3 border-t flex justify-end gap-2 mt-2">
                      <Button variant="outline" size="sm" onClick={() => updateStatusMutation.mutate({ id: payment.id, status: 'atrasado' })} className="text-red-500 hover:text-red-600">
                        Marcar Atrasado
                      </Button>
                      <Button size="sm" onClick={() => updateStatusMutation.mutate({ id: payment.id, status: 'pago' })} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                        Marcar Pago
                      </Button>
                    </div>
                  )}
                  {payment.status === 'atrasado' && (
                    <div className="pt-3 border-t flex justify-end gap-2 mt-2">
                      <Button size="sm" onClick={() => updateStatusMutation.mutate({ id: payment.id, status: 'pago' })} className="bg-emerald-500 hover:bg-emerald-600 text-white w-full">
                        Baixar como Pago
                      </Button>
                    </div>
                  )}
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
    </div>
  );
}
