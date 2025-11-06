import { useState } from 'react';
import { motion } from 'framer-motion';
import { Envelope, MapPin, Calendar, Phone } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { CreedaLogo } from '@/components/CreedaLogo';

interface FormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  service: string;
  message: string;
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
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

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, var(--navy-50) 0%, var(--green-50) 100%)'}}>
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6" style={{color: 'var(--navy-800)'}}>
              Let's <span style={{color: 'var(--green-600)'}}>Connect</span>
            </h1>
            <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed" style={{color: 'var(--navy-600)'}}>
              Have questions about our services? Want to discuss your specific needs? 
              Our team is ready to help you achieve your goals.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="shadow-lg" style={{borderColor: 'var(--green-200)'}}>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6" style={{color: 'var(--navy-800)'}}>Send us a message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
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
                    <Label htmlFor="email">Email *</Label>
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

                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="mt-2"
                    placeholder="Tell us about your project..."
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full text-white" 
                  style={{backgroundColor: 'var(--navy-600)'}}
                  size="lg"
                >
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
