import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { EnvelopeSimple, Calendar, MapPin, Phone } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export function Contact() {
  const handleContactSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData)
    console.log('Contact form submitted:', data)
    toast.success('Thank you! We\'ll be in touch within 24 hours.')
    e.currentTarget.reset()
  }

  const contactMethods = [
    {
      icon: <EnvelopeSimple className="text-accent" size={24} />,
      title: 'Email Us',
      detail: 'hello@creedava.com',
      link: 'mailto:hello@creedava.com',
    },
    {
      icon: <Phone className="text-accent" size={24} />,
      title: 'Call Us',
      detail: '+1 (555) 123-4567',
      link: 'tel:+15551234567',
    },
    {
      icon: <Calendar className="text-accent" size={24} />,
      title: 'Business Hours',
      detail: 'Mon-Fri 9am-6pm EST',
      link: null,
    },
    {
      icon: <MapPin className="text-accent" size={24} />,
      title: 'Location',
      detail: 'Serving clients worldwide',
      link: null,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background -z-10" />
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Badge className="mb-6 bg-accent/10 text-accent border-accent/20" variant="outline">
              Let's Connect
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
              Get in <span className="text-accent">Touch</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Ready to transform your business with expert virtual assistance? Fill out the form below
              and we'll schedule your free consultation.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-5 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-2 space-y-8"
            >
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-4">We're Here to Help</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Have questions about our services? Want to discuss your specific needs? Our team is ready
                  to provide the answers and guidance you need to get started.
                </p>
              </div>

              <div className="space-y-6">
                {contactMethods.map((method, index) => (
                  <motion.div
                    key={method.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                      {method.icon}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground mb-1">{method.title}</div>
                      {method.link ? (
                        <a
                          href={method.link}
                          className="text-accent hover:underline"
                        >
                          {method.detail}
                        </a>
                      ) : (
                        <div className="text-muted-foreground">{method.detail}</div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="pt-6">
                <h3 className="font-semibold text-foreground mb-3">What Happens Next?</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-accent font-bold">1.</span>
                    <span>We'll review your inquiry within 24 hours</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent font-bold">2.</span>
                    <span>Schedule a free consultation call</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent font-bold">3.</span>
                    <span>Discuss your needs and receive a custom proposal</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent font-bold">4.</span>
                    <span>Get matched with your perfect virtual assistant</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="lg:col-span-3"
            >
              <Card className="border-border/50">
                <CardContent className="pt-8">
                  <form onSubmit={handleContactSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input id="name" name="name" required placeholder="John Doe" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input id="email" name="email" type="email" required placeholder="john@company.com" />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input id="company" name="company" placeholder="Your Company" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" name="phone" type="tel" placeholder="+1 (555) 123-4567" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="service">What services are you interested in?</Label>
                      <Input
                        id="service"
                        name="service"
                        placeholder="e.g., Executive Support, Customer Service"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Tell us about your needs *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        required
                        rows={5}
                        placeholder="What tasks would you like assistance with? What are your main challenges?"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-white" size="lg">
                      <EnvelopeSimple className="mr-2" size={20} />
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Prefer to Chat Live?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Our team is available during business hours to answer your questions and help you get started.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-white">
                <a href="mailto:hello@creedava.com">Email Us Directly</a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="tel:+15551234567">Call Now</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
