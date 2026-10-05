export interface ExcelColumn<T> {
  header: string;
  accessor: (row: T) => unknown;
}

function escapeXml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Exports data to a Microsoft Excel-compatible Spreadsheet (.xls).
 * Uses XML Spreadsheet format recognized natively by Microsoft Excel,
 * Google Sheets, and LibreOffice with formatted headers.
 */
export function exportToExcel<T>(filename: string, columns: ExcelColumn<T>[], rows: T[]): void {
  const cleanFilename = filename.replace(/\.(xlsx|xls|csv)$/i, '');

  const headerCells = columns
    .map(
      (col) =>
        `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(col.header)}</Data></Cell>`,
    )
    .join('');

  const rowLines = rows
    .map((row) => {
      const cells = columns
        .map((col) => {
          const val = col.accessor(row);
          const isNum = typeof val === 'number' && !Number.isNaN(val);
          const type = isNum ? 'Number' : 'String';
          const content = isNum ? String(val) : escapeXml(val);
          return `<Cell><Data ss:Type="${type}">${content}</Data></Cell>`;
        })
        .join('');
      return `<Row>${cells}</Row>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1D4ED8" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Report">
  <Table>
   <Row ss:Height="22">${headerCells}</Row>
   ${rowLines}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${cleanFilename}.xls`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
