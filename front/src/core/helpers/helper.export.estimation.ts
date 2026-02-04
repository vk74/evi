/**
 * version: 1.3.2
 * Frontend helper for exporting product estimation data to Excel file.
 * Uses ExcelJS library to generate .xlsx with main product + options (qty > 0),
 * formulas for VAT and costs so sheet recalculates when user changes quantity.
 * File: helper.export.estimation.ts
 *
 * Changes in v1.1.0:
 * - Multi-row export: main product + options with quantity > 0
 * - Column A left empty; data in B–I (catalog number = product_code, name, qty, unit price, VAT formula, cost w/o VAT, cost with VAT, short_description)
 * - Formulas in F, G, H for recalculation in Excel; total row with SUM(H2:Hn)
 *
 * Changes in v1.2.0:
 * - Borders: headers and data cells B–I; total cost cell (H) full border; "Итого:" (B:C) top border only
 * - Column widths: A -50%, B +50%, C 3x, D header "Кол-во ед.", E–H 2x, I 6x
 * - Header row: wrap text
 *
 * Changes in v1.3.0:
 * - Column E uses same number format as F,G,H (#,##0.00)
 * - Headers use currency from product card (EstimationExportData.currency)
 * - Column B width +50% (was 1.5x, now 2.25x default width)
 *
 * Changes in v1.3.1:
 * - No fallback currency: headers show currency only when provided from product card, otherwise no currency suffix
 *
 * Changes in v1.3.2:
 * - Column E: assign value first then numFmt so format is not lost; unit price rounded to 2 decimals (data rows only)
 * - Column E display now matches F, G, H (currency: thousands separator, 2 decimal places)
 */

import ExcelJS from 'exceljs'

/** Single row for estimation sheet (catalog number = product_code from product card) */
export interface EstimationRow {
  catalogNumber: string
  name: string
  quantity: number
  unitPrice: number
  vatRate: number
  description?: string
}

export interface EstimationExportData {
  rows: EstimationRow[]
  /** Currency symbol for headers (from product card only). If set, appended to price/VAT/cost headers; if not set, no currency in headers. */
  currency?: string
  headers?: {
    catalogNumber?: string
    name?: string
    quantity?: string
    unitPrice?: string
    vatPerItem?: string
    costWithoutVat?: string
    costWithVat?: string
    itemDescription?: string
  }
}

const DEFAULT_HEADERS = {
  catalogNumber: 'Каталожный номер',
  name: 'Название',
  quantity: 'Кол-во ед.',
  unitPrice: 'Листовая цена за единицу, уе',
  vatPerItem: 'НДС за позицию, уе',
  costWithoutVat: 'Стоимость без НДС, уе',
  costWithVat: 'Стоимость с НДС, уе',
  itemDescription: 'Описание позиции'
}

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' }
}

const TOP_BORDER_ONLY: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' }
}

const HEADER_ROW = 1
const FIRST_DATA_ROW = 2
const COL_A = 1
const COL_B = 2
const COL_C = 3
const COL_D = 4
const COL_E = 5
const COL_F = 6
const COL_G = 7
const COL_H = 8
const COL_I = 9

const DEFAULT_COL_WIDTH = 8.43
const COLUMN_WIDTHS: Record<number, number> = {
  [COL_A]: DEFAULT_COL_WIDTH * 0.5,
  [COL_B]: DEFAULT_COL_WIDTH * 2.25, // +50% vs previous 1.5x
  [COL_C]: DEFAULT_COL_WIDTH * 3,
  [COL_D]: DEFAULT_COL_WIDTH,
  [COL_E]: DEFAULT_COL_WIDTH * 2,
  [COL_F]: DEFAULT_COL_WIDTH * 2,
  [COL_G]: DEFAULT_COL_WIDTH * 2,
  [COL_H]: DEFAULT_COL_WIDTH * 2,
  [COL_I]: DEFAULT_COL_WIDTH * 6
}

const LIGHT_BLUE_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFD6EAF8' }
}

/**
 * Exports product estimation to an Excel file.
 * Sheet: column A empty; B–I = headers then data rows; formulas in F, G, H; total row with merged B:C "Итого:" and SUM in H.
 */
export async function exportEstimationToExcel(data: EstimationExportData): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Estimation')
  const currency = data.currency
  const headers = {
    ...DEFAULT_HEADERS,
    unitPrice: currency ? `Листовая цена за единицу, ${currency}` : 'Листовая цена за единицу',
    vatPerItem: currency ? `НДС за позицию, ${currency}` : 'НДС за позицию',
    costWithoutVat: currency ? `Стоимость без НДС, ${currency}` : 'Стоимость без НДС',
    costWithVat: currency ? `Стоимость с НДС, ${currency}` : 'Стоимость с НДС',
    ...data.headers
  }
  const rows = data.rows

  // Column widths
  Object.entries(COLUMN_WIDTHS).forEach(([col, w]) => {
    sheet.getColumn(Number(col)).width = w
  })

  // Header row: A empty, B–I; wrap text, borders, fill
  const headerRow = sheet.getRow(HEADER_ROW)
  headerRow.getCell(COL_A).value = ''
  headerRow.getCell(COL_B).value = headers.catalogNumber
  headerRow.getCell(COL_C).value = headers.name
  headerRow.getCell(COL_D).value = headers.quantity
  headerRow.getCell(COL_E).value = headers.unitPrice
  headerRow.getCell(COL_F).value = headers.vatPerItem
  headerRow.getCell(COL_G).value = headers.costWithoutVat
  headerRow.getCell(COL_H).value = headers.costWithVat
  headerRow.getCell(COL_I).value = headers.itemDescription
  headerRow.eachCell((cell, colNumber) => {
    if (colNumber >= COL_B && colNumber <= COL_I) {
      cell.fill = LIGHT_BLUE_FILL
      cell.font = { bold: true }
      cell.alignment = { wrapText: true }
      cell.border = THIN_BORDER
    }
  })

  const numFormat = '#,##0.00'

  // Set column E number format so all unit price cells match F,G,H (thousands separator, 2 decimals)
  sheet.getColumn(COL_E).numFmt = numFormat

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const rowNum = FIRST_DATA_ROW + i
    const rate = r.vatRate / 100
    sheet.getCell(rowNum, COL_A).value = ''
    sheet.getCell(rowNum, COL_B).value = r.catalogNumber
    sheet.getCell(rowNum, COL_C).value = r.name
    sheet.getCell(rowNum, COL_D).value = r.quantity
    sheet.getCell(rowNum, COL_D).numFmt = numFormat
    sheet.getCell(rowNum, COL_E).value = Math.round(r.unitPrice * 100) / 100
    sheet.getCell(rowNum, COL_E).numFmt = numFormat
    sheet.getCell(rowNum, COL_F).value = { formula: `G${rowNum}*${rate}` }
    sheet.getCell(rowNum, COL_F).numFmt = numFormat
    sheet.getCell(rowNum, COL_G).value = { formula: `D${rowNum}*E${rowNum}` }
    sheet.getCell(rowNum, COL_G).numFmt = numFormat
    sheet.getCell(rowNum, COL_H).value = { formula: `G${rowNum}+F${rowNum}` }
    sheet.getCell(rowNum, COL_H).numFmt = numFormat
    sheet.getCell(rowNum, COL_I).value = r.description ?? ''
    for (let c = COL_B; c <= COL_I; c++) {
      sheet.getCell(rowNum, c).border = THIN_BORDER
    }
  }

  const lastDataRow = FIRST_DATA_ROW + rows.length - 1
  const totalRowNum = lastDataRow + 1
  sheet.getCell(totalRowNum, COL_A).value = ''
  sheet.mergeCells(totalRowNum, COL_B, totalRowNum, COL_C)
  sheet.getCell(totalRowNum, COL_B).value = 'Итого:'
  sheet.getCell(totalRowNum, COL_B).font = { bold: true }
  sheet.getCell(totalRowNum, COL_B).border = TOP_BORDER_ONLY
  sheet.getCell(totalRowNum, COL_H).value = {
    formula: `SUM(H${FIRST_DATA_ROW}:H${lastDataRow})`
  }
  sheet.getCell(totalRowNum, COL_H).numFmt = numFormat
  sheet.getCell(totalRowNum, COL_H).font = { bold: true }
  sheet.getCell(totalRowNum, COL_H).border = THIN_BORDER

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'estimation.xlsx'
  link.click()
  URL.revokeObjectURL(url)
}
