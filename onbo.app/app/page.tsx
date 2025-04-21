import { GalleryVerticalEnd } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      {/* Header/Navigation */}
      <nav className="flex w-full max-w-7xl justify-between items-center mb-16">
        <a href="#" className="flex items-center gap-2 font-medium">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEnd className="size-5" />
          </div>
          <span className="text-xl">Onbo</span>
        </a>
        <div className="flex gap-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex flex-col items-center text-center max-w-4xl mb-16">
        <h1 className="text-5xl font-bold mb-6">
          Welcome to Onbo
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Your all-in-one platform for seamless task management and collaboration.
        </p>
        <Button size="lg" asChild>
          <Link href="/signup">Start for Free</Link>
        </Button>
      </div>

      {/* Features Section */}
      <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="p-6 rounded-lg border bg-card text-card-foreground">
          <h3 className="text-xl font-semibold mb-2">Simple & Intuitive</h3>
          <p className="text-muted-foreground">
            Easy-to-use interface that helps you stay focused on what matters.
          </p>
        </div>
        <div className="p-6 rounded-lg border bg-card text-card-foreground">
          <h3 className="text-xl font-semibold mb-2">Team Collaboration</h3>
          <p className="text-muted-foreground">
            Work together seamlessly with your team in real-time.
          </p>
        </div>
        <div className="p-6 rounded-lg border bg-card text-card-foreground">
          <h3 className="text-xl font-semibold mb-2">Powerful Analytics</h3>
          <p className="text-muted-foreground">
            Track progress and make data-driven decisions.
          </p>
        </div>
      </div>
    </main>
  );
}