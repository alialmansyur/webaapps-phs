const xlsx = require('xlsx');
const workbook = xlsx.readFile('doc/PHS Kab - sample.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
console.log(JSON.stringify(data.slice(0, 10), null, 2));
