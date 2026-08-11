'use client'

import React, { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '@clerk/nextjs'

function StripeVerifyContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const sessionId = searchParams.get('session_id')
    const { getToken } = useAuth()
    const [status, setStatus] = useState('Verifying your payment...')
    const verified = useRef(false)

    useEffect(() => {
        if (!sessionId) {
            toast.error('Missing Stripe session ID')
            router.push('/cart')
            return
        }

        if (verified.current) return
        verified.current = true

        const verifyPayment = async () => {
            try {
                const token = await getToken()
                const { data } = await axios.post('/api/payment/stripe/verify', {
                    sessionId
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                })

                if (data.success) {
                    toast.success('Payment successful!')
                    setStatus('Payment verified successfully. Redirecting...')
                    setTimeout(() => {
                        router.push('/orders')
                    }, 2000)
                } else {
                    toast.error('Payment verification failed.')
                    setStatus('Payment failed or was incomplete.')
                    setTimeout(() => router.push('/cart'), 3000)
                }
            } catch (error) {
                console.error('Verification error:', error)
                toast.error(error?.response?.data?.error || 'Payment verification failed')
                setStatus(`Error: ${error?.response?.data?.error || 'Verification failed'}`)
                setTimeout(() => router.push('/cart'), 4000)
            }
        }

        verifyPayment()
    }, [sessionId, router, getToken])

    return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6">
            <h1 className="text-2xl font-semibold mb-4 text-slate-700">Stripe Payment Verification</h1>
            <p className="text-slate-500">{status}</p>
        </div>
    )
}

export default function StripeVerifyPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[50vh] flex flex-col items-center justify-center p-6">
                <h1 className="text-2xl font-semibold mb-4 text-slate-700">Stripe Payment Verification</h1>
                <p className="text-slate-500">Loading payment verification...</p>
            </div>
        }>
            <StripeVerifyContent />
        </Suspense>
    )
}
