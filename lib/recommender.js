import prisma from '@/lib/prisma'

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

export async function getRecommendations(targetProductId, limit = 6, options = {}) {
  // fetch products that are in stock and whose store is active
  const products = await prisma.product.findMany({
    where: { inStock: true },
    include: { store: true, rating: true }
  })

  const items = products.filter(p => p.store?.isActive)
  const N = items.length
  if (N === 0) return options.debug ? { items: [], N: 0, vocabSize: 0, targetIndex: -1, top: [] } : []



  
  // find index of target product first (for category filtering)
  const targetIndex = items.findIndex(p => p.id === targetProductId)
  if (targetIndex === -1) return options.debug ? { items: [], N: 0, vocabSize: 0, targetIndex: -1, top: [] } : []

  const targetProduct = items[targetIndex]
  const targetCategory = targetProduct?.category || ''

  // If strict category mode, filter items to same category
  let candidateItems = items
  if (options.strictCategory) {
    candidateItems = items.filter(p => p.category === targetCategory)
  }

  const candidateCount = candidateItems.length
  if (candidateCount === 0) return options.debug ? { items: candidateItems, N: candidateCount, vocabSize: 0, targetIndex: -1, top: [] } : []

  // build corpus texts from candidates
  const texts = candidateItems.map(p => `${p.name} ${p.description} ${p.category || ''}`)

  // build vocabulary and term frequencies
  const vocab = new Map()
  const docsTokens = texts.map(text => tokenize(text))

  const docTermFreqs = docsTokens.map(tokens => {
    const tf = new Map()
    tokens.forEach(t => {
      tf.set(t, (tf.get(t) || 0) + 1)
      if (!vocab.has(t)) vocab.set(t, vocab.size)
    })
    return tf
  })

  // compute document frequencies
  const df = new Array(vocab.size).fill(0)
  docTermFreqs.forEach(tf => {
    for (const term of tf.keys()) {
      const idx = vocab.get(term)
      df[idx] += 1
    }
  })

  // compute IDF
  const idf = df.map(d => Math.log((candidateCount) / (1 + d)))

  // compute tf-idf vectors (sparse)
  const vectors = docTermFreqs.map(tf => {
    const vec = new Map()
    for (const [term, count] of tf.entries()) {
      const idx = vocab.get(term)
      vec.set(idx, count * idf[idx])
    }
    return vec
  })

  // helper: cosine similarity between sparse vectors
  function cosine(a, b) {
    let dot = 0
    let na = 0
    let nb = 0
    for (const [i, va] of a.entries()) {
      na += va * va
      const vb = b.get(i) || 0
      dot += va * vb
    }
    for (const vb of b.values()) nb += vb * vb
    if (na === 0 || nb === 0) return 0
    return dot / (Math.sqrt(na) * Math.sqrt(nb))
  }

  // find index of target product in candidate list
  const targetCandidateIndex = candidateItems.findIndex(p => p.id === targetProductId)
  if (targetCandidateIndex === -1) return options.debug ? { items: candidateItems, N: candidateCount, vocabSize: vocab.size, targetIndex: -1, top: [] } : []

  const targetVec = vectors[targetCandidateIndex]

  const scores = candidateItems.map((p, idx) => {
    if (idx === targetCandidateIndex) return { product: p, score: -1 }
    let score = cosine(targetVec, vectors[idx])
    return { product: p, score }
  })

  scores.sort((a, b) => b.score - a.score)

  const top = scores.slice(0, limit)

  if (options.debug) {
    return {
      items,
      N,
      vocabSize: vocab.size,
      targetIndex,
      top: top.map(s => ({ id: s.product.id, score: s.score }))
    }
  }

  return top.filter(s => s.score > 0).map(s => s.product)
}

export default getRecommendations
