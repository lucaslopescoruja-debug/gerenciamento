import React from 'react'

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
    const totalItemsCount = details?.items?.length || 0

    // Safely get date
    const emissionDate = details.created_at ? new Date(details.created_at).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')

    return (
      <div ref={ref} className="bg-white text-black p-8 text-[11px] leading-tight font-sans mx-auto w-[800px] print:w-full print:p-0">
        
        {/* HEADER */}
        <div className="flex justify-between items-center border-[1.5px] border-black p-4 mb-4">
          <div className="w-1/3">
            {company?.logo_url ? (
              <img src={company.logo_url} alt="Logo" className="max-h-12 object-contain" />
            ) : (
              <h1 className="text-4xl font-bold text-orange-500 tracking-tighter" style={{ fontFamily: 'sans-serif' }}>
                {company?.fantasy_name || company?.name || 'SL Stock'}
              </h1>
            )}
          </div>
          <div className="w-1/3 text-center">
            <h2 className="text-[13px] font-bold">Pedido de venda {details.order_number}</h2>
          </div>
          <div className="w-1/3 text-right">
            <p className="text-[13px] font-bold mb-1">Página 1 de 1</p>
            <p className="text-[11px] font-bold">Emissão {emissionDate}</p>
          </div>
        </div>

        {/* DADOS DO CLIENTE */}
        <div className="flex mb-2 text-[11px]">
          <div className="w-16">
            Cliente:
          </div>
          <div className="flex-1 uppercase">
            <div>{details.customer?.document || ''} {details.customer?.legal_name || 'Consumidor'}</div>
            <div>
              {details.customer?.address || ''} {details.customer?.address_number || ''}, bairro {details.customer?.neighborhood || ''} - {details.customer?.city || ''}/{details.customer?.state || ''} CEP {details.customer?.zip_code || ''}
            </div>
            <div>{details.customer?.phone || ''}</div>
          </div>
        </div>
        
        <div className="border-b-[1.5px] border-black mb-1"></div>

        {/* ITENS */}
        <div className="mb-1 pl-12 font-bold text-[10px]">Produtos/Serviços</div>
        <table className="w-full border-collapse border-[1.5px] border-black mb-2 text-[10px]">
          <thead>
            <tr>
              <th className="border border-black p-1 text-center w-8">#</th>
              <th className="border border-black p-1 text-left pl-2">Item</th>
              <th className="border border-black p-1 text-center w-24">Quantidade</th>
              <th className="border border-black p-1 text-center w-20">Vl un</th>
              <th className="border border-black p-1 text-center w-20">Vl desconto</th>
              <th className="border border-black p-1 text-center w-24">Vl tot</th>
            </tr>
          </thead>
          <tbody>
            {details.items?.map((item: any, index: number) => (
              <tr key={item.id}>
                <td className="border border-black p-1 text-center">{index + 1}</td>
                <td className="border border-black p-1 text-left pl-2 uppercase">{item.product?.description}</td>
                <td className="border border-black p-1 text-center">{item.quantity.toFixed(2).replace('.', ',')} {item.product?.unit || 'CX'}</td>
                <td className="border border-black p-1 text-center">{item.unit_price.toFixed(2).replace('.', ',')}</td>
                <td className="border border-black p-1 text-center">0,00</td>
                <td className="border border-black p-1 text-center">{item.total_price.toFixed(2).replace('.', ',')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTAIS */}
        <div className="mb-4 relative text-[10px]">
          <div className="font-bold mb-1">Totais</div>
          <div className="flex justify-center mb-1">
            <div className="grid grid-cols-[150px_80px] gap-x-1 text-right">
              <div>Valor total dos produtos</div>
              <div>{computedSubtotal.toFixed(2).replace('.', ',')}</div>
              <div>Desconto</div>
              <div>{totalDiscount.toFixed(2).replace('.', ',')}</div>
              <div className="font-bold">Valor total</div>
              <div className="font-bold">{computedNetAmount.toFixed(2).replace('.', ',')}</div>
            </div>
          </div>
          <div className="absolute top-8 right-24">
            Quantidade de Itens:{totalItemsCount}
          </div>
        </div>
        
        <div className="border-b-[1.5px] border-black mb-2"></div>

        {/* COBRANÇA E TRANSPORTE */}
        <div className="font-bold mb-2 text-[10px]">Cobrança e Transporte</div>
        
        {/* Linha pontilhada */}
        <div className="border-b-[1.5px] border-black border-dashed mb-4"></div>

        <div className="flex justify-between items-start mb-4 uppercase text-[11px]">
          <div className="flex-1">
            <div className="font-bold mb-0.5">Número do pedido: {details.order_number}</div>
            <div className="font-bold mb-0.5">Forma de pagamento: A prazo - {details.payment_condition?.name || ''}</div>
            <div className="font-bold mb-0.5">Razão social: {details.customer?.legal_name || ''}</div>
            <div className="font-bold mb-0.5">Nome fantasia: {details.customer?.fantasy_name || details.customer?.legal_name || ''}</div>
            <div className="font-bold mb-0.5">Valor total: {computedNetAmount.toFixed(2).replace('.', ',')}</div>
            <div className="font-bold uppercase mt-0.5 max-w-[400px]">
              OBS:{details.notes?.replace(/\s*\[Origem: Importação Planilha\]\s*/g, '').trim() || ''}
            </div>
          </div>
          
          <div className="w-[350px] text-center mt-6 font-bold text-[11px] flex flex-col justify-end relative">
            {details.signature_data && (
              <div className="flex justify-center mb-1">
                <img src={details.signature_data} className="max-h-16 object-contain" alt="Assinatura" />
              </div>
            )}
            <div className="border-t-[1.5px] border-black pt-1">
              Assinatura<br/>
              {details.receiver_name && <span>Recebedor: {details.receiver_name}<br/></span>}
              {details.receiver_doc && <span>Doc: {details.receiver_doc}<br/></span>}
              <span className="whitespace-nowrap">Declaro que recebi as mercadorias acima mencionadas.</span><br/>
              <span className="text-[8px] font-normal text-gray-500 block mt-0.5">documento assinado digitalmente</span>
            </div>
          </div>
        </div>

        <div className="border-b-[1.5px] border-black mb-2"></div>

      </div>
    )
  }
)

InvoicePrintTemplate.displayName = 'InvoicePrintTemplate'
