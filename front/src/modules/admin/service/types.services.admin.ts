export interface Section {
  id: string
  name: string
  icon: string
  children?: Section[]
}

export interface FlattenedSection {
  id: string
  name: string
  icon: string
  level: number
  hasChildren: boolean
  isLastInLevel: boolean
  parentId: string | null
} 