const xlsx = require('xlsx');
const fs = require('fs');
const workbook = xlsx.readFile('doc/PHS Kab - sample.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

let mapping = [];
let currentKecamatan = '';
let currentPuskesmas = '';

for(let i=0; i<data.length; i++) {
  let row = data[i];
  if(!row) continue;
  if(typeof row[1] === 'string' && row[1].trim()) {
    currentKecamatan = row[1].trim();
  }
  if(typeof row[2] === 'string' && row[2].trim()) {
    currentPuskesmas = row[2].trim();
  }
  if(typeof row[4] === 'string' && row[4].trim() && currentKecamatan && currentPuskesmas) {
     // Ensure it's not a header
     if (row[4] !== 'DESA / KELURAHAN' && row[4] !== '3' && row[4].length > 1) {
        mapping.push({kecamatan: currentKecamatan, puskesmas: currentPuskesmas, desa: row[4].trim()});
     }
  }
}
fs.writeFileSync('mapping2.json', JSON.stringify(mapping, null, 2));
console.log(JSON.stringify(mapping.slice(0, 10), null, 2));
