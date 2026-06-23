import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { Save, RefreshCw, Key, Link } from 'lucide-react'
import { maxiprodApi } from '@/api/maxiprod'
import AppLayout from '@/components/layout/AppLayout'

export default function Settings() {
  const { user } = useAuth()
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)

  useEffect(() => {
    if (user?.company_id) {
      loadSettings()
    }
  }, [user])

  async function loadSettings() {
    if (!user?.company_id) return
    const { data } = await supabase
      .from('companies')
      .select('maxiprod_api_token, maxiprod_last_sync')
      .eq('id', user.company_id)
      .single()

    if (data) {
      setToken(data.maxiprod_api_token || '')
      setLastSync(data.maxiprod_last_sync)
    }
  }

  async function handleSave() {
    if (!user?.company_id) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('companies')
        .update({ maxiprod_api_token: token })
        .eq('id', user.company_id)

      if (error) throw error

      toast.success('Configurações salvas com sucesso!')
      
      try {
        await maxiprodApi.testConnection()
        toast.success('Conexão com Maxiprod estabelecida!')
      } catch (err: any) {
        toast.error(`Falha na conexão: ${err.message}`)
      }

    } catch (e: any) {
      toast.error('Erro ao salvar token: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSync() {
    if (!token) {
      toast.error('Por favor, salve o token do Maxiprod primeiro.')
      return
    }
    
    setIsSyncing(true)
    const toastId = toast.loading('Sincronizando produtos e clientes do Maxiprod...')
    
    try {
      const res = await maxiprodApi.syncAllData()
      if (res.success) {
        toast.success('Sincronização concluída com sucesso!', { id: toastId })
        setLastSync(res.timestamp)
      }
    } catch (e: any) {
      toast.error(e.message || 'Erro ao sincronizar dados', { id: toastId })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Integração ERP (Maxiprod)
              </CardTitle>
              <CardDescription>
                Configure as credenciais da API do Maxiprod para sincronização automática de estoque e pedidos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">Token de Acesso (API Key)</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="token"
                      type="password"
                      placeholder="Cole seu Bearer Token aqui..."
                      className="pl-9"
                      value={token}
                      onChange={e => setToken(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleSave} disabled={loading}>
                    {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  O aplicativo enviará os pedidos para o Maxiprod automaticamente. A integração inversa de estoque está desabilitada, pois o Estoque Fácil é a fonte principal de dados.
                </p>
                
                <div className="pt-4 border-t mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">Sincronização Manual</h4>
                      <p className="text-xs text-muted-foreground">
                        Puxe clientes, produtos e tabelas de preço do Maxiprod para o Estoque Fácil.
                      </p>
                    </div>
                    <Button variant="outline" onClick={handleSync} disabled={isSyncing || !token}>
                      <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                      {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
                    </Button>
                  </div>
                  {lastSync && (
                    <p className="text-xs text-muted-foreground">
                      Última sincronização: {new Date(lastSync).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  )
}
