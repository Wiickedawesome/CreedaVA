import { useState, useEffect, useRef } from 'react'
import { CreateMLCEngine, MLCEngine } from '@mlc-ai/web-llm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatCircle, X, PaperPlaneRight, Robot } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

const SYSTEM_PROMPT = `You are a helpful virtual assistant for CreedaVA (Creeda Virtual Assistants), a professional virtual assistant service company. 

Key Information about CreedaVA:

SERVICES:
- Executive Support: Calendar management, travel coordination, meeting scheduling, inbox organization
- Administrative Tasks: Data entry, document preparation, file management
- Customer Service: Email/chat support, customer inquiries, order processing
- E-commerce Support: Product listing, inventory management, order fulfillment
- Content & Social Media: Content scheduling, social media management, blog posting
- Insurance Support: Policy administration, claims assistance, client communications
- Real Estate Support: Commission reconciliation, lead qualification, transaction pipeline management, sales outreach, servicing book of business
- Technology Support: Tier 1/2 tech support, Scrum product development, IT project management, website development, database management, product testing
- Bookkeeping Support: Invoice preparation, expense categorization, payment follow-ups

PRICING:
- Starter Plan: $1,499/month for 160 hours/month (full-time dedicated VA)
- Professional Plan: $1,899/month for 160 hours/month (senior VA with specialized expertise) - MOST POPULAR
- Enterprise Plan: Custom pricing for custom hours (multiple VAs, 24/7 support)

CONTACT:
- Phone: +1 844-702-2202
- Email: hello@creedava.com
- Location: Based in Belize, operating in CST (UTC-6)
- Bilingual support available (English/Spanish)

COMPANY INFO:
- Founded: 2023
- 98% client satisfaction rate
- Response time: <24 hours
- 24/7 support available
- Based in Belize (only English-speaking country in Central America)

Be friendly, helpful, and professional. If asked about scheduling, direct users to contact them or visit their website. Keep responses concise and helpful.`

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [engine, setEngine] = useState<MLCEngine | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [initProgress, setInitProgress] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const initializeEngine = async () => {
    if (engine) return

    setIsInitializing(true)
    setInitProgress('Loading AI model...')

    try {
      const mlcEngine = await CreateMLCEngine('Llama-3.1-8B-Instruct-q4f32_1-MLC', {
        initProgressCallback: (progress) => {
          setInitProgress(progress.text)
        },
      })

      setEngine(mlcEngine)
      setIsInitializing(false)
      setInitProgress('')

      // Send welcome message
      setMessages([
        {
          role: 'assistant',
          content: "Hi! I'm CreedaVA's AI assistant. How can I help you learn about our virtual assistant services today?",
        },
      ])
    } catch (error) {
      console.error('Failed to initialize engine:', error)
      setIsInitializing(false)
      setInitProgress('Failed to load AI. Please refresh and try again.')
    }
  }

  const handleOpen = () => {
    setIsOpen(true)
    if (!engine && !isInitializing) {
      initializeEngine()
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || !engine || isLoading) return

    const userMessage: Message = { role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const conversationHistory = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map((msg) => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: userMessage.content },
      ]

      const reply = await engine.chat.completions.create({
        messages: conversationHistory as any,
        temperature: 0.7,
        max_tokens: 500,
      })

      const assistantMessage: Message = {
        role: 'assistant',
        content: reply.choices[0].message.content || 'Sorry, I had trouble generating a response.',
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

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
              className="h-16 w-16 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-2xl hover:shadow-accent/50 transition-all duration-300 hover:scale-110"
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
                    <p className="text-xs text-primary-foreground/80">
                      {isInitializing ? 'Initializing...' : 'Online'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <X size={20} />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {/* Messages Area */}
                <ScrollArea className="h-[400px] p-4" ref={scrollRef}>
                  {isInitializing ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
                      <p className="text-sm text-muted-foreground text-center px-4">
                        {initProgress}
                      </p>
                      <p className="text-xs text-muted-foreground text-center px-4">
                        First load may take a minute...
                      </p>
                    </div>
                  ) : (
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
                  )}
                </ScrollArea>

                {/* Input Area */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about our services..."
                      disabled={isInitializing || isLoading}
                      className="flex-1"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!input.trim() || isInitializing || isLoading}
                      size="icon"
                      className="bg-accent hover:bg-accent/90 text-accent-foreground"
                    >
                      <PaperPlaneRight size={20} weight="fill" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Powered by Llama AI • Running in your browser
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
