import { Box, StoreInfo } from './types'

export const preloadedBoxes: Box[] = [
  {
    name: "Box Chica",
    price: 32.24,
    description: "Ideal para una persona, incluye 4 piezas variadas.",
    contents: ["Nigiri de salmón", "Maki de pepino", "Temaki de atún", "Uramaki de aguacate"],
    availability: "disponible",
  },
  // ... resto de los boxes
]

export const storeInfo = {
  address: "Av. Corrientes 1234, Buenos Aires, Argentina",
  phone: "+54 11 1234-5678",
  hours: {
    weekdays: { day: "Lunes a Viernes", open: "11:00", close: "22:00" },
    weekends: { day: "Sábados y Domingos", open: "12:00", close: "23:00" }
  },
  isOpen: true
} 