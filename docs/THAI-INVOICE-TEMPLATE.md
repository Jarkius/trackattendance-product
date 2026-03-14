# Thai Invoice Template (pdfmake + PromptPay QR)

> Research output from Gemini. Production-ready TypeScript for generating Thai invoices as PDF on Fastify.

## Overview

TypeScript แบบ Production-ready สำหรับสร้าง API ออกใบแจ้งหนี้/ใบกำกับภาษีภาษาไทยบน Fastify

ในฝั่ง Backend (Node.js) การใช้ pdfmake จะไม่ได้ใช้ Virtual File System (VFS) แบบการเขียนบนเบราว์เซอร์ แต่จะใช้คลาส PdfPrinter ซึ่งดึงไฟล์ฟอนต์ .ttf จากโฟลเดอร์ในเซิร์ฟเวอร์โดยตรง วิธีนี้เสถียรที่สุดและไม่เปลือง Memory

## 1. NPM Packages (The Setup)

```bash
npm install pdfmake promptpay-qr qrcode
npm install -D @types/pdfmake @types/qrcode
```

## 2. Font Preparation

ดาวน์โหลดฟอนต์ TH Sarabun New (ฟรีจาก SIPA) และวางในโปรเจกต์:

```
/src
  /fonts
    THSarabunNew.ttf
    THSarabunNew-Bold.ttf
  invoice-route.ts
```

## 3. Invoice Route Implementation

Extracted source file: [`api/invoice-route.ts`](../api/invoice-route.ts)

```typescript
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
    apply_vat: boolean;
  };
}

// --- 3. The Fastify Route ---
fastify.post('/v1/invoices/generate', async (request, reply) => {
  // ... full implementation in invoice-route.ts
});
```

## 4. Example Request

```json
{
  "invoice_no": "INV-2026-0001",
  "client_name": "บริษัท อีเวนต์ เอเจนซี่ จำกัด",
  "client_address": "999 อาคารออฟฟิศทาวเวอร์ ชั้น 15 ถ.พระราม 9 กรุงเทพฯ 10310",
  "client_tax_id": "0994000123456",
  "license_key": "EVT-884A-9B2C",
  "apply_vat": false,
  "items": [
    {
      "description": "TrackAttendance Event License (1 Base Station)",
      "qty": 1,
      "unit_price": 3500
    },
    {
      "description": "Additional Scanning Stations (Kiosk)",
      "qty": 2,
      "unit_price": 1500
    }
  ]
}
```

**Endpoint**: `POST /v1/invoices/generate`
**Response**: PDF file download (`application/pdf`)

## 5. Important Notes

- QR Code generates `netTransfer` amount (after WHT 3% deduction), not the full amount -- prevents accounting mismatch when client scans to pay
- Uses in-memory Buffer (no temp files on disk) -- compatible with Google Cloud Run
- Requires TH Sarabun New font files (.ttf) in `src/fonts/` directory
- `MY_TAX_ID` placeholder (`0123456789123`) must be replaced with actual tax ID
- Company details (name, address, bank account) are hardcoded -- update before production use

## 6. Required NPM Packages

| Package | Type | Purpose |
|---------|------|---------|
| `pdfmake` | production | PDF generation with table/layout support |
| `promptpay-qr` | production | Generate PromptPay QR payload from tax ID + amount |
| `qrcode` | production | Convert QR payload to base64 data URL image |
| `@types/pdfmake` | dev | TypeScript type definitions for pdfmake |
| `@types/qrcode` | dev | TypeScript type definitions for qrcode |
