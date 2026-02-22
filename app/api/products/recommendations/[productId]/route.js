import { NextResponse } from "next/server";
import prisma from '@/lib/prisma'
import { getRecommendations } from '../../../../../lib/recommender'

export async function GET(request, { params }){
  try {
    const { productId } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '6', 10)

    const debug = searchParams.get('debug') === '1'
    const strictCategory = searchParams.get('category') === '1'
    const recs = await getRecommendations(productId, limit, { debug, strictCategory })

    if (debug) {
      return NextResponse.json({ debug: recs })
    }

    // ensure we return the same shape as other product endpoints
    return NextResponse.json({ products: recs })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
