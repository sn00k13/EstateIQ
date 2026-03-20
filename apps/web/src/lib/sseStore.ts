type SSEClient = {
    residentId: string
    controller: ReadableStreamDefaultController
  }
  
  const clients = new Map<string, SSEClient>()
  
  export function addClient(residentId: string, controller: ReadableStreamDefaultController) {
    clients.set(residentId, { residentId, controller })
  }
  
  export function removeClient(residentId: string) {
    clients.delete(residentId)
  }
  
  export function sendToResident(residentId: string, event: string, data: unknown) {
    const client = clients.get(residentId)
    if (!client) return false
  
    try {
      const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
      client.controller.enqueue(new TextEncoder().encode(payload))
      return true
    } catch {
      removeClient(residentId)
      return false
    }
  }