import Link from "next/link";
import {
  CheckCircle,
  Shield,
  BookOpen,
  Code,
  Database,
  ArrowRight,
  User,
  Calendar,
} from "lucide-react";

export default async function Home() {
  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="from-primary/5 to-primary/10 absolute inset-0 bg-gradient-to-br"></div>
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="text-center">
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div className="bg-primary/20 absolute inset-0 animate-pulse rounded-full blur-2xl"></div>
                <div className="bg-card border-border relative rounded-full border p-6 shadow-lg">
                  <Shield className="text-primary h-16 w-16" />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="bg-primary/10 text-primary mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
                <BookOpen className="h-4 w-4" />
                Major Qualifying Project
              </div>
              <h1 className="text-foreground mb-4 text-4xl font-bold sm:text-6xl">
                <span className="block">Student Solver</span>
                <span className="from-primary to-primary/70 block bg-gradient-to-r bg-clip-text text-transparent">
                  Tool
                </span>
              </h1>
            </div>

            <p className="text-muted-foreground mx-auto mb-8 max-w-3xl text-xl leading-relaxed">
              A comprehensive student data management and validation system
              developed as part of our WPI senior capstone project. Built to
              demonstrate modern web development practices and data processing
              techniques.
            </p>

            <div className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/validate"
                className="group bg-primary text-primary-foreground flex items-center gap-2 rounded-lg px-8 py-4 text-lg font-semibold shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
              >
                Try the Validator
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>

              <a
                href="https://github.com/minaboktor2628/student-solver-tool"
                target="_blank"
                rel="noopener noreferrer"
                className="border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-lg border px-8 py-4 text-lg font-semibold transition-all duration-200"
              >
                <Code className="h-5 w-5" />
                View Source Code
              </a>
            </div>

            {/* Project Info */}
            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-card border-border rounded-lg border p-4 text-center">
                <BookOpen className="text-primary mx-auto mb-2 h-6 w-6" />
                <div className="text-foreground font-semibold">University</div>
                <div className="text-muted-foreground">WPI</div>
              </div>
              <div className="bg-card border-border rounded-lg border p-4 text-center">
                <User className="text-primary mx-auto mb-2 h-6 w-6" />
                <div className="text-foreground font-semibold">Advisor</div>
                <div className="text-muted-foreground">Professor Ahrens</div>
              </div>
              <div className="bg-card border-border rounded-lg border p-4 text-center">
                <Calendar className="text-primary mx-auto mb-2 h-6 w-6" />
                <div className="text-foreground font-semibold">Duration</div>
                <div className="text-muted-foreground">Full Academic Year</div>
              </div>
              <div className="bg-card border-border rounded-lg border p-4 text-center">
                <Code className="text-primary mx-auto mb-2 h-6 w-6" />
                <div className="text-foreground font-semibold">Tech Stack</div>
                <div className="text-muted-foreground">
                  Next.js & TypeScript
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Overview */}
      <div className="bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-foreground mb-4 text-3xl font-bold sm:text-4xl">
              Project Overview
            </h2>
            <p className="text-muted-foreground mx-auto max-w-3xl text-xl">
              This MQP explores modern approaches to data validation, combining
              theoretical computer science concepts with practical web
              development to create a robust validation platform.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="group bg-card border-border rounded-xl border p-8 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
              <div className="bg-primary/10 mb-6 w-fit rounded-lg p-3">
                <Database className="text-primary h-8 w-8" />
              </div>
              <h3 className="text-foreground mb-3 text-xl font-semibold">
                Data Processing
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Implementation of various data validation algorithms and parsing
                techniques for different file formats and data structures.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-card border-border rounded-xl border p-8 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
              <div className="bg-primary/10 mb-6 w-fit rounded-lg p-3">
                <Code className="text-primary h-8 w-8" />
              </div>
              <h3 className="text-foreground mb-3 text-xl font-semibold">
                Modern Web Stack
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Built with Next.js, TypeScript, and modern React patterns to
                demonstrate current industry best practices and frameworks.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-card border-border rounded-xl border p-8 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
              <div className="bg-primary/10 mb-6 w-fit rounded-lg p-3">
                <CheckCircle className="text-primary h-8 w-8" />
              </div>
              <h3 className="font-semibual text-foreground mb-3 text-xl">
                User Experience
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Focus on intuitive interface design and responsive user
                interactions to make complex validation processes accessible.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-card/50 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-foreground mb-4 text-3xl font-bold">
              Our Team
            </h2>
            <p className="text-muted-foreground">
              WPI Computer Science students working together to create
              innovative solutions
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="bg-primary/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
                <User className="text-primary h-10 w-10" />
              </div>
              <h3 className="text-foreground mb-1 text-xl font-semibold">
                Ryan Addeche
              </h3>
              <p className="text-muted-foreground text-sm">Developer</p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
                <User className="text-primary h-10 w-10" />
              </div>
              <h3 className="text-foreground mb-1 text-xl font-semibold">
                Mina Boktor
              </h3>
              <p className="text-muted-foreground text-sm">Developer</p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
                <User className="text-primary h-10 w-10" />
              </div>
              <h3 className="text-foreground mb-1 text-xl font-semibold">
                Jacob Burns
              </h3>
              <p className="text-muted-foreground text-sm">Developer</p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
                <User className="text-primary h-10 w-10" />
              </div>
              <h3 className="text-foreground mb-1 text-xl font-semibold">
                Ethan Knorring
              </h3>
              <p className="text-muted-foreground text-sm">Developer</p>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Details */}
      <div className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="from-primary/10 to-primary/5 border-border rounded-2xl border bg-gradient-to-r p-8 sm:p-12">
            <div className="mb-8 text-center">
              <h2 className="text-foreground mb-4 text-3xl font-bold">
                Academic Focus
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                This project demonstrates the practical application of computer
                science principles in solving real-world data validation
                challenges. The implementation showcases algorithm design,
                software engineering practices, and modern web development
                methodologies.
              </p>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-foreground flex items-center gap-2 text-xl font-semibold">
                  <BookOpen className="text-primary h-5 w-5" />
                  Learning Objectives
                </h3>
                <ul className="text-muted-foreground space-y-2">
                  <li>• Algorithm implementation and optimization</li>
                  <li>• Modern web application architecture</li>
                  <li>• User interface and experience design</li>
                  <li>• Data processing and validation techniques</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-foreground flex items-center gap-2 text-xl font-semibold">
                  <Shield className="text-primary h-5 w-5" />
                  Technical Implementation
                </h3>
                <ul className="text-muted-foreground space-y-2">
                  <li>• React and Next.js framework</li>
                  <li>• TypeScript for type safety</li>
                  <li>• Responsive design principles</li>
                  <li>• Component-based architecture</li>
                </ul>
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/validate"
                className="group bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-lg px-8 py-4 text-lg font-semibold shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
              >
                Explore the Application
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
