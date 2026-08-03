// 设计器事件总线 - 用于节点组件与设计器主组件通信
type Handler = (...args: any[]) => void

const handlers = new Map<string, Handler[]>()

export function on(event: string, handler: Handler) {
  if (!handlers.has(event)) handlers.set(event, [])
  handlers.get(event)!.push(handler)
  return () => off(event, handler)
}

export function emit(event: string, ...args: any[]) {
  handlers.get(event)?.forEach(h => h(...args))
}

export function off(event: string, handler: Handler) {
  const list = handlers.get(event)
  if (list) handlers.set(event, list.filter(h => h !== handler))
}