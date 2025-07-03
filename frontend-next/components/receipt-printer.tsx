"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Printer } from "lucide-react"
import type { Order } from "@/types"

interface ReceiptPrinterProps {
    order: Order | null
    isOpen: boolean
    onClose: () => void
}

export function ReceiptPrinter({ order, isOpen, onClose }: ReceiptPrinterProps) {
    const formatCurrency = (amount: number | string) => {
        const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(numAmount)
    }

    const handlePrint = () => {
        const printContent = document.getElementById("receipt-content")
        if (printContent) {
            const printWindow = window.open("", "_blank")
            if (printWindow) {
                printWindow.document.write(`
          <html>
            <head>
              <title>Receipt - ${order?.receipt_number || `Order #${order?.id}`}</title>
              <style>
                body {
                  font-family: 'Courier New', monospace;
                  font-size: 12px;
                  line-height: 1.4;
                  margin: 0;
                  padding: 20px;
                  max-width: 300px;
                }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .font-bold { font-weight: bold; }
                .border-t { border-top: 1px dashed #000; margin: 10px 0; }
                .flex { display: flex; justify-content: space-between; }
                .mb-2 { margin-bottom: 8px; }
                .mt-4 { margin-top: 16px; }
                @media print {
                  body { margin: 0; padding: 10px; }
                }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `)
                printWindow.document.close()
                printWindow.print()
                printWindow.close()
            }
        }
    }

    if (!order) return null

    const isGuestCustomer =
        !!order.guest_customer ||
        order.customer?.name?.toLowerCase() === "guest" ||
        order.customer?.phone === "000000000000";

    const customerName = isGuestCustomer ? (order.guest_customer?.name || "Guest") : (order.customer?.name || "N/A");
    const customerPhone = isGuestCustomer ? null : (order.customer?.phone || null);

    const isRealRegisteredCustomer =
        order.customer &&
        order.customer.id !== undefined &&
        order.customer.name?.toLowerCase() !== "guest" &&
        order.customer.phone !== "000000000000";

    const customerBalance = isRealRegisteredCustomer ? (order.customer?.saldo) : null;


    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Printer className="h-5 w-5" />
                        Receipt Preview
                    </DialogTitle>
                </DialogHeader>

                <div id="receipt-content" className="space-y-4 font-mono text-sm">
                    <div className="text-center space-y-1">
                        <h2 className="font-bold text-lg">CINBUD FOOD</h2>
                        <p className="text-xs">Jl. Karawaci No. 123</p>
                        <p className="text-xs">Phone: (021) 1234-5678</p>
                    </div>

                    <Separator />

                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <span>Receipt No:</span>
                            <span className="font-bold">{order.receipt_number || `#${order.id}`}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Date:</span>
                            <span>{new Date(order.order_date).toLocaleDateString("id-ID", { dateStyle: "long" })}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Cashier:</span>
                            <span>{order.user?.name || "N/A"}</span>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <span>Customer:</span>
                            <div className="text-right">
                                <div className="flex items-center gap-1 justify-end">
                                    {/* Removed User icon entirely */}
                                    <span className="font-medium">{customerName}</span>
                                </div>
                                {customerPhone && <div className="text-xs text-gray-600">{customerPhone}</div>}
                                {isGuestCustomer && <div className="text-xs text-gray-500">Guest Customer</div>}
                            </div>
                        </div>

                        {isRealRegisteredCustomer && customerBalance !== undefined && customerBalance !== null && (
                            <div className="flex justify-between">
                                <span>Current Balance:</span>
                                <span className="font-medium">{formatCurrency(customerBalance)}</span>
                            </div>
                        )}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        {(order.details || order.order_details || []).map((item, index) => (
                            <div key={index} className="space-y-1">
                                <div className="flex justify-between">
                                    <span className="font-medium">{item.product?.name || `Product ${item.product_id}`}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span>
                                    {item.quantity} x {formatCurrency(item.price)}
                                  </span>
                                    <span className="font-medium">{item.subtotal ? formatCurrency(item.subtotal) : formatCurrency(item.quantity * item.price)}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Separator />

                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(order.total || 0)}</span>
                        </div>

                        {order.discount && order.discount > 0 && (
                            <div className="flex justify-between">
                                <span>Discount:</span>
                                <span>-{formatCurrency(order.discount)}</span>
                            </div>
                        )}

                        <div className="flex justify-between">
                            <span>Tax (11%):</span>
                            <span>{formatCurrency(order.tax_amount || 0)}</span>
                        </div>

                        <Separator />

                        <div className="flex justify-between font-bold text-base">
                            <span>TOTAL:</span>
                            <span>{formatCurrency(order.grand_total || 0)}</span>
                        </div>

                        <div className="flex justify-between">
                            <span>Payment Method:</span>
                            <span className="uppercase">{order.payment_method || "CASH"}</span>
                        </div>
                    </div>

                    <Separator />

                    <div className="text-center space-y-1 text-xs">
                        <p>Thank you for your purchase!</p>
                        <p>Have a great day!</p>
                        {isGuestCustomer && <p>Join our loyalty program for exclusive rewards!</p>}
                    </div>
                </div>

                <div className="flex gap-2 mt-4">
                    <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                        Close
                    </Button>
                    <Button onClick={handlePrint} className="flex-1 bg-orange-500 hover:bg-orange-600">
                        <Printer className="h-4 w-4 mr-2" />
                        Print Receipt
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}