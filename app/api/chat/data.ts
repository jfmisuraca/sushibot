import { Box, StoreInfo } from './types'

export const preloadedBoxes: Box[] = [
  {
    name: "Box Chica",
    price: 32.24,
    description: "Ideal para una persona, incluye 4 piezas variadas.",
    contents: ["Nigiri de salmón", "Maki de pepino", "Temaki de atún", "Uramaki de aguacate"],
    availability: "disponible",
  },
  {
    name: "Box Mediana",
    price: 99.16,
    description: "Perfecta para compartir, incluye 8 piezas variadas.",
    contents: [
      "Nigiri de salmón",
      "Maki de pepino",
      "Temaki de atún",
      "Uramaki de aguacate",
      "Sashimi de salmón",
      "Nigiri de camarón",
      "Maki de atún",
      "Temaki de vegetales",
    ],
    availability: "disponible",
  },
  {
    name: "Box Grande",
    price: 169.89,
    description: "Un festín para varios, incluye 12 piezas variadas.",
    contents: [
      "Nigiri de salmón",
      "Maki de pepino",
      "Temaki de atún",
      "Uramaki de aguacate",
      "Sashimi de salmón",
      "Nigiri de camarón",
      "Maki de atún",
      "Temaki de vegetales",
      "Nigiri de anguila",
      "Uramaki de salmón",
      "Sashimi de atún",
      "Maki de camarón",
    ],
    availability: "disponible",
  },
  {
    name: "Box Vegana (Mediana)",
    price: 103.62,
    description: "La mejor opción para los amantes de lo vegano, incluye 8 piezas veganas.",
    contents: [
      "Maki de pepino",
      "Uramaki de aguacate",
      "Temaki de vegetales",
      "Nigiri de tofu",
      "Maki de zanahoria",
      "Uramaki de espárragos",
      "Temaki de mango",
      "Nigiri de berenjena",
    ],
    availability: "disponible",
  }
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