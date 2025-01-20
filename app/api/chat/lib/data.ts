interface Box {
  name: string
  price: number
  availability: string
  description: string
  contents: string[]
}

interface StoreHours {
  day: string
  open: string
  close: string
}

interface StoreInfo {
  hours: StoreHours[]
  address: string
  phone: string
}

export const preloadedBoxes: Box[] = [
  {
    name: "Box Chica",
    price: 32.24,
    availability: "Disponible",
    description: "Ideal para una persona, incluye 4 piezas variadas.",
    contents: ["Rollo California", "Rollo de Kanikama", "Rollo Philadelphia", "Rollo de Atún Picante"]
  },
  {
    name: "Box Mediana",
    price: 99.16,
    availability: "Disponible", 
    description: "Perfecta para compartir, incluye 8 piezas variadas.",
    contents: ["Rollo California", "Rollo Dragón", "Sashimi de Salmón", "Rollo Philadelphia"]
  },
  {
    name: "Box Grande",
    price: 169.89,
    availability: "Disponible",
    description: "Un festín para varios, incluye 12 piezas variadas.",
    contents: ["Rollo California", "Rollo de Kanikama", "Rollo Dragón", "Sashimi de Salmón"]
  }
]

export const storeInfo: StoreInfo = {
  hours: [
    { day: "Lunes a Viernes", open: "11:00", close: "23:00" },
    { day: "Sábados y Domingos", open: "12:00", close: "23:00" }
  ],
  address: "Av. Principal 123, Ciudad",
  phone: "+54 11 1234-5678"
} 