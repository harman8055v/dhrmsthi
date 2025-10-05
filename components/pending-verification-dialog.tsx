"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ShieldCheck } from "lucide-react"

interface PendingVerificationDialogProps {
  open: boolean
  onOpenChange?: (open: boolean) => void
  onAcknowledge?: () => void
}

export default function PendingVerificationDialog({ open, onOpenChange, onAcknowledge }: PendingVerificationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-green-600" />
          </div>
          <DialogTitle className="text-xl">Updates sent for verification</DialogTitle>
          <DialogDescription className="mt-2 text-base">
            To maintain the highest security, your recent changes will be reviewed. Your profile may show as pending briefly.
            Most reviews complete within a few minutes and at most within 4 hours. We will notify you via WhatsApp and email once verified or if we need more information. Completing your profile helps avoid unnecessary delays.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onAcknowledge} className="w-full">Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


