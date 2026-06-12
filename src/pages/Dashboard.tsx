import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Truck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  PackageX,
  PackageMinus,
  BarChart3
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const mockChartData = [
  { time: '00h', total: 0, rota: 0, finalizadas: 0 },
  { time: '04h', total: 1, rota: 0, finalizadas: 0 },
  { time: '08h', total: 2, rota: 1, finalizadas: 0 },
  { time: '12h', total: 4, rota: 2, finalizadas: 0 },
  { time: '16h', total: 6, rota: 3, finalizadas: 1 },
  { time: '20h', total: 6, rota: 3, finalizadas: 1 },
  { time: '24h', total: 6, rota: 3, finalizadas: 1 },
]

const mockLoads = [
  { id: '302', status: 'Pendente', origem: 'Orlando', previsao: '12/05 • 14:00', motorista: '---' },
  { id: '301', status: 'Em Rota', origem: 'Orlando', previsao: '12/05 • 10:30', motorista: 'João Silva' },
  { id: '300', status: 'Em Rota', origem: 'Itacaré', previsao: '12/05 • 09:00', motorista: 'Carlos Lima' },
  { id: '299', status: 'Pendente', origem: 'Salvador', previsao: '13/05 • 08:30', motorista: '---' },
  { id: '298', status: 'Finalizada', origem: 'Vitória da Conquista', previsao: '11/05 • 16:40', motorista: 'Marcos Neto' },
]

const statusColors: any = {
  'Pendente': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-500 dark:border-amber-500/20',
  'Em Rota': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-500 dark:border-blue-500/20',
  'Finalizada': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500/20',
}

export default function Dashboard() {
  const { user } = useAuth()
  
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral das operações logísticas</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatsCard 
          title="Total de Cargas" 
          value="3" 
          icon={Truck} 
          iconBg="bg-primary" 
          iconColor="text-white" 
          trend="↑ 20%" 
          trendColor="text-primary"
        />
        <StatsCard 
          title="Pendentes" 
          value="1" 
          icon={Clock} 
          iconBg="bg-orange-500" 
          iconColor="text-white" 
          trend="↑ 10%" 
          trendColor="text-orange-500"
        />
        <StatsCard 
          title="Em Rota" 
          value="2" 
          icon={Truck} 
          iconBg="bg-blue-500" 
          iconColor="text-white" 
          trend="↑ 5%" 
          trendColor="text-blue-500"
        />
        <StatsCard 
          title="Finalizadas" 
          value="0" 
          icon={CheckCircle2} 
          iconBg="bg-emerald-500" 
          iconColor="text-white" 
          trend="— 0%" 
          trendColor="text-muted-foreground"
        />
        <StatsCard 
          title="Alertas" 
          value="2" 
          icon={AlertTriangle} 
          iconBg="bg-amber-500" 
          iconColor="text-white" 
          trend="↑ 100%" 
          trendColor="text-amber-500"
        />
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Últimas Cargas Table */}
        <Card className="lg:col-span-2 border-border shadow-sm">
          <div className="p-5 flex items-center justify-between border-b border-border/50">
            <h2 className="text-lg font-semibold text-foreground">Últimas Cargas</h2>
            <Button variant="secondary" size="sm" className="h-8 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 border-0">
              Ver todas
            </Button>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/30">
                <tr>
                  <th className="px-5 py-3 font-medium">Carga</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Origem</th>
                  <th className="px-5 py-3 font-medium">Previsão</th>
                  <th className="px-5 py-3 font-medium">Motorista</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {mockLoads.map((load) => (
                  <tr key={load.id} className="hover:bg-muted/30 transition-colors group cursor-pointer">
                    <td className="px-5 py-3.5 font-medium text-foreground">{load.id}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${statusColors[load.status]}`}>
                        {load.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{load.origem}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{load.previsao}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{load.motorista}</td>
                    <td className="px-5 py-3.5 text-right">
                      <ChevronRight className="inline-block h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Alertas Importantes */}
        <Card className="border-border shadow-sm flex flex-col">
          <div className="p-5 flex items-center justify-between border-b border-border/50">
            <h2 className="text-lg font-semibold text-foreground">Alertas Importantes</h2>
            <Button variant="link" size="sm" className="h-8 text-xs font-medium text-primary px-0">
              Ver todos
            </Button>
          </div>
          <div className="p-5 flex-1 space-y-4">
            
            <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors cursor-pointer group">
              <div className="bg-orange-500/10 p-2.5 rounded-lg shrink-0">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground">2 entregas com atraso</p>
                <p className="text-xs text-muted-foreground mt-0.5">Verifique as rotas em andamento.</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 mt-1 shrink-0 group-hover:text-primary transition-colors" />
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors cursor-pointer group">
              <div className="bg-red-500/10 p-2.5 rounded-lg shrink-0">
                <PackageX className="h-5 w-5 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground">3 produtos com estoque baixo</p>
                <p className="text-xs text-muted-foreground mt-0.5">Risco de ruptura nas próximas entregas.</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 mt-1 shrink-0 group-hover:text-primary transition-colors" />
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors cursor-pointer group">
              <div className="bg-primary/10 p-2.5 rounded-lg shrink-0">
                <PackageMinus className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground">1 divergência na conferência</p>
                <p className="text-xs text-muted-foreground mt-0.5">Aguardando ajuste.</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 mt-1 shrink-0 group-hover:text-primary transition-colors" />
            </div>

          </div>
        </Card>
      </div>

      {/* Bottom Section */}
      <Card className="border-border shadow-sm p-5">
        <h2 className="text-lg font-semibold text-foreground mb-6">Resumo das Operações (Hoje)</h2>
        <div className="flex flex-col lg:flex-row gap-8">
          
          <div className="flex-1 h-[250px] min-w-0 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-center">
             <p className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-5 w-5" /> Gráfico indisponível temporariamente
             </p>
          </div>

          {/* Chart Legend Summary */}
          <div className="w-full lg:w-64 shrink-0 flex flex-col justify-center space-y-4 pr-4">
            
            {/* Legend Toggles */}
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <div className="w-2 h-2 rounded-full bg-primary" /> Cargas
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <div className="w-2 h-2 rounded-full bg-blue-500" /> Em Rota
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <div className="w-2 h-2 rounded-full bg-emerald-500" /> Finalizadas
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-sm text-foreground font-medium">Total de Cargas</span>
              </div>
              <span className="font-bold">3</span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-sm text-foreground font-medium">Em Rota</span>
              </div>
              <span className="font-bold">2</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-sm text-foreground font-medium">Pendentes</span>
              </div>
              <span className="font-bold">1</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm text-foreground font-medium">Finalizadas</span>
              </div>
              <span className="font-bold">0</span>
            </div>

          </div>
        </div>
      </Card>

    </div>
  )
}

function StatsCard({ title, value, icon: Icon, iconBg, iconColor, trend, trendColor }: any) {
  return (
    <Card className="p-4 border-border shadow-sm flex flex-col justify-between h-[120px]">
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-xl ${iconBg} bg-opacity-10 dark:bg-opacity-20`}>
          <Icon className={`h-6 w-6 ${iconBg.replace('bg-', 'text-')} dark:${iconColor}`} />
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground">{title}</p>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-bold text-foreground">{value}</span>
          <span className={`text-[10px] font-bold ${trendColor}`}>
            Hoje {trend}
          </span>
        </div>
      </div>
    </Card>
  )
}
