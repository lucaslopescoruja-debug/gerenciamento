import React, { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import SignatureCanvas from 'react-signature-canvas'
import { equipmentsApi } from '@/api/equipments'
import { suppliesApi } from '@/api/supplies'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toaster'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { History, PenTool, Wrench, PackagePlus, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import type { EquipmentOrder, Supply } from '@/types/database'

interface ExecutionModalProps {
  isOpen: boolean
  onClose: () => void
  order: EquipmentOrder | null
}

export function ExecutionModal({ isOpen, onClose, order }: ExecutionModalProps) {
  const { company } = useAuth()
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
  const [isExchangingEquipment, setIsExchangingEquipment] = useState(false)

  const isTroca = order?.type === 'troca' || isExchangingEquipment

  useEffect(() => {
    if (isOpen && order) {
      setDefectDesc(order.defect_description || '')
      setSolutionDesc(order.solution_description || '')
      setReceiverName(order.receiver_name || '')
      setReceiverDoc(order.receiver_doc || '')
      setConsumedParts([])
      setNewEquipmentId('')
      setIsExchangingEquipment(false)
      if (sigCanvas.current) sigCanvas.current.clear()
    }
  }, [isOpen, order])

  const { data: equipmentOrders = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['equipment_orders', order?.equipment_id],
    queryFn: () => equipmentsApi.getEquipmentOrders(order!.equipment_id),
    enabled: !!order && isOpen && activeTab === 'historico'
  })

  type SortFieldType = 'os_number' | 'created_at' | 'type' | null
  const [sortField, setSortField] = useState<SortFieldType>(null)
  const [sortAsc, setSortAsc] = useState(true)

  const handleSort = (field: SortFieldType) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  const renderSortIcon = (field: SortFieldType) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3.5 w-3.5 inline-block opacity-40 hover:opacity-100 transition-opacity" />
    }
    return sortAsc 
      ? <ArrowUp className="ml-1 h-3.5 w-3.5 inline-block text-primary" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5 inline-block text-primary" />
  }

  const sortedEquipmentOrders = React.useMemo(() => {
    const sorted = [...equipmentOrders]
    if (!sortField) return sorted

    return sorted.sort((a, b) => {
      let valA: any = ''
      let valB: any = ''
      
      switch (sortField) {
        case 'os_number': valA = parseInt(a.os_number || '0'); valB = parseInt(b.os_number || '0'); break;
        case 'created_at': valA = new Date(a.created_at).getTime(); valB = new Date(b.created_at).getTime(); break;
        case 'type': valA = a.type; valB = b.type; break;
      }

      valA = valA ?? ''
      valB = valB ?? ''

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortAsc
          ? valA.localeCompare(valB, 'pt-BR', { sensitivity: 'base' })
          : valB.localeCompare(valA, 'pt-BR', { sensitivity: 'base' })
      }

      if (valA < valB) return sortAsc ? -1 : 1
      if (valA > valB) return sortAsc ? 1 : -1
      return 0
    })
  }, [equipmentOrders, sortField, sortAsc])

  const { data: supplies = [] } = useQuery({
    queryKey: ['supplies'],
    queryFn: suppliesApi.getSupplies,
    enabled: isOpen
  })

  const { data: equipments = [] } = useQuery({
    queryKey: ['equipments'],
    queryFn: equipmentsApi.getEquipments,
    enabled: isOpen && isTroca
  })

  const availableEquipments = equipments.filter(e => e.status === 'Disponível')

  const executeMutation = useMutation({
    mutationFn: async () => {
      if (!order) throw new Error('Sem OS selecionada')
      
      const sigData = sigCanvas.current?.isEmpty() ? null : sigCanvas.current?.toDataURL()

      let actionTakenText = ''
      if (isTroca) {
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
        }, `OS Entrega Finalizada. Entregue para ${order.customer?.legal_name || order.customer?.fantasy_name}`)
      } else if (order.type === 'recolha') {
        await equipmentsApi.updateEquipment(order.equipment_id, {
          status: 'Em Manutenção',
          current_customer_id: null
        }, `OS Recolha Finalizada. Retirado do cliente ${order.customer?.legal_name || order.customer?.fantasy_name} e enviado para manutenção.`)
      } else if (isTroca) {
        const partsText = consumedParts.length > 0 ? `\nPeças consumidas: ${consumedParts.map(p => `${p.quantity}x ${p.supply.name}`).join(', ')}` : ''
        
        // Equipamento antigo é recolhido
        await equipmentsApi.updateEquipment(order.equipment_id, {
          status: 'Em Manutenção',
          current_customer_id: null
        }, `Recolhido em OS de Troca/Manutenção. Cliente: ${order.customer?.legal_name || order.customer?.fantasy_name}. Enviado para manutenção.${partsText}`)
        
        // Equipamento novo é entregue
        await equipmentsApi.updateEquipment(newEquipmentId, {
          status: 'No Cliente',
          current_customer_id: order.customer_id
        }, `Entregue em OS de Troca/Manutenção. Cliente: ${order.customer?.legal_name || order.customer?.fantasy_name}`)
      } else {
        const partsText = consumedParts.length > 0 ? `\nPeças consumidas: ${consumedParts.map(p => `${p.quantity}x ${p.supply.name}`).join(', ')}` : ''
        await equipmentsApi.createHistory(order.equipment_id, `OS de ${order.type.toUpperCase()} finalizada`, order.customer_id, `Defeito: ${defectDesc}. Solução: ${solutionDesc}${partsText}`)
      }
    },
    onSuccess: () => {
      toast.success('OS concluída com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['equipment_orders'] })
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
            Cliente: {order.customer?.legal_name || order.customer?.fantasy_name}
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
            {isLoadingHistory ? (
              <p className="text-center py-4 text-muted-foreground">Carregando histórico...</p>
            ) : equipmentOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhum histórico de OS encontrado para este equipamento.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('os_number')}>OS {renderSortIcon('os_number')}</TableHead>
                      <TableHead className="cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('created_at')}>Data {renderSortIcon('created_at')}</TableHead>
                      <TableHead className="cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => handleSort('type')}>Tipo {renderSortIcon('type')}</TableHead>
                      <TableHead>Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedEquipmentOrders.map(o => (
                      <TableRow key={o.id}>
                        <TableCell className="font-bold whitespace-nowrap">#{o.os_number || '---'}</TableCell>
                        <TableCell className="whitespace-nowrap">{new Date(o.created_at).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="uppercase text-xs font-medium">{o.type}</TableCell>
                        <TableCell>
                          {o.type === 'manutencao' ? (
                            <div className="text-sm">
                              {o.supplies && o.supplies.length > 0 ? (
                                <ul className="list-disc list-inside">
                                  {o.supplies.map((s: any, idx: number) => (
                                    <li key={idx}>{s.quantity_consumed} {s.supply?.unit} - {s.supply?.name}</li>
                                  ))}
                                </ul>
                              ) : (
                                <span className="text-muted-foreground italic">Nenhum insumo registrado</span>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm">
                              <span className="font-semibold">Local:</span> {o.customer?.legal_name || o.customer?.fantasy_name || 'Depósito / Galpão'}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'execucao' && (
          <div className="space-y-6">
            
            {(order.type === 'entrega' || order.type === 'recolha') && (
              <div className="space-y-4 bg-muted/20 p-4 rounded-lg border">
                <h3 className="font-bold flex items-center gap-2">Termo de {order.type === 'entrega' ? 'Comodato' : 'Recolha'}</h3>
                <div className="bg-white p-6 border rounded text-xs text-black font-serif h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                  {order.type === 'entrega' ? (
`CONTRATO PARTICULAR DE COMODATO

Contrato nº ${order.os_number ? `BA${String(order.os_number).padStart(5, '0')}/2026` : 'BA00000/2026'}
                                                                                                      Patrimônio: ${order.equipment?.patrimony || '______'}.

PARTES

COMODANTE: ${company?.name || '______________'}, inscrita no CNPJ sob o número ${company?.cnpj || '______________'}, sediada à ${company?.garage_street || '______________'}, nº. ${company?.garage_number || '___'} ${company?.garage_neighborhood || ''}, ${company?.garage_city || '______________'} – ${company?.garage_state || '___'}, CEP: ${company?.garage_cep || '______________'}.

COMODATÁRIO: ${order.customer?.legal_name || order.customer?.fantasy_name || '______________'}, insc.no CNPJ/CPF ${order.customer?.document || '______________'}, ${[order.customer?.address, order.customer?.number, order.customer?.neighborhood, order.customer?.city, order.customer?.state].filter(Boolean).join(', ')}

DAS OBRIGAÇÕES DAS PARTES

1º) A parte denominada neste ato COMODANTE cede 01 ${order.equipment?.type || '______________'} ${order.equipment?.model || '______________'}, entregue no endereço do COMODATÁRIO, sem nenhum custo de aluguel para este, devendo o mesmo guardar e zelar do mesmo.

2º) O equipamento cedido em comodato destina-se exclusivamente para o uso e venda dos produtos do COMODANTE, ficando expressamente vedada a sua utilização para produtos de outras marcas, sob pena de imediata rescisão deste contrato.

3º) É dever do COMODATÁRIO conservar o equipamento como se seu fosse, de forma que findo o presente contrato possa devolvê-lo em perfeito estado de conservação e funcionamento, ressalvando o desgaste normal pelo uso.

4º) As obrigações deste contrato são intransferíveis, entendendo que o objeto do comodato deve ficar em posse única e exclusivamente do COMODATÁRIO enquanto durar o contrato, sob pena de indenizar o COMODANTE no valor equivalente 01 aparelho novo, do mesmo modelo que o cedido e no valor do marcado na época da compra, que poderá ser cobrado na via judicial. No caso de troca do endereço de prestação dos serviços do COMODATÁRIO, este deverá solicitar por escrito o consentimento do COMODANTE, que se reserva no direito de autorizar ou não, importando a violação desta cláusula na retenção do aparelho por parte do cedente.

5º) O COMODATÁRIO deverá permitir a inspeção e fiscalização do objeto por parte do COMODANTE sempre que este entender necessário.

6º) Em caso de defeito técnico o COMODATÁRIO deverá comunicar o COMODANTE por escrito, de forma a serem tomadas todas as medidas cabíveis, que podem ir desde a manutenção do bem ou a sua troca por outro. Caso o defeito seja por culpa do COMODATÁRIO, este deverá arcar com as despesas.

7º) O COMODANTE não se responsabilizará por produtos danificados em razão da falta de energia elétrica, ou acidentes causados por casos fortuitos e forças maiores.

8º) O COMODANTE irá fornecer todo o produto que será oferecido ao COMODATÁRIO para venda, mediante compra dos mesmos pelo segundo, de forma que havendo atraso no pagamento dos mesmos, ao COMODATÁRIO será imposto multa no importe de 6%, juros de 0,20% ao dia, bem como custas judiciais que possam haver e honorários do advogado do COMODANTE no importe de 30% sobre o valor do débito.

DO PRAZO DE VALIDADE

9º) Este contrato será por tempo indeterminado, podendo ser unilateralmente rescindido por ambas as partes, havendo justo motivo para tanto, devendo notificar a outra parte por escrito com antecedência mínima de 48 horas.

10º) Assinam ao final, além das partes, 02 testemunhas.

Elege-se o foro da comarca de Porto Seguro - BA para dirimir quaisquer controvérsias oriundas do presente contrato.

Porto Seguro, ${new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}.
`
                  ) : (
`TERMO DE RECOLHA DE EQUIPAMENTO

Serve o presente termo para atestar que na presente data, foi recolhido o equipamento descrito abaixo (Item1.) do cliente:

• CNPJ/CPF: ${order.customer?.document || '_____________________'}
• Razão Social: ${order.customer?.legal_name || order.customer?.fantasy_name || '______________'}
• Endereço: ${[order.customer?.address, order.customer?.number, order.customer?.neighborhood, order.customer?.city, order.customer?.state].filter(Boolean).join(', ')}
• Tipo de equipamento: ${order.equipment?.type || '______________________'}
• Modelo: ${order.equipment?.model || '_____________'}
• Número do patrimônio: ${order.equipment?.patrimony || '_________'}
(1) Quantidade: 1

As partes assinam o presente documento em 2(duas) vias de igual teor e forma na presença de 2(duas) testemunhas abaixo identificadas.

Porto Seguro, ${new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}.
`
                  )}
                </div>
              </div>
            )}

            {order.type !== 'entrega' && order.type !== 'recolha' && (
              <>
            
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
              
              {order.type !== 'troca' && (
                <div className="flex items-center gap-2 pb-4 mb-2">
                  <input 
                    type="checkbox" 
                    id="exchangeEquipment" 
                    checked={isExchangingEquipment} 
                    onChange={e => setIsExchangingEquipment(e.target.checked)} 
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <Label htmlFor="exchangeEquipment" className="cursor-pointer text-sm font-medium">
                    Realizar troca integral do equipamento (recolher o atual e deixar um novo)
                  </Label>
                </div>
              )}

              {isTroca && (
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
            </>
          )}

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
