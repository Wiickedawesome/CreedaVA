'use client';

import { ContactHeader } from './contact-header';
import { ContactForm } from './contact-form';

export default function ContactPage() {
  return (
    <div className="container mx-auto px-6 py-12">
      <ContactHeader />
      <ContactForm />
    </div>
  );
}
