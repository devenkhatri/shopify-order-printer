import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { AppSettings, GSTConfiguration, BusinessInfo } from '@/types'

// Mock data storage - in production this would use a database
const settingsStore = new Map<string, AppSettings>()

// Default settings for new shops
const getDefaultSettings = (shopDomain: string): AppSettings => ({
  id: `settings_${shopDomain}`,
  shopDomain,
  gstConfiguration: {
    storeState: 'Maharashtra', // Default to Maharashtra
    gstRates: {
      lowRate: 0.05, // 5% for orders < ₹1000
      highRate: 0.12, // 12% for orders >= ₹1000
      threshold: 1000 // ₹1000 threshold
    },
    hsnCodes: {
      'tshirt': '6109', // Cotton T-shirts
      'polo': '6105', // Men's shirts
      'tank': '6108', // Women's slips and petticoats
      'hoodie': '6110', // Jerseys, pullovers
      'default': '6109'
    }
  },
  businessInfo: {
    companyName: '',
    gstin: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: 'Maharashtra',
      pincode: '',
      country: 'India'
    },
    contact: {
      phone: '',
      email: '',
      website: ''
    },
    bankDetails: {
      accountName: '',
      accountNumber: '',
      ifscCode: '',
      bankName: ''
    }
  },
  defaultTemplate: '',
  preferences: {
    autoCalculateGST: true,
    showGSTInOrderList: true,
    defaultExportFormat: 'pdf',
    dateFormat: 'DD/MM/YYYY',
    currency: 'INR',
    timezone: 'Asia/Kolkata'
  },
  webhooks: {
    ordersCreate: true,
    ordersUpdate: true,
    appUninstalled: true
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.shop) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get existing settings or create default ones
    let settings = settingsStore.get(session.shop)
    if (!settings) {
      settings = getDefaultSettings(session.shop)
      settingsStore.set(session.shop, settings)
    }

    return NextResponse.json({ success: true, data: settings })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.shop) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const updates = await request.json()
    
    // Get existing settings or create default ones
    let settings = settingsStore.get(session.shop)
    if (!settings) {
      settings = getDefaultSettings(session.shop)
    }

    // Update settings with provided data
    const updatedSettings: AppSettings = {
      ...settings,
      ...updates,
      gstConfiguration: {
        ...settings.gstConfiguration,
        ...updates.gstConfiguration
      },
      businessInfo: {
        ...settings.businessInfo,
        ...updates.businessInfo,
        address: {
          ...settings.businessInfo.address,
          ...updates.businessInfo?.address
        },
        contact: {
          ...settings.businessInfo.contact,
          ...updates.businessInfo?.contact
        },
        bankDetails: {
          ...settings.businessInfo.bankDetails,
          ...updates.businessInfo?.bankDetails
        }
      },
      preferences: {
        ...settings.preferences,
        ...updates.preferences
      },
      webhooks: {
        ...settings.webhooks,
        ...updates.webhooks
      },
      updatedAt: new Date().toISOString()
    }

    // Validate required fields
    const errors: string[] = []
    
    if (updatedSettings.businessInfo.gstin && !isValidGSTIN(updatedSettings.businessInfo.gstin)) {
      errors.push('Invalid GSTIN format')
    }
    
    if (updatedSettings.businessInfo.address.pincode && !isValidPincode(updatedSettings.businessInfo.address.pincode)) {
      errors.push('Invalid pincode format')
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      )
    }

    // Save updated settings
    settingsStore.set(session.shop, updatedSettings)

    return NextResponse.json({ success: true, data: updatedSettings })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}

// Validation helpers
function isValidGSTIN(gstin: string): boolean {
  // GSTIN format: 15 characters - 2 state code + 10 PAN + 1 entity code + 1 Z + 1 checksum
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
  return gstinRegex.test(gstin)
}

function isValidPincode(pincode: string): boolean {
  // Indian pincode format: 6 digits
  const pincodeRegex = /^[1-9][0-9]{5}$/
  return pincodeRegex.test(pincode)
}