import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportColumn {
  header: string;
  key: string;
}

/**
 * Export data to an Excel (.xlsx) file
 */
export const exportToExcel = (data: any[], columns: ExportColumn[], filename: string) => {
  // Map data to match the headers
  const exportData = data.map(item => {
    const row: Record<string, any> = {};
    columns.forEach(col => {
      // Handle nested keys like "profiles.full_name"
      let value = item;
      const keys = col.key.split('.');
      for (const k of keys) {
        if (value === undefined || value === null) break;
        value = value[k];
      }
      row[col.header] = value !== undefined && value !== null ? value : '-';
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

/**
 * Export data to a PDF file
 */
export const exportToPDF = (data: any[], columns: ExportColumn[], filename: string, title: string, subtitle?: string) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  // Subtitle
  let startY = 30;
  if (subtitle) {
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(subtitle, 14, 30);
    startY = 40;
  }
  
  // Map data
  const head = [columns.map(col => col.header)];
  const body = data.map(item => {
    return columns.map(col => {
      let value = item;
      const keys = col.key.split('.');
      for (const k of keys) {
        if (value === undefined || value === null) break;
        value = value[k];
      }
      return value !== undefined && value !== null ? String(value) : '-';
    });
  });

  autoTable(doc, {
    startY,
    head,
    body,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  doc.save(`${filename}.pdf`);
};
