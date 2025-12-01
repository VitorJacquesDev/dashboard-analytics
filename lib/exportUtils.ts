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

/**
 * Export dashboard or element to PNG
 */
export const exportToPNG = async (
    elementId: string,
    fileName: string = 'dashboard'
): Promise<void> => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error('Element not found:', elementId);
        return;
    }

    try {
        const canvas = await html2canvas(element, {
            scale: 2, // High resolution
            logging: false,
            useCORS: true,
            backgroundColor: '#ffffff',
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight,
        });

        // Convert to blob and download
        canvas.toBlob((blob) => {
            if (!blob) {
                console.error('Failed to create blob');
                return;
            }

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${fileName}.png`;
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 'image/png', 1.0);
    } catch (error) {
        console.error('Export to PNG failed:', error);
        throw error;
    }
};

/**
 * Export a specific widget to PNG
 */
export const exportWidgetToPNG = async (
    widgetId: string,
    fileName: string = 'widget'
): Promise<void> => {
    // Widget elements are typically wrapped with a data attribute or specific class
    const element = document.querySelector(`[data-widget-id="${widgetId}"]`) as HTMLElement
        || document.getElementById(`widget-${widgetId}`);
    
    if (!element) {
        console.error('Widget element not found:', widgetId);
        return;
    }

    try {
        const canvas = await html2canvas(element, {
            scale: 2,
            logging: false,
            useCORS: true,
            backgroundColor: '#ffffff',
        });

        canvas.toBlob((blob) => {
            if (!blob) {
                console.error('Failed to create blob');
                return;
            }

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${fileName}.png`;
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 'image/png', 1.0);
    } catch (error) {
        console.error('Export widget to PNG failed:', error);
        throw error;
    }
};
