import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Phone, EnvelopeSimple, Clock, User } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { CreedaLogo } from '@/components/CreedaLogo';
import { submitContactForm, trackButtonClick } from '@/lib/tracking';
import { SEO, seoData } from '@/components/SEO';
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
  const { t } = useTranslation();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Submit to Cosmos DB via Azure Function
      const result = await submitContactForm({
        name: formData.name,
        email: formData.email,
        company: formData.company,
        phone: formData.phone,
        message: formData.message,
        service: formData.service
      });

      if (result.success) {
        // Also store in localStorage as backup
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
        
        alert(result.message || t('contact.form.successMessage'));
      } else {
        alert(t('contact.form.errorMessage'));
      }
    } catch (_error) {
      console.error('Error submitting form:', _error);
      alert(t('contact.form.errorMessage'));
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Submit booking to API
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/submitBooking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Success - show confirmation
        alert(result.message + '\n\nBooking ID: ' + result.bookingId);
        
        // Store booking ID locally
        localStorage.setItem('lastBookingId', result.bookingId);
      } else {
        // Error from API
        alert(t('contact.booking.errorMessage').replace('hello@creedava.com', result.message || result.error || 'Unknown error'));
        return;
      }
    } catch (_error) {
      console.error('Booking submission error:', _error);
      alert(t('contact.booking.errorMessage'));
      return;
    }

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
      alert(t('contact.booking.successMessage'));
    }, 500);
  };

  // Generate available time slots (8 AM - 6 PM CST in 30-min intervals)
  const timeSlots: { value: string; label: string }[] = [];
  for (let hour = 8; hour < 18; hour++) {
    for (const min of [0, 30]) {
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

  const contactFieldClass = "bg-background text-foreground placeholder:text-muted-foreground border-input focus-visible:border-primary focus-visible:ring-primary/20";

  return (
    <>
      <SEO {...seoData.contact} />
      <div className="min-h-screen bg-background">
      <section className="relative py-32 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-navy-50 via-white to-green-50 -z-10" />
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              {t('contact.title').split(' ')[0]} <span className="text-primary">{t('contact.title').split(' ')[1]}</span>
            </h1>
            <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed text-muted-foreground">
              {t('contact.subtitle')}
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="border-border shadow-lg">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-6 text-foreground">{t('contact.formTitle')}</h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="name" className="text-foreground">{t('contact.form.name')} *</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className={`mt-2 ${contactFieldClass}`}
                          placeholder={t('contact.form.namePlaceholder')}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email" className="text-foreground">{t('contact.form.email')} *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className={`mt-2 ${contactFieldClass}`}
                          placeholder={t('contact.form.emailPlaceholder')}
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="phone" className="text-foreground">{t('contact.form.phone')}</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className={`mt-2 ${contactFieldClass}`}
                          placeholder={t('contact.form.phonePlaceholder')}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="company" className="text-foreground">{t('contact.form.company')}</Label>
                        <Input
                          id="company"
                          name="company"
                          value={formData.company}
                          onChange={handleInputChange}
                          className={`mt-2 ${contactFieldClass}`}
                          placeholder={t('contact.form.companyPlaceholder')}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="service" className="text-foreground">{t('contact.form.service')}</Label>
                      <select
                        id="service"
                        name="service"
                        value={formData.service}
                        onChange={handleInputChange}
                        className="mt-2 w-full px-3 py-2 border border-input rounded-md bg-background focus:border-primary focus:ring-primary"
                      >
                        <option value="">{t('contact.form.servicePlaceholder')}</option>
                        <option value="executive-assistance">{t('contact.form.serviceOptions.executiveAssistance')}</option>
                        <option value="administrative-tasks">{t('contact.form.serviceOptions.administrativeTasks')}</option>
                        <option value="customer-service">{t('contact.form.serviceOptions.customerService')}</option>
                        <option value="real-estate-support">{t('contact.form.serviceOptions.realEstateSupport')}</option>
                        <option value="technology-support">{t('contact.form.serviceOptions.technologySupport')}</option>
                        <option value="other">{t('contact.form.serviceOptions.other')}</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="message" className="text-foreground">{t('contact.form.message')} *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        rows={6}
                        className={`mt-2 ${contactFieldClass}`}
                        placeholder={t('contact.form.messagePlaceholder')}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" 
                      size="lg"
                    >
                      {t('contact.form.submit')}
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
                <h3 className="text-xl font-semibold text-foreground mb-6">{t('contact.info.title')}</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <EnvelopeSimple size={24} className="text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{t('contact.info.email')}</h4>
                      <a href="mailto:hello@creedava.com" className="text-primary hover:text-primary/80 transition-colors">
                        hello@creedava.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Phone size={24} className="text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{t('contact.info.phone')}</h4>
                      <a href="tel:+18447022202" className="text-primary hover:text-primary/80 transition-colors">
                        +1 (844) 702-2202
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <MapPin size={24} className="text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{t('contact.info.location')}</h4>
                      <p className="text-muted-foreground">{t('contact.info.locationText')}</p>
                      <p className="text-sm text-muted-foreground mt-1">{t('contact.info.timezone')}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <h3 className="text-xl font-semibold text-foreground mb-6">{t('contact.info.hours')}</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('contact.info.mondayFriday')}</span>
                    <span className="text-foreground">{t('contact.info.mondayFridayTime')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('contact.info.saturday')}</span>
                    <span className="text-foreground">{t('contact.info.saturdayTime')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('contact.info.sunday')}</span>
                    <span className="text-foreground">{t('contact.info.sundayTime')}</span>
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
                    {t('contact.booking.buttonText')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">{t('contact.booking.title')}</DialogTitle>
                    <DialogDescription>
                      {t('contact.booking.description')}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleBookingSubmit} className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="booking-name">{t('contact.booking.name')} *</Label>
                        <div className="relative mt-2">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                          <Input
                            id="booking-name"
                            name="name"
                            value={bookingData.name}
                            onChange={handleBookingChange}
                            required
                            className={`pl-10 ${contactFieldClass}`}
                            placeholder={t('contact.booking.namePlaceholder')}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="booking-company">{t('contact.booking.company')} *</Label>
                        <Input
                          id="booking-company"
                          name="company"
                          value={bookingData.company}
                          onChange={handleBookingChange}
                          required
                          className={`mt-2 ${contactFieldClass}`}
                          placeholder={t('contact.booking.companyPlaceholder')}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="booking-email">{t('contact.booking.email')} *</Label>
                        <div className="relative mt-2">
                          <EnvelopeSimple className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                          <Input
                            id="booking-email"
                            name="email"
                            type="email"
                            value={bookingData.email}
                            onChange={handleBookingChange}
                            required
                            className={`pl-10 ${contactFieldClass}`}
                            placeholder={t('contact.booking.emailPlaceholder')}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="booking-phone">{t('contact.booking.phone')} *</Label>
                        <div className="relative mt-2">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                          <Input
                            id="booking-phone"
                            name="phone"
                            type="tel"
                            value={bookingData.phone}
                            onChange={handleBookingChange}
                            required
                            className={`pl-10 ${contactFieldClass}`}
                            placeholder={t('contact.booking.phonePlaceholder')}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="booking-service">{t('contact.booking.service')} *</Label>
                      <select
                        id="booking-service"
                        name="service"
                        value={bookingData.service}
                        onChange={handleBookingChange}
                        required
                        className="mt-2 w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:border-primary focus:ring-primary"
                      >
                        <option value="">{t('contact.booking.servicePlaceholder')}</option>
                        <option value="Executive Assistance">{t('contact.booking.serviceOptions.executiveAssistance')}</option>
                        <option value="Administrative Tasks">{t('contact.booking.serviceOptions.administrativeTasks')}</option>
                        <option value="Customer Service">{t('contact.booking.serviceOptions.customerService')}</option>
                        <option value="Real Estate Support">{t('contact.booking.serviceOptions.realEstateSupport')}</option>
                        <option value="Technology Support">{t('contact.booking.serviceOptions.technologySupport')}</option>
                        <option value="Multiple Services">{t('contact.booking.serviceOptions.multipleServices')}</option>
                        <option value="Not Sure Yet">{t('contact.booking.serviceOptions.notSureYet')}</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="booking-hasProvider">{t('contact.booking.hasProvider')} *</Label>
                      <select
                        id="booking-hasProvider"
                        name="hasProvider"
                        value={bookingData.hasProvider}
                        onChange={handleBookingChange}
                        required
                        className="mt-2 w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:border-primary focus:ring-primary"
                      >
                        <option value="">{t('contact.booking.hasProviderPlaceholder')}</option>
                        <option value="Yes">{t('contact.booking.yes')}</option>
                        <option value="No">{t('contact.booking.no')}</option>
                      </select>
                    </div>

                    {bookingData.hasProvider === 'Yes' && (
                      <div>
                        <Label htmlFor="booking-currentProvider">{t('contact.booking.currentProvider')}</Label>
                        <Input
                          id="booking-currentProvider"
                          name="currentProvider"
                          value={bookingData.currentProvider}
                          onChange={handleBookingChange}
                          className={`mt-2 ${contactFieldClass}`}
                          placeholder={t('contact.booking.currentProviderPlaceholder')}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="booking-date">{t('contact.booking.date')} *</Label>
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
                            className={`pl-10 ${contactFieldClass}`}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="booking-time">{t('contact.booking.time')} *</Label>
                        <div className="relative mt-2">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10" size={18} />
                          <select
                            id="booking-time"
                            name="time"
                            value={bookingData.time}
                            onChange={handleBookingChange}
                            required
                            className="w-full pl-10 pr-3 py-2 border border-input rounded-md bg-background text-foreground focus:border-primary focus:ring-primary"
                          >
                            <option value="">{t('contact.booking.timePlaceholder')}</option>
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
                      <Label htmlFor="booking-timezone">{t('contact.booking.timezone')}</Label>
                      <Input
                        id="booking-timezone"
                        name="timezone"
                        value={bookingData.timezone}
                        onChange={handleBookingChange}
                        className={`mt-2 ${contactFieldClass}`}
                        placeholder={t('contact.booking.timezonePlaceholder')}
                      />
                      <p className="text-xs text-muted-foreground mt-1">{t('contact.booking.timezoneDetected')}: {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
                    </div>

                    <div>
                      <Label htmlFor="booking-notes">{t('contact.booking.notes')}</Label>
                      <Textarea
                        id="booking-notes"
                        name="notes"
                        value={bookingData.notes}
                        onChange={handleBookingChange}
                        rows={3}
                        className={`mt-2 ${contactFieldClass}`}
                        placeholder={t('contact.booking.notesPlaceholder')}
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsBookingOpen(false)}
                        className="flex-1"
                      >
                        {t('contact.booking.cancel')}
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {t('contact.booking.submit')}
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
              {t('contact.process.title').split(' ').slice(0, -2).join(' ')} <span className="text-primary">{t('contact.process.title').split(' ').slice(-2).join(' ')}</span>
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: t('contact.process.step1.number'),
                  title: t('contact.process.step1.title'),
                  description: t('contact.process.step1.description')
                },
                {
                  step: t('contact.process.step2.number'), 
                  title: t('contact.process.step2.title'),
                  description: t('contact.process.step2.description')
                },
                {
                  step: t('contact.process.step3.number'),
                  title: t('contact.process.step3.title'),
                  description: t('contact.process.step3.description')
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
    </>
  );
}
