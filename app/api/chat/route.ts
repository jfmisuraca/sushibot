import openai from '@/lib/openai';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { message } = await req.json();

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: "Sos un asistente de ayuda para un restaurante de sushi. Podés consultar productos (mostrándolos en forma de lista, no uno detrás del otro), verificar su disponibilidad, realizar pedidos, cambiar o cancelar pedidos. Tus clientes son argentinos, tenés que hablarles con voseo. Sólo podés usar información de la base de datos." 
        },
        { role: "user", content: message }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "query_products",
            description: "Query available products",
            parameters: {
              type: "object",
              properties: {},
            },
          }
        },
        {
          type: "function",
          function: {
            name: "check_availability",
            description: "Check availability of a specific product",
            
            parameters: {
              type: "object",
              properties: {
                product_name: { type: "string" },
              },
              required: ["product_name"],
            },
          }
        },
        {
          type: "function",
          function: {
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
          }
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
          }
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
          }
        },
        {
          type: "function",
          function: {
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
          }
        },
      ],
    });

    const assistantMessage = chatCompletion.choices[0].message;

    if (assistantMessage.tool_calls) {
      const functionName = assistantMessage.tool_calls[0].function.name;
      const functionArgs = JSON.parse(assistantMessage.tool_calls[0].function.arguments || '{}');

      switch (functionName) {
        case 'query_products':
          return await handleQueryProducts();
        case 'check_availability':
          return handleCheckAvailability(functionArgs.product_name);
        case 'place_order':
          return handlePlaceOrder(functionArgs.product_name, functionArgs.quantity);
        case 'change_order':
          return handleChangeOrder(functionArgs.order_id, functionArgs.new_quantity);
        case 'cancel_order':
          return handleCancelOrder(functionArgs.order_id);
        default:
          return NextResponse.json({ response: "Lo siento, no pude procesar esa solicitud." });
      }
    } else {
      return NextResponse.json({ response: assistantMessage.content });
    }
  } catch (error) {
    console.error('Error detallado:', error);
    return NextResponse.json({ 
      response: "Lo siento, hubo un error al procesar tu solicitud.",
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

async function handleQueryProducts() {
  try {
    const products = await prisma.product.findMany({
      select: {
        name: true,
        price: true,
        quantity: true,
        description: true
      }
    });
    
    if (!products || products.length === 0) {
      return NextResponse.json({
        response: "Lo siento, no hay productos disponibles en este momento."
      });
    }

    const productList = products.map(p => 
      `- ${p.name}: $${p.price} (${p.quantity} disponibles)`
    ).join('\n');

    return NextResponse.json({
      response: `Estos son nuestros productos disponibles:\n${productList}`
    });
  } catch (error) {
    console.error('Error al consultar productos:', error);
    return NextResponse.json({ 
      response: "Lo siento, hubo un error al consultar los productos.",
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
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