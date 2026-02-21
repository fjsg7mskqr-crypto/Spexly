declare module 'jspdf' {
  class jsPDF {
    constructor(options?: Record<string, unknown>);
    text(text: string, x: number, y: number, options?: Record<string, unknown>): jsPDF;
    setFontSize(size: number): jsPDF;
    setFont(fontName: string, fontStyle?: string): jsPDF;
    setTextColor(r: number, g?: number, b?: number): jsPDF;
    setDrawColor(r: number, g?: number, b?: number): jsPDF;
    setFillColor(r: number, g?: number, b?: number): jsPDF;
    setLineWidth(width: number): jsPDF;
    line(x1: number, y1: number, x2: number, y2: number): jsPDF;
    rect(x: number, y: number, w: number, h: number, style?: string): jsPDF;
    roundedRect(x: number, y: number, w: number, h: number, rx: number, ry: number, style?: string): jsPDF;
    addPage(): jsPDF;
    getNumberOfPages(): number;
    splitTextToSize(text: string, maxWidth: number): string[];
    getTextWidth(text: string): number;
    save(filename: string): void;
    output(type: string): string | ArrayBuffer;
    internal: { pageSize: { getWidth(): number; getHeight(): number } };
  }
  export default jsPDF;
}
