import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Briefcase,
  ChartLineUp,
  ArrowRight,
  Star,
  ClipboardText,
  ChatCircle,
  ShoppingCart,
  Article,
  UserCircle,
  Quotes,
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'

export function Home() {
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
      quote: "CreedaVA has been instrumental in helping us scale our operations. Their VAs are professional, proactive, and feel like true members of our team.",
      author: "Sarah Johnson",
      role: "CEO, TechStart Inc",
      rating: 5,
    },
    {
      quote: "The quality of work and attention to detail is outstanding. We've been able to focus on growing our business while CreedaVA handles the day-to-day operations.",
      author: "Michael Chen",
      role: "Founder, GrowthLabs",
      rating: 5,
    },
    {
      quote: "Best decision we made this year. Our CreedaVA assistant has saved us countless hours and brought organization to our chaos.",
      author: "Emily Rodriguez",
      role: "COO, Marketplace Pro",
      rating: 5,
    },
  ]

  const stats = [
    { value: '5+', label: 'Years Experience' },
    { value: '98%', label: 'Client Satisfaction' },
    { value: '<24h', label: 'Response Time' },
    { value: '24/7', label: 'Support Available' },
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
              Your Trusted Virtual Assistant Partner
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
              Scale Your Business with
              <br />
              <span className="text-accent">Elite Virtual Assistants</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Professional remote support tailored to your needs. Bilingual assistants available. 
              From executive assistance to specialized tasks, we help ambitious teams achieve more.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                asChild
                size="lg"
                className="bg-accent hover:bg-accent/90 text-white px-8 group shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Link to="/contact">
                  Start Your Free Consultation
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="px-8 hover:bg-accent/10 hover:border-accent transition-all duration-300"
              >
                <Link to="/services">Explore Services</Link>
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

      <section className="py-24 px-4">
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
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
              >
                <Card className="h-full hover:shadow-xl hover:border-accent/50 transition-all duration-300 border-border/50 cursor-pointer group">
                  <CardHeader>
                    <div className="mb-4 transition-transform group-hover:scale-110 duration-300">{service.icon}</div>
                    <CardTitle className="text-xl group-hover:text-accent transition-colors">{service.title}</CardTitle>
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

          <div className="text-center mt-12">
            <Button asChild size="lg" variant="outline" className="hover:bg-accent/10 hover:border-accent transition-all duration-300">
              <Link to="/services">View All Services</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-primary/5">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-6 bg-accent/10 text-accent border-accent/20" variant="outline">
              Simple Process
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started with your dedicated virtual assistant in just a few simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Free Consultation',
                description: 'Schedule a discovery call to discuss your needs, goals, and the type of support that would benefit your business most.',
              },
              {
                step: '02',
                title: 'Perfect Match',
                description: 'We carefully match you with a virtual assistant whose skills, experience, and personality align with your requirements.',
              },
              {
                step: '03',
                title: 'Start Growing',
                description: 'Your VA hits the ground running. We provide onboarding support and ongoing management to ensure success.',
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
                <div className="text-7xl font-bold text-accent/10 absolute -top-4 -left-2">{item.step}</div>
                <Card className="relative z-10 h-full hover:shadow-lg transition-shadow border-border/50">
                  <CardHeader>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-white px-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Link to="/contact">Get Started Today</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">What Our Clients Say</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See what our satisfied clients have to say about working with CreedaVA
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

      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about working with CreedaVA
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="bg-background border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:text-accent transition-colors">
                  What services do CreedaVA virtual assistants provide?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Our virtual assistants provide a wide range of services including executive support, administrative tasks, 
                  customer service, e-commerce support, content and social media management, and project coordination. We tailor 
                  our services to match your specific business needs.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="bg-background border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:text-accent transition-colors">
                  Why choose Belizean virtual assistants?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Belize is the only English-speaking country in Central America, offering the perfect combination of native English 
                  proficiency, Spanish fluency, and cultural adaptability. Our team operates in Central Standard Time (CST), making 
                  real-time collaboration with North American businesses seamless. You get world-class talent at competitive rates.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="bg-background border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:text-accent transition-colors">
                  How quickly can I get started?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  After your initial consultation, we typically match you with a virtual assistant within 3-5 business days. 
                  We then facilitate an onboarding session to ensure a smooth transition and optimal workflow from day one.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="bg-background border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:text-accent transition-colors">
                  What if I'm not satisfied with my virtual assistant?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Client satisfaction is our top priority. If you're not completely satisfied, we'll work with you to address concerns 
                  or match you with a different assistant at no additional cost. We stand behind our 98% client satisfaction rate.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="bg-background border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:text-accent transition-colors">
                  Are your virtual assistants bilingual?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Yes! Most of our virtual assistants are fluent in both English and Spanish, allowing them to serve diverse markets 
                  and handle multilingual customer support, content creation, and business operations.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="bg-background border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:text-accent transition-colors">
                  How do you ensure data security and confidentiality?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  We take security seriously. All our virtual assistants sign comprehensive NDAs, and we implement industry-standard 
                  security protocols including secure file sharing, encrypted communications, and regular security training. Your 
                  business information remains completely confidential.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              Ready to Scale Your Business?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Let's discuss how our virtual assistants can help you focus on what matters most.
            </p>
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-white px-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Link to="/contact">Schedule Free Consultation</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
