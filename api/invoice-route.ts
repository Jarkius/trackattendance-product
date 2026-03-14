/**
 * Thai Invoice / Tax Invoice PDF Generator
 *
 * Generates A4 PDF invoices in Thai with:
 * - pdfmake (TH Sarabun New font)
 * - PromptPay QR code (net amount after WHT 3%)
 * - VAT 7% toggle
 * - WHT 3% withholding tax calculation
 *
 * Research template from Gemini — not yet integrated into main server.ts
 * TODO: Replace placeholder tax ID, company details, and bank account
 * TODO: Download TH Sarabun New fonts to src/fonts/
 */

import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import PdfPrinter from 'pdfmake';
import generatePayload from 'promptpay-qr';
import QRCode from 'qrcode';
import path from 'path';

const fastify = Fastify({ logger: true });

// --- 1. Font Configuration for Node.js Backend ---
const fonts = {
  THSarabunNew: {
    normal: path.join(__dirname, 'fonts', 'THSarabunNew.ttf'),
    bold: path.join(__dirname, 'fonts', 'THSarabunNew-Bold.ttf'),
    // Fallback to normal if italics are missing
    italics: path.join(__dirname, 'fonts', 'THSarabunNew.ttf'),
    bolditalics: path.join(__dirname, 'fonts', 'THSarabunNew-Bold.ttf')
  }
};
const printer = new PdfPrinter(fonts);

// --- 2. Request Interfaces ---
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
    apply_vat: boolean; // true = 7% VAT, false = 0% VAT
  };
}

// --- 3. The Fastify Route ---
fastify.post('/v1/invoices/generate', async (request: FastifyRequest<InvoiceRequest>, reply: FastifyReply) => {
  const { invoice_no, client_name, client_address, client_tax_id, items, license_key, apply_vat } = request.body;

  // 3.1 Calculate Totals
  const subtotal = items.reduce((sum, item) => sum + (item.qty * item.unit_price), 0);
  const vat = apply_vat ? subtotal * 0.07 : 0;
  const grandTotal = subtotal + vat;

  // WHT 3% is calculated on the Base Subtotal (Exclude VAT)
  const wht3 = subtotal * 0.03;
  const netTransfer = grandTotal - wht3;

  // 3.2 Generate PromptPay QR Base64 (Using our Tax ID & Net Transfer Amount)
  const MY_TAX_ID = '0123456789123'; // TODO: Replace with actual tax ID
  const promptPayPayload = generatePayload(MY_TAX_ID, { amount: netTransfer });
  const qrImageBase64 = await QRCode.toDataURL(promptPayPayload);

  // 3.3 Prepare Table Rows
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

  // 3.4 Define PDF Layout structure
  const docDefinition: any = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    defaultStyle: {
      font: 'THSarabunNew',
      fontSize: 16, // Sarabun 16pt is equal to standard 12pt
    },
    styles: {
      header: { fontSize: 24, bold: true },
      subheader: { fontSize: 16, bold: true },
      tableHeader: { bold: true, fillColor: '#eeeeee' },
      totalsText: { bold: true }
    },
    content: [
      // Company Header & Document Title
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
              `ครบกำหนด (Due Date): ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('th-TH')}` // +7 Days
            ]
          }
        ]
      },
      { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1 }] },
      { text: '\n' },

      // Client Details
      {
        text: [
          { text: 'ลูกค้า (Customer):\n', bold: true },
          `${client_name}\n`,
          `${client_address}\n`,
          `เลขประจำตัวผู้เสียภาษี: ${client_tax_id}\n\n`
        ]
      },

      // Line Items Table
      {
        table: {
          headerRows: 1,
          widths: ['auto', '*', 'auto', 'auto', 100],
          body: tableBody
        },
        layout: 'lightHorizontalLines'
      },
      { text: '\n' },

      // Totals & PromptPay Section
      {
        columns: [
          // Left Side: Payment Info & PromptPay
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
          // Right Side: Totals Math
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

      // Embed PromptPay QR Code
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

  // 3.5 Generate PDF Buffer Promise
  const generatePdf = (): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
      try {
        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        const chunks: any[] = [];
        pdfDoc.on('data', (chunk) => chunks.push(chunk));
        pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
        pdfDoc.end();
      } catch (err) {
        reject(err);
      }
    });
  };

  try {
    const pdfBuffer = await generatePdf();

    // 3.6 Send Response
    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', `attachment; filename="invoice_${invoice_no}.pdf"`);
    return reply.send(pdfBuffer);

  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Failed to generate PDF' });
  }
});

fastify.listen({ port: 3000 }, (err, address) => {
  if (err) throw err;
  console.log(`Server listening at ${address}`);
});
