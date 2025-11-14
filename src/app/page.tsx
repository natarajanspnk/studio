export const dynamic = 'force-dynamic';
import Link from 'next/link';
import Image from 'next/image';
import {
  HeartPulse,
  Video,
  FileText,
  BrainCircuit,
  ShieldCheck,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { placeholderImages } from '@/lib/placeholder-images';
import { ThemeToggle } from '@/components/theme-toggle';

const features = [
  {
    icon: <HeartPulse className="h-8 w-8 text-primary" />,
    title: 'Online Appointment Booking',
    description:
      'Easily schedule appointments with our specialists through an intuitive online calendar system.',
  },
  {
    icon: <Video className="h-8 w-8 text-primary" />,
    title: 'Real-time Video  a',
    description:
      'Connect with doctors face-to-face through high-quality, real-time video calls from anywhere.',
  },
  {
    icon: <FileText className="h-8 w-8 text-primary" />,
    title: 'Electronic Health Records',
    description:
      'Your complete medical history, prescriptions, and lab results stored securely in one place.',
  },
  {
    icon: <BrainCircuit className="h-8 w-8 text-primary" />,
    title: 'AI Symptom Checker',
    description:
      'Get preliminary insights into your symptoms with our AI-powered tool before your consultation.',
  },
];

export default function Home() {
  const heroImage = placeholderImages.find((img) => img.id === 'hero-landing');

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
        <Logo />
        <nav className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign Up</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        <section className="relative w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto grid items-center gap-12 px-4 md:grid-cols-2 md:px-6">
            <div className="space-y-6">
              <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Your Health,
                <br />
                Connected.
              </h1>
              <p className="max-w-[600px] text-lg text-muted-foreground md:text-xl">
                MedConnect offers seamless, secure, and personalized
                telemedicine services. Connect with trusted healthcare
                professionals from the comfort of your home.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button size="lg" asChild>
                  <Link href="/signup">Get Started Now</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="#features">Learn More</Link>
                </Button>
              </div>
            </div>
            <div className="relative h-64 w-full overflow-hidden rounded-xl md:h-auto md:aspect-square">
              {heroImage && (
                <Image
                  src={heroImage.imageUrl}
                  alt={heroImage.description}
                  fill
                  sizes="50vw"
                  className="object-cover"
                  data-ai-hint={heroImage.imageHint}
                  priority
                />
              )}
            </div>
          </div>
        </section>

        <section
          id="features"
          className="w-full bg-secondary/30 py-12 md:py-24 lg:py-32"
        >
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Comprehensive Care at Your Fingertips
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                MedConnect is designed to provide a complete virtual care
                experience.
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <Card
                  key={feature.title}
                  className="transform-gpu border-none bg-transparent shadow-none transition-all duration-300"
                >
                  <CardHeader className="items-center">{feature.icon}</CardHeader>
                  <CardContent className="text-center">
                    <CardTitle className="mb-2 font-headline text-xl font-semibold">
                      {feature.title}
                    </CardTitle>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto grid items-center gap-8 px-4 md:grid-cols-2 md:px-6">
            <div className="space-y-4">
              <div className="inline-block rounded-lg bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
                Security First
              </div>
              <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl">
                Your Privacy is Our Priority
              </h2>
              <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                We employ state-of-the-art security and encryption protocols to
                ensure your data is always protected. Our platform is built to
                be HIPAA compliant, guaranteeing the confidentiality of your
                health information.
              </p>
            </div>
            <div className="flex items-center justify-center">
              <ShieldCheck className="h-32 w-32 text-primary" />
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t bg-background py-6">
        <div className="container mx-auto flex flex-col items-center justify-between px-4 md:flex-row md:px-6">
          <Logo />
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} MedConnect. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
