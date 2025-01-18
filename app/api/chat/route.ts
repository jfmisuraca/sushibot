import openai from '@/lib/openai';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { message } = await req.json();

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Sos un asistente de ayuda para un restaurante de sushi. Podés consultar productos (mostrándolos en forma de lista, no uno detrás del otro), verificar su disponibilidad, realizar pedidos, cambiar o cancelar pedidos. Tus clientes son argentinos, tenés que hablarles con voseo. Sólo podés usar información de la base de datos." },
        { role: "user", content: message }
      ],
      functions: [
        {
          name: "query_products",
          description: "Query available products",
          parameters: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "check_availability",
          description: "Check availability of a specific product",
          parameters: {
            type: "object",
            properties: {
              product_name: { type: "string" },
            },
            required: ["product_name"],
          },
        },
        {
          name: "place_order",
          description: "Place an order for a product",
          parameters: {
            type: "object",
            properties: {
              product_name: { type: "string" },
              quantity: { type: "integer" },
            },
            required: ["product_name", "quantity"],
          },
        },
        {
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
        {
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
        {
          name: "get_info",
          description: "Get information about the store",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string" },
              address: { type: "string" },
              phone: { type: "string" },
              email: { type: "string" },
              opening: { type: "string" },
            },
          },
        },
      ],
    });

    const assistantMessage = chatCompletion.choices[0].message;

    if (assistantMessage.function_call) {
      const functionName = assistantMessage.function_call.name;
      const functionArgs = JSON.parse(assistantMessage.function_call.arguments || '{}');

      switch (functionName) {
        case 'query_products':
          return handleQueryProducts();
        case 'check_availability':
          return handleCheckAvailability(functionArgs.product_name);
        case 'place_order':
          return handlePlaceOrder(functionArgs.product_name, functionArgs.quantity);
        case 'change_order':
          return handleChangeOrder(functionArgs.order_id, functionArgs.new_quantity);
        case 'cancel_order':
          return handleCancelOrder(functionArgs.order_id);
        case 'get_info':
          return handleGetInfo(functionArgs.name, functionArgs.address, functionArgs.phone, functionArgs.email, functionArgs.opening);
        default:
          return NextResponse.json({ response: "I'm sorry, I couldn't process that request." });
      }
    } else {
      return NextResponse.json({ response: assistantMessage.content });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ response: "Lo sentimos, hubo un error al procesar tu solicitud." }, { status: 500 });
  }
}

async function handleQueryProducts() {
  const products = await prisma.product.findMany();
  const productList = products
    .map(p => `- ${p.name}: $${p.price.toFixed(2)} - ${p.description} (${p.vegan ? 'Vegano' : 'No vegano'})`)
    .join('\n');
  return NextResponse.json({ response: `Aquí están nuestros productos disponibles:\n${productList}` });
}

async function handleCheckAvailability(productName: string) {
  const product = await prisma.product.findFirst({
    where: { name: { contains: productName, mode: 'insensitive' } }
  });

  if (product) {
    return NextResponse.json({ response: `Tenemos ${product.quantity} unidades de ${product.name} disponibles.` });
  } else {
    return NextResponse.json({ response: `Lo siento, no pude encontrar el producto "${productName}".` });
  }
}

async function handlePlaceOrder(productName: string, quantity: number) {
  const product = await prisma.product.findFirst({
    where: { name: { contains: productName, mode: 'insensitive' } }
  });

  if (product) {
    if (quantity > product.quantity) {
      return NextResponse.json({ response: `Lo siento, solo tenemos ${product.quantity} unidades de ${product.name} disponibles.` });
    }

    const order = await prisma.order.create({
      data: {
        productId: product.id,
        quantity
      }
    });
    await prisma.product.update({
      where: { id: product.id },
      data: { quantity: product.quantity - quantity }
    });
    return NextResponse.json({ response: `Tu pedido de ${quantity} ${product.name} fue realizado con éxito con el número de orden ${order.id}. ¡Muchas gracias!` });
  } else {
    return NextResponse.json({ response: `Lo siento, no pude encontrar el producto "${productName}".` });
  }
}

async function handleChangeOrder(orderId: string, newQuantity: number) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { product: true }
  });

  if (!order) {
    return NextResponse.json({ response: `Lo siento, no pude encontrar un pedido con el ID ${orderId}.` });
  }

  if (newQuantity > order.product.quantity + order.quantity) {
    return NextResponse.json({ response: `Lo siento, no tenemos suficiente stock. La cantidad máxima disponible es ${order.product.quantity + order.quantity}.` });
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { quantity: newQuantity }
  });
  await prisma.product.update({
    where: { id: order.productId },
    data: { quantity: order.product.quantity + order.quantity - newQuantity }
  });
  return NextResponse.json({ response: `Tu pedido ha sido actualizado a ${newQuantity} ${order.product.name}.` });
}

async function handleCancelOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { product: true }
  });

  if (!order) {
    return NextResponse.json({ response: `Lo siento, no pude encontrar un pedido con el ID ${orderId}.` });
  }

  if (order.status === 'cancelled') {
    return NextResponse.json({ response: `El pedido con el ID ${orderId} ya fue cancelado.` });
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: 'cancelled' }
  });
  await prisma.product.update({
    where: { id: order.productId },
    data: { quantity: { increment: order.quantity } }
  });
  return NextResponse.json({ response: `Tu pedido de ${order.quantity} ${order.product.name} fue cancelado.` });
}

function isStoreOpen(opening: string): { open: boolean; message: string } {
  const [openingTime, closingTime] = opening.split('-').map((time) => time.trim());
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();

  // Convertir horas de apertura/cierre a minutos del día
  const [openingHour, openingMinutes] = openingTime.split(':').map(Number);
  const [closingHour, closingMinutes] = closingTime.split(':').map(Number);

  const openingInMinutes = openingHour * 60 + openingMinutes;
  const closingInMinutes = closingHour * 60 + closingMinutes;
  const currentInMinutes = currentHour * 60 + currentMinutes;

  if (currentInMinutes >= openingInMinutes && currentInMinutes < closingInMinutes) {
    return { open: true, message: `Estamos abiertos hasta las ${closingTime}` };
  }
  return { open: false, message: `Estamos cerrados, abrimos a las ${openingTime}` };
}

async function handleGetInfo(request: Request) {
  try {
    const { query } = Object.fromEntries(new URL(request.url).searchParams);
    const StoreData = await prisma.StoreData.findFirst();

    if (!StoreData) {
      return NextResponse.json({ error: 'No se encontraron datos de la tienda' }, { status: 404 });
    }

    switch (query.toLowerCase()) {
      case 'dirección':
      case 'direccion':
        return NextResponse.json({
          response: `Nuestra dirección es: ${StoreData.address}`,
          embed: `https://www.google.com/maps?q=${encodeURIComponent(StoreData.address)}`,
        });

      case 'teléfono':
      case 'telefono':
        return NextResponse.json({
          response: `Nuestro teléfono es:`,
          clickable: `tel:${StoreData.phone}`,
        });

      case 'horarios':
      case 'abiertos':
      case 'abierto':
        const status = isStoreOpen(StoreData.opening);
        return NextResponse.json({ response: status.message });

      default:
        return NextResponse.json({
          error: 'Consulta no válida. Por favor, pregunta por dirección, teléfono o si estamos abiertos.',
        });
    }
  } catch (error) {
    console.error('Error al obtener datos de la tienda:', error);
    return NextResponse.json({ error: 'Ocurrió un error al procesar tu solicitud' }, { status: 500 });
  }
}
