import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  Briefcase,
  ChartLineUp,
  CheckCircle,
  EnvelopeSimple,
  List,
  Phone,
  Calendar,
  UsersThree,
  ClipboardText,
  ChatCircle,
  ShoppingCart,
  Article,
  UserCircle,
  ArrowRight,
  Star,
  Quotes,
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

function App() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setIsMenuOpen(false)
    }
  }

  const handleContactSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData)
    console.log('Contact form submitted:', data)
    toast.success('Thank you! We\'ll be in touch within 24 hours.')
    e.currentTarget.reset()
  }

  const services = [
    {
      icon: <Briefcase className="text-accent" size={32} />,
      title: 'Executive Support',
      description: 'Calendar management, travel coordination, meeting scheduling, and inbox organization for busy executives.',
    },
    {
      icon: <ClipboardText className="text-accent" size={32} />,
      title: 'Administrative Tasks',
      description: 'Data entry, document preparation, file management, and general administrative support.',
    },
    {
      icon: <ChatCircle className="text-accent" size={32} />,
      title: 'Customer Service',
      description: 'Email and chat support, customer inquiries, order processing, and client communication.',
    },
    {
      icon: <ShoppingCart className="text-accent" size={32} />,
      title: 'E-commerce Support',
      description: 'Product listing, inventory management, order fulfillment, and marketplace optimization.',
    },
    {
      icon: <Article className="text-accent" size={32} />,
      title: 'Content & Social Media',
      description: 'Content scheduling, social media management, blog posting, and community engagement.',
    },
    {
      icon: <ChartLineUp className="text-accent" size={32} />,
      title: 'Project Coordination',
      description: 'Task tracking, team coordination, deadline management, and project documentation.',
    },
  ]

  const testimonials = [
    {
      quote: "CreedAVA has been instrumental in helping us scale our operations. Their VAs are professional, proactive, and feel like true members of our team.",
      author: "Sarah Johnson",
      role: "CEO, TechStart Inc",
      rating: 5,
    },
    {
      quote: "The quality of work and attention to detail is outstanding. We've been able to focus on growing our business while CreedAVA handles the day-to-day operations.",
      author: "Michael Chen",
      role: "Founder, GrowthLabs",
      rating: 5,
    },
    {
      quote: "Best decision we made this year. Our CreedAVA assistant has saved us countless hours and brought organization to our chaos.",
      author: "Emily Rodriguez",
      role: "COO, Marketplace Pro",
      rating: 5,
    },
  ]

  const plans = [
    {
      name: 'Starter',
      hours: '20 hours/month',
      price: 'Starting at $600',
      features: [
        'Dedicated virtual assistant',
        'Email & chat support',
        'Basic task management',
        'Monthly reporting',
        'Flexible scheduling',
      ],
      popular: false,
    },
    {
      name: 'Professional',
      hours: '80 hours/month',
      price: 'Starting at $2,200',
      features: [
        'Dedicated senior VA',
        'Priority support',
        'Advanced task management',
        'Weekly sync meetings',
        'Process documentation',
        'Team collaboration tools',
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      hours: 'Custom hours',
      price: 'Custom pricing',
      features: [
        'Multiple VAs & specialists',
        '24/7 support available',
        'Account manager',
        'Custom workflows',
        'Dedicated team lead',
        'SLA guarantees',
        'Integration support',
      ],
      popular: false,
    },
  ]

  const stats = [
    { value: '500+', label: 'Clients Served' },
    { value: '98%', label: 'Client Satisfaction' },
    { value: '50k+', label: 'Hours Completed' },
    { value: '24/7', label: 'Support Available' },
  ]

  const navLinks = [
    { label: 'Services', id: 'services' },
    { label: 'How It Works', id: 'how-it-works' },
    { label: 'Pricing', id: 'pricing' },
    { label: 'Testimonials', id: 'testimonials' },
    { label: 'Contact', id: 'contact' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-background/95 backdrop-blur-sm shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-bold text-primary"
            >
              CreedAVA
            </motion.div>

            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className="text-foreground hover:text-accent transition-colors font-medium"
                >
                  {link.label}
                </button>
              ))}
              <Button onClick={() => scrollToSection('contact')} className="bg-accent hover:bg-accent/90">
                Get Started
              </Button>
            </nav>

            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <List size={24} />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <nav className="flex flex-col gap-4 mt-8">
                  {navLinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => scrollToSection(link.id)}
                      className="text-left text-lg font-medium text-foreground hover:text-accent transition-colors"
                    >
                      {link.label}
                    </button>
                  ))}
                  <Button onClick={() => scrollToSection('contact')} className="bg-accent hover:bg-accent/90 mt-4">
                    Get Started
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

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
              Trusted by 500+ Businesses Worldwide
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
              Scale Your Business with
              <br />
              <span className="text-accent">Elite Virtual Assistants</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Professional remote support tailored to your needs. From executive assistance to specialized tasks,
              we help ambitious teams achieve more.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => scrollToSection('contact')}
                size="lg"
                className="bg-accent hover:bg-accent/90 text-white px-8 group"
              >
                Start Your Free Consultation
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
              </Button>
              <Button
                onClick={() => scrollToSection('services')}
                size="lg"
                variant="outline"
                className="px-8"
              >
                Explore Services
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-accent mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">Our Services</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive virtual assistant services designed to free up your time and accelerate growth
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow border-border/50">
                  <CardHeader>
                    <div className="mb-4">{service.icon}</div>
                    <CardTitle className="text-xl">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {service.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started with your dedicated virtual assistant in three simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Discovery Call',
                description: 'We discuss your needs, challenges, and goals to find the perfect match for your business.',
                icon: <Phone size={32} className="text-accent" />,
              },
              {
                step: '02',
                title: 'Meet Your VA',
                description: 'Get introduced to your carefully selected virtual assistant and establish workflows.',
                icon: <UsersThree size={32} className="text-accent" />,
              },
              {
                step: '03',
                title: 'Scale & Succeed',
                description: 'Focus on high-value work while your VA handles tasks efficiently and professionally.',
                icon: <ChartLineUp size={32} className="text-accent" />,
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <Card className="h-full border-border/50">
                  <CardHeader>
                    <div className="text-6xl font-bold text-accent/20 mb-4">{item.step}</div>
                    <div className="mb-4">{item.icon}</div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {item.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">Flexible Pricing Plans</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your needs. All plans include a dedicated VA and can be customized.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`h-full relative ${plan.popular ? 'border-accent shadow-lg scale-105' : 'border-border/50'}`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-accent text-white">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="text-lg font-semibold text-foreground mt-2">
                      {plan.hours}
                    </CardDescription>
                    <div className="text-3xl font-bold text-accent mt-4">{plan.price}</div>
                  </CardHeader>
                  <CardContent>
                    <Separator className="mb-6" />
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <CheckCircle className="text-accent flex-shrink-0 mt-0.5" size={20} weight="fill" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => scrollToSection('contact')}
                      className={`w-full mt-6 ${
                        plan.popular
                          ? 'bg-accent hover:bg-accent/90 text-white'
                          : 'bg-primary hover:bg-primary/90'
                      }`}
                    >
                      Get Started
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">What Our Clients Say</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join hundreds of satisfied clients who have transformed their business with CreedAVA
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow border-border/50">
                  <CardHeader>
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="text-accent" size={20} weight="fill" />
                      ))}
                    </div>
                    <Quotes className="text-accent/30" size={32} />
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-6 leading-relaxed italic">
                      "{testimonial.quote}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                        <UserCircle className="text-accent" size={32} />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{testimonial.author}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">Get Started Today</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ready to scale your business? Fill out the form below and we'll schedule your free consultation.
            </p>
          </motion.div>

          <Card className="border-border/50">
            <CardContent className="pt-6">
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
                  <Label htmlFor="message">Tell us about your needs *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    placeholder="What tasks would you like assistance with?"
                  />
                </div>
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-white" size="lg">
                  <EnvelopeSimple className="mr-2" size={20} />
                  Send Message
                </Button>
              </form>

              <Separator className="my-8" />

              <div className="grid md:grid-cols-2 gap-6 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <EnvelopeSimple className="text-accent" size={24} />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Email Us</div>
                    <a href="mailto:hello@creedava.com" className="text-accent hover:underline">
                      hello@creedava.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="text-accent" size={24} />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Schedule a Call</div>
                    <div className="text-muted-foreground">Available Mon-Fri 9am-6pm EST</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="bg-primary text-primary-foreground py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">CreedAVA</h3>
              <p className="text-primary-foreground/80 text-sm">
                Professional virtual assistant services for ambitious businesses worldwide.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/80">
                <li>Executive Support</li>
                <li>Administrative Tasks</li>
                <li>Customer Service</li>
                <li>E-commerce Support</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/80">
                <li>
                  <button onClick={() => scrollToSection('services')} className="hover:text-white transition-colors">
                    Services
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors">
                    Pricing
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('testimonials')} className="hover:text-white transition-colors">
                    Testimonials
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('contact')} className="hover:text-white transition-colors">
                    Contact
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/80">
                <li>hello@creedava.com</li>
                <li>Available 24/7</li>
              </ul>
            </div>
          </div>
          <Separator className="bg-primary-foreground/20 mb-8" />
          <div className="text-center text-sm text-primary-foreground/80">
            © {new Date().getFullYear()} CreedAVA. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App