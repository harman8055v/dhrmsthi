"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Lock, CreditCard, Smartphone, Building, CheckCircle, X } from "lucide-react"
import { toast } from "sonner"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  item: {
    type: "plan" | "superlike" | "highlight"
    name: string
    price: number
    description: string
    features?: string[]
    count?: number
    user_id: string
  } | null
  onSuccess: () => void
}

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function PaymentModal({ isOpen, onClose, item, onSuccess }: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStep, setPaymentStep] = useState<"details" | "processing" | "success">("details")

  if (!item) return null

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handlePayment = async () => {
    setIsProcessing(true)
    setPaymentStep("processing")

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        throw new Error("Failed to load payment gateway")
      }

      // All payments are now one-time payments (including plans)
      console.log("Creating one-time payment for:", {
        itemType: item.type,
        itemName: item.name,
        amount: item.price,
        userId: item.user_id
      })
      
      const orderResponse = await fetch("/api/payments/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: item.price * 100, // Convert to paise
          currency: "INR",
          receipt: `receipt_${Date.now()}`,
          payment_type: "one_time", // Always use one-time payments
          notes: {
            item_type: item.type,
            item_name: item.name,
            item_price: item.price,
            count: item.count || 1,
            user_id: item.user_id,
          },
        }),
      })

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json().catch(() => ({}))
        console.error("Order creation failed:", errorData)
        throw new Error(`Failed to create order: ${errorData.error || orderResponse.statusText}`)
      }

      const order = await orderResponse.json()
      console.log("Order created:", order)

      // Configure Razorpay options for one-time payment
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        name: "DharmaSaathi",
        description: item.description,
        image: "/logo.png",
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        theme: {
          color: "#f97316", // Orange theme
        },
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
        },
        handler: async (response: any) => {
          try {
            // Verify one-time payment
            const verifyResponse = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                order_id: order.id,
                payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                item_type: item.type,
                item_name: item.name,
                amount: item.price,
                count: item.count || 1,
              }),
            })

            if (!verifyResponse.ok) {
              throw new Error("Payment verification failed")
            }

            const result = await verifyResponse.json()
            if (result.verified) {
              setPaymentStep("success")
              setTimeout(() => {
                onSuccess()
                onClose()
                if (item.type === "plan") {
                  toast.success("Plan activated! Your premium features are now available.")
                } else {
                  toast.success(`${item.name} added to your account successfully!`)
                }
              }, 2000)
            } else {
              throw new Error("Payment verification failed")
            }
          } catch (error) {
            console.error("Payment verification error:", error)
            toast.error("Payment verification failed. Please contact support.")
            setPaymentStep("details")
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false)
            setPaymentStep("details")
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      console.error("Payment error:", error)
      toast.error("Payment failed. Please try again.")
      setPaymentStep("details")
    } finally {
      setIsProcessing(false)
    }
  }



  const renderPaymentStep = () => {
    switch (paymentStep) {
      case "processing":
        return (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold mb-3">Processing Payment...</h3>
            <p className="text-gray-600">Please complete the payment in the popup window</p>
          </div>
        )

      case "success":
        return (
          <div className="text-center py-12">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h3 className="text-xl font-semibold mb-3 text-green-700">Payment Successful!</h3>
            <p className="text-gray-600">Your purchase has been activated</p>
          </div>
        )

      default:
        return (
          <div className="space-y-6">
            {/* Item Details */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 pr-4">
                    <h3 className="font-semibold text-lg text-gray-900">{item.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-bold text-orange-600">₹{item.price.toLocaleString()}</div>
                    {item.count && <div className="text-sm text-gray-500">{item.count} items</div>}
                  </div>
                </div>

                {item.features && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">What's included:</h4>
                    <ul className="space-y-2">
                      {item.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Accepted Payment Methods</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center p-3 border rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 cursor-pointer">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                    <Smartphone className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">UPI</span>
                  <span className="text-xs text-gray-500 mt-0.5">Instant</span>
                </div>
                <div className="flex flex-col items-center p-3 border rounded-xl hover:border-green-300 hover:bg-green-50/50 transition-all duration-200 cursor-pointer">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <CreditCard className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Cards</span>
                  <span className="text-xs text-gray-500 mt-0.5">Secure</span>
                </div>
                <div className="flex flex-col items-center p-3 border rounded-xl hover:border-purple-300 hover:bg-purple-50/50 transition-all duration-200 cursor-pointer">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                    <Building className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Banking</span>
                  <span className="text-xs text-gray-500 mt-0.5">All Banks</span>
                </div>
              </div>
            </div>

            {/* Trust Elements */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800">Secure Payment</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Your payment is protected by 256-bit SSL encryption and processed securely through Razorpay
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Lock className="w-4 h-4" />
              <span>Powered by Razorpay • PCI DSS Compliant</span>
            </div>
          </div>
        )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-[95vw] max-h-[85vh] p-0 gap-0 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100002] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg shadow-2xl border-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Complete Payment</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 hover:bg-gray-100">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 py-6 overflow-y-auto flex-1 min-h-0">{renderPaymentStep()}</div>

        {/* Footer */}
        {paymentStep === "details" && (
          <div className="px-6 py-4 border-t bg-gray-50 sticky bottom-0 z-10 pb-6">
            <div className="flex gap-3 pb-2">
              <Button variant="outline" onClick={onClose} className="flex-1" disabled={isProcessing}>
                Cancel
              </Button>
              <Button
                onClick={handlePayment}
                disabled={isProcessing}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                {isProcessing ? "Processing..." : `Pay ₹${item.price.toLocaleString()}`}
              </Button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2 pb-2">
              By proceeding, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
