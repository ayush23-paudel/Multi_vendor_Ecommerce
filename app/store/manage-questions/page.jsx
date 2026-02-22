'use client'
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import Image from "next/image"
import Loading from "@/components/Loading"
import { useAuth, useUser } from "@clerk/clerk-react"
import axios from "axios"

export default function StoreManageQuestions() {
    const { getToken } = useAuth()
    const { user } = useUser()

    const [loading, setLoading] = useState(true)
    const [questions, setQuestions] = useState([])
    const [answerModal, setAnswerModal] = useState(null)
    const [answerText, setAnswerText] = useState('')

    const fetchQuestions = async () => {
        try {
            const token = await getToken()
            // Get all products for this seller
            const { data: productsData } = await axios.get('/api/store/product', {
                headers: { Authorization: `Bearer ${token}` }
            })

            // Get questions for all products
            const allQuestions = []
            for (const product of productsData.products) {
                const { data: questionsData } = await axios.get(`/api/question?productId=${product.id}`)
                allQuestions.push(...questionsData.questions.map(q => ({ ...q, product })))
            }

            // Sort by unanswered first, then by date
            allQuestions.sort((a, b) => {
                if (a.answer && !b.answer) return 1
                if (!a.answer && b.answer) return -1
                return new Date(b.createdAt) - new Date(a.createdAt)
            })

            setQuestions(allQuestions)
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleAnswerQuestion = async (questionId) => {
        if (!answerText.trim() || answerText.length < 5) {
            toast.error('Answer must be at least 5 characters')
            return
        }

        try {
            const token = await getToken()
            const { data } = await axios.put(`/api/question/${questionId}`, {
                answer: answerText
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })

            setQuestions(prevQuestions =>
                prevQuestions.map(q =>
                    q.id === questionId ? { ...q, answer: answerText, updatedAt: new Date().toISOString() } : q
                )
            )

            toast.success(data.message)
            setAnswerModal(null)
            setAnswerText('')
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }

    useEffect(() => {
        if (user) {
            fetchQuestions()
        }
    }, [user])

    if (loading) return <Loading />

    return (
        <>
            <h1 className="text-2xl text-slate-500 mb-5">Manage <span className="text-slate-800 font-medium">Questions</span></h1>

            <div className="space-y-4 max-w-4xl">
                {questions && questions.length > 0 ? (
                    questions.map((question) => (
                        <div
                            key={question.id}
                            className={`border rounded-lg p-4 ${question.answer ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'}`}
                        >
                            {/* Product Info */}
                            <div className="flex gap-2 items-center mb-3">
                                <Image
                                    width={40}
                                    height={40}
                                    className='p-1 shadow rounded'
                                    src={question.product.images[0]}
                                    alt=""
                                />
                                <div>
                                    <p className="font-medium text-slate-700">{question.product.name}</p>
                                    <p className="text-xs text-slate-500">{question.product.category}</p>
                                </div>
                            </div>

                            {/* Question */}
                            <div className="ml-12 mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="font-medium text-slate-600">{question.user.name}</p>
                                    <p className="text-xs text-slate-400">{new Date(question.createdAt).toDateString()}</p>
                                </div>
                                <p className="text-slate-700 text-sm">{question.question}</p>
                            </div>

                            {/* Answer Section */}
                            {question.answer ? (
                                <div className="ml-12 pl-4 border-l-4 border-green-500 bg-green-100 p-3 rounded">
                                    <p className="text-xs font-medium text-green-700 mb-1">Your Answer</p>
                                    <p className="text-sm text-slate-700">{question.answer}</p>
                                </div>
                            ) : (
                                <button
                                    onClick={() => {
                                        setAnswerModal(question.id)
                                        setAnswerText('')
                                    }}
                                    className="ml-12 px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                                >
                                    Write Answer
                                </button>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-slate-500 text-center py-8">No questions yet</p>
                )}
            </div>

            {/* Answer Modal */}
            {answerModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-semibold mb-4">Write Your Answer</h2>
                        <textarea
                            value={answerText}
                            onChange={(e) => setAnswerText(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                            placeholder="Write your answer here... (minimum 5 characters)"
                            rows="4"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleAnswerQuestion(answerModal)}
                                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                            >
                                Post Answer
                            </button>
                            <button
                                onClick={() => {
                                    setAnswerModal(null)
                                    setAnswerText('')
                                }}
                                className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
