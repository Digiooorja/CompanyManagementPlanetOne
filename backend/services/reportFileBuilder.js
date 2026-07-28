// Renders a real PDF (via pdfkit) or a real Excel workbook (via exceljs) for
// a generated report, given the definition's metadata and a dataset built by
// reportDataBuilder.js ({ columns, rows, summaryLines }). Returns a Buffer in
// both cases so the route can stream it straight back as a file download.
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

function buildPdfBuffer({ title, meta, dataset }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text(title, { align: 'left' });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#555555');
    meta.forEach((line) => doc.text(line));
    doc.moveDown(0.5);

    if (dataset.summaryLines?.length) {
      doc.fontSize(11).fillColor('#111111').text('Summary', { underline: true });
      doc.fontSize(10).fillColor('#333333');
      dataset.summaryLines.forEach((line) => doc.text(`\u2022 ${line}`));
      doc.moveDown(0.6);
    }

    const { columns, rows } = dataset;
    if (!rows.length) {
      doc.fontSize(11).fillColor('#111111').text('No records match this report definition yet.');
      doc.end();
      return;
    }

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colWidth = pageWidth / columns.length;
    const rowHeight = 20;

    const drawHeader = () => {
      const startX = doc.page.margins.left;
      let y = doc.y;
      doc.fontSize(9).fillColor('#ffffff');
      doc.rect(startX, y, pageWidth, rowHeight).fill('#2563eb');
      doc.fillColor('#ffffff');
      columns.forEach((col, i) => {
        doc.text(col.label, startX + i * colWidth + 4, y + 5, { width: colWidth - 8, ellipsis: true });
      });
      doc.y = y + rowHeight;
    };

    drawHeader();

    rows.forEach((row, idx) => {
      if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        drawHeader();
      }
      const startX = doc.page.margins.left;
      const y = doc.y;
      if (idx % 2 === 0) {
        doc.rect(startX, y, pageWidth, rowHeight).fill('#f3f4f6');
      }
      doc.fillColor('#111111').fontSize(8);
      columns.forEach((col, i) => {
        const value = row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '-';
        doc.text(value, startX + i * colWidth + 4, y + 5, { width: colWidth - 8, ellipsis: true });
      });
      doc.y = y + rowHeight;
    });

    doc.end();
  });
}

async function buildExcelBuffer({ title, meta, dataset }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PlanetOne Dashboard';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Report');
  sheet.addRow([title]);
  sheet.getRow(1).font = { bold: true, size: 14 };
  meta.forEach((line) => sheet.addRow([line]));
  sheet.addRow([]);

  if (dataset.summaryLines?.length) {
    sheet.addRow(['Summary']).font = { bold: true };
    dataset.summaryLines.forEach((line) => sheet.addRow([line]));
    sheet.addRow([]);
  }

  const { columns, rows } = dataset;
  const headerRow = sheet.addRow(columns.map((c) => c.label));
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  });

  rows.forEach((row) => {
    sheet.addRow(columns.map((c) => row[c.key] ?? '-'));
  });

  sheet.columns.forEach((col) => {
    let maxLength = 12;
    col.eachCell?.({ includeEmpty: true }, (cell) => {
      const len = cell.value ? String(cell.value).length : 0;
      if (len > maxLength) maxLength = len;
    });
    col.width = Math.min(maxLength + 2, 50);
  });

  return workbook.xlsx.writeBuffer();
}

module.exports = { buildPdfBuffer, buildExcelBuffer };
