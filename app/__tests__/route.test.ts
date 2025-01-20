import { NextRequest } from "next/server"
import { POST } from "../api/chat/route"

jest.mock("../../lib/openai.ts", () => ({
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: "Test response",
              tool_calls: [{ function: { name: "query_boxes" } }],
            },
          },
        ],
      }),
    },
  },
}))

describe("POST handler", () => {
  it("should return a response for a valid request", async () => {
    const req = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "Test message" }),
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.response).toContain("Estos son nuestros boxes disponibles:")
  })

  it("should handle errors gracefully", async () => {
    const req = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({}), // Invalid body
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.response).toBe("Lo siento, hubo un error al procesar tu solicitud.")
  })
})

describe("handleQueryBoxes", () => {
  it("should return a list of available boxes", async () => {
    const req = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "Mostrar boxes" }),
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.response).toContain("Box Chica")
    expect(data.response).toContain("Box Mediana")
    expect(data.response).toContain("Box Grande")
    expect(data.response).toContain("Box Vegana (Mediana)")
  })
})

describe("handleGetStoreInfo", () => {
  it("should return store information", async () => {
    const req = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "Información de la tienda" }),
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.response).toContain("Dirección:")
    expect(data.response).toContain("Teléfono:")
    expect(data.response).toContain("Horarios:")
    expect(data.response).toContain("Estado actual:")
  })
})


