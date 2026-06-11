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
      
      // Test connection
      const isOk = await maxiprodApi.testConnection()
      if (isOk) {
        toast.success('Conexão com Maxiprod estabelecida!')
      } else {
        toast.warning('Token salvo, mas a conexão falhou. Verifique se o token é válido.')
      }

    } catch (e: any) {
      toast.error('Erro ao salvar configurações')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleSyncStock() {
    setIsSyncing(true)
    try {
      const updated = await maxiprodApi.syncProductsStock()
      toast.success(`Estoque sincronizado! ${updated} produtos atualizados.`)
      await loadSettings() // reload last sync date
    } catch (e: any) {
      toast.error(e.message || 'Falha ao sincronizar o estoque.')
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
                <p className="text-sm text-muted-foreground">
                  Você pode gerar este token dentro do painel do Maxiprod. Este token permite que o aplicativo do vendedor leia os estoques e crie pedidos em seu nome.
                </p>
              </div>

              <div className="border-t pt-4 mt-6">
                <h4 className="text-sm font-medium mb-3 flex items-center justify-between">
                  Status da Sincronização
                  {lastSync && <span className="text-xs text-muted-foreground">Última sync: {new Date(lastSync).toLocaleString()}</span>}
                </h4>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleSyncStock} disabled={isSyncing || !token}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    Sincronizar Estoque Agora
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  )
}
