import { describe, it, expect } from 'vitest';

describe('PDF Service Integration', () => {
  it('should have all required PDF service components', () => {
    // Test that all the required files exist and can be imported
    expect(() => require('../pdfService')).not.toThrow();
    expect(() => require('../fileStorageService')).not.toThrow();
    expect(() => require('../../api/print/route')).not.toThrow();
    expect(() => require('../../api/print/download/[fileKey]/route')).not.toThrow();
  });

  it('should export required PDF service classes and interfaces', () => {
    const { PDFService } = require('../pdfService');
    const { FileStorageService } = require('../fileStorageService');
    
    expect(PDFService).toBeDefined();
    expect(FileStorageService).toBeDefined();
    expect(typeof PDFService).toBe('function');
    expect(typeof FileStorageService).toBe('function');
  });

  it('should have proper utility functions', () => {
    const { formatCurrency, formatDate, generatePDFFilename, validateOrderForPDF } = require('../orderUtils');
    
    expect(formatCurrency).toBeDefined();
    expect(formatDate).toBeDefined();
    expect(generatePDFFilename).toBeDefined();
    expect(validateOrderForPDF).toBeDefined();
    
    // Test utility functions
    expect(formatCurrency(1000)).toBe('₹1000.00');
    expect(formatDate('2024-01-15T10:30:00Z')).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(generatePDFFilename('order', '123')).toMatch(/^order_123_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.pdf$/);
  });

  it('should validate order structure correctly', () => {
    const { validateOrderForPDF } = require('../orderUtils');
    
    const validOrder = {
      id: 'test-123',
      order_number: 1001,
      created_at: '2024-01-15T10:30:00Z',
      total_price: '1200.00',
      line_items: [{ id: 1, title: 'Test Item', quantity: 1, price: '1200.00' }]
    };
    
    const invalidOrder = {
      id: '',
      order_number: null,
      total_price: '0'
    };
    
    const validResult = validateOrderForPDF(validOrder);
    const invalidResult = validateOrderForPDF(invalidOrder);
    
    expect(validResult.isValid).toBe(true);
    expect(validResult.errors).toHaveLength(0);
    
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors.length).toBeGreaterThan(0);
  });
});