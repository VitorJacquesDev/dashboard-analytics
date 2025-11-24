import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { Widget } from '@/lib/types';

export const exportToPDF = async (elementId: string, fileName: string = 'dashboard-report') => {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
        const canvas = await html2canvas(element, {
            scale: 2,
            logging: false,
            useCORS: true,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [canvas.width, canvas.height],
        });

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${fileName}.pdf`);
    } catch (error) {
        console.error('Export to PDF failed', error);
    }
};

export const exportToXLSX = (widgets: Widget[], dataMap: Record<string, any[]>, fileName: string = 'dashboard-data') => {
    const wb = XLSX.utils.book_new();

    widgets.forEach(widget => {
        const data = dataMap[widget.id];
        if (data && data.length > 0) {
            const ws = XLSX.utils.json_to_sheet(data);
            XLSX.utils.book_append_sheet(wb, ws, widget.title.substring(0, 31)); // Sheet names max 31 chars
        }
    });

    XLSX.writeFile(wb, `${fileName}.xlsx`);
};

export const exportToCSV = (data: any[], fileName: string = 'data') => {
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${fileName}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
