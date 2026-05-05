import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { operationsApi } from '@/api/operations'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/toaster'
import { ArrowLeft, FileSignature, Check } from 'lucide-react'

export default function DeliveryProof() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const { data: op, isLoading } = useQuery({
    queryKey: ['operation', id],
    queryFn: () => operationsApi.getOperation(id!),
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: () => operationsApi.updateOperationStatus(id!, 'completed', new Date().toISOString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations'] })
      queryClient.invalidateQueries({ queryKey: ['operation', id] })
      toast.success('Comprovante de entrega registrado e operação finalizada!')
      setTimeout(() => navigate('/'), 1500)
    },
    onError: (e: any) => {
      toast.error(`Erro ao finalizar operação: ${e.message}`)
    }
  })

  const handleConfirm = () => {
    updateMutation.mutate()
  }

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando dados...</div>

  if (!op) return (
    <div className="text-center py-16 text-muted-foreground">Operação não encontrada</div>
  )

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-xl font-bold gradient-text">Comprovante de Entrega</h1>
          <p className="text-xs text-muted-foreground">{op.load_number} — {op.client_name}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileSignature className="h-4 w-4 text-primary" />Assinatura do Recebedor</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-6 border-2 border-dashed border-border rounded-xl bg-card/50">
            <p className="text-muted-foreground text-sm mb-2">Assinatura digital temporariamente desativada.</p>
            <p className="text-muted-foreground text-xs">Você pode confirmar a entrega diretamente.</p>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 glow-success" onClick={handleConfirm} disabled={updateMutation.isPending}>
              <Check className="h-4 w-4 mr-1.5" /> Confirmar Entrega
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
