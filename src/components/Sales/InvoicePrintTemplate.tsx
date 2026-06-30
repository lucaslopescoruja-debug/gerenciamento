import React from 'react'
import { formatCurrency } from '@/utils/formatters'

interface InvoicePrintTemplateProps {
  details: any
  company?: any
}

export const InvoicePrintTemplate = React.forwardRef<HTMLDivElement, InvoicePrintTemplateProps>(
  ({ details, company }, ref) => {
    if (!details) return null

    const computedSubtotal = details?.items?.reduce((acc: number, item: any) => acc + (item.quantity * item.unit_price), 0) || 0
    const computedItemsDiscount = details?.items?.reduce((acc: number, item: any) => acc + (item.quantity * item.unit_price - item.total_price), 0) || 0
    const computedOrderDiscount = details?.total_discount || 0
    const totalDiscount = computedItemsDiscount + computedOrderDiscount
    const computedNetAmount = computedSubtotal - totalDiscount

    return (
      <div ref={ref} className="bg-white text-black p-8 text-[11px] leading-tight font-sans mx-auto w-[800px] print:w-full print:p-0">
        {/* CABEÇALHO */}
        <div className="flex justify-between items-start border border-black p-4 mb-2">
          <div className="w-1/3">
            {company?.logo_url ? (
              <img src={company.logo_url} alt="Logo" className="max-h-16 object-contain" />
            ) : (
              <>
                <h1 className="text-2xl font-bold text-orange-500 italic">{company?.fantasy_name || company?.name || 'Delicius'}</h1>
                <h2 className="text-sm font-bold text-orange-400 tracking-widest">S O R V E T E S</h2>
              </>
            )}
          </div>
          <div className="w-2/3 text-center">
            <h2 className="text-base font-bold">DELICIUS SORVETES</h2>
            <p className="text-sm">Pedido Nº {details.order_number}</p>
          </div>
        </div>

        {/* DADOS DO CLIENTE */}
        <div className="border border-black mb-2 flex flex-col">
          <div className="border-b border-black p-1">
            <strong>Representada:</strong> {company?.name || 'DELICIUS SORVETES / DELICIUS DISTRIBUIDORA DE ALIMENTOS LTDA'}
          </div>
          <div className="p-1 grid grid-cols-2 gap-x-2 gap-y-1">
            <div className="col-span-2 sm:col-span-1">
              <strong>Cliente:</strong> {details.customer?.legal_name || 'Consumidor'}
            </div>
            <div className="col-span-2 sm:col-span-1">
              <strong>Nome Fantasia:</strong> {details.customer?.fantasy_name || details.customer?.legal_name || '---'}
            </div>
            <div className="col-span-2 sm:col-span-1">
              <strong>CNPJ:</strong> {details.customer?.document || '---'}
            </div>
            <div className="col-span-2 sm:col-span-1">
              <strong>Vendedor:</strong> {details.sales_rep?.nickname || '---'}
            </div>
            <div className="col-span-2 sm:col-span-1">
              <strong>Endereço:</strong> {details.customer?.address || '---'}, {details.customer?.address_number || 'S/N'}
            </div>
            <div className="col-span-2 sm:col-span-1">
              <strong>CEP:</strong> {details.customer?.zip_code || '---'}
            </div>
            <div className="col-span-2 sm:col-span-1">
              <strong>Bairro:</strong> {details.customer?.neighborhood || '---'}
            </div>
            <div className="col-span-2 sm:col-span-1">
              <strong>Cidade:</strong> {details.customer?.city || '---'} <strong>Estado:</strong> {details.customer?.state || '---'}
            </div>
            <div className="col-span-2 sm:col-span-1">
              <strong>Telefone:</strong> {details.customer?.phone || '---'}
            </div>
            <div className="col-span-2 sm:col-span-1">
              <strong>E-mail:</strong> {details.customer?.email || '---'}
            </div>
          </div>
        </div>

        {/* ITENS */}
        <table className="w-full border-collapse border border-black mb-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-1 text-center w-8">#</th>
              <th className="border border-black p-1 text-left w-20">Código</th>
              <th className="border border-black p-1 text-left">Produto</th>
              <th className="border border-black p-1 text-center w-12">Qtde.</th>
              <th className="border border-black p-1 text-center w-16">Unidade</th>
              <th className="border border-black p-1 text-right w-24">Preço Tabela</th>
              <th className="border border-black p-1 text-center w-16">Desc.</th>
              <th className="border border-black p-1 text-right w-24">Preço Líquido</th>
              <th className="border border-black p-1 text-right w-24">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {details.items?.map((item: any, index: number) => (
              <tr key={item.id}>
                <td className="border border-black p-1 text-center">{index + 1}</td>
                <td className="border border-black p-1 text-left">{item.product?.code || '---'}</td>
                <td className="border border-black p-1 text-left">{item.product?.description}</td>
                <td className="border border-black p-1 text-center">{item.quantity}</td>
                <td className="border border-black p-1 text-center">un</td>
                <td className="border border-black p-1 text-right">{formatCurrency(item.unit_price)}</td>
                <td className="border border-black p-1 text-center">{item.discount_percent ? `${item.discount_percent}%` : '----'}</td>
                <td className="border border-black p-1 text-right">{formatCurrency(item.unit_price * (1 - (item.discount_percent || 0) / 100))}</td>
                <td className="border border-black p-1 text-right">{formatCurrency(item.total_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTAIS E OBSERVAÇÕES */}
        <div className="flex justify-between items-start gap-4">
          <div className="w-1/2 border border-black p-2 min-h-[80px]">
            <strong>Observações:</strong>
            <p className="mt-1 whitespace-pre-wrap">{details.notes?.replace(/\s*\[Origem: Importação Planilha\]\s*/g, '').trim() || 'Nenhuma observação.'}</p>
            <p className="mt-2 text-[10px] text-gray-600">Emissão: {new Date().toLocaleString('pt-BR')}</p>
          </div>
          <div className="w-1/3">
            <table className="w-full border-collapse border border-black">
              <tbody>
                <tr>
                  <td className="border border-black p-1 font-bold">Subtotal:</td>
                  <td className="border border-black p-1 text-right">{formatCurrency(computedSubtotal)}</td>
                </tr>
                <tr>
                  <td className="border border-black p-1 font-bold text-red-600">Desconto:</td>
                  <td className="border border-black p-1 text-right text-red-600">- {formatCurrency(totalDiscount)}</td>
                </tr>
                <tr>
                  <td className="border border-black p-1 font-bold bg-gray-100">Total Líquido:</td>
                  <td className="border border-black p-1 text-right font-bold bg-gray-100">{formatCurrency(computedNetAmount)}</td>
                </tr>
              </tbody>
            </table>
            
            <div className="mt-4 border border-black p-2 text-center bg-gray-100">
              <strong>Condição de Pagamento</strong><br/>
              {details.payment_condition?.name || 'A Definir'}
            </div>
          </div>
        </div>
      </div>
    )
  }
)

InvoicePrintTemplate.displayName = 'InvoicePrintTemplate'
