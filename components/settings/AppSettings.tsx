'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Page,
  Card,
  FormLayout,
  TextField,
  Select,
  Checkbox,
  Button,
  Banner,
  Spinner,
  Layout,
  Text,
  Divider,
  ButtonGroup,
  Toast,
  Frame
} from '@shopify/polaris'
import { useSettings } from '@/hooks/useSettings'
import { useTemplates } from '@/hooks/useTemplates'
import { AppSettings as AppSettingsType, GSTConfiguration, BusinessInfo } from '@/types'

// Indian states for dropdown
const INDIAN_STATES = [
  { label: 'Andhra Pradesh', value: 'Andhra Pradesh' },
  { label: 'Arunachal Pradesh', value: 'Arunachal Pradesh' },
  { label: 'Assam', value: 'Assam' },
  { label: 'Bihar', value: 'Bihar' },
  { label: 'Chhattisgarh', value: 'Chhattisgarh' },
  { label: 'Goa', value: 'Goa' },
  { label: 'Gujarat', value: 'Gujarat' },
  { label: 'Haryana', value: 'Haryana' },
  { label: 'Himachal Pradesh', value: 'Himachal Pradesh' },
  { label: 'Jharkhand', value: 'Jharkhand' },
  { label: 'Karnataka', value: 'Karnataka' },
  { label: 'Kerala', value: 'Kerala' },
  { label: 'Madhya Pradesh', value: 'Madhya Pradesh' },
  { label: 'Maharashtra', value: 'Maharashtra' },
  { label: 'Manipur', value: 'Manipur' },
  { label: 'Meghalaya', value: 'Meghalaya' },
  { label: 'Mizoram', value: 'Mizoram' },
  { label: 'Nagaland', value: 'Nagaland' },
  { label: 'Odisha', value: 'Odisha' },
  { label: 'Punjab', value: 'Punjab' },
  { label: 'Rajasthan', value: 'Rajasthan' },
  { label: 'Sikkim', value: 'Sikkim' },
  { label: 'Tamil Nadu', value: 'Tamil Nadu' },
  { label: 'Telangana', value: 'Telangana' },
  { label: 'Tripura', value: 'Tripura' },
  { label: 'Uttar Pradesh', value: 'Uttar Pradesh' },
  { label: 'Uttarakhand', value: 'Uttarakhand' },
  { label: 'West Bengal', value: 'West Bengal' },
  { label: 'Delhi', value: 'Delhi' },
  { label: 'Jammu and Kashmir', value: 'Jammu and Kashmir' },
  { label: 'Ladakh', value: 'Ladakh' },
  { label: 'Chandigarh', value: 'Chandigarh' },
  { label: 'Dadra and Nagar Haveli and Daman and Diu', value: 'Dadra and Nagar Haveli and Daman and Diu' },
  { label: 'Lakshadweep', value: 'Lakshadweep' },
  { label: 'Puducherry', value: 'Puducherry' },
  { label: 'Andaman and Nicobar Islands', value: 'Andaman and Nicobar Islands' }
]

const DATE_FORMAT_OPTIONS = [
  { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
  { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
  { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' }
]

const EXPORT_FORMAT_OPTIONS = [
  { label: 'PDF', value: 'pdf' },
  { label: 'CSV', value: 'csv' }
]

export function AppSettings() {
  const { settings, loading, error, updateSettings } = useSettings()
  const { templates, loading: templatesLoading } = useTemplates()
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('gst')
  const [toastActive, setToastActive] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastError, setToastError] = useState(false)

  // Form state
  const [formData, setFormData] = useState<Partial<AppSettingsType>>({})

  // Update form data when settings load
  useEffect(() => {
    if (settings) {
      setFormData(settings)
    }
  }, [settings])

  const showToast = useCallback((message: string, isError = false) => {
    setToastMessage(message)
    setToastError(isError)
    setToastActive(true)
  }, [])

  const handleSave = useCallback(async () => {
    if (!formData) return

    setSaving(true)
    try {
      const success = await updateSettings(formData)
      if (success) {
        showToast('Settings saved successfully')
      } else {
        showToast('Failed to save settings', true)
      }
    } catch (err) {
      showToast('Failed to save settings', true)
    } finally {
      setSaving(false)
    }
  }, [formData, updateSettings, showToast])

  const handleReset = useCallback(() => {
    if (settings) {
      setFormData(settings)
      showToast('Settings reset to last saved values')
    }
  }, [settings, showToast])

  const updateFormData = useCallback((updates: Partial<AppSettingsType>) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }))
  }, [])

  const updateGSTConfiguration = useCallback((updates: Partial<GSTConfiguration>) => {
    setFormData(prev => ({
      ...prev,
      gstConfiguration: {
        ...prev?.gstConfiguration,
        ...updates
      } as GSTConfiguration
    }))
  }, [])

  const updateBusinessInfo = useCallback((updates: Partial<BusinessInfo>) => {
    setFormData(prev => ({
      ...prev,
      businessInfo: {
        ...prev?.businessInfo,
        ...updates,
        address: {
          ...prev?.businessInfo?.address,
          ...updates.address
        },
        contact: {
          ...prev?.businessInfo?.contact,
          ...updates.contact
        },
        bankDetails: {
          ...prev?.businessInfo?.bankDetails,
          ...updates.bankDetails
        }
      } as BusinessInfo
    }))
  }, [])

  if (loading) {
    return (
      <Page title="Settings">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Spinner size="large" />
        </div>
      </Page>
    )
  }

  if (error) {
    return (
      <Page title="Settings">
        <Banner tone="critical">
          <p>{error}</p>
        </Banner>
      </Page>
    )
  }

  if (!settings || !formData) {
    return (
      <Page title="Settings">
        <Banner tone="warning">
          <p>Settings not found. Please try refreshing the page.</p>
        </Banner>
      </Page>
    )
  }

  const templateOptions = templates?.map(template => ({
    label: template.name,
    value: template.id
  })) || []

  const toastMarkup = toastActive ? (
    <Toast
      content={toastMessage}
      error={toastError}
      onDismiss={() => setToastActive(false)}
    />
  ) : null

  return (
    <Frame>
      {toastMarkup}
      <Page
        title="App Settings"
        subtitle="Configure GST settings, business information, and app preferences"
        primaryAction={{
          content: 'Save Settings',
          onAction: handleSave,
          loading: saving,
          disabled: saving
        }}
        secondaryActions={[
          {
            content: 'Reset',
            onAction: handleReset,
            disabled: saving
          }
        ]}
      >
        <Layout>
          <Layout.Section>
            {/* Navigation Tabs */}
            <Card>
              <div style={{ padding: '1rem' }}>
                <ButtonGroup>
                  <Button
                    pressed={activeTab === 'gst'}
                    onClick={() => setActiveTab('gst')}
                  >
                    GST Configuration
                  </Button>
                  <Button
                    pressed={activeTab === 'business'}
                    onClick={() => setActiveTab('business')}
                  >
                    Business Information
                  </Button>
                  <Button
                    pressed={activeTab === 'preferences'}
                    onClick={() => setActiveTab('preferences')}
                  >
                    Preferences
                  </Button>
                </ButtonGroup>
              </div>
            </Card>

            {/* GST Configuration Tab */}
            {activeTab === 'gst' && (
              <Card>
                <div style={{ padding: '1rem' }}>
                  <Text as="h2" variant="headingMd">GST Configuration</Text>
                </div>
                <div style={{ padding: '1rem' }}>
                  <FormLayout>
                    <Select
                      label="Store State"
                      options={INDIAN_STATES}
                      value={formData.gstConfiguration?.storeState || ''}
                      onChange={(value) => updateGSTConfiguration({ storeState: value })}
                      helpText="Select the state where your business is registered"
                    />

                    <Text as="h3" variant="headingMd">Tax Rates</Text>

                    <FormLayout.Group>
                      <TextField
                        label="Low Rate (%)"
                        type="number"
                        value={((formData.gstConfiguration?.gstRates?.lowRate || 0) * 100).toString()}
                        onChange={(value) => updateGSTConfiguration({
                          gstRates: {
                            ...formData.gstConfiguration?.gstRates,
                            lowRate: parseFloat(value) / 100,
                            highRate: formData.gstConfiguration?.gstRates?.highRate || 0,
                            threshold: formData.gstConfiguration?.gstRates?.threshold || 1000
                          }
                        })}
                        helpText="GST rate for orders below threshold"
                        suffix="%"
                        autoComplete="off"
                      />

                      <TextField
                        label="High Rate (%)"
                        type="number"
                        value={((formData.gstConfiguration?.gstRates?.highRate || 0) * 100).toString()}
                        onChange={(value) => updateGSTConfiguration({
                          gstRates: {
                            ...formData.gstConfiguration?.gstRates,
                            lowRate: formData.gstConfiguration?.gstRates?.lowRate || 0,
                            highRate: parseFloat(value) / 100,
                            threshold: formData.gstConfiguration?.gstRates?.threshold || 1000
                          }
                        })}
                        helpText="GST rate for orders above threshold"
                        suffix="%"
                        autoComplete="off"
                      />
                    </FormLayout.Group>

                    <TextField
                      label="Threshold Amount (₹)"
                      type="number"
                      value={formData.gstConfiguration?.gstRates?.threshold?.toString() || ''}
                      onChange={(value) => updateGSTConfiguration({
                        gstRates: {
                          ...formData.gstConfiguration?.gstRates,
                          lowRate: formData.gstConfiguration?.gstRates?.lowRate || 0,
                          highRate: formData.gstConfiguration?.gstRates?.highRate || 0,
                          threshold: parseFloat(value)
                        }
                      })}
                      helpText="Order amount threshold for GST rate calculation"
                      prefix="₹"
                      autoComplete="off"
                    />

                    <Divider />

                    <Text as="h3" variant="headingMd">HSN Codes</Text>

                    <FormLayout.Group>
                      <TextField
                        label="T-Shirt HSN Code"
                        value={formData.gstConfiguration?.hsnCodes?.tshirt || ''}
                        onChange={(value) => updateGSTConfiguration({
                          hsnCodes: {
                            ...formData.gstConfiguration?.hsnCodes,
                            tshirt: value
                          }
                        })}
                        helpText="HSN code for T-shirts"
                        autoComplete="off"
                      />

                      <TextField
                        label="Polo HSN Code"
                        value={formData.gstConfiguration?.hsnCodes?.polo || ''}
                        onChange={(value) => updateGSTConfiguration({
                          hsnCodes: {
                            ...formData.gstConfiguration?.hsnCodes,
                            polo: value
                          }
                        })}
                        helpText="HSN code for polo shirts"
                        autoComplete="off"
                      />
                    </FormLayout.Group>

                    <FormLayout.Group>
                      <TextField
                        label="Tank Top HSN Code"
                        value={formData.gstConfiguration?.hsnCodes?.tank || ''}
                        onChange={(value) => updateGSTConfiguration({
                          hsnCodes: {
                            ...formData.gstConfiguration?.hsnCodes,
                            tank: value
                          }
                        })}
                        helpText="HSN code for tank tops"
                        autoComplete="off"
                      />

                      <TextField
                        label="Hoodie HSN Code"
                        value={formData.gstConfiguration?.hsnCodes?.hoodie || ''}
                        onChange={(value) => updateGSTConfiguration({
                          hsnCodes: {
                            ...formData.gstConfiguration?.hsnCodes,
                            hoodie: value
                          }
                        })}
                        helpText="HSN code for hoodies"
                        autoComplete="off"
                      />
                    </FormLayout.Group>

                    <TextField
                      label="Default HSN Code"
                      value={formData.gstConfiguration?.hsnCodes?.default || ''}
                      onChange={(value) => updateGSTConfiguration({
                        hsnCodes: {
                          ...formData.gstConfiguration?.hsnCodes,
                          default: value
                        }
                      })}
                      helpText="Default HSN code for products without specific codes"
                      autoComplete="off"
                    />
                  </FormLayout>
                </div>
              </Card>
            )}

            {/* Business Information Tab */}
            {activeTab === 'business' && (
              <>
                <Card>
                  <div style={{ padding: '1rem' }}>
                    <Text as="h3" variant="headingMd">Company Details</Text>
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <FormLayout>
                      <TextField
                        label="Company Name"
                        value={formData.businessInfo?.companyName || ''}
                        onChange={(value) => updateBusinessInfo({ companyName: value })}
                        helpText="Your registered business name"
                        autoComplete="organization"
                      />

                      <TextField
                        label="GSTIN"
                        value={formData.businessInfo?.gstin || ''}
                        onChange={(value) => updateBusinessInfo({ gstin: value })}
                        helpText="15-digit GST Identification Number"
                        placeholder="22AAAAA0000A1Z5"
                        autoComplete="off"
                      />
                    </FormLayout>
                  </div>
                </Card>

                <Card>
                  <div style={{ padding: '1rem' }}>
                    <Text as="h3" variant="headingMd">Business Address</Text>
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <FormLayout>
                      <TextField
                        label="Address Line 1"
                        value={formData.businessInfo?.address?.line1 || ''}
                        onChange={(value) => updateBusinessInfo({
                          address: {
                            line1: value,
                            line2: formData.businessInfo?.address?.line2 || '',
                            city: formData.businessInfo?.address?.city || '',
                            state: formData.businessInfo?.address?.state || '',
                            pincode: formData.businessInfo?.address?.pincode || '',
                            country: formData.businessInfo?.address?.country || 'India'
                          }
                        })}
                        autoComplete="address-line1"
                      />

                      <TextField
                        label="Address Line 2"
                        value={formData.businessInfo?.address?.line2 || ''}
                        onChange={(value) => updateBusinessInfo({
                          address: {
                            line1: formData.businessInfo?.address?.line1 || '',
                            line2: value,
                            city: formData.businessInfo?.address?.city || '',
                            state: formData.businessInfo?.address?.state || '',
                            pincode: formData.businessInfo?.address?.pincode || '',
                            country: formData.businessInfo?.address?.country || 'India'
                          }
                        })}
                        autoComplete="address-line2"
                      />

                      <FormLayout.Group>
                        <TextField
                          label="City"
                          value={formData.businessInfo?.address?.city || ''}
                          onChange={(value) => updateBusinessInfo({
                            address: {
                              line1: formData.businessInfo?.address?.line1 || '',
                              line2: formData.businessInfo?.address?.line2 || '',
                              city: value,
                              state: formData.businessInfo?.address?.state || '',
                              pincode: formData.businessInfo?.address?.pincode || '',
                              country: formData.businessInfo?.address?.country || 'India'
                            }
                          })}
                          autoComplete="address-level2"
                        />

                        <Select
                          label="State"
                          options={INDIAN_STATES}
                          value={formData.businessInfo?.address?.state || ''}
                          onChange={(value) => updateBusinessInfo({
                            address: {
                              line1: formData.businessInfo?.address?.line1 || '',
                              line2: formData.businessInfo?.address?.line2 || '',
                              city: formData.businessInfo?.address?.city || '',
                              state: value,
                              pincode: formData.businessInfo?.address?.pincode || '',
                              country: formData.businessInfo?.address?.country || 'India'
                            }
                          })}
                        />
                      </FormLayout.Group>

                      <FormLayout.Group>
                        <TextField
                          label="Pincode"
                          value={formData.businessInfo?.address?.pincode || ''}
                          onChange={(value) => updateBusinessInfo({
                            address: {
                              line1: formData.businessInfo?.address?.line1 || '',
                              line2: formData.businessInfo?.address?.line2 || '',
                              city: formData.businessInfo?.address?.city || '',
                              state: formData.businessInfo?.address?.state || '',
                              pincode: value,
                              country: formData.businessInfo?.address?.country || 'India'
                            }
                          })}
                          helpText="6-digit postal code"
                          autoComplete="postal-code"
                        />

                        <TextField
                          label="Country"
                          value={formData.businessInfo?.address?.country || 'India'}
                          onChange={(value) => updateBusinessInfo({
                            address: {
                              line1: formData.businessInfo?.address?.line1 || '',
                              line2: formData.businessInfo?.address?.line2 || '',
                              city: formData.businessInfo?.address?.city || '',
                              state: formData.businessInfo?.address?.state || '',
                              pincode: formData.businessInfo?.address?.pincode || '',
                              country: value
                            }
                          })}
                          disabled
                          autoComplete="country"
                        />
                      </FormLayout.Group>
                    </FormLayout>
                  </div>
                </Card>

                <Card>
                  <div style={{ padding: '1rem' }}>
                    <Text as="h3" variant="headingMd">Contact Information</Text>
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <FormLayout>
                      <FormLayout.Group>
                        <TextField
                          label="Phone"
                          type="tel"
                          value={formData.businessInfo?.contact?.phone || ''}
                          onChange={(value) => updateBusinessInfo({
                            contact: {
                              phone: value,
                              email: formData.businessInfo?.contact?.email || '',
                              website: formData.businessInfo?.contact?.website || ''
                            }
                          })}
                          helpText="Business phone number"
                          autoComplete="tel"
                        />

                        <TextField
                          label="Email"
                          type="email"
                          value={formData.businessInfo?.contact?.email || ''}
                          onChange={(value) => updateBusinessInfo({
                            contact: {
                              phone: formData.businessInfo?.contact?.phone || '',
                              email: value,
                              website: formData.businessInfo?.contact?.website || ''
                            }
                          })}
                          helpText="Business email address"
                          autoComplete="email"
                        />
                      </FormLayout.Group>

                      <TextField
                        label="Website"
                        type="url"
                        value={formData.businessInfo?.contact?.website || ''}
                        onChange={(value) => updateBusinessInfo({
                          contact: {
                            phone: formData.businessInfo?.contact?.phone || '',
                            email: formData.businessInfo?.contact?.email || '',
                            website: value
                          }
                        })}
                        helpText="Business website URL (optional)"
                        autoComplete="url"
                      />
                    </FormLayout>
                  </div>
                </Card>

                <Card>
                  <div style={{ padding: '1rem' }}>
                    <Text as="h3" variant="headingMd">Bank Details (Optional)</Text>
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <FormLayout>
                      <TextField
                        label="Account Name"
                        value={formData.businessInfo?.bankDetails?.accountName || ''}
                        onChange={(value) => updateBusinessInfo({
                          bankDetails: {
                            accountName: value,
                            accountNumber: formData.businessInfo?.bankDetails?.accountNumber || '',
                            ifscCode: formData.businessInfo?.bankDetails?.ifscCode || '',
                            bankName: formData.businessInfo?.bankDetails?.bankName || ''
                          }
                        })}
                        autoComplete="off"
                      />

                      <FormLayout.Group>
                        <TextField
                          label="Account Number"
                          value={formData.businessInfo?.bankDetails?.accountNumber || ''}
                          onChange={(value) => updateBusinessInfo({
                            bankDetails: {
                              accountName: formData.businessInfo?.bankDetails?.accountName || '',
                              accountNumber: value,
                              ifscCode: formData.businessInfo?.bankDetails?.ifscCode || '',
                              bankName: formData.businessInfo?.bankDetails?.bankName || ''
                            }
                          })}
                          autoComplete="off"
                        />

                        <TextField
                          label="IFSC Code"
                          value={formData.businessInfo?.bankDetails?.ifscCode || ''}
                          onChange={(value) => updateBusinessInfo({
                            bankDetails: {
                              accountName: formData.businessInfo?.bankDetails?.accountName || '',
                              accountNumber: formData.businessInfo?.bankDetails?.accountNumber || '',
                              ifscCode: value,
                              bankName: formData.businessInfo?.bankDetails?.bankName || ''
                            }
                          })}
                          autoComplete="off"
                        />
                      </FormLayout.Group>

                      <TextField
                        label="Bank Name"
                        value={formData.businessInfo?.bankDetails?.bankName || ''}
                        onChange={(value) => updateBusinessInfo({
                          bankDetails: {
                            accountName: formData.businessInfo?.bankDetails?.accountName || '',
                            accountNumber: formData.businessInfo?.bankDetails?.accountNumber || '',
                            ifscCode: formData.businessInfo?.bankDetails?.ifscCode || '',
                            bankName: value
                          }
                        })}
                        autoComplete="off"
                      />
                    </FormLayout>
                  </div>
                </Card>
              </>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <>
                <Card>
                  <div style={{ padding: '1rem' }}>
                    <Text as="h3" variant="headingMd">Template Settings</Text>
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <FormLayout>
                      <Select
                        label="Default Template"
                        options={[
                          { label: 'Select a template', value: '' },
                          ...templateOptions
                        ]}
                        value={formData.defaultTemplate || ''}
                        onChange={(value) => updateFormData({ defaultTemplate: value })}
                        helpText="Default template for printing orders"
                        disabled={templatesLoading}
                      />
                    </FormLayout>
                  </div>
                </Card>

                <Card>
                  <div style={{ padding: '1rem' }}>
                    <Text as="h3" variant="headingMd">GST Preferences</Text>
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <FormLayout>
                      <Checkbox
                        label="Auto-calculate GST"
                        checked={formData.preferences?.autoCalculateGST || false}
                        onChange={(checked) => updateFormData({
                          preferences: {
                            autoCalculateGST: checked,
                            showGSTInOrderList: formData.preferences?.showGSTInOrderList || false,
                            defaultExportFormat: formData.preferences?.defaultExportFormat || 'pdf',
                            dateFormat: formData.preferences?.dateFormat || 'DD/MM/YYYY',
                            currency: formData.preferences?.currency || 'INR',
                            timezone: formData.preferences?.timezone || 'Asia/Kolkata'
                          }
                        })}
                        helpText="Automatically calculate GST for all orders"
                      />

                      <Checkbox
                        label="Show GST in order list"
                        checked={formData.preferences?.showGSTInOrderList || false}
                        onChange={(checked) => updateFormData({
                          preferences: {
                            autoCalculateGST: formData.preferences?.autoCalculateGST || false,
                            showGSTInOrderList: checked,
                            defaultExportFormat: formData.preferences?.defaultExportFormat || 'pdf',
                            dateFormat: formData.preferences?.dateFormat || 'DD/MM/YYYY',
                            currency: formData.preferences?.currency || 'INR',
                            timezone: formData.preferences?.timezone || 'Asia/Kolkata'
                          }
                        })}
                        helpText="Display GST breakdown in the orders list"
                      />
                    </FormLayout>
                  </div>
                </Card>

                <Card>
                  <div style={{ padding: '1rem' }}>
                    <Text as="h3" variant="headingMd">Export Settings</Text>
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <FormLayout>
                      <Select
                        label="Default Export Format"
                        options={EXPORT_FORMAT_OPTIONS}
                        value={formData.preferences?.defaultExportFormat || 'pdf'}
                        onChange={(value) => updateFormData({
                          preferences: {
                            autoCalculateGST: formData.preferences?.autoCalculateGST || false,
                            showGSTInOrderList: formData.preferences?.showGSTInOrderList || false,
                            defaultExportFormat: value as 'pdf' | 'csv',
                            dateFormat: formData.preferences?.dateFormat || 'DD/MM/YYYY',
                            currency: formData.preferences?.currency || 'INR',
                            timezone: formData.preferences?.timezone || 'Asia/Kolkata'
                          }
                        })}
                        helpText="Default format for bulk exports"
                      />

                      <Select
                        label="Date Format"
                        options={DATE_FORMAT_OPTIONS}
                        value={formData.preferences?.dateFormat || 'DD/MM/YYYY'}
                        onChange={(value) => updateFormData({
                          preferences: {
                            autoCalculateGST: formData.preferences?.autoCalculateGST || false,
                            showGSTInOrderList: formData.preferences?.showGSTInOrderList || false,
                            defaultExportFormat: formData.preferences?.defaultExportFormat || 'pdf',
                            dateFormat: value,
                            currency: formData.preferences?.currency || 'INR',
                            timezone: formData.preferences?.timezone || 'Asia/Kolkata'
                          }
                        })}
                        helpText="Date format for displays and exports"
                      />
                    </FormLayout>
                  </div>
                </Card>

                <Card>
                  <div style={{ padding: '1rem' }}>
                    <Text as="h3" variant="headingMd">Webhook Settings</Text>
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <FormLayout>
                      <Checkbox
                        label="Orders Create Webhook"
                        checked={formData.webhooks?.ordersCreate || false}
                        onChange={(checked) => updateFormData({
                          webhooks: {
                            ordersCreate: checked,
                            ordersUpdate: formData.webhooks?.ordersUpdate || false,
                            appUninstalled: formData.webhooks?.appUninstalled || false
                          }
                        })}
                        helpText="Receive notifications when new orders are created"
                      />

                      <Checkbox
                        label="Orders Update Webhook"
                        checked={formData.webhooks?.ordersUpdate || false}
                        onChange={(checked) => updateFormData({
                          webhooks: {
                            ordersCreate: formData.webhooks?.ordersCreate || false,
                            ordersUpdate: checked,
                            appUninstalled: formData.webhooks?.appUninstalled || false
                          }
                        })}
                        helpText="Receive notifications when orders are updated"
                      />

                      <Checkbox
                        label="App Uninstalled Webhook"
                        checked={formData.webhooks?.appUninstalled || false}
                        onChange={(checked) => updateFormData({
                          webhooks: {
                            ordersCreate: formData.webhooks?.ordersCreate || false,
                            ordersUpdate: formData.webhooks?.ordersUpdate || false,
                            appUninstalled: checked
                          }
                        })}
                        helpText="Handle cleanup when app is uninstalled"
                      />
                    </FormLayout>
                  </div>
                </Card>
              </>
            )}
          </Layout.Section>
        </Layout>
      </Page>
    </Frame>
  )
}