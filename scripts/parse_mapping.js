const xlsx = require('xlsx');
const fs = require('fs');

const workbook = xlsx.readFile('../doc/PHS Kab - sample.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// We can get the data as an array of arrays
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

// Start scanning from row 5
const blocks = [];
let currentBlock = null;

for (let r = 5; r < data.length; r++) {
    const row = data[r];
    if (!row || row.length === 0) continue;
    
    const no = row[0];
    if (no && !isNaN(no)) {
        // Start a new block
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { rows: [] };
    }
    
    if (currentBlock) {
        currentBlock.rows.push(row);
    }
}
if (currentBlock) blocks.push(currentBlock);

const mappings = [];

for (const block of blocks) {
    let blockKecamatan = null;
    let blockPuskesmas = null;
    
    // Find Kecamatan and Puskesmas anywhere in the block
    for (const row of block.rows) {
        if (row[1] && typeof row[1] === 'string') blockKecamatan = row[1].trim();
        if (row[2] && typeof row[2] === 'string') blockPuskesmas = row[2].trim();
    }
    
    // Create mapping for each Desa
    for (const row of block.rows) {
        const desa = row[4];
        if (desa && typeof desa === 'string') {
            mappings.push({
                kecamatan: blockKecamatan,
                puskesmas: blockPuskesmas,
                desa: desa.trim()
            });
        }
    }
}

fs.writeFileSync('phs_mapping.json', JSON.stringify(mappings, null, 2));
console.log('Successfully generated phs_mapping.json with ' + mappings.length + ' mappings');
