import { Sparkles } from "lucide-react"

export default function InspirationQuote() {
  return (
    <section className="py-12 md:py-16 lg:py-24 bg-gradient-to-b from-background/80 to-background/90">
      <div className="container px-4 md:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 md:mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-primary/10 blur-md" />
              <div className="relative flex h-10 md:h-12 w-10 md:w-12 items-center justify-center rounded-full bg-white shadow-sm">
                <Sparkles className="h-5 md:h-6 w-5 md:w-6 text-primary" />
              </div>
            </div>
          </div>
          <blockquote className="space-y-2">
            <p className="text-lg md:text-xl font-medium leading-relaxed lg:text-2xl lg:leading-relaxed xl:text-3xl xl:leading-relaxed px-4">
              "When you find your spiritual partner, you find a mirror to your soul. Together, you walk the path of
              dharma, supporting each other's growth and evolution."
            </p>
            <footer className="mt-4 text-sm md:text-base font-medium text-muted-foreground">
              — Ancient Vedic Wisdom
            </footer>
          </blockquote>
          <div className="mt-6 md:mt-8 flex justify-center">
            <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  )
}
