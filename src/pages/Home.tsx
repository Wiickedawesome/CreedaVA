import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
    { value: '500+', label: 'Clients Served' },
    { value: '98%', label: 'Client Satisfaction' },
    { value: '50k+', label: 'Hours Completed' },
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
                asChild
                size="lg"
                className="bg-accent hover:bg-accent/90 text-white px-8 group"
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
                className="px-8"
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

          <div className="text-center mt-12">
            <Button asChild size="lg" variant="outline">
              <Link to="/services">View All Services</Link>
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
              Join hundreds of satisfied clients who have transformed their business with CreedaVA
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
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-white px-8">
              <Link to="/contact">Schedule Free Consultation</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
