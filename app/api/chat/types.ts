export interface Box {
  name: string
  price: number
  description: string
  contents: string[]
  availability: "disponible" | "no disponible"
}

export interface StoreInfo {
  address: string
  phone: string
  hours: {
    day: string
    open: string
    close: string
  }[]
  isOpen: boolean
}

export interface OrderItem {
  boxName: string
  quantity: number
}

export interface OrderRequest {
  items?: OrderItem[]
  boxName?: string
  quantity?: number
  confirm?: boolean | string
} 