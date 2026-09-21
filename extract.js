const xlsx = require('xlsx');
const fs = require('fs');
const workbook = xlsx.readFile('doc/PHS Kab - sample.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

let mapping = [];
let startIdx = 0;
for(let i=0; i<data.length; i++) {
  if(data[i][0] === 1 || data[i][0] === '1') {
    startIdx = i;
    break;
  }
}

for(let i=startIdx; i<data.length; i++) {
  let row = data[i];
  if(!row || row.length < 4) continue;
  let kecamatan = String(row[1] || '').trim();
  let puskesmas = String(row[2] || '').trim();
  let desa = String(row[3] || '').trim();
  if(kecamatan && puskesmas && desa) {
    mapping.push({kecamatan, puskesmas, desa});
  }
}
fs.writeFileSync('mapping.json', JSON.stringify(mapping, null, 2));
console.log('Mapping saved to mapping.json, total records:', mapping.length);
