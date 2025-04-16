import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Generate avatar fallback from username
  const getAvatarFallback = () => {
    if (!user?.username) return "U";
    return user.username.substring(0, 2).toUpperCase();
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Glass morphism effect */}
      <div className="backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-primary">
                EventsApp
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="text-sm font-medium hover:text-primary"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/events"
                    className="text-sm font-medium hover:text-primary"
                  >
                    Events
                  </Link>
                  <div className="flex items-center space-x-4">
                    <Button variant="ghost" onClick={handleLogout}>
                      Logout
                    </Button>
                    <Link to="/profile">
                      <Avatar className="cursor-pointer">
                        <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
                      </Avatar>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/auth/login">
                    <Button variant="ghost">Login</Button>
                  </Link>
                  <Link to="/auth/signup">
                    <Button>Sign Up</Button>
                  </Link>
                </>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden backdrop-blur-md bg-white/95 dark:bg-gray-900/95 absolute w-full border-b border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-4 py-4 space-y-3">
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-3 pb-3">
                  <Avatar>
                    <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
                  </Avatar>
                  <div className="font-medium">{user?.username}</div>
                </div>
                <div className="grid gap-2">
                  <Link
                    to="/dashboard"
                    className="block py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/events"
                    className="block py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Events
                  </Link>
                  <Link
                    to="/profile"
                    className="block py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="justify-start px-3"
                  >
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <div className="grid gap-2">
                <Link
                  to="/auth/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button variant="ghost" className="w-full justify-start">
                    Login
                  </Button>
                </Link>
                <Link
                  to="/auth/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button className="w-full">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
