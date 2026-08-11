'use client'
import { addToCart, removeFromCart } from "@/lib/features/cart/cartSlice";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

const Counter = ({ productId }) => {

    const { cartItems } = useSelector(state => state.cart);
    const products = useSelector(state => state.product.list);

    const dispatch = useDispatch();

    const product = products.find(p => p.id === productId);
    const stock = product ? product.stock : 0;
    const inStock = product ? product.inStock : false;
    const currentQuantity = cartItems[productId] || 0;

    const addToCartHandler = () => {
        if (!inStock || stock <= 0) {
            toast.error("This product is currently out of stock.");
            return;
        }
        if (currentQuantity >= stock) {
            toast.error(`Only ${stock} items available in stock.`);
            return;
        }
        dispatch(addToCart({ productId }))
    }

    const removeFromCartHandler = () => {
        dispatch(removeFromCart({ productId }))
    }

    const isMaxReached = currentQuantity >= stock;

    return (
        <div className="inline-flex items-center gap-1 sm:gap-3 px-3 py-1 rounded border border-slate-200 max-sm:text-sm text-slate-600">
            <button onClick={removeFromCartHandler} className="p-1 select-none hover:text-black">-</button>
            <p className="p-1 min-w-[20px] text-center font-medium">{currentQuantity}</p>
            <button 
                onClick={addToCartHandler} 
                disabled={isMaxReached} 
                className={`p-1 select-none transition ${isMaxReached ? 'text-gray-300 cursor-not-allowed' : 'hover:text-black'}`}
            >
                +
            </button>
        </div>
    )
}

export default Counter