import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";

export const Contact = () => {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Thank you! We'll get back to you soon.");
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Contact Us - GlobalView Times"
        description="Get in touch with GlobalView Times. Send us your questions, feedback, or news tips. We'd love to hear from you."
        canonical={typeof window !== 'undefined' ? window.location.href : ''}
      />
      <Navigation />
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <h1 className="text-4xl font-serif font-bold mb-6">Contact Us</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Your Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            type="email"
            placeholder="Your Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <Textarea
            placeholder="Your Message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            required
            rows={6}
          />
          <Button type="submit">Send Message</Button>
        </form>
      </main>
      <Footer />
    </div>
  );
};
