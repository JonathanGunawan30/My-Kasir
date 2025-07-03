"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Edit, Trash2, Plus, Search } from "lucide-react"

interface Column {
    key: string
    label: string
    render?: (value: any, row: any) => React.ReactNode
}

interface DataTableProps {
    data: any[]
    columns: Column[]
    onAdd?: () => void
    onEdit?: (row: any) => void
    onDelete?: (row: any) => void
    title: string
    searchPlaceholder?: string
    isLoading?: boolean
    customActions?: (row: any) => React.ReactNode
    // --- PERBAIKAN: Hapus @ts-ignore dan pastikan props ini ada di interface
    searchTerm: string;
    onSearchChange: (value: string) => void;
}

export function DataTable({
                              data,
                              columns,
                              onAdd,
                              onEdit,
                              onDelete,
                              title,
                              searchPlaceholder = "Search...",
                              isLoading = false,
                              customActions,
                              // --- PERBAIKAN: Ambil props langsung dari parameter
                              searchTerm,
                              onSearchChange,
                          }: DataTableProps) {

    // --- PERBAIKAN: Hapus state searchTerm internal. Ini sekarang dikelola oleh komponen induk. ---
    // const [searchTerm, setSearchTerm] = useState("")

    // --- PERBAIKAN: Hapus logika filtering internal. Data yang diterima sudah difilter. ---
    // const filteredData = data.filter((item) =>
    //     Object.values(item).some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase())),
    // )

    const getValue = (obj: any, path: string) => {
        return path.split(".").reduce((current, key) => current?.[key], obj)
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-32">
                        <div className="text-muted-foreground">Loading...</div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            {/* --- START: PERBAIKAN TATA LETAK CARD HEADER --- */}
            {/* Menggabungkan judul, search, dan tombol dalam satu baris flex */}
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
                <CardTitle className="text-2xl font-bold">{title}</CardTitle>

                {/* Grup input search dan tombol 'Add New' */}
                <div className="flex items-center gap-2">
                    <div className="relative">
                        {/* Ikon Search di tengah secara vertikal */}
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={searchPlaceholder}
                            // Menggunakan prop searchTerm dari parent
                            value={searchTerm}
                            // Mengirim perubahan kembali ke parent melalui prop onSearchChange
                            onChange={(e) => onSearchChange(e.target.value)}
                            // Mengatur ukuran input agar kecil dan sejajar dengan tombol
                            className="pl-10 h-9 w-[250px]"
                        />
                    </div>
                    {onAdd && (
                        <Button onClick={onAdd} className="bg-orange-500 hover:bg-orange-600 h-9">
                            <Plus className="h-4 w-4 mr-2" />
                            Add New
                        </Button>
                    )}
                </div>
            </CardHeader>
            {/* --- END: PERBAIKAN TATA LETAK CARD HEADER --- */}

            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {columns.map((column) => (
                                    <TableHead key={column.key}>{column.label}</TableHead>
                                ))}
                                {(onEdit || onDelete || customActions) && <TableHead className="text-right">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* --- MENGGUNAKAN DATA DARI PROP LANGSUNG --- */}
                            {/* Data yang diterima sudah difilter dan dipaginasi oleh parent */}
                            {data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length + 1} className="text-center py-8">
                                        No data available
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((row, index) => (
                                    <TableRow key={index}>
                                        {columns.map((column) => (
                                            <TableCell key={column.key}>
                                                {column.render
                                                    ? column.render(getValue(row, column.key), row)
                                                    : getValue(row, column.key) || "N/A"}
                                            </TableCell>
                                        ))}
                                        {(onEdit || onDelete || customActions) && (
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {customActions && customActions(row)}
                                                    {onEdit && (
                                                        <Button size="sm" variant="outline" onClick={() => onEdit(row)} className="h-8 px-2">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {onDelete && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => onDelete(row)}
                                                            className="h-8 px-2 text-red-500 hover:text-red-700"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}