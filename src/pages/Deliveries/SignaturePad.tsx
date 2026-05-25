import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { deliveriesApi } from '@/api/deliveries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toaster'
import { ArrowLeft, CheckCircle2, Eraser, PenTool } from 'lucide-react'
import SignatureCanvas from 'react-signature-canvas'

export default function SignaturePad() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [receiverName, setReceiverName] = useState('')
  const [receiverDoc, setReceiverDoc] = useState('')
  const sigCanvas = useRef<any>(null)

  const { data: client } = useQuery({
    queryKey: ['delivery_client', clientId],
    queryFn: () => deliveriesApi.getDeliveryClient(clientId!),
    enabled: !!clientId,
  })

  const saveSignatureMutation = useMutation({
    mutationFn: (data: any) => deliveriesApi.updateDeliveryClient(clientId!, data),
    onSuccess: () => {
      toast.success('Assinatura salva com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['delivery_client', clientId] })
      queryClient.invalidateQueries({ queryKey: ['delivery_items', clientId] })
      if (client?.delivery_route_id) {
        queryClient.invalidateQueries({ queryKey: ['delivery_clients', client.delivery_route_id] })
        navigate(`/entregas/${client.delivery_route_id}`)
      } else {
        navigate('/entregas')
      }
    },
    onError: (error: any) => {
      toast.error(`Erro ao salvar: ${error.message}`)
    }
  })

  const clearSignature = () => {
    sigCanvas.current?.clear()
  }

  const handleSave = () => {
    try {
      if (!sigCanvas.current) {
        toast.error('Erro: Canvas não carregado.')
        return
      }
      if (sigCanvas.current.isEmpty()) {
        toast.error('Por favor, colete a assinatura do recebedor.')
        return
      }
      if (!receiverName || !receiverName.trim()) {
        toast.error('Informe o nome de quem recebeu a entrega.')
        return
      }

      // Get Base64 image - use getCanvas if getTrimmedCanvas fails
      let signatureData = ''
      try {
        signatureData = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png')
      } catch (e) {
        signatureData = sigCanvas.current.getCanvas().toDataURL('image/png')
      }
      
      saveSignatureMutation.mutate({
        signature_data: signatureData,
        receiver_name: receiverName.trim(),
        receiver_doc: receiverDoc ? receiverDoc.trim() : '',
        signed_at: new Date().toISOString()
      })
    } catch (err: any) {
      toast.error(`Erro ao processar a assinatura: ${err.message}`)
    }
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto slide-in pb-20">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold gradient-text">Assinatura Digital</h1>
          <p className="text-sm text-muted-foreground">Confirmação de Recebimento</p>
        </div>
      </div>

      <div className="glass-card p-6 border-primary/20 space-y-6">
        <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
          <p className="font-medium text-foreground text-sm sm:text-base">
            "Declaro que recebi os produtos conferidos nesta entrega."
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do Recebedor *</Label>
            <Input 
              value={receiverName}
              onChange={e => setReceiverName(e.target.value)}
              placeholder="Ex: João da Silva"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Documento (RG/CPF) - Opcional</Label>
            <Input 
              value={receiverDoc}
              onChange={e => setReceiverDoc(e.target.value)}
              placeholder="Ex: 123.456.789-00"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="flex justify-between items-center">
            <span>Assinatura *</span>
            <Button variant="ghost" size="sm" onClick={clearSignature} className="h-6 text-xs text-muted-foreground hover:text-red-500">
              <Eraser className="h-3 w-3 mr-1" /> Limpar
            </Button>
          </Label>
          <div className="border-2 border-dashed border-border rounded-lg bg-white overflow-hidden touch-none">
            <SignatureCanvas 
              ref={sigCanvas}
              penColor="#000000"
              canvasProps={{
                className: 'signature-canvas w-full h-48 cursor-crosshair'
              }}
              backgroundColor="#ffffff"
            />
          </div>
        </div>

        <Button 
          className="w-full h-12 text-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          onClick={handleSave}
          disabled={saveSignatureMutation.isPending}
        >
          <CheckCircle2 className="h-5 w-5 mr-2" />
          {saveSignatureMutation.isPending ? 'Salvando...' : 'Confirmar Recebimento'}
        </Button>
      </div>
    </div>
  )
}
