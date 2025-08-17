import { Badge, Mail, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";

interface TeamMemberProps {
  member: {
    id: number;
    username: string;
    email: string;
    role: string;
    profile_image_url: string;
    team_created_at: string;
    user_id: number;
  };
  getRoleBadgeColor: (role: string) => string;
  canDeleteTeamMembers: boolean;
  handleDeleteTeamMember: (memberId: number) => void;
  isDeleting: string;
  authUser: {
    id: number;
  };
}

export default function TeamMember({
  member,
  getRoleBadgeColor,
  canDeleteTeamMembers,
  handleDeleteTeamMember,
  isDeleting,
  authUser,
}: TeamMemberProps) {
  return (
    <Card key={member.id} className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            {member.profile_image_url && (
              <AvatarImage
                src={member.profile_image_url}
                alt={member.username}
              />
            )}
            <AvatarFallback className="bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{member.username}</CardTitle>
            <CardDescription>
              <Badge
                className={`${getRoleBadgeColor(member.role)} text-white mt-1`}
              >
                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
              </Badge>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Mail className="h-4 w-4" />
          <span>{member.email}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Team joined: {new Date(member.team_created_at).toLocaleDateString()}
        </p>
      </CardContent>
      {canDeleteTeamMembers && member.user_id !== authUser?.id && (
        <CardFooter>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={isDeleting === member.user_id.toString()}
              >
                {isDeleting === member.user_id.toString()
                  ? "Removing..."
                  : "Remove"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove{" "}
                  <strong>{member.username}</strong> from the team? This action
                  cannot be undone and they will lose access to all team events
                  and resources.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDeleteTeamMember(member.user_id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Remove Member
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      )}
    </Card>
  );
}
