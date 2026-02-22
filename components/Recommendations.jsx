'use client'
import { useEffect, useState } from 'react'
import ProductCard from './ProductCard'

export default function Recommendations({ productId, limit = 6, strictCategory = true }){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!productId) return
    setLoading(true)
    const categoryParam = strictCategory ? '&category=1' : ''
    fetch(`/api/products/recommendations/${productId}?limit=${limit}${categoryParam}`)
      .then(r => r.json())
      .then(data => {
        setItems(data.products || [])
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [productId, limit, strictCategory])

  if (loading) return null
  if (!items || items.length === 0) return null

  return (
    <div className="mt-8">
      <h3 className="text-lg text-slate-600 mb-4">Recommended for you</h3>
      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4'>
        {items.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
