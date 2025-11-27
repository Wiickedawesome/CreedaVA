import { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatCircle, X, PaperPlaneRight, Robot } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// Memoized knowledge base to prevent re-creation
const KNOWLEDGE_BASE: { [key: string]: string } = {
  // Greetings
  'hi|hello|hey|greetings': "Hello! I'm CreedaVA's assistant. I can help you with information about our services, pricing, or contact details. What would you like to know?",
  
  // Services
  'services|what do you do|what services|help with': "CreedaVA offers:\n• Executive Support\n• Administrative Tasks\n• Customer Service\n• Real Estate Support\n• Technology Support\n• E-commerce Support\n• Bookkeeping Support\n\nWhich service interests you?",
  
  // Pricing
  'pricing|price|cost|how much': "Our pricing:\n• Starter: $1,499/month (160 hrs)\n• Professional: $1,899/month (160 hrs) ⭐ Most Popular\n• Enterprise: Custom pricing\n\nAll plans include dedicated VAs and bilingual support!",
  
  // Contact
  'contact|email|phone|call|reach': "You can reach us:\n📞 Phone: +1 844-702-2202\n📧 Email: hello@creedava.com\n🌎 Based in Belize, serving worldwide\n\nWould you like to schedule a consultation?",
  
  // Real Estate
  'real estate|realtor|property': "Our Real Estate Support includes:\n• Commission reconciliation\n• Lead qualification\n• Transaction pipeline management\n• Sales outreach\n• Book of business servicing",
  
  // Technology
  'technology|tech|it|developer|website': "Our Technology Support includes:\n• Tier 1/2 tech support\n• Scrum product development\n• IT project management\n• Website development\n• Database management\n• Product testing",
  
  // Bilingual
  'bilingual|spanish|language': "Yes! Our VAs are fluent in both English and Spanish. Belize is the only English-speaking country in Central America, giving our team unique multilingual capabilities.",
  
  // Start/Book
  'get started|book|schedule|appointment|consultation': "Great! You can schedule a free consultation:\n1. Visit our Contact page\n2. Call us at +1 844-702-2202\n3. Email hello@creedava.com\n\nWe typically respond within 24 hours!",
}

const findResponse = (input: string): string => {
  const lowerInput = input.toLowerCase()
  
  for (const [keywords, response] of Object.entries(KNOWLEDGE_BASE)) {
    const patterns = keywords.split('|')
    if (patterns.some(pattern => lowerInput.includes(pattern))) {
      return response
    }
  }
  
  return "I'm here to help! You can ask me about:\n• Our services\n• Pricing plans\n• Contact information\n• Real estate support\n• Technology support\n\nOr feel free to reach us directly at hello@creedava.com or +1 844-702-2202"
}

export const ChatBot = memo(() => {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Memoize initial messages to prevent re-creation
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      role: 'assistant',
      content: "Hi! I'm CreedaVA's assistant. How can I help you learn about our virtual assistant services today?",
    },
  ])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Reduced delay for better performance
    setTimeout(() => {
      const response = findResponse(userMessage.content)
      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 300)
  }, [input, isLoading])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }, [sendMessage])

  const handleOpen = useCallback(() => setIsOpen(true), [])
  const handleClose = useCallback(() => setIsOpen(false), [])
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }, [])

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={handleOpen}
              size="lg"
              className="h-16 w-16 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-2xl hover:shadow-accent/50 transition-all duration-200 hover:scale-105"
            >
              <ChatCircle size={28} weight="fill" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-3rem)]"
          >
            <Card className="shadow-2xl border-2 border-accent/20">
              <CardHeader className="bg-primary text-primary-foreground flex flex-row items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-accent rounded-full p-2">
                    <Robot size={24} weight="fill" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">CreedaVA Assistant</CardTitle>
                    <p className="text-xs text-primary-foreground/80">Online</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <X size={20} />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {/* Messages Area */}
                <ScrollArea className="h-[400px] p-4" ref={scrollRef}>
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            message.role === 'user'
                              ? 'bg-accent text-accent-foreground'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted text-foreground rounded-lg px-4 py-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-accent rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-accent rounded-full animate-bounce"
                              style={{ animationDelay: '0.2s' }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-accent rounded-full animate-bounce"
                              style={{ animationDelay: '0.4s' }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about our services..."
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!input.trim() || isLoading}
                      size="icon"
                      className="bg-accent hover:bg-accent/90 text-accent-foreground"
                    >
                      <PaperPlaneRight size={20} weight="fill" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Quick AI responses • For detailed help, contact us!
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
})

ChatBot.displayName = 'ChatBot'
