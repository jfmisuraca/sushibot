type Box = {
  id: string
  description: string
  name: string
  createdAt: Date
  price: number
  products: Array<{
    id: string
    name: string
    description: string
    price: number
    quantity: number
    vegan: boolean
  }>
}

import { NextResponse } from "next/server"
import openai from "@/lib/openai"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const STORE_INFO = {
  address: "123 Sushi Street, Sushi City, SC 12345",
  phone: "+1234567890",
  openingHours: "Monday to Sunday: 11:00 AM - 10:00 PM",
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json()

    // Check for store info questions
    if (message.toLowerCase().includes("address") || message.toLowerCase().includes("location")) {
      return NextResponse.json({
        response: `Our store is located at: ${STORE_INFO.address}
        
        <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.215707164939!2d-73.98823492426385!3d40.75838383560561!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25855c6480299%3A0x55194ec5a1ae072e!2sTimes%20Square!5e0!3m2!1sen!2sus!4v1689242051525!5m2!1sen!2sus" width="100%" height="300" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`,
      })
    }

    if (
      message.toLowerCase().includes("phone") ||
      message.toLowerCase().includes("telephone") ||
      message.toLowerCase().includes("contact")
    ) {
      return NextResponse.json({
        response: `You can contact us via WhatsApp: <a href="https://wa.me/${STORE_INFO.phone}" target="_blank">${STORE_INFO.phone}</a>`,
      })
    }

    if (
      message.toLowerCase().includes("open") ||
      message.toLowerCase().includes("close") ||
      message.toLowerCase().includes("hours")
    ) {
      const now = new Date()
      const currentHour = now.getHours()
      const isOpen = currentHour >= 11 && currentHour < 22
      return NextResponse.json({
        response: `We are currently ${isOpen ? "OPEN" : "CLOSED"}. Our opening hours are: ${STORE_INFO.openingHours}`,
      })
    }

    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant for a sushi restaurant. You can help with querying pre-made sushi boxes, checking availability, placing orders, and changing or canceling orders.",
        },
        { role: "user", content: message },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "query_boxes",
            description: "Query available pre-made sushi boxes",
            parameters: {
              type: "object",
              properties: {},
            },
          },
        },
        {
          type: "function",
          function: {
            name: "check_availability",
            description: "Check availability of a specific sushi box",
            parameters: {
              type: "object",
              properties: {
                box_name: { type: "string" },
              },
              required: ["box_name"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "place_order",
            description: "Place an order for a sushi box",
            parameters: {
              type: "object",
              properties: {
                box_name: { type: "string" },
                quantity: { type: "integer" },
              },
              required: ["box_name", "quantity"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "change_order",
            description: "Change an existing order",
            parameters: {
              type: "object",
              properties: {
                order_id: { type: "string" },
                new_quantity: { type: "integer" },
              },
              required: ["order_id", "new_quantity"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "cancel_order",
            description: "Cancel an existing order",
            parameters: {
              type: "object",
              properties: {
                order_id: { type: "string" },
              },
              required: ["order_id"],
            },
          },
        },
      ],
    })

    const assistantMessage = chatCompletion.choices[0].message

    if (assistantMessage.tool_calls) {
      const functionCall = assistantMessage.tool_calls[0]
      const functionName = functionCall.function.name
      const functionArgs = JSON.parse(functionCall.function.arguments || "{}")

      let functionResponse
      switch (functionName) {
        case "query_boxes":
          functionResponse = await handleQueryBoxes()
          break
        case "check_availability":
          functionResponse = await handleCheckAvailability(functionArgs.box_name)
          break
        case "place_order":
          functionResponse = await handlePlaceOrder(functionArgs.box_name, functionArgs.quantity)
          break
        case "change_order":
          functionResponse = await handleChangeOrder(functionArgs.order_id, functionArgs.new_quantity)
          break
        case "cancel_order":
          functionResponse = await handleCancelOrder(functionArgs.order_id)
          break
        default:
          functionResponse = "I'm sorry, I couldn't process that request."
      }

      return NextResponse.json({ response: functionResponse })
    } else {
      return NextResponse.json({ response: assistantMessage.content })
    }
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json({ error: "An error occurred while processing your request." }, { status: 500 })
  }
}

async function handleQueryBoxes() {
  const boxes = await prisma.box.findMany()
  return boxes.map((box) => `${box.name}: $${box.price.toFixed(2)} - ${box.description}`).join("\n\n")
}

async function handleCheckAvailability(boxName: string) {
  const box = (await prisma.box.findFirst({
    where: { name: { contains: boxName, mode: "insensitive" } },
    include: { products: true },
  })) as Box | null

  if (box) {
    const availableProducts = box.products.filter((product) => product.quantity > 0)
    if (availableProducts.length === box.products.length) {
      return `The ${box.name} is available.`
    } else {
      return `Sorry, the ${box.name} is currently not available due to some products being out of stock.`
    }
  } else {
    return `Sorry, we couldn't find a box named "${boxName}".`
  }
}

async function handlePlaceOrder(boxName: string, quantity: number) {
  const box = (await prisma.box.findFirst({
    where: { name: { contains: boxName, mode: "insensitive" } },
    include: { products: true },
  })) as Box | null

  if (box) {
    const availableProducts = box.products.filter((product) => product.quantity >= quantity)
    if (availableProducts.length === box.products.length) {
      const order = await prisma.order.create({
        data: {
          product: { connect: { id: box.products[0].id } },
          quantity: quantity,
        },
      })
      await Promise.all(
        box.products.map((product) =>
          prisma.product.update({
            where: { id: product.id },
            data: { quantity: { decrement: quantity } },
          }),
        ),
      )
      return `Your order for ${quantity} ${box.name}(s) has been placed successfully. Your order ID is ${order.id}.`
    } else {
      return `Sorry, we don't have enough stock to fulfill your order for ${quantity} ${box.name}(s).`
    }
  } else {
    return `Sorry, we couldn't find a box named "${boxName}".`
  }
}

async function handleChangeOrder(orderId: string, newQuantity: number) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { product: { include: { box: true } } },
  })

  if (!order) {
    return `Sorry, we couldn't find an order with ID ${orderId}.`
  }

  const box = order.product.box
  const availableProducts = await prisma.product.findMany({
    where: { boxId: box.id, quantity: { gte: newQuantity - order.quantity } },
  })

  if (availableProducts.length === box.products.length) {
    await prisma.order.update({
      where: { id: orderId },
      data: { quantity: newQuantity },
    })
    await Promise.all(
      box.products.map((product) =>
        prisma.product.update({
          where: { id: product.id },
          data: { quantity: { decrement: newQuantity - order.quantity } },
        }),
      ),
    )
    return `Your order has been updated to ${newQuantity} ${box.name}(s).`
  } else {
    return `Sorry, we don't have enough stock to change your order to ${newQuantity} ${box.name}(s).`
  }
}

async function handleCancelOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { product: { include: { box: true } } },
  })

  if (!order) {
    return `Sorry, we couldn't find an order with ID ${orderId}.`
  }

  if (order.status === "cancelled") {
    return `The order with ID ${orderId} has already been cancelled.`
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "cancelled" },
  })
  await Promise.all(
    order.product.box.products.map((product) =>
      prisma.product.update({
        where: { id: product.id },
        data: { quantity: { increment: order.quantity } },
      }),
    ),
  )
  return `Your order for ${order.quantity} ${order.product.box.name}(s) has been cancelled.`
}


