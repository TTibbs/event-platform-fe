import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import authApi from "@/api/auth";

// Define the team interface
interface Team {
  team_id: number;
  team_name: string;
  team_description: string;
  role: string;
}

// Define the shape of the user data
interface User {
  id?: number;
  username?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
  teams?: Team[];
  [key: string]: any;
}

// Define the shape of the context
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: false,
  login: async () => {},
  logout: async () => {},
  error: null,
});

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("userData");

      if (token && userData) {
        try {
          setUser(JSON.parse(userData));
          setIsAuthenticated(true);
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

      // Store tokens and user data
      localStorage.setItem("token", responseData.accessToken);
      localStorage.setItem("refreshToken", responseData.refreshToken);
      localStorage.setItem("userData", JSON.stringify(responseData.user));

      // Update state
      setUser(responseData.user);
      setIsAuthenticated(true);

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
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export default AuthContext;
