import AdminLayout from "@/components/admin/AdminLayout";

export const metadata = {
    title: "Hamrocart",
    description: "Hamrocart. - Admin",
};

export default function RootAdminLayout({ children }) {

    return (
        <>
            <AdminLayout>
                {children}
            </AdminLayout>
        </>
    );
}
