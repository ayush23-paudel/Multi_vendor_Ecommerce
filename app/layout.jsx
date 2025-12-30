import { Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import StoreProvider from "@/app/StoreProvider";
import "./globals.css";
import {ClerkProvider} from "@clerk/nextjs";
const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata = {
    title: "Hamro Cart",
    description: "Shop Smarter",
};

export default function RootLayout({ children }) {
    return (
        
        <html lang="en">
            <body className={`${outfit.className} antialiased`}>
                <ClerkProvider>
                <StoreProvider>
                    <Toaster />
                    {children}
                </StoreProvider>
                </ClerkProvider>
            </body>
        </html>
        
    );
}
