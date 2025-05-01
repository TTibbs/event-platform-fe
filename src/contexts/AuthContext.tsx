import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import authApi from "@/api/auth";
import usersApi from "@/api/users";
import { User } from "@/types/users";

// Define the shape of the context
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  isSiteAdmin: boolean;
  checkSiteAdmin: () => Promise<void>;
  updateUserData: (userData: Partial<User>) => void;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: false,
  login: async () => {},
  logout: async () => {},
  error: null,
  isSiteAdmin: false,
  checkSiteAdmin: async () => {},
  updateUserData: () => {},
});

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSiteAdmin, setIsSiteAdmin] = useState<boolean>(false);
  const navigate = useNavigate();

  // Fetch complete user data from the API
  const fetchUserData = async (userId: number) => {
    try {
      const response = await usersApi.getUserById(userId.toString());
      const userData = response.data.user;

      // Update user state with complete data including teams
      setUser(userData);

      // Update localStorage with complete user data
      localStorage.setItem("userData", JSON.stringify(userData));

      // Update admin status
      setIsSiteAdmin(!!userData.is_site_admin);

      return userData;
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      return null;
    }
  };

  // Check if current user is a site admin using dedicated endpoint
  const checkSiteAdmin = async () => {
    if (!isAuthenticated || !user?.id) return;

    try {
      const response = await usersApi.getIsSiteAdmin(user.id.toString());
      setIsSiteAdmin(response.data.is_site_admin === true);
    } catch (error) {
      console.error("Failed to check admin status:", error);
      setIsSiteAdmin(false);
    }
  };

  // Update user data in context and localStorage
  const updateUserData = (userData: Partial<User>) => {
    if (!user) return;

    // Update user state with new data
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);

    // Update localStorage
    localStorage.setItem("userData", JSON.stringify(updatedUser));

    // Trigger storage event for other tabs
    window.dispatchEvent(new Event("storage"));
  };

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("userData");

      if (token && userData) {
        try {
          // Parse initial user data from localStorage
          const parsedUserData = JSON.parse(userData);

          // Set initial user state
          setUser(parsedUserData);
          setIsAuthenticated(true);

          // Initial setting based on stored user data
          setIsSiteAdmin(!!parsedUserData.is_site_admin);

          // Then fetch complete and up-to-date user data from API
          if (parsedUserData.id) {
            await fetchUserData(parsedUserData.id);
          }
        } catch (e) {
          console.error("Failed to parse user data:", e);
          clearAuthData();
        }
      }

      setLoading(false);
    };

    initializeAuth();

    // Listen for storage events (for multi-tab synchronization)
    window.addEventListener("storage", initializeAuth);

    return () => {
      window.removeEventListener("storage", initializeAuth);
    };
  }, []);

  // Helper function to clear all auth data
  const clearAuthData = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userData");
    setUser(null);
    setIsAuthenticated(false);
    setIsSiteAdmin(false);
  };

  // Login function
  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authApi.login({ username, password });

      // Extract nested data
      const responseData = response.data.data;

      if (!responseData || !responseData.accessToken) {
        throw new Error("Invalid response from server");
      }

      // Store tokens
      localStorage.setItem("token", responseData.accessToken);
      localStorage.setItem("refreshToken", responseData.refreshToken);

      // Set initial user data from login response
      const initialUserData = responseData.user;
      localStorage.setItem("userData", JSON.stringify(initialUserData));

      // Update authentication state
      setUser(initialUserData);
      setIsAuthenticated(true);

      // Fetch complete user data including teams from API
      if (initialUserData.id) {
        await fetchUserData(initialUserData.id);
      }

      // Trigger storage event for other tabs
      window.dispatchEvent(new Event("storage"));

      return responseData;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.msg ||
        err.message ||
        "Login failed. Please try again.";

      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setLoading(true);

    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        // Call the logout endpoint (if it exists)
        await authApi.logout(refreshToken);
      }
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // Clear auth data regardless of API success
      clearAuthData();
      setLoading(false);
      navigate("/auth/login");

      // Trigger storage event for other tabs
      window.dispatchEvent(new Event("storage"));
    }
  };

  // Provide the context value
  const contextValue: AuthContextType = {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    error,
    isSiteAdmin,
    checkSiteAdmin,
    updateUserData,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export default AuthContext;
