import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

export const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-serif font-bold mb-6">About GlobalView Times</h1>
        <div className="prose prose-lg">
          <p className="text-lg mb-4">
            GlobalView Times is your trusted source for comprehensive global news coverage.
            We bring you stories from around the world with accuracy, depth, and insight.
          </p>
          <p className="mb-4">
            Our mission is to keep you informed about the events shaping our world, from politics
            and business to technology and culture.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};
