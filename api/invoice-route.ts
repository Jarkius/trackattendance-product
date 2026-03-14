/**
 * Thai Invoice / Tax Invoice PDF Generator
 *
 * Generates A4 PDF invoices in Thai with:
 * - pdfmake (TH Sarabun New font)
 * - PromptPay QR code (net amount after WHT 3%)
 * - VAT 7% toggle
 * - WHT 3% withholding tax calculation
 *
 * TODO: Replace placeholder tax ID, company details, and bank account
 * TODO: Download TH Sarabun New fonts to src/fonts/
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
// @ts-ignore — pdfmake types don't match runtime CJS export
import PdfPrinter from 'pdfmake';
import generatePayload from 'promptpay-qr';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';

// --- Font Configuration ---
// Prefer TH Sarabun New for proper Thai rendering; fall back to bundled Roboto
// Use process.cwd() so fonts/ resolves to project root in both dev (tsx) and production (node dist/)
const thFontPath = path.join(process.cwd(), 'fonts', 'THSarabunNew.ttf');
const thFontBoldPath = path.join(process.cwd(), 'fonts', 'THSarabunNew-Bold.ttf');
const hasThaiFonts = fs.existsSync(thFontPath) && fs.existsSync(thFontBoldPath);

// Resolve Roboto from pdfmake's own directory (works in both dev and dist/)
// Wrapped in try/catch so a missing pdfmake package doesn't crash the whole server
let robotoDir: string;
try {
  robotoDir = path.join(path.dirname(require.resolve('pdfmake')), 'fonts', 'Roboto');
} catch {
  console.warn('⚠ pdfmake package not found — invoice PDF generation will be unavailable');
  robotoDir = '';
}

const fonts = hasThaiFonts
  ? {
      THSarabunNew: {
        normal: thFontPath,
        bold: thFontBoldPath,
        italics: thFontPath,
        bolditalics: thFontBoldPath,
      }
    }
  : robotoDir
    ? {
        THSarabunNew: {
          normal: path.join(robotoDir, 'Roboto-Regular.ttf'),
          bold: path.join(robotoDir, 'Roboto-Medium.ttf'),
          italics: path.join(robotoDir, 'Roboto-Italic.ttf'),
          bolditalics: path.join(robotoDir, 'Roboto-MediumItalic.ttf'),
        }
      }
    : {};

if (!hasThaiFonts && robotoDir) {
  console.warn('⚠ TH Sarabun New fonts not found — falling back to Roboto. Thai glyphs may not render. Place THSarabunNew.ttf + THSarabunNew-Bold.ttf in fonts/');
}

// @ts-ignore — pdfmake CJS default export is constructable at runtime
const printer = Object.keys(fonts).length > 0 ? new PdfPrinter(fonts) : null;

// --- Request Interfaces ---
interface InvoiceItem {
  description: string;
  qty: number;
  unit_price: number;
}

interface InvoiceRequest {
  Body: {
    invoice_no: string;
    client_name: string;
    client_address: string;
    client_tax_id: string;
    items: InvoiceItem[];
    license_key: string;
    apply_vat: boolean;
  };
}

export default async function invoiceRoute(app: FastifyInstance) {
  app.post<InvoiceRequest>('/v1/invoices/generate', async (request, reply) => {
    // Guard: pdfmake must be available
    if (!printer) {
      reply.code(503);
      return { error: 'Invoice generation unavailable — pdfmake package or fonts not configured' };
    }

    // Master API key only — reject license-key auth
    const tenant = (request as any).tenant;
    if (!tenant || !tenant.isMasterKey) {
      reply.code(403);
      return { error: 'Master API key required' };
    }

    const { invoice_no, client_name, client_address, client_tax_id, items, license_key, apply_vat } = request.body;

    if (!Array.isArray(items) || items.length === 0) {
      reply.code(400);
      return { error: 'items must be a non-empty array' };
    }

    // Calculate Totals — Math.round() to avoid floating-point rounding errors with THB
    const subtotal = Math.round(items.reduce((sum, item) => sum + (item.qty * item.unit_price), 0) * 100) / 100;
    const vat = Math.round((apply_vat ? subtotal * 0.07 : 0) * 100) / 100;
    const grandTotal = Math.round((subtotal + vat) * 100) / 100;

    // WHT 3% is calculated on the Base Subtotal (Exclude VAT)
    const wht3 = Math.round(subtotal * 0.03 * 100) / 100;
    const netTransfer = Math.round((grandTotal - wht3) * 100) / 100;

    // Generate PromptPay QR Base64
    const MY_TAX_ID = '0123456789123'; // TODO: Replace with actual tax ID
    const promptPayPayload = generatePayload(MY_TAX_ID, { amount: netTransfer });
    const qrImageBase64 = await QRCode.toDataURL(promptPayPayload);

    // Prepare Table Rows
    const tableBody: any[][] = [
      [
        { text: 'ลำดับ', style: 'tableHeader', alignment: 'center' },
        { text: 'รายการ (Description)', style: 'tableHeader' },
        { text: 'จำนวน', style: 'tableHeader', alignment: 'center' },
        { text: 'ราคา/หน่วย', style: 'tableHeader', alignment: 'right' },
        { text: 'จำนวนเงิน (THB)', style: 'tableHeader', alignment: 'right' }
      ]
    ];

    items.forEach((item, index) => {
      tableBody.push([
        { text: (index + 1).toString(), alignment: 'center' },
        { text: item.description },
        { text: item.qty.toString(), alignment: 'center' },
        { text: item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2 }), alignment: 'right' },
        { text: (item.qty * item.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 }), alignment: 'right' }
      ]);
    });

    // Define PDF Layout
    const docDefinition: any = {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      defaultStyle: {
        font: 'THSarabunNew',
        fontSize: 16,
      },
      styles: {
        header: { fontSize: 24, bold: true },
        subheader: { fontSize: 16, bold: true },
        tableHeader: { bold: true, fillColor: '#eeeeee' },
        totalsText: { bold: true }
      },
      content: [
        {
          columns: [
            {
              width: '*',
              text: [
                { text: 'บริษัท แทรคแอทเทนแดนซ์ จำกัด\n', style: 'header' },
                'TRACKATTENDANCE CO., LTD.\n',
                '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110\n',
                'เลขประจำตัวผู้เสียภาษี: 0123456789123 (สำนักงานใหญ่)\n'
              ]
            },
            {
              width: 200,
              alignment: 'right',
              text: [
                { text: 'ใบแจ้งหนี้ / ใบกำกับภาษี\n', style: 'header' },
                { text: 'INVOICE / TAX INVOICE\n\n', fontSize: 14 },
                { text: `เลขที่ (No.): ${invoice_no}\n`, bold: true },
                `วันที่ (Date): ${new Date().toLocaleDateString('th-TH')}\n`,
                `ครบกำหนด (Due Date): ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('th-TH')}`
              ]
            }
          ]
        },
        { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1 }] },
        { text: '\n' },
        {
          text: [
            { text: 'ลูกค้า (Customer):\n', bold: true },
            `${client_name}\n`,
            `${client_address}\n`,
            `เลขประจำตัวผู้เสียภาษี: ${client_tax_id}\n\n`
          ]
        },
        {
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto', 'auto', 100],
            body: tableBody
          },
          layout: 'lightHorizontalLines'
        },
        { text: '\n' },
        {
          columns: [
            {
              width: '*',
              text: [
                { text: 'วิธีการชำระเงิน (Payment Method)\n', bold: true },
                '1. โอนเงินเข้าบัญชีธนาคาร:\n',
                '   ธนาคารกสิกรไทย (Kasikorn Bank)\n',
                '   ชื่อบัญชี: บจก. แทรคแอทเทนแดนซ์\n',
                '   เลขที่บัญชี: 123-4-56789-0\n\n',
                '2. สแกน QR Code PromptPay (ยอดสุทธิหลังหักภาษีแล้ว)\n'
              ]
            },
            {
              width: 200,
              table: {
                widths: ['*', 80],
                body: [
                  ['รวมเป็นเงิน (Subtotal):', { text: subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 }), alignment: 'right' }],
                  ['ภาษีมูลค่าเพิ่ม 7% (VAT):', { text: vat.toLocaleString('en-US', { minimumFractionDigits: 2 }), alignment: 'right' }],
                  ['จำนวนเงินรวมทั้งสิ้น (Grand Total):', { text: grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 }), alignment: 'right', style: 'totalsText' }],
                  [{ text: 'หักภาษี ณ ที่จ่าย 3% (WHT 3%):', color: 'red' }, { text: `-${wht3.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, alignment: 'right', color: 'red' }],
                  [{ text: 'ยอดชำระสุทธิ (Net Transfer):', style: 'totalsText' }, { text: netTransfer.toLocaleString('en-US', { minimumFractionDigits: 2 }), alignment: 'right', style: 'totalsText' }]
                ]
              },
              layout: 'noBorders'
            }
          ]
        },
        {
          image: qrImageBase64,
          width: 120,
          alignment: 'left',
          margin: [0, 10, 0, 0]
        },
        { text: '\n* กรุณาหัก ณ ที่จ่าย 3% และจัดส่งหนังสือรับรองการหักภาษี ณ ที่จ่าย (50 ทวิ) มาตามที่อยู่บริษัท', fontSize: 14, italics: true },
        { text: `License Key อ้างอิง: ${license_key}`, fontSize: 14, color: 'gray' }
      ]
    };

    // Generate PDF Buffer
    const generatePdf = (): Promise<Buffer> => {
      return new Promise((resolve, reject) => {
        try {
          const pdfDoc = printer.createPdfKitDocument(docDefinition);
          const chunks: any[] = [];
          pdfDoc.on('data', (chunk: any) => chunks.push(chunk));
          pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
          pdfDoc.on('error', (err: Error) => reject(err));
          pdfDoc.end();
        } catch (err) {
          reject(err);
        }
      });
    };

    try {
      const pdfBuffer = await generatePdf();
      reply.header('Content-Type', 'application/pdf');
      const safeInvoiceNo = invoice_no.replace(/[^a-zA-Z0-9\-_]/g, '');
      reply.header('Content-Disposition', `attachment; filename="invoice_${safeInvoiceNo}.pdf"`);
      return reply.send(pdfBuffer);
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Failed to generate PDF' });
    }
  });
}
