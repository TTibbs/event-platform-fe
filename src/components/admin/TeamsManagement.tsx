import { useState } from "react";
import { TeamResponse, TeamMember } from "@/types/teams";
import { Plus, EyeIcon, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ManagementBase from "./ManagementBase";

interface TeamsManagementProps {
  teams: TeamResponse[];
  teamMembers: TeamMember[];
}

export default function TeamsManagement({
  teams,
  teamMembers,
}: TeamsManagementProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTeamMembersCount = (teamId: number) => {
    return teamMembers.filter((member) => member.team_id === teamId).length;
  };

  const handleCreateTeam = () => {
    // Implement create team functionality
    console.log("Create team clicked");
  };

  return (
    <ManagementBase
      title="Teams Management"
      description="Manage teams and their members"
      addButtonLabel="Create Team"
      addButtonIcon={<Plus className="mr-2 h-4 w-4" />}
      onAddButtonClick={handleCreateTeam}
      loading={loading}
      error={error}
    >
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    No teams found
                  </TableCell>
                </TableRow>
              ) : (
                teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell>{team.id}</TableCell>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>
                      {team.description || (
                        <span className="text-muted-foreground italic">
                          No description
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getTeamMembersCount(team.id)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(team.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-8 cursor-pointer"
                          title="View Team"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-8 cursor-pointer"
                          title="Edit Team"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-8 cursor-pointer text-destructive hover:bg-destructive/10"
                          title="Delete Team"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </ManagementBase>
  );
}
