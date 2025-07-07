import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PurchaseSuccessModalProps {
  open: boolean
  onClose: () => void
  superLikesAdded?: number
}

export default function PurchaseSuccessModal({ open, onClose, superLikesAdded = 5 }: PurchaseSuccessModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 gap-0 rounded-lg">
        <DialogHeader className="px-6 py-4 border-b bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">🎉 Purchase Successful</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 hover:bg-gray-100">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="px-6 py-10 text-center space-y-4">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
          <h3 className="text-2xl font-semibold text-green-700">Purchase Successful!</h3>
          <p className="text-gray-700">
            You’ve received <span className="font-bold text-orange-600">{superLikesAdded}</span> Superlikes. Use them mindfully 🙏
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
} 