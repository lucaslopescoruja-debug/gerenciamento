import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import SignatureCanvas from 'react-signature-canvas'
import { equipmentsApi } from '@/api/equipments'
import { suppliesApi } from '@/api/supplies'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toaster'
import { History, PenTool, Wrench, PackagePlus, Trash2 } from 'lucide-react'
import type { EquipmentOrder, Supply } from '@/types/database'

interface ExecutionModalProps {
  isOpen: boolean
  onClose: () => void
  order: EquipmentOrder | null
}

export function ExecutionModal({ isOpen, onClose, order }: ExecutionModalProps) {
  const queryClient = useQueryClient()
  const sigCanvas = useRef<SignatureCanvas>(null)

  const [activeTab, setActiveTab] = useState<'execucao' | 'historico'>('execucao')

  // Form
  const [defectDesc, setDefectDesc] = useState('')
  const [solutionDesc, setSolutionDesc] = useState('')
  const [receiverName, setReceiverName] = useState('')
  const [receiverDoc, setReceiverDoc] = useState('')
  
  // Supplies & Equipment Exchange
  const [selectedSupply, setSelectedSupply] = useState('')
  const [supplyQty, setSupplyQty] = useState('1')
  const [consumedParts, setConsumedParts] = useState<{supply: Supply, quantity: number}[]>([])
  const [newEquipmentId, setNewEquipmentId] = useState('')

  useEffect(() => {
    if (isOpen && order) {
      setDefectDesc(order.defect_description || '')
      setSolutionDesc(order.solution_description || '')
      setReceiverName(order.receiver_name || '')
      setReceiverDoc(order.receiver_doc || '')
      setConsumedParts([])
      setNewEquipmentId('')
      if (sigCanvas.current) sigCanvas.current.clear()
    }
  }, [isOpen, order])

  const { data: history = [] } = useQuery({
    queryKey: ['equipment_history', order?.equipment_id],
    queryFn: () => equipmentsApi.getEquipmentHistory(order!.equipment_id),
    enabled: !!order && isOpen && activeTab === 'historico'
  })

  const { data: supplies = [] } = useQuery({
    queryKey: ['supplies'],
    queryFn: suppliesApi.getSupplies,
    enabled: isOpen
  })

  const { data: equipments = [] } = useQuery({
    queryKey: ['equipments'],
    queryFn: equipmentsApi.getEquipments,
    enabled: isOpen && order?.type === 'troca'
  })

  const availableEquipments = equipments.filter(e => e.status === 'Disponível')

  const executeMutation = useMutation({
    mutationFn: async () => {
      if (!order) throw new Error('Sem OS selecionada')
      
      const sigData = sigCanvas.current?.isEmpty() ? null : sigCanvas.current?.toDataURL()

      let actionTakenText = ''
      if (order.type === 'troca') {
        if (!newEquipmentId) throw new Error('Selecione o equipamento que será deixado no cliente para a troca.')
        const newEq = equipments.find(e => e.id === newEquipmentId)
        actionTakenText = `Troca efetuada. Equipamento recolhido e deixado o patrimônio ${newEq?.patrimony} (${newEq?.model}).`
      }

      // 1. Update OS with fields and signature
      await equipmentsApi.updateOrder(order.id, {
        defect_description: defectDesc,
        action_taken: actionTakenText || null,
        solution_description: solutionDesc,
        receiver_name: receiverName,
        receiver_doc: receiverDoc,
        signature_data: sigData,
        status: 'concluido',
        completed_at: new Date().toISOString()
      })

      // 2. Consume parts
      for (const part of consumedParts) {
        await suppliesApi.consumeSupplyInOrder(order.id, part.supply.id, part.quantity)
      }

      // 3. Update Equipment Status/Customer if needed
      if (order.type === 'entrega') {
        await equipmentsApi.updateEquipment(order.equipment_id, {
          status: 'No Cliente',
          current_customer_id: order.customer_id
        }, `OS Entrega Finalizada. Entregue para ${order.customer?.fantasy_name || order.customer?.legal_name}`)
      } else if (order.type === 'recolha') {
        await equipmentsApi.updateEquipment(order.equipment_id, {
          status: 'Disponível',
          current_customer_id: null
        }, `OS Recolha Finalizada. Retirado do cliente ${order.customer?.fantasy_name || order.customer?.legal_name}`)
      } else if (order.type === 'troca') {
        // Equipamento antigo é recolhido
        await equipmentsApi.updateEquipment(order.equipment_id, {
          status: 'Disponível', // ou poderia ser "Em Manutenção" dependendo da regra
          current_customer_id: null
        }, `Recolhido em OS de Troca. Cliente: ${order.customer?.fantasy_name || order.customer?.legal_name}`)
        
        // Equipamento novo é entregue
        await equipmentsApi.updateEquipment(newEquipmentId, {
          status: 'No Cliente',
          current_customer_id: order.customer_id
        }, `Entregue em OS de Troca. Cliente: ${order.customer?.fantasy_name || order.customer?.legal_name}`)
      } else {
        await equipmentsApi.createHistory(order.equipment_id, `OS de ${order.type.toUpperCase()} finalizada`, order.customer_id, `Defeito: ${defectDesc}. Solução: ${solutionDesc}`)
      }
    },
    onSuccess: () => {
      toast.success('OS concluída com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['equipments'] })
      onClose()
    },
    onError: (err: any) => toast.error(err.message)
  })

  const addPart = () => {
    if (!selectedSupply || !supplyQty) return
    const supply = supplies.find(s => s.id === selectedSupply)
    if (!supply) return
    const qty = parseFloat(supplyQty)
    if (qty > supply.stock_quantity) {
      toast.error('Quantidade maior que o estoque disponível!')
      return
    }
    setConsumedParts([...consumedParts, { supply, quantity: qty }])
    setSelectedSupply('')
    setSupplyQty('1')
  }

  const removePart = (index: number) => {
    setConsumedParts(consumedParts.filter((_, i) => i !== index))
  }

  const handleFinish = () => {
    executeMutation.mutate()
  }

  if (!order) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Execução de OS: {order.type.toUpperCase()}</DialogTitle>
          <div className="text-sm text-muted-foreground">
            Equipamento: <span className="font-bold">{order.equipment?.patrimony}</span> ({order.equipment?.model})<br/>
            Cliente: {order.customer?.fantasy_name || order.customer?.legal_name}
            {order.notes && (
              <div className="mt-2 p-2 bg-muted/50 rounded border-l-2 border-primary text-foreground text-sm">
                <strong>Motivo / Observação Inicial:</strong> {order.notes}
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex border-b mb-4">
          <button 
            className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'execucao' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
            onClick={() => setActiveTab('execucao')}
          >
            <PenTool className="h-4 w-4 inline mr-1" /> Execução
          </button>
          <button 
            className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'historico' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
            onClick={() => setActiveTab('historico')}
          >
            <History className="h-4 w-4 inline mr-1" /> Histórico do Equipamento
          </button>
        </div>

        {activeTab === 'historico' && (
          <div className="space-y-4">
            {history.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhum histórico encontrado para este equipamento.</p>
            ) : (
              history.map(h => (
                <div key={h.id} className="border p-3 rounded bg-muted/30">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm">{h.action}</span>
                    <span className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                  {h.customer && <div className="text-xs">Cliente: {h.customer.fantasy_name || h.customer.legal_name}</div>}
                  {h.notes && <div className="text-sm mt-2 text-muted-foreground">{h.notes}</div>}
                  <div className="text-xs mt-1">Por: {h.user?.name || 'Sistema'}</div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'execucao' && (
          <div className="space-y-6">
            
            {/* Relato Técnico */}
            <div className="space-y-4 bg-muted/20 p-4 rounded-lg border">
              <h3 className="font-bold flex items-center gap-2"><Wrench className="h-4 w-4" /> Relato Técnico</h3>
              <div className="space-y-2">
                <Label>Descrição do Defeito</Label>
                <Textarea value={defectDesc} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDefectDesc(e.target.value)} placeholder="Ex: Equipamento não estava gelando..." />
              </div>
              <div className="space-y-2">
                <Label>Solução / Observações Finais</Label>
                <Textarea value={solutionDesc} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSolutionDesc(e.target.value)} placeholder="Ex: Equipamento testado e operando normalmente em -4C..." />
              </div>
            </div>

            {/* Consumo de Peças / Troca */}
            <div className="space-y-4 bg-muted/20 p-4 rounded-lg border">
              <h3 className="font-bold flex items-center gap-2"><PackagePlus className="h-4 w-4" /> Consumo e Substituições</h3>
              
              {order.type === 'troca' && (
                <div className="space-y-2 pb-4 border-b">
                  <Label className="text-primary font-bold">Equipamento Novo (Sendo deixado no cliente) *</Label>
                  <select 
                    value={newEquipmentId} 
                    onChange={e => setNewEquipmentId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Selecione o equipamento disponível...</option>
                    {availableEquipments.map(eq => (
                      <option key={eq.id} value={eq.id}>{eq.patrimony} - {eq.model} ({eq.type})</option>
                    ))}
                  </select>
                  {availableEquipments.length === 0 && (
                    <p className="text-xs text-red-500">Nenhum equipamento disponível no estoque.</p>
                  )}
                </div>
              )}
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-2">
                  <Label>Peça / Insumo</Label>
                  <select 
                    value={selectedSupply} 
                    onChange={e => setSelectedSupply(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Selecione...</option>
                    {supplies.map(s => (
                      <option key={s.id} value={s.id}>{s.name} (Estoque: {s.stock_quantity} {s.unit})</option>
                    ))}
                  </select>
                </div>
                <div className="w-24 space-y-2">
                  <Label>Qtd.</Label>
                  <Input type="number" step="0.01" min="0.01" value={supplyQty} onChange={e => setSupplyQty(e.target.value)} />
                </div>
                <Button onClick={addPart} variant="secondary">Adicionar</Button>
              </div>

              {consumedParts.length > 0 && (
                <div className="mt-4 space-y-2">
                  <Label>Peças aplicadas nesta OS:</Label>
                  {consumedParts.map((part, i) => (
                    <div key={i} className="flex justify-between items-center bg-background border p-2 rounded text-sm">
                      <span>{part.quantity} {part.supply.unit} - {part.supply.name}</span>
                      <Button variant="ghost" size="sm" onClick={() => removePart(i)} className="text-red-500 h-6 w-6 p-0"><Trash2 className="h-4 w-4"/></Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assinatura */}
            <div className="space-y-4 bg-muted/20 p-4 rounded-lg border">
              <h3 className="font-bold">Assinatura do Cliente / Recebedor</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome de quem acompanhou/recebeu</Label>
                  <Input value={receiverName} onChange={e => setReceiverName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Documento (RG/CPF)</Label>
                  <Input value={receiverDoc} onChange={e => setReceiverDoc(e.target.value)} />
                </div>
              </div>

              <div className="mt-4">
                <Label>Assinatura Digital (Toque ou use o mouse)</Label>
                <div className="border bg-white rounded-md mt-2 overflow-hidden shadow-inner">
                  <SignatureCanvas 
                    ref={sigCanvas} 
                    canvasProps={{ className: 'w-full h-40' }} 
                    backgroundColor="rgb(255,255,255)"
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={() => sigCanvas.current?.clear()} className="mt-2">
                  Limpar Assinatura
                </Button>
              </div>
            </div>

          </div>
        )}

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleFinish} disabled={executeMutation.isPending} className="bg-green-600 hover:bg-green-700 text-white">
            Finalizar e Salvar OS
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
