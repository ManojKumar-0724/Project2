import { Button } from "@/components/ui/button";
import { Menu, Scan } from "lucide-react";
import { useState } from "react";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-heritage-terracotta to-heritage-gold flex items-center justify-center">
              <Scan className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">AR Folk</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#monuments" className="text-foreground hover:text-heritage-terracotta transition-colors">
              Monuments
            </a>
            <a href="#stories" className="text-foreground hover:text-heritage-terracotta transition-colors">
              Stories
            </a>
            <a href="#contribute" className="text-foreground hover:text-heritage-terracotta transition-colors">
              Contribute
            </a>
            <a href="#quizzes" className="text-foreground hover:text-heritage-terracotta transition-colors">
              Quizzes
            </a>
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Button className="bg-heritage-terracotta hover:bg-heritage-terracotta/90 text-heritage-cream">
              <Scan className="mr-2 h-4 w-4" />
              Start AR
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-4">
            <a
              href="#monuments"
              className="block text-foreground hover:text-heritage-terracotta transition-colors"
            >
              Monuments
            </a>
            <a
              href="#stories"
              className="block text-foreground hover:text-heritage-terracotta transition-colors"
            >
              Stories
            </a>
            <a
              href="#contribute"
              className="block text-foreground hover:text-heritage-terracotta transition-colors"
            >
              Contribute
            </a>
            <a
              href="#quizzes"
              className="block text-foreground hover:text-heritage-terracotta transition-colors"
            >
              Quizzes
            </a>
            <Button className="w-full bg-heritage-terracotta hover:bg-heritage-terracotta/90 text-heritage-cream">
              <Scan className="mr-2 h-4 w-4" />
              Start AR
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};
