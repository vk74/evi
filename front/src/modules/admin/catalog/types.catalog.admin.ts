export interface Section {
  id: string
  name: string
  icon: string
  children?: Section[]
}

export type CatalogSectionId = string
