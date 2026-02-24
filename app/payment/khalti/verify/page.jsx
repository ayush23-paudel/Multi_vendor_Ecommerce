"use client"
import React, { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import axios from "axios"
import toast from "react-hot-toast"
import { useAuth } from "@clerk/nextjs"
import { useDispatch } from "react-redux"
import { fetchCart } from "@/lib/features/cart/cartSlice"

function KhaltiVerifyContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { getToken } = useAuth()
    const dispatch = useDispatch()
    const [verifying, setVerifying] = useState(true)

    useEffect(() => {
        const pidx = searchParams.get('pidx')
        const status = searchParams.get('status')
        const purchase_order_id = searchParams.get('purchase_order_id')

        if (!pidx) {
            setVerifying(false)
            toast.error('Invalid payment parameters')
            router.push('/orders')
            return;
        }

        if (status === 'User canceled') {
            setVerifying(false)
            toast.error('Payment canceled by user')
            router.push('/orders')
            return;
        }

        const orderIds = purchase_order_id ? purchase_order_id.split(',') : [];

        const verifyPayment = async () => {
            try {
                const token = await getToken()
                const { data } = await axios.post('/api/payment/khalti/verify', { pidx, orderIds }, { headers: { Authorization: `Bearer ${token}` } })

                if (data.success) {
                    toast.success('Payment successful')
                    dispatch(fetchCart({ getToken }))
                    router.push('/orders')
                } else {
                    toast.error('Payment verification failed')
                    router.push('/orders')
                }
            } catch (error) {
                console.error('Verify error:', error)
                toast.error(error?.response?.data?.error || 'Payment verification failed')
                router.push('/orders')
            } finally {
                setVerifying(false)
            }
        }

        verifyPayment()

    }, [searchParams, router, getToken, dispatch])

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="p-6 bg-white rounded shadow text-center">
                <h2 className="text-lg font-medium">{verifying ? 'Verifying Payment...' : 'Redirecting...'}</h2>
                <p className="text-sm text-gray-600 mt-2">Please do not refresh the page.</p>
            </div>
        </div>
    )
}

export default function KhaltiVerifyPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <KhaltiVerifyContent />
        </Suspense>
    )
}
