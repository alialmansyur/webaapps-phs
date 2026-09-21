const xlsx = require('xlsx');
const fs = require('fs');

const workbook = xlsx.readFile('../doc/PHS Kab - sample.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Get raw data
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    fs.writeFileSync('phs_kab.json', JSON.stringify(data.slice(0, 50), null, 2));
    console.log('Successfully wrote phs_kab.json with raw data');
