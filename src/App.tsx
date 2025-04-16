import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "@/components/Header";
import Login from "@/pages/auth/Login";
import SignUp from "@/pages/auth/SignUp";
import { AuthProvider } from "@/contexts/AuthContext";
import Events from "@/pages/Events";
import Profile from "@/pages/Profile";
import { Toaster } from "@/components/ui/sonner";
import CreateEvent from "@/pages/CreateEvent";
import Dashboard from "@/pages/Dashboard";

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Header />
          <main className="container mx-auto px-4 py-6">
            <Routes>
              <Route
                path="/"
                element={
                  <div className="text-center py-10">Welcome to EventsApp</div>
                }
              />
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/signup" element={<SignUp />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/create" element={<CreateEvent />} />
              <Route path="/profile" element={<Profile />} />
              <Route
                path="*"
                element={
                  <div className="text-center py-10">Page not found</div>
                }
              />
            </Routes>
          </main>
          <Toaster />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
