import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { ArrowRight, Users, TrendingUp, Calendar } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen gradient-surface">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge className="mb-4">Modern Design System</Badge>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-accent)] bg-clip-text text-transparent">
            HR Project
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            A modern Next.js application built with the same beautiful design system
            as LearnCycle
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[var(--primary-muted)] mb-4">
              <Users className="h-6 w-6 text-[var(--primary)]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Team Management</h3>
            <p className="text-slate-600 text-sm">
              Manage your team members, roles, and permissions with ease.
            </p>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[var(--primary-light)] mb-4">
              <TrendingUp className="h-6 w-6 text-[var(--primary-accent)]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Analytics</h3>
            <p className="text-slate-600 text-sm">
              Track performance metrics and gain insights into your organization.
            </p>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[var(--primary-muted)] mb-4">
              <Calendar className="h-6 w-6 text-[var(--primary)]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Scheduling</h3>
            <p className="text-slate-600 text-sm">
              Organize meetings, time off, and important events effortlessly.
            </p>
          </Card>
        </div>

        {/* Component Showcase */}
        <Card className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Design System Components</h2>

          <div className="space-y-8">
            {/* Buttons */}
            <div>
              <h3 className="text-sm font-medium text-slate-600 mb-3">Buttons</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary Button</Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="primary" size="sm">Small</Button>
                <Button variant="primary" size="lg">Large</Button>
              </div>
            </div>

            {/* Badges */}
            <div>
              <h3 className="text-sm font-medium text-slate-600 mb-3">Badges</h3>
              <div className="flex flex-wrap gap-3">
                <Badge>Default Badge</Badge>
                <Badge className="bg-[var(--primary-light)] text-[var(--primary-contrast)]">Accent Badge</Badge>
                <Badge className="bg-green-100 text-green-700">Success</Badge>
                <Badge className="bg-red-100 text-red-700">Error</Badge>
              </div>
            </div>

            {/* Input */}
            <div>
              <h3 className="text-sm font-medium text-slate-600 mb-3">Input</h3>
              <div className="max-w-md">
                <Input placeholder="Enter your email..." type="email" />
              </div>
            </div>
          </div>
        </Card>

        {/* Color Palette */}
        <Card>
          <h2 className="text-2xl font-bold mb-6">Color Palette</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="h-20 rounded-lg bg-[var(--primary)] mb-2"></div>
              <p className="text-sm font-medium">Turquoise Primary</p>
              <p className="text-xs text-slate-500">#40E0D0</p>
            </div>
            <div>
              <div className="h-20 rounded-lg bg-[var(--primary-light)] mb-2"></div>
              <p className="text-sm font-medium">Turquoise Light</p>
              <p className="text-xs text-slate-500">#8CF4EA</p>
            </div>
            <div>
              <div className="h-20 rounded-lg bg-slate-50 border border-slate-200 mb-2"></div>
              <p className="text-sm font-medium">Background</p>
              <p className="text-xs text-slate-500">#f8fafc</p>
            </div>
            <div>
              <div className="h-20 rounded-lg bg-slate-900 mb-2"></div>
              <p className="text-sm font-medium">Foreground</p>
              <p className="text-xs text-slate-500">#0f172a</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
