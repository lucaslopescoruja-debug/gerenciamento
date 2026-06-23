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

      const orderDate = new Date(o.created_at)
      if (orderDate.getMonth() !== selectedMonth || orderDate.getFullYear() !== selectedYear) {
        return false
      }

      return true
    })
  }, [orders, isManager, user?.name, selectedRep, selectedMonth, selectedYear])

  const vendidoNoMes = filteredOrders.reduce((sum, o) => sum + (o.net_amount || 0), 0)
  const objetivoNoMes = 0
  const missingGoal = Math.max(0, objetivoNoMes - vendidoNoMes)
  
  const today = new Date()
  const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate()
  const currentDay = (today.getMonth() === selectedMonth && today.getFullYear() === selectedYear) ? today.getDate() : 1
  const daysLeft = Math.max(1, lastDay - currentDay)
  const necessarioVender = missingGoal / daysLeft

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

  const ativosCount = relevantCustomers.filter(c => c.active).length
  const inativosCount = relevantCustomers.filter(c => !c.active).length

  const carteiraData = [
    { name: 'Ativos', value: ativosCount, color: '#10b981' },
    { name: 'Inativos', value: inativosCount, color: '#ef4444' }
  ]

  const customersWithOrders = new Set(filteredOrders.map(o => o.customer_id))
  const positivadosCount = customersWithOrders.size
  const naoPositivadosCount = Math.max(0, ativosCount - positivadosCount)

  const positivacaoData = [
    { name: 'Positivados', value: positivadosCount, color: '#10b981' },
    { name: 'Não Positivados', value: naoPositivadosCount, color: '#f59e0b' }
  ]

  const salesByCustomer = useMemo(() => {
    const map: Record<string, number> = {}
    filteredOrders.forEach(o => {
      if (!map[o.customer_id]) map[o.customer_id] = 0
      map[o.customer_id] += (o.net_amount || 0)
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
          <div className="flex gap-3 w-full md:w-auto">
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

        {/* Evolução de Venda Chart */}
        <Card className="p-6 overflow-hidden">
          <h3 className="text-lg font-semibold mb-6">Evolução de Venda</h3>
          <div className="h-[300px] w-full overflow-x-auto">
            <div style={{ width: '800px', height: '300px' }}>
              <LineChart width={800} height={300} data={evolucaoData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="dia" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value}`} />
                <Legend />
                <Line type="monotone" dataKey="Vendido" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </div>
          </div>
        </Card>

        {/* Bottom Donut Charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase">Carteira de Clientes</h3>
            <div className="h-[200px] relative flex justify-center">
              {(ativosCount + inativosCount) === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>
              ) : (
                <PieChart width={200} height={200}>
                  <Pie data={carteiraData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {carteiraData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold">{relevantCustomers.length}</span>
                <span className="text-xs text-muted-foreground">Clientes</span>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {carteiraData.map(d => (
                <div key={d.name} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                    <span className="text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="font-bold">{d.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase">Positivação</h3>
            <div className="h-[200px] relative flex justify-center">
              {(positivadosCount + naoPositivadosCount) === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>
              ) : (
                <PieChart width={200} height={200}>
                  <Pie data={positivacaoData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {positivacaoData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold">{positivadosCount}</span>
                <span className="text-xs text-muted-foreground">Positivados</span>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {positivacaoData.map(d => (
                <div key={d.name} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                    <span className="text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="font-bold">{d.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase">Curva ABC (Apenas Clientes Ativos c/ Compra)</h3>
            <div className="h-[200px] relative flex justify-center">
              {(curvaA + curvaB + curvaC) === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>
              ) : (
                <PieChart width={200} height={200}>
                  <Pie data={abcData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {abcData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold">{salesByCustomer.length}</span>
                <span className="text-xs text-muted-foreground">Clientes</span>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {abcData.map(d => (
                <div key={d.name} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                    <span className="text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="font-bold">{d.value}</span>
                </div>
              ))}
            </div>
          </Card>

        </div>
      </div>
    </ErrorBoundary>
  )
}
