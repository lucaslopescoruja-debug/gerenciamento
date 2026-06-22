import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function test() {
  const data = new Uint8Array(fs.readFileSync('PEDIDO_-_19-06-8Yee.pdf'));
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdf = await loadingTask.promise;
  
  let recognized = 0;
  let totalLines = 0;
  let totalQty = 0;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageItems = textContent.items;
    
    pageItems.sort((a, b) => {
      if (Math.abs(b.transform[5] - a.transform[5]) > 2) {
         return b.transform[5] - a.transform[5];
      }
      return a.transform[4] - b.transform[4];
    });

    let lines = [];
    let currentLine = "";
    let currentY = -1;

    pageItems.forEach(item => {
       if (currentY === -1 || Math.abs(currentY - item.transform[5]) <= 2) {
         currentLine += item.str + " ";
         currentY = item.transform[5];
       } else {
         lines.push(currentLine.trim());
         currentLine = item.str + " ";
         currentY = item.transform[5];
       }
    });
    if (currentLine) lines.push(currentLine.trim());

    for (const line of lines) {
       totalLines++;
       // The regex now specifically requires a quantity format like 50,00 right after the unit
       const match = line.match(/^(\d+)\s+(\d+)\s+(.+?)\s+(CX|FD|UN)\s+(\d+,\d{2})\s+/);
       if (match) {
         recognized++;
         const factoryCode = match[2];
         const desc = match[3];
         const unit = match[4];
         const qtyStr = match[5];
         let qty = parseInt(qtyStr.split(',')[0].replace(/\./g, ''), 10);
         
         if (!isNaN(qty)) {
           totalQty += qty;
         }
         console.log(`Matched: item ${match[1]} (ext qty: ${qty}) - line: ${line}`);
       } else if (line.match(/^\d+\s+\d+/)) {
         console.log("Mismatched line:", line);
       }
    }
  }
  console.log(`Recognized ${recognized} items out of ${totalLines} lines. Total quantity: ${totalQty}`);
}

test().catch(console.error);
