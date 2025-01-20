import { NextRequest } from "next/server"
import { POST, GET, handleGetStoreInfo, handleGetLocation, handleGetPhone } from "../api/chat/route"
import openai from "../../lib/openai"

jest.mock("../../lib/openai", () => ({
  chat: {
    completions: {
      create: jest.fn()
    }
  }
}))

describe("Chat API", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("GET handler", () => {
    it("should return OK status", async () => {
      const res = await GET()
      const data = await res.json()
      expect(data.status).toBe("OK")
    })
  })

  describe("POST handler", () => {
    it("should handle query_boxes function call", async () => {
      const mockCreate = openai.chat.completions.create as jest.Mock
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            tool_calls: [{ function: { name: "query_boxes" } }]
          }
        }]
      })

      const req = new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: "Mostrar boxes" })
      })

      const res = await POST(req)
      const data = await res.json()

      expect(data.response).toContain("Estos son nuestros boxes disponibles:")
      expect(data.response).toContain("Box Chica")
    })

    it("should handle get_store_info function call", async () => {
      const mockCreate = openai.chat.completions.create as jest.Mock
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            tool_calls: [{ function: { name: "get_store_info" } }]
          }
        }]
      })

      const req = new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: "Horarios" })
      })

      const res = await POST(req)
      const data = await res.json()

      expect(data.response).toContain("Nuestros horarios")
    })

    it("should handle get_location function call", async () => {
      const mockCreate = openai.chat.completions.create as jest.Mock
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            tool_calls: [{ function: { name: "get_location" } }]
          }
        }]
      })

      const req = new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: "Dirección" })
      })

      const res = await POST(req)
      const data = await res.json()

      expect(data.response).toContain("Nos encontramos en:")
    })

    it("should handle get_phone function call", async () => {
      const mockCreate = openai.chat.completions.create as jest.Mock
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            tool_calls: [{ function: { name: "get_phone" } }]
          }
        }]
      })

      const req = new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: "Teléfono" })
      })

      const res = await POST(req)
      const data = await res.json()

      expect(data.response).toContain("Nuestro teléfono:")
    })

    it("should handle direct assistant response", async () => {
      const mockCreate = openai.chat.completions.create as jest.Mock
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: "Respuesta directa del asistente"
          }
        }]
      })

      const req = new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: "Hola" })
      })

      const res = await POST(req)
      const data = await res.json()

      expect(data.response).toBe("Respuesta directa del asistente")
    })

    it("should handle invalid function name", async () => {
      const mockCreate = openai.chat.completions.create as jest.Mock
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            tool_calls: [{ function: { name: "invalid_function" } }]
          }
        }]
      })

      const req = new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: "Test" })
      })

      const res = await POST(req)
      const data = await res.json()

      expect(data.response).toBe("Lo siento, no pude procesar esa solicitud.")
    })

    it("should handle invalid request body", async () => {
      const req = new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        body: "invalid json"
      })

      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(500)
      expect(data.response).toBe("Lo siento, hubo un error al procesar tu solicitud.")
    })

    test('should handle errors gracefully', async () => {
      const req = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: null }), // Forzar un error
      })

      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(500)
      expect(data.response).toBe("Lo siento, hubo un error al procesar tu solicitud.")
    })
  })

  describe('handleGetStoreInfo', () => {
    test('should return store hours and status', async () => {
      const res = await handleGetStoreInfo()
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.response).toContain("Nuestros horarios:")
      expect(data.response).toContain("Lunes a Viernes:")
      expect(data.response).toContain("Sábados y Domingos:")
      expect(data.response).toMatch(/(Estamos abiertos ahora|Estamos cerrados ahora)/)
    })
  })

  describe('handleGetLocation', () => {
    test('should return store address', async () => {
      const res = await handleGetLocation()
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.response).toContain("Nos encontramos en:")
      expect(data.response).toContain("Av. Corrientes")
    })
  })

  describe('handleGetPhone', () => {
    test('should return store phone', async () => {
      const res = await handleGetPhone()
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.response).toContain("Nuestro teléfono:")
      expect(data.response).toContain("+54")
    })
  })
})


