/**
 * A chave de acesso nunca e enviada para o servidor: o que identifica o
 * documento no Firestore e o hash dela. Assim quem tiver acesso ao banco ve
 * apenas ids opacos, e a chave continua sendo o unico jeito de abrir o contador.
 */
export async function hashAccessKey(key: string): Promise<string> {
  const normalized = normalizeAccessKey(key)
  const subtle = globalThis.crypto?.subtle
  if (subtle) {
    const bytes = new TextEncoder().encode(`combo-counter:${normalized}`)
    const digest = await subtle.digest('SHA-256', bytes)
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
  }
  // Contexto inseguro (http sem localhost): fallback deterministico FNV-1a.
  return fnv1a(`combo-counter:${normalized}`)
}

export function normalizeAccessKey(key: string): string {
  return key.trim().toLowerCase()
}

function fnv1a(input: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return `fnv${hash.toString(16).padStart(8, '0')}`
}
