'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useAuth, useUser } from '@clerk/clerk-react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { Send } from 'lucide-react'

export default function Questions({ productId }) {
    const { getToken } = useAuth()
    const { user } = useUser()
    
    const [questions, setQuestions] = useState([])
    const [newQuestion, setNewQuestion] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    const fetchQuestions = async () => {
        try {
            const { data } = await axios.get(`/api/question?productId=${productId}`)
            setQuestions(data.questions || [])
        } catch (error) {
            console.error('Failed to fetch questions:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAskQuestion = async (e) => {
        e.preventDefault()
        
        if (!user) {
            toast.error('Please log in to ask a question')
            return
        }

        if (!newQuestion.trim() || newQuestion.length < 5) {
            toast.error('Question must be at least 5 characters')
            return
        }

        try {
            setSubmitting(true)
            const token = await getToken()
            const { data } = await axios.post('/api/question', {
                question: newQuestion,
                productId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })

            setNewQuestion('')
            toast.success(data.message)
            fetchQuestions()
        } catch (error) {
            toast.error(error?.response?.data?.error || 'Failed to post question')
        } finally {
            setSubmitting(false)
        }
    }

    useEffect(() => {
        fetchQuestions()
    }, [productId])

    if (loading) return null

    return (
        <div className="mt-12">
            <h3 className="text-lg text-slate-600 mb-6 font-medium">Questions & Answers</h3>

            {/* Ask Question Form */}
            {user && (
                <form onSubmit={handleAskQuestion} className="mb-8 max-w-2xl">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={newQuestion}
                            onChange={(e) => setNewQuestion(e.target.value)}
                            placeholder="Ask a question about this product..."
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 flex items-center gap-2"
                        >
                            <Send size={18} />
                            Ask
                        </button>
                    </div>
                </form>
            )}

            {!user && (
                <p className="text-sm text-slate-500 mb-8">Log in to ask questions about this product</p>
            )}

            {/* Questions List */}
            <div className="space-y-6 max-w-2xl">
                {questions && questions.length > 0 ? (
                    questions.map((question) => (
                        <div key={question.id} className="border border-slate-200 rounded-lg p-4">
                            {/* Question */}
                            <div className="flex gap-3 mb-4">
                                <Image
                                    src={question.user.image}
                                    alt=""
                                    className="w-8 h-8 rounded-full"
                                    width={32}
                                    height={32}
                                />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium text-slate-700">{question.user.name}</p>
                                        <p className="text-xs text-slate-400">{new Date(question.createdAt).toDateString()}</p>
                                    </div>
                                    <p className="text-sm text-slate-600 mt-1">{question.question}</p>
                                </div>
                            </div>

                            {/* Answer */}
                            {question.answer && (
                                <div className="ml-11 pl-4 border-l-2 border-green-500 bg-green-50 p-3 rounded">
                                    <p className="text-xs font-medium text-green-700 mb-1">Seller's Answer</p>
                                    <p className="text-sm text-slate-700">{question.answer}</p>
                                    <p className="text-xs text-slate-400 mt-2">{new Date(question.updatedAt).toDateString()}</p>
                                </div>
                            )}

                            {!question.answer && (
                                <p className="ml-11 text-xs text-slate-400 italic">Waiting for seller to respond...</p>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-slate-500 text-sm">No questions yet. Be the first to ask!</p>
                )}
            </div>
        </div>
    )
}
