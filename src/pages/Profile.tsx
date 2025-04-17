import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import usersApi from "@/api/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import EventsCalendar from "@/components/events/EventsCalendar";
import { UserTeam } from "@/types/users";

export default function Profile() {
  const { user, updateUserData } = useAuth();
  const [teams, setTeams] = useState<UserTeam[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isTeamMember, setIsTeamMember] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          const response = await usersApi.getUserById(String(user.id));
          const fetchedUser = response.data.user;
          setUserData(fetchedUser);

          // Set teams and determine if user is a team member
          const userTeams = fetchedUser.teams || [];
          setTeams(userTeams);
          setIsTeamMember(userTeams.length > 0);

          setUsername(fetchedUser.username || "");
          setEmail(fetchedUser.email || "");
          setProfileImageUrl(fetchedUser.profile_image_url || "");
        } catch (error) {
          console.error("Failed to fetch user data:", error);
        }
      }
    };
    fetchData();
  }, [user]);

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form values to current user data
    if (userData) {
      setUsername(userData.username || "");
      setEmail(userData.email || "");
      setProfileImageUrl(userData.profile_image_url || "");
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      await usersApi.updateUser(String(user.id), {
        username,
        email,
        profile_image_url: profileImageUrl,
      });

      // Update local user data
      setUserData({
        ...userData,
        username,
        email,
        profile_image_url: profileImageUrl,
      });

      // Update user data in context to reflect changes across components
      updateUserData({
        username,
        email,
        profile_image_url: profileImageUrl,
      });

      setIsEditing(false);
      toast("Profile updated", {
        description: "Your profile information has been updated successfully.",
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Update failed", {
        description: "There was a problem updating your profile.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <p className="text-muted-foreground">
          Please log in to view your profile
        </p>
      </div>
    );
  }

  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  // Use userData for display if available, otherwise fall back to user from context
  const displayData = userData || user;
  const formattedJoinDate = displayData.created_at
    ? format(new Date(displayData.created_at), "MMMM d, yyyy")
    : "Unknown";

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>

      <div
        className={`grid grid-cols-1 ${
          isTeamMember ? "md:grid-cols-3" : "md:max-w-md mx-auto"
        } gap-6 mb-6`}
      >
        {/* User Info Card */}
        <Card className={isTeamMember ? "md:col-span-1" : "w-full"}>
          <CardHeader className="flex flex-col items-center">
            <Avatar className="h-24 w-24 mb-4">
              {displayData.profile_image_url && (
                <AvatarImage
                  src={displayData.profile_image_url}
                  alt={displayData.username || "User"}
                />
              )}
              <AvatarFallback className="text-xl">
                {getInitials(displayData.username || "")}
              </AvatarFallback>
            </Avatar>
            {!isEditing ? (
              <>
                <CardTitle className="text-xl">
                  {displayData.username}
                </CardTitle>
                <CardDescription>{displayData.email}</CardDescription>
              </>
            ) : (
              <div className="w-full space-y-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profileImageUrl">Profile Image URL</Label>
                  <Input
                    id="profileImageUrl"
                    type="url"
                    placeholder="https://example.com/profile.jpg"
                    value={profileImageUrl}
                    onChange={(e) => setProfileImageUrl(e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member since</span>
                <span>{formattedJoinDate}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center pt-2">
            {!isEditing ? (
              <Button onClick={handleEditProfile} variant="outline" size="sm">
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2 w-full">
                <Button
                  onClick={handleCancelEdit}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  size="sm"
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>

        {/* Teams Card - Only shown if user is a team member */}
        {isTeamMember && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Your Teams</CardTitle>
              <CardDescription>
                Teams you're a member of and your role in each
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teams && teams.length > 0 && (
                <div className="space-y-4">
                  {teams.map((team: UserTeam) => (
                    <div key={team.team_id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{team.team_name}</h3>
                        <span className="px-2 py-1 bg-slate-100 text-slate-800 text-xs rounded-full">
                          {team.role.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {team.team_description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Events Calendar Section */}
      {user && user.id && (
        <div className="mb-6">
          <EventsCalendar userId={user.id.toString()} />
        </div>
      )}
    </div>
  );
}
