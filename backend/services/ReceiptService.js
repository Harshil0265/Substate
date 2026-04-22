import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ReceiptService {
  /**
   * Generate a PDF receipt for a payment
   * @param {Object} payment - Payment document
   * @param {Object} user - User document
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generateReceipt(payment, user) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: 'A4',
          margin: 50,
          info: {
            Title: `Invoice ${payment.invoiceNumber || payment._id}`,
            Author: 'SubState',
            Subject: 'Payment Receipt'
          }
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Company Header
        this.addHeader(doc);

        // Invoice Details
        this.addInvoiceDetails(doc, payment);

        // Bill To Section
        this.addBillToSection(doc, user);

        // Payment Details Table
        this.addPaymentDetailsTable(doc, payment);

        // Payment Summary
        this.addPaymentSummary(doc, payment);

        // Footer
        this.addFooter(doc);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add company header to the receipt
   */
  addHeader(doc) {
    // Company Name
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor('#6366f1')
       .text('SubState', 50, 50);

    // Company Details
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#666666')
       .text('Content & Campaign Management Platform', 50, 80)
       .text('Email: support@substate.com', 50, 95)
       .text('Website: www.substate.com', 50, 110);

    // Invoice Title
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text('INVOICE', 400, 50, { align: 'right' });

    // Horizontal line
    doc.moveTo(50, 140)
       .lineTo(545, 140)
       .strokeColor('#e5e7eb')
       .stroke();
  }

  /**
   * Add invoice details (invoice number, date, etc.)
   */
  addInvoiceDetails(doc, payment) {
    const invoiceNumber = payment.invoiceNumber || `INV-${payment._id.toString().slice(-8).toUpperCase()}`;
    const invoiceDate = new Date(payment.createdAt).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let yPosition = 160;

    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text('Invoice Number:', 400, yPosition, { align: 'right', width: 100, continued: true })
       .font('Helvetica')
       .text(` ${invoiceNumber}`, { align: 'right' });

    yPosition += 20;
    doc.font('Helvetica-Bold')
       .text('Invoice Date:', 400, yPosition, { align: 'right', width: 100, continued: true })
       .font('Helvetica')
       .text(` ${invoiceDate}`, { align: 'right' });

    yPosition += 20;
    doc.font('Helvetica-Bold')
       .text('Payment Status:', 400, yPosition, { align: 'right', width: 100, continued: true })
       .font('Helvetica')
       .fillColor(payment.status === 'COMPLETED' ? '#10b981' : '#ef4444')
       .text(` ${this.formatStatus(payment.status)}`, { align: 'right' });

    if (payment.transactionId) {
      yPosition += 20;
      doc.font('Helvetica-Bold')
         .fillColor('#000000')
         .text('Transaction ID:', 400, yPosition, { align: 'right', width: 100, continued: true })
         .font('Helvetica')
         .fontSize(8)
         .text(` ${payment.transactionId}`, { align: 'right' });
    }
  }

  /**
   * Add bill to section with customer details
   */
  addBillToSection(doc, user) {
    const yPosition = 160;

    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text('BILL TO:', 50, yPosition);

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#333333')
       .text(user.name, 50, yPosition + 25)
       .text(user.email, 50, yPosition + 40);

    if (user.phone) {
      doc.text(`Phone: ${user.phone}`, 50, yPosition + 55);
    }

    if (user.company) {
      doc.text(`Company: ${user.company}`, 50, yPosition + 70);
    }
  }

  /**
   * Add payment details table
   */
  addPaymentDetailsTable(doc, payment) {
    const tableTop = 280;
    const itemCodeX = 50;
    const descriptionX = 150;
    const quantityX = 350;
    const priceX = 420;
    const amountX = 490;

    // Table Header
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#ffffff')
       .rect(50, tableTop, 495, 25)
       .fillAndStroke('#6366f1', '#6366f1');

    doc.fillColor('#ffffff')
       .text('Item', itemCodeX + 5, tableTop + 8)
       .text('Description', descriptionX + 5, tableTop + 8)
       .text('Qty', quantityX + 5, tableTop + 8)
       .text('Price', priceX + 5, tableTop + 8)
       .text('Amount', amountX + 5, tableTop + 8);

    // Table Row
    const rowTop = tableTop + 25;
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#000000')
       .text(this.getPlanCode(payment.planType), itemCodeX + 5, rowTop + 10)
       .text(this.getPlanDescription(payment), descriptionX + 5, rowTop + 10, { width: 180 })
       .text('1', quantityX + 5, rowTop + 10)
       .text(`₹${payment.amount.toFixed(2)}`, priceX + 5, rowTop + 10)
       .text(`₹${payment.amount.toFixed(2)}`, amountX + 5, rowTop + 10);

    // Table Border
    doc.rect(50, tableTop, 495, 60)
       .strokeColor('#e5e7eb')
       .stroke();

    // Vertical lines
    doc.moveTo(150, tableTop).lineTo(150, tableTop + 60).stroke();
    doc.moveTo(350, tableTop).lineTo(350, tableTop + 60).stroke();
    doc.moveTo(420, tableTop).lineTo(420, tableTop + 60).stroke();
    doc.moveTo(490, tableTop).lineTo(490, tableTop + 60).stroke();
  }

  /**
   * Add payment summary section
   */
  addPaymentSummary(doc, payment) {
    const summaryTop = 360;
    const labelX = 350;
    const valueX = 490;

    // Subtotal
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#666666')
       .text('Subtotal:', labelX, summaryTop, { width: 130, align: 'right' })
       .text(`₹${payment.amount.toFixed(2)}`, valueX, summaryTop, { width: 55, align: 'right' });

    // Tax (if applicable)
    const taxAmount = this.calculateTax(payment.amount);
    if (taxAmount > 0) {
      doc.text('Tax (18% GST):', labelX, summaryTop + 20, { width: 130, align: 'right' })
         .text(`₹${taxAmount.toFixed(2)}`, valueX, summaryTop + 20, { width: 55, align: 'right' });
    }

    // Total line
    doc.moveTo(350, summaryTop + 40)
       .lineTo(545, summaryTop + 40)
       .strokeColor('#e5e7eb')
       .stroke();

    // Total
    const totalAmount = payment.amount + taxAmount;
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text('Total:', labelX, summaryTop + 50, { width: 130, align: 'right' })
       .text(`₹${totalAmount.toFixed(2)}`, valueX, summaryTop + 50, { width: 55, align: 'right' });

    // Amount in words
    doc.fontSize(9)
       .font('Helvetica-Oblique')
       .fillColor('#666666')
       .text(`Amount in words: ${this.numberToWords(totalAmount)} Rupees Only`, 50, summaryTop + 80, {
         width: 495,
         align: 'left'
       });

    // Payment Method
    if (payment.paymentMethod) {
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#333333')
         .text(`Payment Method: ${this.formatPaymentMethod(payment.paymentMethod)}`, 50, summaryTop + 110);
    }

    // Payment Date
    if (payment.status === 'COMPLETED' && payment.updatedAt) {
      const paymentDate = new Date(payment.updatedAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`Payment Date: ${paymentDate}`, 50, summaryTop + 130);
    }
  }

  /**
   * Add footer with terms and thank you message
   */
  addFooter(doc) {
    const footerTop = 650;

    // Thank you message
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#6366f1')
       .text('Thank you for your business!', 50, footerTop, { align: 'center', width: 495 });

    // Terms and conditions
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#666666')
       .text('Terms & Conditions:', 50, footerTop + 30)
       .fontSize(7)
       .text('• This is a computer-generated invoice and does not require a signature.', 50, footerTop + 45)
       .text('• All payments are non-refundable after 30 days from the date of purchase.', 50, footerTop + 57)
       .text('• For any queries, please contact support@substate.com', 50, footerTop + 69)
       .text('• Please retain this invoice for your records.', 50, footerTop + 81);

    // Footer line
    doc.moveTo(50, footerTop + 100)
       .lineTo(545, footerTop + 100)
       .strokeColor('#e5e7eb')
       .stroke();

    // Company footer
    doc.fontSize(8)
       .fillColor('#999999')
       .text('SubState - Empowering Content Creators', 50, footerTop + 110, { align: 'center', width: 495 });
  }

  /**
   * Helper: Get plan code
   */
  getPlanCode(planType) {
    const codes = {
      TRIAL: 'PLAN-001',
      PROFESSIONAL: 'PLAN-002',
      ENTERPRISE: 'PLAN-003'
    };
    return codes[planType] || 'PLAN-000';
  }

  /**
   * Helper: Get plan description
   */
  getPlanDescription(payment) {
    const descriptions = {
      TRIAL: 'Starter Plan - 14 Days Free Trial',
      PROFESSIONAL: 'Professional Plan - Monthly Subscription',
      ENTERPRISE: 'Enterprise Plan - Monthly Subscription'
    };
    
    let description = descriptions[payment.planType] || 'Subscription Plan';
    
    if (payment.billingPeriod === 'YEARLY') {
      description = description.replace('Monthly', 'Annual');
    }
    
    return description;
  }

  /**
   * Helper: Format status
   */
  formatStatus(status) {
    const statusMap = {
      COMPLETED: 'Paid',
      PENDING: 'Pending',
      FAILED: 'Failed',
      REFUNDED: 'Refunded',
      REFUND_REQUESTED: 'Refund Requested'
    };
    return statusMap[status] || status;
  }

  /**
   * Helper: Format payment method
   */
  formatPaymentMethod(method) {
    const methodMap = {
      RAZORPAY: 'Razorpay (Online Payment)',
      STRIPE: 'Stripe (Online Payment)',
      DIRECT: 'Direct Bank Transfer',
      FREE: 'Free Trial'
    };
    return methodMap[method] || method;
  }

  /**
   * Helper: Calculate tax (if applicable)
   */
  calculateTax(amount) {
    // For now, returning 0 as tax is typically included in the amount
    // Modify this based on your business requirements
    return 0;
  }

  /**
   * Helper: Convert number to words (Indian numbering system)
   */
  numberToWords(num) {
    if (num === 0) return 'Zero';

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    const convertLessThanThousand = (n) => {
      if (n === 0) return '';
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
    };

    const integerPart = Math.floor(num);
    const decimalPart = Math.round((num - integerPart) * 100);

    let result = '';

    if (integerPart >= 10000000) {
      result += convertLessThanThousand(Math.floor(integerPart / 10000000)) + ' Crore ';
      integerPart %= 10000000;
    }

    if (integerPart >= 100000) {
      result += convertLessThanThousand(Math.floor(integerPart / 100000)) + ' Lakh ';
      integerPart %= 100000;
    }

    if (integerPart >= 1000) {
      result += convertLessThanThousand(Math.floor(integerPart / 1000)) + ' Thousand ';
      integerPart %= 1000;
    }

    if (integerPart > 0) {
      result += convertLessThanThousand(integerPart);
    }

    if (decimalPart > 0) {
      result += ' and ' + convertLessThanThousand(decimalPart) + ' Paise';
    }

    return result.trim();
  }
}

// Export singleton instance
const receiptService = new ReceiptService();
export default receiptService;
