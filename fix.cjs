const fs = require('fs');
let content = fs.readFileSync('src/pages/SalesApp/NewOrder/index.tsx', 'utf-8');

const replacement1 = `            <Textarea 
              placeholder="Digite aqui observações para a nota fiscal ou entrega..." 
              defaultValue={order.notes?.replace(/\\s*\\[Origem: Importação Planilha\\]\\s*/g, '').trim() || ''}
              onBlur={(e) => {
                const isImported = order.notes?.includes('[Origem: Importação Planilha]')
                let newNotes = e.target.value
                if (isImported && !newNotes.includes('[Origem: Importação Planilha]')) {
                  newNotes = newNotes ? newNotes + '\\n\\n[Origem: Importação Planilha]' : '[Origem: Importação Planilha]'
                }
                if (newNotes !== order.notes) {
                  handleUpdate({ notes: newNotes })
                }
              }}
              className="resize-none h-20"
            />`;

content = content.replace(/<Textarea\s+placeholder="Digite aqui observações para a nota fiscal ou entrega\.\.\."\s+defaultValue=\{order\.notes \|\| ''\}\s+onBlur=\{\(e\) => \{\s+if \(e\.target\.value !== order\.notes\) \{\s+handleUpdate\(\{ notes: e\.target\.value \}\)\s+\}\s+\}\}\s+className="resize-none h-20"\s+\/>/, replacement1);

fs.writeFileSync('src/pages/SalesApp/NewOrder/index.tsx', content, 'utf-8');
console.log('Replaced in NewOrder');
