import Link from 'next/link';
import { CheckCircle, Shield, BookOpen, Code, Database, ArrowRight, User, Calendar } from 'lucide-react';

export default async function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10"></div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
                <div className="relative bg-card border border-border rounded-full p-6 shadow-lg">
                  <Shield className="h-16 w-16 text-primary" />
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
                <BookOpen className="h-4 w-4" />
                Major Qualifying Project
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold text-foreground mb-4">
                <span className="block">Student Solver</span>
                <span className="block bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Tool
                </span>
              </h1>
            </div>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              A comprehensive student data management and validation system developed as part of our WPI senior capstone project. 
              Built to demonstrate modern web development practices and data processing techniques.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link 
                href="/validate" 
                className="group bg-primary text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center gap-2"
              >
                Try the Validator
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <a 
                href="https://github.com/yourusername/your-repo-name" 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-8 py-4 rounded-lg border border-border bg-card text-foreground font-semibold text-lg hover:bg-accent hover:text-accent-foreground transition-all duration-200 flex items-center gap-2"
              >
                <Code className="h-5 w-5" />
                View Source Code
              </a>
            </div>

            {/* Project Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="text-center p-4 bg-card border border-border rounded-lg">
                <BookOpen className="h-6 w-6 text-primary mx-auto mb-2" />
                <div className="font-semibold text-foreground">University</div>
                <div className="text-muted-foreground">WPI</div>
              </div>
              <div className="text-center p-4 bg-card border border-border rounded-lg">
                <User className="h-6 w-6 text-primary mx-auto mb-2" />
                <div className="font-semibold text-foreground">Advisor</div>
                <div className="text-muted-foreground">Professor Ahrens</div>
              </div>
              <div className="text-center p-4 bg-card border border-border rounded-lg">
                <Calendar className="h-6 w-6 text-primary mx-auto mb-2" />
                <div className="font-semibold text-foreground">Duration</div>
                <div className="text-muted-foreground">Full Academic Year</div>
              </div>
              <div className="text-center p-4 bg-card border border-border rounded-lg">
                <Code className="h-6 w-6 text-primary mx-auto mb-2" />
                <div className="font-semibold text-foreground">Tech Stack</div>
                <div className="text-muted-foreground">Next.js & TypeScript</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Overview */}
      <div className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Project Overview
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              This MQP explores modern approaches to data validation, combining theoretical computer science 
              concepts with practical web development to create a robust validation platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group bg-card border border-border rounded-xl p-8 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <div className="bg-primary/10 rounded-lg p-3 w-fit mb-6">
                <Database className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Data Processing</h3>
              <p className="text-muted-foreground leading-relaxed">
                Implementation of various data validation algorithms and parsing techniques for different file formats and data structures.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-card border border-border rounded-xl p-8 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <div className="bg-primary/10 rounded-lg p-3 w-fit mb-6">
                <Code className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Modern Web Stack</h3>
              <p className="text-muted-foreground leading-relaxed">
                Built with Next.js, TypeScript, and modern React patterns to demonstrate current industry best practices and frameworks.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-card border border-border rounded-xl p-8 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <div className="bg-primary/10 rounded-lg p-3 w-fit mb-6">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibual text-foreground mb-3">User Experience</h3>
              <p className="text-muted-foreground leading-relaxed">
                Focus on intuitive interface design and responsive user interactions to make complex validation processes accessible.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="py-16 bg-card/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Team</h2>
            <p className="text-muted-foreground">
              WPI Computer Science students working together to create innovative solutions
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <User className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-1">Ryan Addeche</h3>
              <p className="text-muted-foreground text-sm">Developer</p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <User className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-1">Mina Boktor</h3>
              <p className="text-muted-foreground text-sm">Developer</p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <User className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-1">Jacob Burns</h3>
              <p className="text-muted-foreground text-sm">Developer</p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <User className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-1">Ethan Knorring</h3>
              <p className="text-muted-foreground text-sm">Developer</p>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Details */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 sm:p-12 border border-border">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Academic Focus
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                This project demonstrates the practical application of computer science principles 
                in solving real-world data validation challenges. The implementation showcases 
                algorithm design, software engineering practices, and modern web development methodologies.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Learning Objectives
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Algorithm implementation and optimization</li>
                  <li>• Modern web application architecture</li>
                  <li>• User interface and experience design</li>
                  <li>• Data processing and validation techniques</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Technical Implementation
                </h3>
                <ul className="space-y-2 text-muted-foreground">
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
                className="group bg-primary text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 inline-flex items-center gap-2"
              >
                Explore the Application
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}