'use client'
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import Image from "next/image"
import Loading from "@/components/Loading"

import { useAuth, useUser } from "@clerk/clerk-react"
import axios from "axios"

export default function StoreManageProducts() {
    const {getToken} = useAuth()
    const {user} = useUser()

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState([])
    const [editModal, setEditModal] = useState(null)
    const [editFormData, setEditFormData] = useState({ price: '', description: '', stock: '' })

    const fetchProducts = async () => {
       try {
        const token = await getToken()
        const {data} = await axios.get('/api/store/product',{
            headers: {Authorization : `Bearer ${token}`}
        })
 setProducts(data.products.sort((a,b)=>new Date(b.createdAt)- new Date(a.createdAt)))
       
    } catch (error) {
           toast.error(error?.response?.data?.error || error.message)
          
       }
        setLoading(false)
    }

    // Logic to toggle the stock of a product
    const toggleStock = async (productId) => {
try {
    const token = await getToken()
            const {data} = await axios.post('/api/store/stock-toggle',{productId},{
                headers: {Authorization : `Bearer ${token}`}
               
            })
    
         setProducts(prevProducts => prevProducts.map(product=> product.id === productId ? {...product,inStock: !product.inStock}: product))
         toast.success(data.message)
} catch (error) {
     toast.error(error?.response?.data?.error || error.message)
}
    }

    // Open edit modal
    const openEditModal = (product) => {
        setEditModal(product.id)
        setEditFormData({ price: product.price, description: product.description, stock: product.stock })
    }

    // Close edit modal
    const closeEditModal = () => {
        setEditModal(null)
        setEditFormData({ price: '', description: '', stock: '' })
    }

    // Handle update product
    const handleUpdateProduct = async (productId) => {
        try {
            if (editFormData.price === '' && editFormData.description === '' && editFormData.stock === '') {
                toast.error('Please enter price, description, or stock to update')
                return
            }

            const token = await getToken()
            const formData = new FormData()
            formData.append('productId', productId)
            if (editFormData.price !== '') formData.append('price', editFormData.price)
            if (editFormData.description !== '') formData.append('description', editFormData.description)
            if (editFormData.stock !== '') formData.append('stock', editFormData.stock)

            const { data } = await axios.put('/api/store/product', formData, {
                headers: { Authorization: `Bearer ${token}` }
            })

            setProducts(prevProducts =>
                prevProducts.map(product => {
                    if (product.id === productId) {
                        const updatedStock = editFormData.stock !== '' ? Number(editFormData.stock) : product.stock;
                        return {
                            ...product,
                            price: editFormData.price !== '' ? Number(editFormData.price) : product.price,
                            description: editFormData.description !== '' ? editFormData.description : product.description,
                            stock: updatedStock,
                            inStock: updatedStock > 0
                        };
                    }
                    return product;
                })
            )
            toast.success(data.message)
            closeEditModal()
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }
    useEffect(() => {

            if (user) {
                fetchProducts()
            }
    }, [user])

    if (loading) return <Loading />

    return (
        <>
            <h1 className="text-2xl text-slate-500 mb-5">Manage <span className="text-slate-800 font-medium">Products</span></h1>
            <table className="w-full max-w-4xl text-left  ring ring-slate-200  rounded overflow-hidden text-sm">
                <thead className="bg-slate-50 text-gray-700 uppercase tracking-wider">
                    <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3 hidden md:table-cell">Description</th>
                        <th className="px-4 py-3 hidden md:table-cell">MRP</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Stock</th>
                        <th className="px-4 py-3">Actions</th>
                    </tr>
                </thead>
                <tbody className="text-slate-700">
                    {products.map((product) => (
                        <tr key={product.id} className="border-t border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-3">
                                <div className="flex gap-2 items-center">
                                    <Image width={40} height={40} className='p-1 shadow rounded cursor-pointer' src={product.images[0]} alt="" />
                                    {product.name}
                                </div>
                            </td>
                            <td className="px-4 py-3 max-w-md text-slate-600 hidden md:table-cell truncate">{product.description}</td>
                            <td className="px-4 py-3 hidden md:table-cell">{currency} {product.mrp.toLocaleString()}</td>
                            <td className="px-4 py-3">{currency} {product.price.toLocaleString()}</td>
                            <td className="px-4 py-3">{product.stock}</td>
                            <td className="px-4 py-3 text-center">
                                <label className="relative inline-flex items-center cursor-pointer text-gray-900 gap-3">
                                    <input type="checkbox" className="sr-only peer" onChange={() => toast.promise(toggleStock(product.id), { loading: "Updating data..." })} checked={product.inStock} />
                                    <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-green-600 transition-colors duration-200"></div>
                                    <span className="dot absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                                </label>
                                <button onClick={() => openEditModal(product)} className="ml-3 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">
                                    Edit
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            

            {/* Edit Modal */}
            {editModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 max-w-full">
                        <h2 className="text-xl font-semibold mb-4">Edit Product</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={editFormData.price}
                                    onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter new price"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                                <input
                                    type="number"
                                    value={editFormData.stock}
                                    onChange={(e) => setEditFormData({ ...editFormData, stock: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter new stock quantity"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={editFormData.description}
                                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter new description"
                                    rows="4"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => handleUpdateProduct(editModal)}
                                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                >
                                    Update
                                </button>
                                <button
                                    onClick={closeEditModal}
                                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            </>)
}