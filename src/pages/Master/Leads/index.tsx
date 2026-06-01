import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { saasApi } from '@/api/saas';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Phone, Mail, Trash2, User, Calendar, MessageSquare, Search, Building2, HelpCircle } from 'lucide-react';
import { toast } from '@/components/ui/toaster';

export default function SaaSLeads() {
  const { isMaster } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['system_leads'],
    queryFn: saasApi.getLeads,
    enabled: isMaster
  });

  const deleteLeadMutation = useMutation({
    mutationFn: saasApi.deleteLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system_leads'] });
      toast.success('Lead removido com sucesso!');
    },
    onError: (err: any) => {
      toast.error('Erro ao remover lead: ' + err.message);
    }
  });

  React.useEffect(() => {
    if (isMaster) {
      // Marcar como lido após 1.5 segundos para o usuário ver o estado unread piscando brevemente na tela
      const timer = setTimeout(() => {
        saasApi.markAllLeadsAsViewed().then(() => {
          queryClient.invalidateQueries({ queryKey: ['system_leads'] });
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isMaster, queryClient]);

  if (!isMaster) {
    return <div className="p-6 text-center text-red-500">Acesso negado.</div>;
  }

  // Filtrar leads com base na pesquisa
  const filteredLeads = leads.filter((lead: any) => 
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone.includes(searchTerm) ||
    (lead.message && lead.message.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getWhatsAppLink = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    const withCountry = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
    return `https://wa.me/${withCountry}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Building2 className="h-7 w-7 text-primary" /> Leads & Contatos
          </h1>
          <p className="text-muted-foreground">Monitore as solicitações de demonstração vindas da Landing Page.</p>
        </div>
        
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 bg-background"
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total de Leads</p>
              <p className="text-2xl font-extrabold text-foreground mt-0.5">{leads.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Últimos 7 dias</p>
              <p className="text-2xl font-extrabold text-foreground mt-0.5">
                {leads.filter((l: any) => {
                  const diff = Date.now() - new Date(l.created_at).getTime();
                  return diff <= 7 * 24 * 60 * 60 * 1000;
                }).length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Com Mensagem</p>
              <p className="text-2xl font-extrabold text-foreground mt-0.5">
                {leads.filter((l: any) => !!l.message?.trim()).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads List / Table */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground">Carregando leads...</div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-12 bg-card border border-dashed rounded-xl text-muted-foreground space-y-2">
            <User className="h-8 w-8 mx-auto text-muted-foreground/30" />
            <p className="font-semibold">Nenhum lead encontrado</p>
            <p className="text-xs text-muted-foreground/80">Novos contatos da página inicial aparecerão aqui.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLeads.map((lead: any) => (
              <Card key={lead.id} className="glass-card flex flex-col justify-between overflow-hidden group">
                <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <User className="h-4.5 w-4.5 text-primary shrink-0" />
                        {lead.name}
                        {!lead.viewed && (
                          <span className="text-[10px] bg-purple-500/10 text-purple-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 animate-pulse">
                            Novo
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs font-mono mt-1 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(lead.created_at)}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={() => {
                        if (window.confirm('Tem certeza que deseja excluir este lead?')) {
                          deleteLeadMutation.mutate(lead.id);
                        }
                      }}
                      title="Excluir Lead"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2 text-sm text-foreground/80">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <a href={`mailto:${lead.email}`} className="hover:underline hover:text-primary break-all">
                        {lead.email}
                      </a>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <a 
                        href={getWhatsAppLink(lead.phone)} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="hover:underline hover:text-emerald-500 flex items-center gap-1 font-mono font-bold"
                      >
                        {lead.phone}
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-1 rounded font-sans uppercase font-normal">WhatsApp</span>
                      </a>
                    </div>

                    {lead.message && (
                      <div className="bg-muted/40 p-3 rounded-lg border text-xs text-muted-foreground mt-2 relative whitespace-pre-wrap">
                        <span className="absolute -top-1.5 left-2 bg-background px-1 text-[9px] font-bold uppercase tracking-wider">Mensagem</span>
                        {lead.message}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-border/50 mt-3 justify-end">
                    <a href={`mailto:${lead.email}`}>
                      <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 cursor-pointer">
                        <Mail className="h-3.5 w-3.5" /> Responder por E-mail
                      </Button>
                    </a>
                    <a href={getWhatsAppLink(lead.phone)} target="_blank" rel="noreferrer">
                      <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer">
                        <Phone className="h-3.5 w-3.5" /> Contato no WhatsApp
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
