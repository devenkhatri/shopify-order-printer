export interface GSTBreakdown {
  gstType: 'CGST_SGST' | 'IGST'
  gstRate: number
  cgstAmount?: number
  sgstAmount?: number
  igstAmount?: number
  totalGstAmount: number
  taxableAmount: number
}

export function calculateGST(
  orderTotal: number,
  customerState: string,
  storeState: string
): GSTBreakdown {
  // GST rate determination based on order total
  const gstRate = orderTotal < 1000 ? 0.05 : 0.12
  const taxableAmount = orderTotal
  const totalGstAmount = taxableAmount * gstRate
  
  // Determine if same state or different state
  const isSameState = customerState === storeState
  
  if (isSameState) {
    // Split into CGST and SGST (each 50% of total GST)
    return {
      gstType: 'CGST_SGST',
      gstRate,
      cgstAmount: totalGstAmount / 2,
      sgstAmount: totalGstAmount / 2,
      totalGstAmount,
      taxableAmount,
    }
  } else {
    // IGST (full GST amount)
    return {
      gstType: 'IGST',
      gstRate,
      igstAmount: totalGstAmount,
      totalGstAmount,
      taxableAmount,
    }
  }
}