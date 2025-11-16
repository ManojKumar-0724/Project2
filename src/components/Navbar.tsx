import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Scan, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
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

          {/* Auth Section */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Button
                  onClick={() => navigate("/favorites")}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  My Favorites
                </Button>
                <Button
                  onClick={() => signOut()}
                  variant="outline"
                  size="sm"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button
                onClick={() => navigate("/auth")}
                className="bg-heritage-terracotta hover:bg-heritage-terracotta/90 text-heritage-cream"
              >
                Sign In
              </Button>
            )}
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
            
            {user ? (
              <>
                <Button
                  onClick={() => navigate("/favorites")}
                  variant="ghost"
                  className="w-full justify-start"
                >
                  <User className="w-4 h-4 mr-2" />
                  My Favorites
                </Button>
                <Button
                  onClick={() => signOut()}
                  variant="outline"
                  className="w-full"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button
                onClick={() => navigate("/auth")}
                className="w-full bg-heritage-terracotta hover:bg-heritage-terracotta/90 text-heritage-cream"
              >
                Sign In
              </Button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
