// Where on screen the thing that opened the modal sits, so the modal can grow out of it.
let origin: DOMRect | undefined

export function setModalOrigin(rect: DOMRect) {
  origin = rect
}

export function takeModalOrigin() {
  const rect = origin
  origin = undefined
  return rect
}
