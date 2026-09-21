const xlsx = require('xlsx');

const workbook = xlsx.readFile('../doc/Pendataan PHS.xlsx');

console.log('Sheets in workbook:');
workbook.SheetNames.forEach(sheetName => {
  console.log(`- ${sheetName}`);
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  if (data.length > 0) {
    console.log(`  Columns: ${data[0].join(', ')}`);
    if (data.length > 1) {
      console.log(`  Sample row: ${JSON.stringify(data[1])}`);
    }
  } else {
    console.log(`  (Empty sheet)`);
  }
});
