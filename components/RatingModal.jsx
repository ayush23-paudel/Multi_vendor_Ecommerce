'use client'

import { Star } from 'lucide-react';
import React, { useState } from 'react'
import { XIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { addRating } from '@/lib/features/rating/ratingSlice';
import axios from 'axios';

const RatingModal = ({ ratingModal, setRatingModal }) => {

    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const handleSubmit = async () => {
        try {
            if (rating < 1 || rating > 5) {
                return toast.error('Please select a rating');
            }
            if (review && review.length < 5) {
                return toast.error('Write a review with at least 5 characters');
            }

            setLoading(true);

            const { data } = await axios.post('/api/rating', {
                rating,
                review,
                productId: ratingModal.productId,
                orderId: ratingModal.orderId
            });

            // Dispatch action to add rating to Redux
            dispatch(addRating({
                rating,
                review,
                productId: ratingModal.productId,
                orderId: ratingModal.orderId
            }));

            toast.success(data.message || 'Rating submitted successfully!');
            setRatingModal(null);
            setRating(0);
            setReview('');
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message || 'Failed to submit rating');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className='fixed inset-0 z-120 flex items-center justify-center bg-black/10'>
            <div className='bg-white p-8 rounded-lg shadow-lg w-96 relative'>
                <button onClick={() => setRatingModal(null)} className='absolute top-3 right-3 text-gray-500 hover:text-gray-700'>
                    <XIcon size={20} />
                </button>
                <h2 className='text-xl font-medium text-slate-600 mb-4'>Rate Product</h2>
                <div className='flex items-center justify-center mb-4'>
                    {Array.from({ length: 5 }, (_, i) => (
                        <Star
                            key={i}
                            className={`size-8 cursor-pointer ${rating > i ? "text-green-400 fill-current" : "text-gray-300"}`}
                            onClick={() => setRating(i + 1)}
                        />
                    ))}
                </div>
                <textarea
                    className='w-full p-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-green-400'
                    placeholder='Write your review (minimum 5 characters)'
                    rows='4'
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                ></textarea>
                <button 
                    onClick={() => toast.promise(handleSubmit(), { loading: 'Submitting...' })}
                    disabled={loading}
                    className='w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition disabled:bg-gray-400'
                >
                    {loading ? 'Submitting...' : 'Submit Rating'}
                </button>
            </div>
        </div>
    )
}

export default RatingModal