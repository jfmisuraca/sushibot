import { Box } from '../app/api/chat/types'
import { handleQueryBoxes, handleGetStoreInfo, handleCreateOrder } from '../app/api/chat/handlers'
import { preloadedBoxes } from '../app/api/chat/data'

describe('API Handlers', () => {
  test('handleQueryBoxes returns all available boxes', async () => {
    const response = await handleQueryBoxes()
    const data = await response.json()
    expect(response.status).toBe(200)
    preloadedBoxes.forEach((box: Box) => {
      expect(data.response).toContain(box.name)
      expect(data.response).toContain(box.price.toString())
    })
  })

  test('handleCreateOrder validates order items', async () => {
    const invalidOrder = {
      items: [{ boxName: 'Box Inexistente', quantity: 1 }]
    }
    const response = await handleCreateOrder(invalidOrder)
    const data = await response.json()
    expect(response.status).toBe(400)
    expect(data.response).toContain('Box no encontrado')
  })

  test('handleGetStoreInfo returns store hours', async () => {
    const response = await handleGetStoreInfo()
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.response).toContain('Lunes a Viernes')
    expect(data.response).toContain('Sábados y Domingos')
  })
}) 