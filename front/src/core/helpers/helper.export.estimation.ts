/**
 * version: 1.0.0
 * Frontend helper for exporting product estimation data to Excel file.
 * Uses ExcelJS library to generate .xlsx files on the client side.
 * File: helper.export.estimation.ts
 */

import ExcelJS from 'exceljs'

/**
 * Data structure for product estimation export
 */
export interface EstimationData {
  productName: string
  unitPrice: number
  vatAmount: number
  quantity: number
  totalCost: number
}

/**
 * Exports product estimation data to an Excel file.
 * Creates a workbook with a single sheet containing product details.
 * Triggers browser download dialog for the generated file.
 * 
 * @param data - Product estimation data to export
 */
export async function exportEstimationToExcel(data: EstimationData): Promise<void> {
  // Create workbook and worksheet
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Estimation')
  
  // Add headers row
  worksheet.addRow(['Product Name', 'Unit Price', 'VAT', 'Quantity', 'Total Cost'])
  
  // Add data row
  worksheet.addRow([
    data.productName,
    data.unitPrice,
    data.vatAmount,
    data.quantity,
    data.totalCost
  ])
  
  // Generate file buffer
  const buffer = await workbook.xlsx.writeBuffer()
  
  // Create blob for download
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  })
  
  // Create download link and trigger download
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'estimation.xlsx'
  link.click()
  
  // Cleanup
  URL.revokeObjectURL(url)
}
