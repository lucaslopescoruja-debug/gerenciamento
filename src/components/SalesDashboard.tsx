import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { salesApi } from '@/api/sales'
import { customersApi } from '@/api/customers'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/utils/formatters'
import { Card } from '@/components/ui/card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import { usersApi } from '@/api/users'
import { salesRepsApi } from '@/api/salesReps'

import { ErrorBoundary } from '@/components/ErrorBoundary'

export function SalesDashboard() {
  const { user, isMaster, company } = useAuth()
  const isManager = user?.role === 'admin' || user?.role === 'gestor' || user?.role === 'master' || isMaster

  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth())
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  const [selectedRep, setSelectedRep] = useState('all')

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['sales_orders'],
    queryFn: salesApi.getSalesOrders,
  })

  const { data: customers = [], isLoading: loadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: customersApi.getCustomers,
  })

  const { data: usersList = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getUsers(company?.id),
    enabled: isManager && !!company?.id,
  })

  const { data: salesReps = [] } = useQuery({
    queryKey: ['salesReps'],
    queryFn: salesRepsApi.getSalesReps,
    enabled: !!company?.id,
  })

  const vendedores = usersList.filter(u => u.role === 'vendedor' || u.role === 'representante')

  // Filtros
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (!isManager) {
        const repName = o.sales_rep?.nickname || o.sales_rep?.legal_name
        if (repName !== user?.name) return false
      } else if (selectedRep !== 'all') {
        const repName = o.sales_rep?.nickname || o.sales_rep?.legal_name
        if (repName !== selectedRep) return false
      }
      return o.created_at.includes(`${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`)
    })
  }, [orders, isManager, user?.name, selectedRep, selectedMonth, selectedYear])

  let vendidoNoMes = filteredOrders.reduce((sum, o) => sum + (o.net_amount || 0), 0)
  
  const objetivoNoMes = useMemo(() => {
    // Se não for gestor, pega a meta apenas do vendedor logado
    if (!isManager) {
      const myRep = salesReps.find(r => (r.nickname || r.legal_name) === user?.name)
      return myRep?.monthly_goal || 0
    }
    // Se for gestor e filtrou um vendedor específico
    if (selectedRep !== 'all') {
      const myRep = salesReps.find(r => (r.nickname || r.legal_name) === selectedRep)
      return myRep?.monthly_goal || 0
    }
    // Se for gestor vendo geral, soma todas as metas
    return salesReps.reduce((sum, r) => sum + (r.monthly_goal || 0), 0)
  }, [salesReps, isManager, user?.name, selectedRep])
  const missingGoal = Math.max(0, objetivoNoMes - vendidoNoMes)
  
  const today = new Date()
  const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate()
  const currentDay = (today.getMonth() === selectedMonth && today.getFullYear() === selectedYear) ? today.getDate() : 1
  const daysLeft = Math.max(1, lastDay - currentDay)
  let necessarioVender = missingGoal / daysLeft

  const evolucaoData = useMemo(() => {
    const dataByDay: Record<number, number> = {}
    for (let i = 1; i <= lastDay; i++) dataByDay[i] = 0

    filteredOrders.forEach(o => {
      const day = new Date(o.created_at).getDate()
      dataByDay[day] += (o.net_amount || 0)
    })

    let accumulated = 0
    return Object.keys(dataByDay).map(day => {
      accumulated += dataByDay[parseInt(day)]
      return {
        dia: parseInt(day),
        Vendido: accumulated
      }
    })
  }, [filteredOrders, lastDay])

  const relevantCustomers = useMemo(() => {
    return customers.filter(c => {
      const customer = c as any;
      if (!isManager) {
        const repName = customer.sales_rep?.nickname || customer.sales_rep?.legal_name
        if (repName !== user?.name) return false
      } else if (selectedRep !== 'all') {
        const repName = customer.sales_rep?.nickname || customer.sales_rep?.legal_name
        if (repName !== selectedRep) return false
      }
      return true
    })
  }, [customers, isManager, user?.name, selectedRep])

  let ativosCount = relevantCustomers.filter(c => c.active).length
  let inativosCount = relevantCustomers.filter(c => !c.active).length

  const carteiraData = [
    { name: 'Ativos', value: ativosCount, color: '#10b981' },
    { name: 'Inativos', value: inativosCount, color: '#ef4444' }
  ]

  const customersWithOrders = new Set(filteredOrders.map(o => o.customer_id))
  let positivadosCount = customersWithOrders.size
  let naoPositivadosCount = Math.max(0, ativosCount - positivadosCount)

  const positivacaoData = [
    { name: 'Positivados', value: positivadosCount, color: '#10b981' },
    { name: 'Não Positivados', value: naoPositivadosCount, color: '#f59e0b' }
  ]

  const salesByCustomer = useMemo(() => {
    const map: Record<string, number> = {}
    filteredOrders.forEach(o => {
      const cid = o.customer_id || 'unknown'
      if (!map[cid]) map[cid] = 0
      map[cid] += (o.net_amount || 0)
    })
    return Object.entries(map).map(([id, total]) => ({ id, total })).sort((a, b) => b.total - a.total)
  }, [filteredOrders])

  const totalSales = salesByCustomer.reduce((sum, item) => sum + item.total, 0)
  
  let accumulatedForABC = 0
  let curvaA = 0, curvaB = 0, curvaC = 0

  salesByCustomer.forEach(item => {
    accumulatedForABC += item.total
    const percentage = totalSales > 0 ? (accumulatedForABC / totalSales) * 100 : 0
    if (percentage <= 80) curvaA++
    else if (percentage <= 95) curvaB++
    else curvaC++
  })

  const abcData = [
    { name: 'Curva A', value: curvaA, color: '#8b5cf6' },
    { name: 'Curva B', value: curvaB, color: '#ec4899' },
    { name: 'Curva C', value: curvaC, color: '#3b82f6' }
  ]

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  // O mock de dados foi removido
  // Agora todos os dados são puxados diretamente do banco de dados real.

  if (loadingOrders || loadingCustomers) {
    return <div className="p-8 text-center text-muted-foreground">Carregando painel de vendas...</div>
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        
        {/* Filters Bar */}
        <div className="bg-card p-4 rounded-lg border shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-lg text-foreground">
            Painel de Vendas
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="h-10 px-3 rounded-md border bg-background text-sm flex-1 md:w-32"
            >
              {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="h-10 px-3 rounded-md border bg-background text-sm flex-1 md:w-24"
            >
              {[currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            {isManager && (
              <select 
                value={selectedRep} 
                onChange={(e) => setSelectedRep(e.target.value)}
                className="h-10 px-3 rounded-md border bg-background text-sm flex-1 md:w-48"
              >
                <option value="all">Todos os vendedores</option>
                {vendedores.map(v => (
                  <option key={v.id} value={v.name}>{v.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Main KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-800 flex flex-col justify-center">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-400 mb-1">VENDIDO NO MÊS</p>
            <p className="text-3xl font-black text-emerald-900 dark:text-emerald-300">{formatCurrency(vendidoNoMes)}</p>
          </Card>
          <Card className="p-6 flex flex-col justify-center">
            <p className="text-sm font-semibold text-muted-foreground mb-1">OBJETIVO DO MÊS</p>
            <p className="text-3xl font-black text-foreground">{formatCurrency(objetivoNoMes)}</p>
            <p className="text-xs text-muted-foreground mt-2">Sem metas definidas</p>
          </Card>
          <Card className="p-6 flex flex-col justify-center">
            <p className="text-sm font-semibold text-muted-foreground mb-1">NECESSÁRIO VENDER POR DIA ÚTIL</p>
            <p className="text-3xl font-black text-foreground">{formatCurrency(necessarioVender)}</p>
          </Card>
        </div>

        {/* Evolução de Venda Chart (Gráfico de Barras Nativo) */}
        <Card className="p-6 overflow-hidden">
          <h3 className="text-lg font-semibold mb-6">Evolução Diária de Vendas</h3>
          <div className="h-[250px] w-full mt-4">
            <div className="flex items-end h-full gap-1 md:gap-2">
              {(() => {
                const dailyData: Record<number, number> = {}
                for (let i = 1; i <= lastDay; i++) dailyData[i] = 0
                filteredOrders.forEach(o => {
                  const day = new Date(o.created_at).getDate()
                  dailyData[day] += (o.net_amount || 0)
                })
                let chartData = Object.keys(dailyData).map(day => ({
                  dia: parseInt(day),
                  valor: dailyData[parseInt(day)]
                }))

                const maxValor = Math.max(...chartData.map(d => d.valor), 1)

                return chartData.map(d => {
                  const heightPercent = (d.valor / maxValor) * 100
                  return (
                    <div key={d.dia} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:block bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg whitespace-nowrap z-10 pointer-events-none">
                        Dia {d.dia}<br/>
                        <span className="font-bold">{formatCurrency(d.valor)}</span>
                      </div>
                      {/* Bar */}
                      <div 
                        className="w-full bg-emerald-500/80 rounded-t-sm transition-all duration-300 group-hover:bg-emerald-400" 
                        style={{ height: `${Math.max(heightPercent, 1)}%`, minHeight: d.valor > 0 ? '4px' : '0' }}
                      ></div>
                      {/* Label */}
                      <span className="text-[10px] text-muted-foreground mt-2 truncate">
                        {d.dia % 5 === 0 || d.dia === 1 ? d.dia : ''}
                      </span>
                    </div>
                  )
                })
              })()}
            </div>
          </div>
        </Card>

        {/* Bottom Charts (Barras de Progresso Nativas) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <Card className="p-6 flex flex-col">
            <h3 className="text-sm font-semibold text-muted-foreground mb-6 uppercase">Carteira de Clientes</h3>
            <div className="flex-1 flex flex-col justify-center space-y-6">
              {(ativosCount + inativosCount) === 0 ? (
                <div className="flex items-center justify-center text-muted-foreground text-sm h-full">Sem dados</div>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div>Ativos</span>
                      <span className="font-bold">{ativosCount}</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(ativosCount / relevantCustomers.length) * 100}%` }}></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div>Inativos</span>
                      <span className="font-bold">{inativosCount}</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${(inativosCount / relevantCustomers.length) * 100}%` }}></div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>

          <Card className="p-6 flex flex-col">
            <h3 className="text-sm font-semibold text-muted-foreground mb-6 uppercase">Positivação</h3>
            <div className="flex-1 flex flex-col justify-center space-y-6">
              {(positivadosCount + naoPositivadosCount) === 0 ? (
                <div className="flex items-center justify-center text-muted-foreground text-sm h-full">Sem dados</div>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div>Positivados</span>
                      <span className="font-bold">{positivadosCount}</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(positivadosCount / ativosCount) * 100}%` }}></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div>Não Positivados</span>
                      <span className="font-bold">{naoPositivadosCount}</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${(naoPositivadosCount / ativosCount) * 100}%` }}></div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>

          <Card className="p-6 flex flex-col">
            <h3 className="text-sm font-semibold text-muted-foreground mb-6 uppercase">Curva ABC (Apenas c/ Compra)</h3>
            <div className="flex-1 flex flex-col justify-center space-y-4">
              {(curvaA + curvaB + curvaC) === 0 ? (
                <div className="flex items-center justify-center text-muted-foreground text-sm h-full">Sem dados</div>
              ) : (
                <>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-violet-500"></div>Curva A (Top 80%)</span>
                      <span className="font-bold">{curvaA} cl.</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 transition-all duration-500" style={{ width: `${(curvaA / salesByCustomer.length) * 100}%` }}></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-pink-500"></div>Curva B (15%)</span>
                      <span className="font-bold">{curvaB} cl.</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-pink-500 transition-all duration-500" style={{ width: `${(curvaB / salesByCustomer.length) * 100}%` }}></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div>Curva C (Restante)</span>
                      <span className="font-bold">{curvaC} cl.</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${(curvaC / salesByCustomer.length) * 100}%` }}></div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>

        </div>

      </div>
    </ErrorBoundary>
  )
}
