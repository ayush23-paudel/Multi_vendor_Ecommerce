'use client'
import ProductDescription from "@/components/ProductDescription";
import ProductDetails from "@/components/ProductDetails";
import Recommendations from "@/components/Recommendations";
import Loading from "@/components/Loading";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";

export default function Product() {

    const { productId } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`/api/products/${productId}`);
            setProduct(data.product);
        } catch (error) {
            console.error("Error fetching product details:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (productId) {
            fetchProduct();
        }
        scrollTo(0, 0);
    }, [productId]);

    if (loading) {
        return <Loading />;
    }

    if (!product) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center text-slate-400">
                <h1 className="text-2xl font-semibold">Product not found</h1>
            </div>
        );
    }

    return (
        <div className="mx-6">
            <div className="max-w-7xl mx-auto">

                {/* Breadcrums */}
                <div className="  text-gray-600 text-sm mt-8 mb-5">
                    Home / Products / {product?.category}
                </div>

                {/* Product Details */}
                <ProductDetails product={product} />

                {/* Description & Reviews */}
                <ProductDescription product={product} />

                {/* Recommendations */}
                <Recommendations productId={productId} />
            </div>
        </div>
    );
}