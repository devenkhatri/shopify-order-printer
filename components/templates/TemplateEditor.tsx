'use client'

import React, { useState, useEffect } from 'react'
import {
  Page,
  Card,
  Layout,
  FormLayout,
  TextField,
  Select,
  Checkbox,
  Text,
  Divider,
  Toast,
  Frame,
  Loading,
  Banner,
  Modal,
  ColorPicker,
  Popover,
  RangeSlider,
  Badge,
  InlineStack,
  BlockStack,
  Button
} from '@shopify/polaris'
import { Template, TemplateLayout, BusinessInfo } from '../../types/shopify'

interface TemplateEditorProps {
  templateId?: string
  onSave?: (template: Template) => void
  onCancel?: () => void
}

interface TemplatePreviewData {
  orderNumber: string
  orderDate: string
  customerName: string
  customerEmail: string
  items: Array<{
    name: string
    quantity: number
    price: number
    size: string
    color: string
    hsnCode?: string
  }>
  subtotal: number
  gstAmount: number
  total: number
  customerAddress?: {
    line1: string
    line2?: string
    city: string
    state: string
    pincode: string
  }
}

export function TemplateEditor({ templateId, onSave, onCancel }: TemplateEditorProps) {
  const [template, setTemplate] = useState<Template | null>(null)
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ content: string; error?: boolean } | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [colorPickerActive, setColorPickerActive] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [previewData] = useState<TemplatePreviewData>({
    orderNumber: 'ORD-2024-001',
    orderDate: new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    customerName: 'Rajesh Kumar',
    customerEmail: 'rajesh.kumar@example.com',
    items: [
      { 
        name: 'Premium Cotton T-Shirt', 
        quantity: 2, 
        price: 899, 
        size: 'L', 
        color: 'Navy Blue',
        hsnCode: '61091000'
      },
      { 
        name: 'Graphic Print T-Shirt', 
        quantity: 1, 
        price: 1299, 
        size: 'M', 
        color: 'White',
        hsnCode: '61091000'
      }
    ],
    subtotal: 3097,
    gstAmount: 371.64, // 12% GST as total > ₹1000
    total: 3468.64,
    customerAddress: {
      line1: '123, MG Road',
      line2: 'Koramangala',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560034'
    }
  })

  // Page size options
  const pageSizeOptions = [
    { label: 'A4', value: 'A4' },
    { label: 'A5', value: 'A5' },
    { label: 'Letter', value: 'Letter' }
  ]

  // Orientation options
  const orientationOptions = [
    { label: 'Portrait', value: 'portrait' },
    { label: 'Landscape', value: 'landscape' }
  ]

  // Font options
  const fontOptions = [
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Times New Roman', value: 'Times New Roman, serif' },
    { label: 'Helvetica', value: 'Helvetica, sans-serif' },
    { label: 'Georgia', value: 'Georgia, serif' }
  ]

  // Load template data
  useEffect(() => {
    if (templateId) {
      loadTemplate()
    } else {
      // Create new template with defaults
      setTemplate(createDefaultTemplate())
    }
    loadBusinessInfo()
  }, [templateId])

  const loadTemplate = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/templates/${templateId}`)
      const result = await response.json()
      
      if (result.success) {
        setTemplate(result.data)
      } else {
        setToast({ content: result.error || 'Failed to load template', error: true })
      }
    } catch (error) {
      setToast({ content: 'Failed to load template', error: true })
    } finally {
      setLoading(false)
    }
  }

  const loadBusinessInfo = async () => {
    try {
      const response = await fetch('/api/business-info')
      const result = await response.json()
      
      if (result.success) {
        setBusinessInfo(result.data)
      }
    } catch (error) {
      console.error('Failed to load business info:', error)
    }
  }

  const createDefaultTemplate = (): Template => ({
    id: '',
    name: 'New Template',
    isDefault: false,
    layout: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      fonts: {
        primary: 'Arial, sans-serif',
        secondary: 'Arial, sans-serif',
        size: { header: 18, body: 12, footer: 10 }
      },
      colors: {
        primary: '#000000',
        secondary: '#666666',
        text: '#333333',
        background: '#ffffff'
      },
      showGSTBreakdown: true,
      showHSNCodes: true
    },
    businessInfo: businessInfo || {
      companyName: '',
      gstin: '',
      address: {
        line1: '',
        line2: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India'
      },
      contact: {
        phone: '',
        email: '',
        website: ''
      }
    },
    fields: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })

  const handleSave = async () => {
    if (!template) return

    // Validate business information
    const errors = validateBusinessInfo()
    setValidationErrors(errors)
    
    if (Object.keys(errors).length > 0) {
      setToast({ content: 'Please fix validation errors before saving', error: true })
      return
    }

    setSaving(true)
    try {
      const url = templateId ? `/api/templates/${templateId}` : '/api/templates'
      const method = templateId ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      })
      
      const result = await response.json()
      
      if (result.success) {
        setToast({ content: 'Template saved successfully' })
        setValidationErrors({}) // Clear validation errors on successful save
        if (onSave) {
          onSave(result.data)
        }
      } else {
        setToast({ content: result.error || 'Failed to save template', error: true })
      }
    } catch (error) {
      setToast({ content: 'Failed to save template', error: true })
    } finally {
      setSaving(false)
    }
  }

  const updateTemplate = (updates: Partial<Template>) => {
    if (!template) return
    setTemplate({ ...template, ...updates })
  }

  const updateLayout = (updates: Partial<TemplateLayout>) => {
    if (!template) return
    setTemplate({
      ...template,
      layout: { ...template.layout, ...updates }
    })
  }

  const updateBusinessInfo = (updates: Partial<BusinessInfo>) => {
    if (!template) return
    setTemplate({
      ...template,
      businessInfo: { ...template.businessInfo, ...updates }
    })
  }

  const updateMargins = (margin: keyof TemplateLayout['margins'], value: number) => {
    if (!template) return
    updateLayout({
      margins: { ...template.layout.margins, [margin]: value }
    })
  }

  const updateFontSizes = (size: keyof TemplateLayout['fonts']['size'], value: number) => {
    if (!template) return
    updateLayout({
      fonts: {
        ...template.layout.fonts,
        size: { ...template.layout.fonts.size, [size]: value }
      }
    })
  }

  const updateColors = (color: keyof TemplateLayout['colors'], value: string) => {
    if (!template) return
    updateLayout({
      colors: { ...template.layout.colors, [color]: value }
    })
  }

  const validateGSTIN = (gstin: string): boolean => {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    return gstinRegex.test(gstin)
  }

  const validatePincode = (pincode: string): boolean => {
    const pincodeRegex = /^[1-9][0-9]{5}$/
    return pincodeRegex.test(pincode)
  }

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[6-9]\d{9}$/
    return phoneRegex.test(phone.replace(/\D/g, ''))
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateIFSC = (ifsc: string): boolean => {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/
    return ifscRegex.test(ifsc)
  }

  const validateAccountNumber = (accountNumber: string): boolean => {
    const cleanNumber = accountNumber.replace(/\D/g, '')
    return cleanNumber.length >= 9 && cleanNumber.length <= 18
  }

  const validateBusinessInfo = (): Record<string, string> => {
    const errors: Record<string, string> = {}
    
    if (!template?.businessInfo.companyName.trim()) {
      errors.companyName = 'Company name is required'
    }
    
    if (!template?.businessInfo.gstin.trim()) {
      errors.gstin = 'GSTIN is required'
    } else if (!validateGSTIN(template.businessInfo.gstin)) {
      errors.gstin = 'Invalid GSTIN format (e.g., 22AAAAA0000A1Z5)'
    }
    
    if (!template?.businessInfo.address.line1.trim()) {
      errors.addressLine1 = 'Address line 1 is required'
    }
    
    if (!template?.businessInfo.address.city.trim()) {
      errors.city = 'City is required'
    }
    
    if (!template?.businessInfo.address.state.trim()) {
      errors.state = 'State is required'
    }
    
    if (!template?.businessInfo.address.pincode.trim()) {
      errors.pincode = 'Pincode is required'
    } else if (!validatePincode(template.businessInfo.address.pincode)) {
      errors.pincode = 'Invalid pincode format'
    }
    
    if (template?.businessInfo.contact.phone && !validatePhone(template.businessInfo.contact.phone)) {
      errors.phone = 'Invalid phone number format (10 digits starting with 6-9)'
    }
    
    if (template?.businessInfo.contact.email && !validateEmail(template.businessInfo.contact.email)) {
      errors.email = 'Invalid email format'
    }

    // Bank details validation (if provided)
    if (template?.businessInfo.bankDetails) {
      const { ifscCode, accountNumber } = template.businessInfo.bankDetails
      
      if (ifscCode && !validateIFSC(ifscCode)) {
        errors.ifscCode = 'Invalid IFSC code format (e.g., SBIN0001234)'
      }
      
      if (accountNumber && !validateAccountNumber(accountNumber)) {
        errors.accountNumber = 'Invalid account number (9-18 digits)'
      }
    }
    
    return errors
  }

  const handleColorChange = (colorKey: keyof TemplateLayout['colors'], color: { hue: number; saturation: number; brightness: number }) => {
    const hsl = `hsl(${color.hue}, ${color.saturation}%, ${color.brightness}%)`
    updateColors(colorKey, hsl)
  }

  const hexToHsb = (hex: string) => {
    // Handle different color formats
    let normalizedHex = hex
    if (hex.startsWith('hsl')) {
      // Convert HSL to hex first (simplified)
      normalizedHex = '#000000' // fallback
    } else if (!hex.startsWith('#')) {
      normalizedHex = '#' + hex
    }
    
    // Ensure we have a valid hex color
    if (normalizedHex.length !== 7) {
      normalizedHex = '#000000'
    }
    
    // Convert hex to HSB for ColorPicker
    const r = parseInt(normalizedHex.slice(1, 3), 16) / 255
    const g = parseInt(normalizedHex.slice(3, 5), 16) / 255
    const b = parseInt(normalizedHex.slice(5, 7), 16) / 255
    
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const diff = max - min
    
    let hue = 0
    if (diff !== 0) {
      if (max === r) hue = ((g - b) / diff) % 6
      else if (max === g) hue = (b - r) / diff + 2
      else hue = (r - g) / diff + 4
    }
    hue = Math.round(hue * 60)
    if (hue < 0) hue += 360
    
    const saturation = max === 0 ? 0 : Math.round((diff / max) * 100)
    const brightness = Math.round(max * 100)
    
    return { hue, saturation, brightness }
  }

  const renderPreview = () => {
    if (!template) return null

    const { layout } = template
    const previewStyle = {
      fontFamily: layout.fonts.primary,
      color: layout.colors.text,
      backgroundColor: layout.colors.background,
      padding: `${layout.margins.top}px ${layout.margins.right}px ${layout.margins.bottom}px ${layout.margins.left}px`,
      minHeight: '400px',
      border: '1px solid #e1e3e5',
      borderRadius: '4px'
    }

    return (
      <div style={previewStyle}>
        <div style={{ 
          fontSize: `${layout.fonts.size.header}px`, 
          color: layout.colors.primary,
          fontWeight: 'bold',
          marginBottom: '20px'
        }}>
          {template.businessInfo.companyName || 'Your Company Name'}
        </div>
        
        <div style={{ fontSize: `${layout.fonts.size.body}px`, marginBottom: '10px' }}>
          <strong>GSTIN:</strong> {template.businessInfo.gstin || 'XX XXXXX XXXX X X Z X'}
        </div>
        
        <div style={{ fontSize: `${layout.fonts.size.body}px`, marginBottom: '20px' }}>
          {template.businessInfo.address.line1 || 'Address Line 1'}<br/>
          {template.businessInfo.address.city || 'City'}, {template.businessInfo.address.state || 'State'} - {template.businessInfo.address.pincode || 'XXXXXX'}
        </div>

        <Divider />

        <div style={{ margin: '20px 0' }}>
          <div style={{ 
            fontSize: `${layout.fonts.size.body}px`, 
            fontWeight: 'bold',
            marginBottom: '10px'
          }}>
            Invoice: {previewData.orderNumber}
          </div>
          <div style={{ fontSize: `${layout.fonts.size.body}px` }}>
            Date: {previewData.orderDate}
          </div>
        </div>

        <div style={{ margin: '20px 0' }}>
          <div style={{ 
            fontSize: `${layout.fonts.size.body}px`, 
            fontWeight: 'bold',
            marginBottom: '10px'
          }}>
            Bill To:
          </div>
          <div style={{ fontSize: `${layout.fonts.size.body}px` }}>
            {previewData.customerName}<br/>
            {previewData.customerEmail}<br/>
            {previewData.customerAddress && (
              <>
                {previewData.customerAddress.line1}<br/>
                {previewData.customerAddress.line2 && `${previewData.customerAddress.line2}, `}
                {previewData.customerAddress.city}, {previewData.customerAddress.state}<br/>
                PIN: {previewData.customerAddress.pincode}
              </>
            )}
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ccc' }}>
              <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: `${layout.fonts.size.body}px`, fontWeight: 'bold' }}>Item Details</th>
              {layout.showHSNCodes && (
                <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: `${layout.fonts.size.body}px`, fontWeight: 'bold' }}>HSN</th>
              )}
              <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: `${layout.fonts.size.body}px`, fontWeight: 'bold' }}>Qty</th>
              <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: `${layout.fonts.size.body}px`, fontWeight: 'bold' }}>Rate</th>
              <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: `${layout.fonts.size.body}px`, fontWeight: 'bold' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {previewData.items.map((item, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px 8px', fontSize: `${layout.fonts.size.body}px` }}>
                  <div style={{ fontWeight: '500' }}>{item.name}</div>
                  <small style={{ color: layout.colors.secondary, display: 'block', marginTop: '4px' }}>
                    Size: {item.size} | Color: {item.color}
                  </small>
                </td>
                {layout.showHSNCodes && (
                  <td style={{ textAlign: 'center', padding: '12px 8px', fontSize: `${layout.fonts.size.body}px` }}>
                    {item.hsnCode || 'N/A'}
                  </td>
                )}
                <td style={{ textAlign: 'center', padding: '12px 8px', fontSize: `${layout.fonts.size.body}px` }}>
                  {item.quantity}
                </td>
                <td style={{ textAlign: 'right', padding: '12px 8px', fontSize: `${layout.fonts.size.body}px` }}>
                  ₹{item.price.toLocaleString('en-IN')}
                </td>
                <td style={{ textAlign: 'right', padding: '12px 8px', fontSize: `${layout.fonts.size.body}px`, fontWeight: '500' }}>
                  ₹{(item.quantity * item.price).toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {layout.showGSTBreakdown && (
          <div style={{ marginTop: '30px', fontSize: `${layout.fonts.size.body}px` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: '60%' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Tax Breakdown:</div>
                <div style={{ fontSize: `${layout.fonts.size.body - 1}px`, color: layout.colors.secondary }}>
                  • GST Rate: 12% (Order total ≥ ₹1000)<br/>
                  • Tax Type: CGST + SGST (Same State)<br/>
                  • Taxable Amount: ₹{previewData.subtotal.toLocaleString('en-IN')}
                </div>
              </div>
              <div style={{ width: '35%', textAlign: 'right' }}>
                <div style={{ marginBottom: '8px' }}>
                  <span>Subtotal: </span>
                  <span style={{ fontWeight: '500' }}>₹{previewData.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <span>CGST (6%): </span>
                  <span>₹{(previewData.gstAmount / 2).toFixed(2)}</span>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <span>SGST (6%): </span>
                  <span>₹{(previewData.gstAmount / 2).toFixed(2)}</span>
                </div>
                <div style={{ 
                  fontWeight: 'bold', 
                  borderTop: '2px solid #333', 
                  paddingTop: '8px',
                  fontSize: `${layout.fonts.size.body + 2}px`,
                  color: layout.colors.primary
                }}>
                  <span>Total: ₹{previewData.total.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {layout.showBankDetails && template.businessInfo.bankDetails && (
          <div style={{ 
            marginTop: '30px', 
            paddingTop: '20px', 
            borderTop: '1px solid #eee',
            fontSize: `${layout.fonts.size.body}px`
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
              Bank Details for Payment:
            </div>
            <div style={{ fontSize: `${layout.fonts.size.body - 1}px`, color: layout.colors.secondary }}>
              <div>Account Name: {template.businessInfo.bankDetails.accountName || 'N/A'}</div>
              <div>Account Number: {template.businessInfo.bankDetails.accountNumber || 'N/A'}</div>
              <div>IFSC Code: {template.businessInfo.bankDetails.ifscCode || 'N/A'}</div>
              <div>Bank: {template.businessInfo.bankDetails.bankName || 'N/A'}</div>
            </div>
          </div>
        )}

        <div style={{ 
          marginTop: '40px', 
          paddingTop: '20px', 
          borderTop: '1px solid #eee',
          fontSize: `${layout.fonts.size.footer}px`,
          color: layout.colors.secondary,
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '10px' }}>
            Thank you for your business!
          </div>
          <div style={{ marginBottom: '10px' }}>
            For any queries, contact us at {template.businessInfo.contact.email || 'support@yourstore.com'}
          </div>
          {template.businessInfo.contact.phone && (
            <div style={{ marginBottom: '10px' }}>
              Phone: {template.businessInfo.contact.phone}
            </div>
          )}
          {template.businessInfo.contact.website && (
            <div>
              Website: {template.businessInfo.contact.website}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <Page title="Template Editor">
        <Loading />
      </Page>
    )
  }

  if (!template) {
    return (
      <Page title="Template Editor">
        <Banner tone="critical">
          <p>Failed to load template data</p>
        </Banner>
      </Page>
    )
  }

  return (
    <Frame>
      <Page
        title={templateId ? 'Edit Template' : 'Create Template'}
        primaryAction={{
          content: 'Save Template',
          onAction: handleSave,
          loading: saving
        }}
        secondaryActions={[
          {
            content: 'Full Preview',
            onAction: () => setShowPreview(true)
          },
          {
            content: 'Validate',
            onAction: () => {
              const errors = validateBusinessInfo()
              setValidationErrors(errors)
              if (Object.keys(errors).length === 0) {
                setToast({ content: 'All fields are valid!' })
              } else {
                setToast({ content: `Found ${Object.keys(errors).length} validation errors`, error: true })
              }
            }
          },
          ...(onCancel ? [{
            content: 'Cancel',
            onAction: onCancel
          }] : [])
        ]}
      >
        {Object.keys(validationErrors).length > 0 && (
          <Banner tone="critical">
            <p>Please fix the following validation errors:</p>
            <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
              {Object.entries(validationErrors).map(([field, error]) => (
                <li key={field}>{error}</li>
              ))}
            </ul>
          </Banner>
        )}

        <Layout>
          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Template Settings</Text>
                <FormLayout>
                  <TextField
                    label="Template Name"
                    value={template.name}
                    onChange={(value) => updateTemplate({ name: value })}
                    placeholder="Enter template name"
                    autoComplete="off"
                  />
                  
                  <Checkbox
                    label="Set as default template"
                    checked={template.isDefault}
                    onChange={(checked) => updateTemplate({ isDefault: checked })}
                  />
                </FormLayout>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Page Layout</Text>
                <FormLayout>
                  <FormLayout.Group>
                    <Select
                      label="Page Size"
                      options={pageSizeOptions}
                      value={template.layout.pageSize}
                      onChange={(value) => updateLayout({ pageSize: value as any })}
                    />
                    
                    <Select
                      label="Orientation"
                      options={orientationOptions}
                      value={template.layout.orientation}
                      onChange={(value) => updateLayout({ orientation: value as any })}
                    />
                  </FormLayout.Group>

                  <Text as="h3" variant="headingMd">Margins (px)</Text>
                  <FormLayout.Group>
                    <TextField
                      label="Top"
                      type="number"
                      value={template.layout.margins.top.toString()}
                      onChange={(value) => updateMargins('top', parseInt(value) || 0)}
                      autoComplete="off"
                    />
                    <TextField
                      label="Right"
                      type="number"
                      value={template.layout.margins.right.toString()}
                      onChange={(value) => updateMargins('right', parseInt(value) || 0)}
                      autoComplete="off"
                    />
                    <TextField
                      label="Bottom"
                      type="number"
                      value={template.layout.margins.bottom.toString()}
                      onChange={(value) => updateMargins('bottom', parseInt(value) || 0)}
                      autoComplete="off"
                    />
                    <TextField
                      label="Left"
                      type="number"
                      value={template.layout.margins.left.toString()}
                      onChange={(value) => updateMargins('left', parseInt(value) || 0)}
                      autoComplete="off"
                    />
                  </FormLayout.Group>
                </FormLayout>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Typography</Text>
                <FormLayout>
                  <FormLayout.Group>
                    <Select
                      label="Primary Font"
                      options={fontOptions}
                      value={template.layout.fonts.primary}
                      onChange={(value) => updateLayout({ 
                        fonts: { ...template.layout.fonts, primary: value }
                      })}
                    />
                    
                    <Select
                      label="Secondary Font"
                      options={fontOptions}
                      value={template.layout.fonts.secondary}
                      onChange={(value) => updateLayout({ 
                        fonts: { ...template.layout.fonts, secondary: value }
                      })}
                    />
                  </FormLayout.Group>

                  <Text as="h3" variant="headingMd">Font Sizes</Text>
                  <FormLayout.Group>
                    <TextField
                      label="Header Size (px)"
                      type="number"
                      value={template.layout.fonts.size.header.toString()}
                      onChange={(value) => updateFontSizes('header', parseInt(value) || 12)}
                      autoComplete="off"
                    />
                    <TextField
                      label="Body Size (px)"
                      type="number"
                      value={template.layout.fonts.size.body.toString()}
                      onChange={(value) => updateFontSizes('body', parseInt(value) || 12)}
                      autoComplete="off"
                    />
                    <TextField
                      label="Footer Size (px)"
                      type="number"
                      value={template.layout.fonts.size.footer.toString()}
                      onChange={(value) => updateFontSizes('footer', parseInt(value) || 10)}
                      autoComplete="off"
                    />
                  </FormLayout.Group>
                </FormLayout>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Colors</Text>
                <FormLayout>
                  {Object.entries(template.layout.colors).map(([colorKey, colorValue]) => (
                    <div key={colorKey}>
                      <Text as="p" variant="bodyMd" fontWeight="medium">
                        {colorKey.charAt(0).toUpperCase() + colorKey.slice(1)} Color
                      </Text>
                      <InlineStack gap="300" align="start">
                        <div style={{ 
                          width: '40px', 
                          height: '40px', 
                          backgroundColor: colorValue, 
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }} 
                        onClick={() => setColorPickerActive(colorKey)}
                        />
                        <TextField
                          label="Color Value"
                          value={colorValue}
                          onChange={(value) => updateColors(colorKey as keyof TemplateLayout['colors'], value)}
                          placeholder="#000000"
                          autoComplete="off"
                        />
                        <Popover
                          active={colorPickerActive === colorKey}
                          activator={<div />}
                          onClose={() => setColorPickerActive(null)}
                        >
                          <div style={{ padding: '16px' }}>
                            <ColorPicker
                              color={hexToHsb(colorValue)}
                              onChange={(color) => handleColorChange(colorKey as keyof TemplateLayout['colors'], color)}
                            />
                          </div>
                        </Popover>
                      </InlineStack>
                    </div>
                  ))}
                </FormLayout>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Template Options</Text>
                <FormLayout>
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingMd">GST & Tax Settings</Text>
                    <Checkbox
                      label="Show detailed GST breakdown"
                      checked={template.layout.showGSTBreakdown}
                      onChange={(checked) => updateLayout({ showGSTBreakdown: checked })}
                      helpText="Display CGST/SGST or IGST breakdown with rates"
                    />
                    
                    <Checkbox
                      label="Show HSN codes for products"
                      checked={template.layout.showHSNCodes}
                      onChange={(checked) => updateLayout({ showHSNCodes: checked })}
                      helpText="Include HSN codes in product table for tax compliance"
                    />
                    
                    <Checkbox
                      label="Show bank details in footer"
                      checked={template.layout.showBankDetails || false}
                      onChange={(checked) => updateLayout({ showBankDetails: checked })}
                      helpText="Display bank account information for payment reference"
                    />
                    
                    <Checkbox
                      label="Show company logo"
                      checked={template.layout.showLogo || false}
                      onChange={(checked) => updateLayout({ showLogo: checked })}
                      helpText="Include company logo in header (upload logo in settings)"
                    />
                  </BlockStack>

                  <BlockStack gap="300">
                    <Text as="h3" variant="headingMd">Layout Preferences</Text>
                    <RangeSlider
                      label={`Line spacing: ${template.layout.fonts.size.body + 4}px`}
                      value={template.layout.fonts.size.body}
                      min={8}
                      max={20}
                      onChange={(value) => updateFontSizes('body', Array.isArray(value) ? value[0] : value)}
                      output
                    />
                    
                    <RangeSlider
                      label={`Header font size: ${template.layout.fonts.size.header}px`}
                      value={template.layout.fonts.size.header}
                      min={12}
                      max={32}
                      onChange={(value) => updateFontSizes('header', Array.isArray(value) ? value[0] : value)}
                      output
                    />
                    
                    <RangeSlider
                      label={`Footer font size: ${template.layout.fonts.size.footer}px`}
                      value={template.layout.fonts.size.footer}
                      min={8}
                      max={16}
                      onChange={(value) => updateFontSizes('footer', Array.isArray(value) ? value[0] : value)}
                      output
                    />
                    
                    <InlineStack gap="200">
                      <Badge tone={template.layout.pageSize === 'A4' ? 'success' : 'info'}>
                        {template.layout.pageSize}
                      </Badge>
                      <Badge tone={template.layout.orientation === 'portrait' ? 'success' : 'info'}>
                        {template.layout.orientation}
                      </Badge>
                      <Badge tone={template.layout.showGSTBreakdown ? 'success' : 'info'}>
                        GST Breakdown
                      </Badge>
                      <Badge tone={template.layout.showHSNCodes ? 'success' : 'info'}>
                        HSN Codes
                      </Badge>
                    </InlineStack>
                  </BlockStack>
                </FormLayout>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Business Information</Text>
                <FormLayout>
                <TextField
                  label="Company Name"
                  value={template.businessInfo.companyName}
                  onChange={(value) => updateBusinessInfo({ companyName: value })}
                  placeholder="Your Company Name"
                  error={validationErrors.companyName}
                  requiredIndicator
                  autoComplete="organization"
                />
                
                <TextField
                  label="GSTIN"
                  value={template.businessInfo.gstin}
                  onChange={(value) => updateBusinessInfo({ gstin: value.toUpperCase() })}
                  placeholder="22AAAAA0000A1Z5"
                  helpText="15-digit GST Identification Number (Format: 22AAAAA0000A1Z5)"
                  error={validationErrors.gstin}
                  requiredIndicator
                  autoComplete="off"
                />

                <BlockStack gap="300">
                  <Text as="h3" variant="headingMd">Address</Text>
                  <TextField
                    label="Address Line 1"
                    value={template.businessInfo.address.line1}
                    onChange={(value) => updateBusinessInfo({
                      address: { ...template.businessInfo.address, line1: value }
                    })}
                    placeholder="Building/House number, Street name"
                    error={validationErrors.addressLine1}
                    requiredIndicator
                    autoComplete="address-line1"
                  />
                  
                  <TextField
                    label="Address Line 2"
                    value={template.businessInfo.address.line2 || ''}
                    onChange={(value) => updateBusinessInfo({
                      address: { ...template.businessInfo.address, line2: value }
                    })}
                    placeholder="Area, Landmark (Optional)"
                    autoComplete="address-line2"
                  />

                  <FormLayout.Group>
                    <TextField
                      label="City"
                      value={template.businessInfo.address.city}
                      onChange={(value) => updateBusinessInfo({
                        address: { ...template.businessInfo.address, city: value }
                      })}
                      placeholder="City name"
                      error={validationErrors.city}
                      requiredIndicator
                      autoComplete="address-level2"
                    />
                    
                    <TextField
                      label="State"
                      value={template.businessInfo.address.state}
                      onChange={(value) => updateBusinessInfo({
                        address: { ...template.businessInfo.address, state: value }
                      })}
                      placeholder="State name"
                      error={validationErrors.state}
                      requiredIndicator
                      autoComplete="address-level1"
                    />
                    
                    <TextField
                      label="Pincode"
                      value={template.businessInfo.address.pincode}
                      onChange={(value) => updateBusinessInfo({
                        address: { ...template.businessInfo.address, pincode: value }
                      })}
                      placeholder="560001"
                      error={validationErrors.pincode}
                      requiredIndicator
                      autoComplete="postal-code"
                    />
                  </FormLayout.Group>
                </BlockStack>

                <BlockStack gap="300">
                  <Text as="h3" variant="headingMd">Contact Information</Text>
                  <FormLayout.Group>
                    <TextField
                      label="Phone"
                      value={template.businessInfo.contact.phone}
                      onChange={(value) => updateBusinessInfo({
                        contact: { ...template.businessInfo.contact, phone: value }
                      })}
                      placeholder="9876543210"
                      helpText="10-digit mobile number"
                      error={validationErrors.phone}
                      autoComplete="tel"
                    />
                    
                    <TextField
                      label="Email"
                      type="email"
                      value={template.businessInfo.contact.email}
                      onChange={(value) => updateBusinessInfo({
                        contact: { ...template.businessInfo.contact, email: value }
                      })}
                      placeholder="business@example.com"
                      error={validationErrors.email}
                      autoComplete="email"
                    />
                  </FormLayout.Group>
                  
                  <TextField
                    label="Website"
                    value={template.businessInfo.contact.website || ''}
                    onChange={(value) => updateBusinessInfo({
                      contact: { ...template.businessInfo.contact, website: value }
                    })}
                    placeholder="https://www.yourstore.com"
                    autoComplete="url"
                  />
                </BlockStack>

                {template.businessInfo.bankDetails && (
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingMd">Bank Details (Optional)</Text>
                    <FormLayout.Group>
                      <TextField
                        label="Account Name"
                        value={template.businessInfo.bankDetails.accountName || ''}
                        onChange={(value) => updateBusinessInfo({
                          bankDetails: { 
                            ...template.businessInfo.bankDetails!, 
                            accountName: value 
                          }
                        })}
                        placeholder="Account holder name"
                        autoComplete="off"
                      />
                      
                      <TextField
                        label="Account Number"
                        value={template.businessInfo.bankDetails.accountNumber || ''}
                        onChange={(value) => updateBusinessInfo({
                          bankDetails: { 
                            ...template.businessInfo.bankDetails!, 
                            accountNumber: value.replace(/\D/g, '') 
                          }
                        })}
                        placeholder="1234567890"
                        helpText="9-18 digit bank account number"
                        error={validationErrors.accountNumber}
                        autoComplete="off"
                      />
                    </FormLayout.Group>
                    
                    <FormLayout.Group>
                      <TextField
                        label="IFSC Code"
                        value={template.businessInfo.bankDetails.ifscCode || ''}
                        onChange={(value) => updateBusinessInfo({
                          bankDetails: { 
                            ...template.businessInfo.bankDetails!, 
                            ifscCode: value.toUpperCase() 
                          }
                        })}
                        placeholder="SBIN0001234"
                        helpText="11-character IFSC code (e.g., SBIN0001234)"
                        error={validationErrors.ifscCode}
                        autoComplete="off"
                      />
                      
                      <TextField
                        label="Bank Name"
                        value={template.businessInfo.bankDetails.bankName || ''}
                        onChange={(value) => updateBusinessInfo({
                          bankDetails: { 
                            ...template.businessInfo.bankDetails!, 
                            bankName: value 
                          }
                        })}
                        placeholder="State Bank of India"
                        autoComplete="off"
                      />
                    </FormLayout.Group>
                  </BlockStack>
                )}
                </FormLayout>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <InlineStack gap="300" align="space-between">
                  <Text as="h2" variant="headingMd">Live Preview</Text>
                  <Button
                    size="slim"
                    onClick={() => {
                      // Force re-render of preview
                      setTemplate({ ...template })
                    }}
                  >
                    Refresh Preview
                  </Button>
                </InlineStack>
                <div style={{ 
                  border: '2px dashed #e1e3e5', 
                  borderRadius: '8px', 
                  padding: '16px',
                  backgroundColor: '#fafbfb'
                }}>
                  <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                    Preview updates automatically as you make changes
                  </Text>
                  <div style={{ marginTop: '16px' }}>
                    {renderPreview()}
                  </div>
                </div>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        <Modal
          open={showPreview}
          onClose={() => setShowPreview(false)}
          title="Template Preview"
          size="large"
        >
          <Modal.Section>
            {renderPreview()}
          </Modal.Section>
        </Modal>

        {toast && (
          <Toast
            content={toast.content}
            error={toast.error}
            onDismiss={() => setToast(null)}
          />
        )}
      </Page>
    </Frame>
  )
}