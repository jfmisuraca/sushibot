export interface Box {
  name: string
  price: number
  description: string
  contents: string[]
  availability: "disponible" | "no disponible"
}

export interface StoreHours {
  weekdays: { open: string; close: string }
  weekends: { open: string; close: string }
}

export interface StoreInfo {
  address: string
  phone: string
  hours: StoreHours
  isOpen: boolean
}

export interface OrderRequest {
  items: Array<{
    boxName: string
    quantity: number
  }>
  confirm?: boolean
} 