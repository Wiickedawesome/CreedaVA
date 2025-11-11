import { useState } from 'react';
import { motion } from 'framer-motion';
import { Envelope, MapPin, Calendar, Phone, EnvelopeSimple, Clock, User } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { CreedaLogo } from '@/components/CreedaLogo';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface FormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  service: string;
  message: string;
}

interface BookingData {
  name: string;
  email: string;
  phone: string;
  company: string;
  service: string;
  hasProvider: string;
  currentProvider: string;
  date: string;
  time: string;
  timezone: string;
  notes: string;
}

export default function Contact() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    service: '',
    message: ''
  });

  const [bookingData, setBookingData] = useState<BookingData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    service: '',
    hasProvider: '',
    currentProvider: '',
    date: '',
    time: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    notes: ''
  });

  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBookingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Store form data
    localStorage.setItem('contactSubmission', JSON.stringify({
      ...formData,
      timestamp: new Date().toISOString()
    }));
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      service: '',
      message: ''
    });
    
    alert('Thank you! Your message has been received.');
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse the selected date and time
    const [year, month, day] = bookingData.date.split('-');
    const [hour, minute] = bookingData.time.split(':');
    
    // Create start time
    const startDateTime = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute)
    );
    
    // Create end time (30 minutes later)
    const endDateTime = new Date(startDateTime.getTime() + 30 * 60000);
    
    // Format for Google Calendar URL
    const formatGoogleDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    // Build description with all details
    const description = `
Consultation Call Details:
------------------------
Name: ${bookingData.name}
Email: ${bookingData.email}
Phone: ${bookingData.phone}
Company: ${bookingData.company}
Service Interested: ${bookingData.service}
Has Current Provider: ${bookingData.hasProvider}
${bookingData.currentProvider ? `Current Provider: ${bookingData.currentProvider}` : ''}

Additional Notes:
${bookingData.notes || 'None'}
    `.trim();

    // Create Google Calendar event URL
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Consultation Call - ' + bookingData.name)}&dates=${formatGoogleDate(startDateTime)}/${formatGoogleDate(endDateTime)}&details=${encodeURIComponent(description)}&location=Phone Call&add=${encodeURIComponent('hello@creedava.com')}&add=${encodeURIComponent(bookingData.email)}`;

    // Store booking data
    localStorage.setItem('bookingSubmission', JSON.stringify({
      ...bookingData,
      timestamp: new Date().toISOString()
    }));

    // Open Google Calendar in new tab
    window.open(calendarUrl, '_blank');

    // Send email notification to hello@creedava.com
    const mailtoLink = `mailto:hello@creedava.com?subject=New Consultation Booking - ${bookingData.name}&body=Name: ${bookingData.name}%0D%0AEmail: ${bookingData.email}%0D%0APhone: ${bookingData.phone}%0D%0ACompany: ${bookingData.company}%0D%0AService: ${bookingData.service}%0D%0AHas Provider: ${bookingData.hasProvider}%0D%0ACurrent Provider: ${bookingData.currentProvider}%0D%0ADate: ${bookingData.date}%0D%0ATime: ${bookingData.time} ${bookingData.timezone}%0D%0ANotes: ${bookingData.notes}`;
    
    window.location.href = mailtoLink;

    // Reset form
    setBookingData({
      name: '',
      email: '',
      phone: '',
      company: '',
      service: '',
      hasProvider: '',
      currentProvider: '',
      date: '',
      time: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      notes: ''
    });

    setIsBookingOpen(false);
    
    setTimeout(() => {
      alert('Booking request sent! The calendar event has been created. Please check your email for confirmation.');
    }, 500);
  };

  // Generate available time slots (8 AM - 6 PM CST in 30-min intervals)
  const timeSlots: { value: string; label: string }[] = [];
  for (let hour = 8; hour < 18; hour++) {
    for (let min of [0, 30]) {
      const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      const displayTime = new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      timeSlots.push({ value: time, label: displayTime });
    }
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-background">
      <section className="relative py-32 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-50 via-white to-green-50 -z-10" />
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              Let's <span className="text-primary">Connect</span>
            </h1>
            <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed text-muted-foreground">
              Have questions about our services? Want to discuss your specific needs? 
              Our team is ready to help you achieve your goals.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="border-border shadow-lg">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-6 text-foreground">Send us a message</h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="name" className="text-foreground">Full Name *</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="mt-2"
                          placeholder="John Smith"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email" className="text-foreground">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="mt-2"
                          placeholder="john@company.com"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="phone" className="text-foreground">Phone</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="mt-2"
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="company" className="text-foreground">Company</Label>
                        <Input
                          id="company"
                          name="company"
                          value={formData.company}
                          onChange={handleInputChange}
                          className="mt-2"
                          placeholder="Your company name"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="service" className="text-foreground">What services are you interested in?</Label>
                      <select
                        id="service"
                        name="service"
                        value={formData.service}
                        onChange={handleInputChange}
                        className="mt-2 w-full px-3 py-2 border border-input rounded-md bg-background focus:border-primary focus:ring-primary"
                      >
                        <option value="">Select a service</option>
                        <option value="executive-assistance">Executive Assistance</option>
                        <option value="administrative-tasks">Administrative Tasks</option>
                        <option value="customer-service">Customer Service</option>
                        <option value="real-estate-support">Real Estate Support</option>
                        <option value="technology-support">Technology Support</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="message" className="text-foreground">Message *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        rows={6}
                        className="mt-2"
                        placeholder="Tell us about your project or requirements..."
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" 
                      size="lg"
                    >
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <h3 className="text-xl font-semibold text-foreground mb-6">Get in Touch</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <EnvelopeSimple size={24} className="text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Email</h4>
                      <a href="mailto:hello@creedava.com" className="text-primary hover:text-primary/80 transition-colors">
                        hello@creedava.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Phone size={24} className="text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Phone</h4>
                      <a href="tel:+18447022202" className="text-primary hover:text-primary/80 transition-colors">
                        +1 (844) 702-2202
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <MapPin size={24} className="text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Location</h4>
                      <p className="text-muted-foreground">Remote Services Worldwide</p>
                      <p className="text-sm text-muted-foreground mt-1">Operating from CST (UTC-6)</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <h3 className="text-xl font-semibold text-foreground mb-6">Business Hours</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monday - Friday</span>
                    <span className="text-foreground">8:00 AM - 6:00 PM CST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Saturday</span>
                    <span className="text-foreground">9:00 AM - 2:00 PM CST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sunday</span>
                    <span className="text-foreground">Closed</span>
                  </div>
                </div>
              </motion.div>

              <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full hover:bg-primary/10 hover:border-primary transition-all duration-300"
                    size="lg"
                  >
                    <Calendar className="mr-2" size={20} />
                    Book a Call Directly
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">Schedule a Consultation</DialogTitle>
                    <DialogDescription>
                      Book a call with our team. We'll add it to our calendar and send you confirmation.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleBookingSubmit} className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="booking-name">Full Name *</Label>
                        <div className="relative mt-2">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                          <Input
                            id="booking-name"
                            name="name"
                            value={bookingData.name}
                            onChange={handleBookingChange}
                            required
                            className="pl-10"
                            placeholder="John Smith"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="booking-company">Company Name *</Label>
                        <Input
                          id="booking-company"
                          name="company"
                          value={bookingData.company}
                          onChange={handleBookingChange}
                          required
                          className="mt-2"
                          placeholder="Your Company"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="booking-email">Email *</Label>
                        <div className="relative mt-2">
                          <EnvelopeSimple className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                          <Input
                            id="booking-email"
                            name="email"
                            type="email"
                            value={bookingData.email}
                            onChange={handleBookingChange}
                            required
                            className="pl-10"
                            placeholder="john@company.com"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="booking-phone">Phone *</Label>
                        <div className="relative mt-2">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                          <Input
                            id="booking-phone"
                            name="phone"
                            type="tel"
                            value={bookingData.phone}
                            onChange={handleBookingChange}
                            required
                            className="pl-10"
                            placeholder="+1 (555) 000-0000"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="booking-service">Service Interested In *</Label>
                      <select
                        id="booking-service"
                        name="service"
                        value={bookingData.service}
                        onChange={handleBookingChange}
                        required
                        className="mt-2 w-full px-3 py-2 border border-input rounded-md bg-background focus:border-primary focus:ring-primary"
                      >
                        <option value="">Select a service</option>
                        <option value="Executive Assistance">Executive Assistance</option>
                        <option value="Administrative Tasks">Administrative Tasks</option>
                        <option value="Customer Service">Customer Service</option>
                        <option value="Real Estate Support">Real Estate Support</option>
                        <option value="Technology Support">Technology Support</option>
                        <option value="Multiple Services">Multiple Services</option>
                        <option value="Not Sure Yet">Not Sure Yet</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="booking-hasProvider">Do you currently have a VA provider? *</Label>
                      <select
                        id="booking-hasProvider"
                        name="hasProvider"
                        value={bookingData.hasProvider}
                        onChange={handleBookingChange}
                        required
                        className="mt-2 w-full px-3 py-2 border border-input rounded-md bg-background focus:border-primary focus:ring-primary"
                      >
                        <option value="">Select an option</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    {bookingData.hasProvider === 'Yes' && (
                      <div>
                        <Label htmlFor="booking-currentProvider">Current Provider Name</Label>
                        <Input
                          id="booking-currentProvider"
                          name="currentProvider"
                          value={bookingData.currentProvider}
                          onChange={handleBookingChange}
                          className="mt-2"
                          placeholder="Provider name"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="booking-date">Preferred Date *</Label>
                        <div className="relative mt-2">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                          <Input
                            id="booking-date"
                            name="date"
                            type="date"
                            min={today}
                            value={bookingData.date}
                            onChange={handleBookingChange}
                            required
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="booking-time">Preferred Time *</Label>
                        <div className="relative mt-2">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10" size={18} />
                          <select
                            id="booking-time"
                            name="time"
                            value={bookingData.time}
                            onChange={handleBookingChange}
                            required
                            className="w-full pl-10 pr-3 py-2 border border-input rounded-md bg-background focus:border-primary focus:ring-primary"
                          >
                            <option value="">Select time</option>
                            {timeSlots.map(slot => (
                              <option key={slot.value} value={slot.value}>
                                {slot.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="booking-timezone">Timezone</Label>
                      <Input
                        id="booking-timezone"
                        name="timezone"
                        value={bookingData.timezone}
                        onChange={handleBookingChange}
                        className="mt-2"
                        placeholder="America/Chicago"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Detected: {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
                    </div>

                    <div>
                      <Label htmlFor="booking-notes">Additional Notes</Label>
                      <Textarea
                        id="booking-notes"
                        name="notes"
                        value={bookingData.notes}
                        onChange={handleBookingChange}
                        rows={3}
                        className="mt-2"
                        placeholder="Anything specific you'd like to discuss?"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsBookingOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        Schedule Call
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-foreground mb-12">
              How We <span className="text-primary">Work Together</span>
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: '1',
                  title: 'Initial Consultation',
                  description: "We'll review your inquiry within 24 hours and schedule a consultation to understand your needs."
                },
                {
                  step: '2', 
                  title: 'Custom Proposal',
                  description: 'Based on our discussion, we create a tailored service plan that fits your requirements and budget.'
                },
                {
                  step: '3',
                  title: 'Get Started',
                  description: 'Once approved, we begin working together to streamline your operations and achieve your goals.'
                }
              ].map((item) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: parseInt(item.step) * 0.2 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
