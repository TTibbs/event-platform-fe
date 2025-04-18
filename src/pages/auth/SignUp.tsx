import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import authApi from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { RegisterParams } from "@/types/auth";

const SignUp = () => {
  const [formData, setFormData] = useState<RegisterParams>({
    username: "",
    email: "",
    password: "",
    isEventOrganiser: false,
    teamName: "",
    teamDescription: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username || !formData.email || !formData.password) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Extract base fields
      const { username, email, password, isEventOrganiser } = formData;

      // Create payload with conditional team fields
      const payload: RegisterParams = {
        username,
        email,
        password,
        isEventOrganiser,
        ...(isEventOrganiser
          ? {
              teamName: formData.teamName,
              teamDescription: formData.teamDescription,
            }
          : {}),
      };

      const response = await authApi.register(payload);
      const responseData = response.data.data;

      if (!responseData || !responseData.accessToken) {
        console.error("Invalid response format:", response);
        setError("Received an invalid response from the server");
        return;
      }

      // Store tokens in localStorage
      localStorage.setItem("token", responseData.accessToken);
      localStorage.setItem("refreshToken", responseData.refreshToken);
      localStorage.setItem("userData", JSON.stringify(responseData.user));

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          err.message ||
          "Registration failed. Please try again."
      );
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign Up</CardTitle>
          <CardDescription>
            Create an account to start using our platform
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isEventOrganiser"
                name="isEventOrganiser"
                checked={formData.isEventOrganiser}
                onCheckedChange={(checked: boolean | "indeterminate") =>
                  setFormData((prev) => ({
                    ...prev,
                    isEventOrganiser: checked === true,
                  }))
                }
                disabled={loading}
              />
              <Label htmlFor="isEventOrganiser">I am an event organizer</Label>
            </div>

            {formData.isEventOrganiser && (
              <div className="space-y-4 border p-4 rounded-md">
                <div className="space-y-2">
                  <Label htmlFor="teamName">Team Name *</Label>
                  <Input
                    id="teamName"
                    name="teamName"
                    placeholder="Your team name"
                    value={formData.teamName}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teamDescription">Team Description</Label>
                  <Input
                    id="teamDescription"
                    name="teamDescription"
                    placeholder="Describe your team"
                    value={formData.teamDescription}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-2">
            <Button
              type="submit"
              className="w-full"
              disabled={
                loading || (formData.isEventOrganiser && !formData.teamName)
              }
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating
                  Account
                </>
              ) : (
                "Sign Up"
              )}
            </Button>

            <p className="text-sm text-center text-muted-foreground mt-2">
              Already have an account?{" "}
              <Link to="/auth/login" className="text-primary hover:underline">
                Login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default SignUp;
