import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Scan, User, LogOut, X, Shield, Heart } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();

  const handleNavClick = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/monuments", label: "Monuments" },
    { path: "/stories", label: "Stories" },
    { path: "/contribute", label: "Contribute" },
    { path: "/quizzes", label: "Quizzes" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-heritage-terracotta to-heritage-gold flex items-center justify-center">
              <Scan className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">AR Folk</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-foreground hover:text-heritage-terracotta transition-colors ${
                  location.pathname === link.path ? "text-heritage-terracotta font-medium" : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-heritage-terracotta text-heritage-cream">
                        {user.email?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium text-sm">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleNavClick("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavClick("/favorites")}>
                    <Heart className="mr-2 h-4 w-4" />
                    My Favorites
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleNavClick("/admin")}>
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => handleNavClick("/auth")}
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
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-4 border-t border-border">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block w-full text-left text-foreground hover:text-heritage-terracotta transition-colors py-2 ${
                  location.pathname === link.path ? "text-heritage-terracotta font-medium" : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            <div className="pt-4 border-t border-border space-y-2">
              {user ? (
                <>
                  <Button
                    onClick={() => handleNavClick("/profile")}
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Button>
                  <Button
                    onClick={() => handleNavClick("/favorites")}
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    My Favorites
                  </Button>
                  {isAdmin && (
                    <Button
                      onClick={() => handleNavClick("/admin")}
                      variant="ghost"
                      className="w-full justify-start"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Admin Dashboard
                    </Button>
                  )}
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
                  onClick={() => handleNavClick("/auth")}
                  className="w-full bg-heritage-terracotta hover:bg-heritage-terracotta/90 text-heritage-cream"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
