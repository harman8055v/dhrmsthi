"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { NotebookIcon as Lotus } from "lucide-react"

export default function Faq() {
  return (
    <section id="faq" className="py-12 md:py-16 lg:py-24 bg-gradient-to-b from-background/90 to-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tighter sm:text-4xl lg:text-5xl">Common Questions</h2>
          <p className="max-w-[700px] text-muted-foreground text-base md:text-lg lg:text-xl leading-relaxed px-4">
            Answers to help you on your spiritual matchmaking journey
          </p>
        </div>
        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {[
              {
                question: "How is DharmaSaathi different from other matrimony sites?",
                answer:
                  "DharmaSaathi focuses exclusively on spiritual compatibility, matching individuals based on their spiritual practices, beliefs, and life goals. Unlike conventional matrimony sites that prioritize appearance, career, or family background, we emphasize the spiritual connection that forms the foundation of a harmonious relationship.",
              },
              {
                question: "What spiritual traditions are represented on DharmaSaathi?",
                answer:
                  "We welcome seekers from all authentic spiritual traditions including but not limited to Hinduism, Buddhism, Jainism, Sikhism, Yoga practitioners, meditation enthusiasts, and those following various spiritual paths. Our platform is inclusive while maintaining respect for genuine spiritual practices.",
              },
              {
                question: "How does the spiritual compatibility matching work?",
                answer:
                  "Our proprietary algorithm considers multiple dimensions of spirituality including daily practices, core beliefs, spiritual goals, lifestyle choices, and values. We analyze these factors to suggest matches who are likely to support and enhance your spiritual journey while creating a harmonious partnership.",
              },
              {
                question: "Is DharmaSaathi only for those deeply established in their spiritual practice?",
                answer:
                  "Not at all. DharmaSaathi welcomes individuals at all stages of their spiritual journey, from those just beginning to explore spirituality to those with established practices. What matters most is your genuine interest in finding a partner who shares your spiritual values and aspirations.",
              },
              {
                question: "How does DharmaSaathi verify profiles?",
                answer:
                  "We implement a thorough KYC (Know Your Customer) process that verifies identity while respecting privacy. This includes document verification, video verification options, and community references where appropriate. Our goal is to create a safe, authentic community of genuine spiritual seekers.",
              },
            ].map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-b border-muted-foreground/10">
                <AccordionTrigger className="text-left py-4 md:py-6 hover:no-underline">
                  <div className="flex items-start">
                    <Lotus className="mr-3 h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm md:text-base font-medium">{item.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm md:text-base leading-relaxed pb-4 md:pb-6 pl-7">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
