import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Layout from "@/components/Layout";
import Home from "./pages/Home";
import Login from "@/pages/auth/Login";
import SignUp from "@/pages/auth/SignUp";
import Events from "@/pages/events/Events";
import Profile from "@/pages/Profile";
import { Toaster } from "@/components/ui/sonner";
import CreateEvent from "@/pages/events/CreateEvent";
import Dashboard from "@/pages/Dashboard";
import EventDetails from "@/pages/events/EventDetails";
import AdminDashboard from "@/pages/AdminDashboard";

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <div className="min-h-screen">
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth/login" element={<Login />} />
                <Route path="/auth/signup" element={<SignUp />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/create" element={<CreateEvent />} />
                <Route path="/events/:id" element={<EventDetails />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin/*" element={<AdminDashboard />} />
                <Route
                  path="*"
                  element={
                    <div className="text-center py-10">Page not found</div>
                  }
                />
              </Routes>
            </Layout>
            <Toaster />
          </div>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
