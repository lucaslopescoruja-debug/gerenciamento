const fs = require('fs');
const files = [
  'src/pages/SalesApp/Orders/index.tsx',
  'src/pages/SalesApp/Orders/ImportOrdersModal.tsx',
  'src/pages/SalesApp/NewOrder/index.tsx',
  'src/pages/SalesApp/OrderGroups/index.tsx',
  'src/pages/ImportLoadModal.tsx',
  'src/pages/Deliveries/ImportGroup.tsx',
  'src/components/Sales/ImportMaxiprodModal.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.log(`Skipping missing file: ${file}`);
    continue;
  }
  let content = fs.readFileSync(file, 'utf8');
  
  if (file === 'src/pages/SalesApp/NewOrder/index.tsx') {
    content = content.replace(
      /queryKey:\s*\['order_groups'\](?:,[\s\S]*?)?queryFn:\s*async\s*\(\)\s*=>\s*\{[\s\S]*?return\s*salesApi\.getOrderGroups\(\)[\s\S]*?\}/m,
      "queryKey: ['order_groups', company?.id],\n    queryFn: async () => {\n      const { salesApi } = await import('@/api/sales')\n      return salesApi.getOrderGroups(company?.id)\n    },\n    enabled: !!company?.id"
    );
  } else {
    // For others like `queryFn: salesApi.getOrderGroups`
    content = content.replace(
      /queryKey:\s*\['order_groups'\],\s*queryFn:\s*salesApi\.getOrderGroups,?/m,
      "queryKey: ['order_groups', company?.id],\n    queryFn: () => salesApi.getOrderGroups(company?.id),\n    enabled: !!company?.id,"
    );
  }
  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
}
console.log('Done replacing getOrderGroups usages');
