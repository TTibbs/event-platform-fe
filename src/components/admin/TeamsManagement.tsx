import { useState, useEffect } from "react";
import { TeamResponse, TeamMember } from "@/types/teams";
import { Plus, Pencil, Trash2, Users, RefreshCw } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import teamsApi from "@/api/teams";
import usersApi from "@/api/users";
import ManagementBase from "./ManagementBase";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";

interface TeamsManagementProps {
  teams: TeamResponse[];
  teamMembers: TeamMember[];
  totalTeams?: number;
  totalTeamMembers?: number;
}

interface TeamParams {
  name: string;
  description?: string;
}

export default function TeamsManagement({
  teams: initialTeams,
  teamMembers,
  totalTeams: initialTotalTeams,
  totalTeamMembers: initialTotalTeamMembers,
}: TeamsManagementProps) {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<TeamResponse[]>(initialTeams);
  const [totalTeams, setTotalTeams] = useState<number>(
    initialTotalTeams || initialTeams.length
  );
  const [totalTeamMembers, setTotalTeamMembers] = useState<number>(
    initialTotalTeamMembers || teamMembers.length
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [teamToDelete, setTeamToDelete] = useState<TeamResponse | null>(null);
  const [teamToEdit, setTeamToEdit] = useState<TeamResponse | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // New team state
  const defaultTeamState = {
    name: "",
    description: "",
  };

  const [newTeam, setNewTeam] = useState<TeamParams>(defaultTeamState);
  const [editedTeam, setEditedTeam] = useState<TeamParams>({
    name: "",
    description: "",
  });

  // Add a state for team member counts
  const [teamMemberCounts, setTeamMemberCounts] = useState<
    Record<number, number>
  >({});

  // Add a state to track loading status of member counts
  const [loadingCounts, setLoadingCounts] = useState<boolean>(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTeamMembersCount = (teamId: number) => {
    // If we have fetched the count from API, use that
    if (teamMemberCounts[teamId] !== undefined) {
      return teamMemberCounts[teamId];
    }
    // Otherwise fall back to the filter method
    return teamMembers.filter((member) => member.team_id === teamId).length;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    isEditMode: boolean
  ) => {
    const { name, value } = e.target;

    if (isEditMode) {
      setEditedTeam((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else {
      setNewTeam((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear validation error when user types
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const updatedErrors = { ...prev };
        delete updatedErrors[name];
        return updatedErrors;
      });
    }
  };

  const validateForm = (team: TeamParams): boolean => {
    const errors: { [key: string]: string } = {};

    if (!team.name || team.name.trim() === "") {
      errors.name = "Team name is required";
    } else if (team.name.length < 3) {
      errors.name = "Team name must be at least 3 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateTeam = () => {
    setNewTeam(defaultTeamState);
    setFormErrors({});
    setDialogOpen(true);
  };

  const addTeam = async () => {
    if (!validateForm(newTeam)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await teamsApi.createTeam(newTeam);
      const createdTeam = response.data.team;

      // Add the new team to the list
      setTeams((prevTeams) => [
        ...prevTeams,
        {
          ...createdTeam,
          member_count: 1, // Creator is automatically a member
        },
      ]);

      // Update team member counts for the new team
      setTeamMemberCounts((prev) => ({
        ...prev,
        [createdTeam.id]: 1, // Creator is automatically a member
      }));

      // Increment the total team count
      setTotalTeams((prev) => prev + 1);

      // Increment the total team members count
      setTotalTeamMembers((prev) => prev + 1);

      setDialogOpen(false);
      setNewTeam(defaultTeamState);
      toast.success(`Team "${createdTeam.name}" created successfully`);
    } catch (error: unknown) {
      const errorMessage =
        typeof error === "object" && error !== null
          ? (error as any).response?.data?.msg ||
            (error as any).response?.data?.message ||
            (error as any).message ||
            "Failed to create team"
          : "Failed to create team";

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (team: TeamResponse) => {
    setTeamToEdit(team);
    setEditedTeam({
      name: team.name,
      description: team.description || "",
    });
    setFormErrors({});
    setEditDialogOpen(true);
  };

  const updateTeam = async () => {
    if (!teamToEdit || !validateForm(editedTeam)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Optimistically update the UI
      setTeams((prevTeams: TeamResponse[]) =>
        prevTeams.map((team) =>
          team.id === teamToEdit.id
            ? {
                ...team,
                name: editedTeam.name,
                description: editedTeam.description || team.description || "",
                updated_at: new Date().toISOString(),
              }
            : team
        )
      );

      // Make the API call
      // Note: The API might only update the name, but we're storing both in state
      await teamsApi.updateTeam(teamToEdit.id.toString(), editedTeam.name);

      setEditDialogOpen(false);
      setTeamToEdit(null);
      toast.success(`Team "${editedTeam.name}" updated successfully`);
    } catch (error: unknown) {
      // Revert optimistic update on error
      setTeams(initialTeams);

      const errorMessage =
        typeof error === "object" && error !== null
          ? (error as any).response?.data?.msg ||
            (error as any).response?.data?.message ||
            (error as any).message ||
            "Failed to update team"
          : "Failed to update team";

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (team: TeamResponse) => {
    setTeamToDelete(team);
    setDeleteDialogOpen(true);
  };

  const deleteTeam = async () => {
    if (!teamToDelete) return;

    try {
      setLoading(true);
      setError(null);

      // Get the current team member count before deletion
      const teamMemberCount =
        teamMemberCounts[teamToDelete.id] ||
        getTeamMembersCount(teamToDelete.id);

      // Optimistically remove from UI
      setTeams((prevTeams) =>
        prevTeams.filter((team) => team.id !== teamToDelete.id)
      );

      // Remove the team's member count from state
      setTeamMemberCounts((prev) => {
        const newCounts = { ...prev };
        delete newCounts[teamToDelete.id];
        return newCounts;
      });

      // Decrement the total team count
      setTotalTeams((prev) => Math.max(0, prev - 1));

      // Decrement the total team members count
      setTotalTeamMembers((prev) => Math.max(0, prev - teamMemberCount));

      // Make the API call
      await teamsApi.deleteTeam(teamToDelete.id.toString());

      setDeleteDialogOpen(false);
      setTeamToDelete(null);
      toast.success(`Team "${teamToDelete.name}" deleted successfully`);
    } catch (error: unknown) {
      // Revert optimistic update on error
      setTeams(initialTeams);
      setTotalTeams(initialTotalTeams || initialTeams.length);

      // Refresh team member counts to get back to the correct state
      fetchTeamMemberCounts();

      const errorMessage =
        typeof error === "object" && error !== null
          ? (error as any).response?.data?.msg ||
            (error as any).response?.data?.message ||
            (error as any).message ||
            "Failed to delete team"
          : "Failed to delete team";

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTeamMembers = (teamId: number) => {
    // Navigate to a team members page or open a modal with team members
    navigate(`/admin/teams/${teamId}/members`);
  };

  // Fetch teams for the dropdown
  const fetchTeams = async () => {
    try {
      const response = await teamsApi.getAllTeams();
      setTeams(response.data.teams || []);
    } catch (error) {
      console.error("Failed to fetch teams:", error);
      toast.error("Failed to load teams");
    }
  };

  // Call fetchTeams when the component mounts
  useEffect(() => {
    fetchTeams();
    // Set loading to false after component is mounted
    setLoading(false);
  }, []);

  // Fetch total counts from the admin dashboard if not provided
  useEffect(() => {
    const fetchTotalCounts = async () => {
      if (initialTotalTeams && initialTotalTeamMembers) {
        return; // If counts are already provided, don't fetch
      }

      try {
        const response = await usersApi.getAdminDashboardData();
        const { total_teams, total_team_members } = response.data.data;
        setTotalTeams(total_teams);
        setTotalTeamMembers(total_team_members);
      } catch (error: unknown) {
        console.error("Failed to fetch team counts:", error);
      }
    };

    fetchTotalCounts();
  }, [initialTotalTeams, initialTotalTeamMembers]);

  // Update the fetchTeamMemberCounts function
  const fetchTeamMemberCounts = async () => {
    if (loadingCounts) return; // Prevent multiple simultaneous fetches

    try {
      setLoadingCounts(true);

      // Create an array of promises for each team
      const countPromises = teams.map(async (team) => {
        try {
          const response = await teamsApi.getTeamMembers(team.id.toString());
          // The response.data.members array contains all members for this team
          return { teamId: team.id, count: response.data.members.length };
        } catch (error) {
          console.error(`Failed to fetch members for team ${team.id}:`, error);
          return { teamId: team.id, count: getTeamMembersCount(team.id) };
        }
      });

      // Wait for all promises to resolve
      const results = await Promise.all(countPromises);

      // Convert array of results to an object where keys are team IDs and values are counts
      const countsObject = results.reduce((acc, { teamId, count }) => {
        acc[teamId] = count;
        return acc;
      }, {} as Record<number, number>);

      setTeamMemberCounts(countsObject);
    } catch (error) {
      console.error("Failed to fetch team member counts:", error);
    } finally {
      setLoadingCounts(false);
    }
  };

  // Update the useEffect to fetch team member counts once teams are loaded
  useEffect(() => {
    if (teams.length > 0) {
      fetchTeamMemberCounts();
    }
  }, [teams]);

  // Add a function to handle refreshing team member counts
  const handleRefreshCounts = () => {
    fetchTeamMemberCounts();
  };

  if (loading && teams.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Teams Management</h2>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  return (
    <>
      <ManagementBase
        title="Teams Management"
        description={`Manage teams and their members (${totalTeams} teams, ${totalTeamMembers} members)`}
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
                  <TableHead>
                    <div className="flex items-center space-x-1">
                      <span>Members</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 text-muted-foreground hover:text-primary"
                        onClick={handleRefreshCounts}
                        disabled={loadingCounts}
                        title="Refresh member counts"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableHead>
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
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant="secondary"
                                className="cursor-pointer hover:bg-secondary/80"
                                onClick={() => handleViewTeamMembers(team.id)}
                              >
                                {loadingCounts &&
                                teamMemberCounts[team.id] === undefined ? (
                                  <span className="flex items-center">
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Loading...
                                  </span>
                                ) : (
                                  getTeamMembersCount(team.id)
                                )}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Click to view team members</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>{formatDate(team.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8 cursor-pointer"
                            title="View Team Members"
                            onClick={() => handleViewTeamMembers(team.id)}
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8 cursor-pointer"
                            title="Edit Team"
                            onClick={() => handleEditClick(team)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8 cursor-pointer text-destructive hover:bg-destructive/10"
                            title="Delete Team"
                            onClick={() => handleDeleteClick(team)}
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

      {/* Create Team Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Enter team details to create a new team.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right">
                Team Name*
              </label>
              <div className="col-span-3">
                <Input
                  id="name"
                  name="name"
                  value={newTeam.name}
                  onChange={(e) => handleInputChange(e, false)}
                  className={formErrors.name ? "border-red-500" : ""}
                  required
                />
                {formErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <label htmlFor="description" className="text-right pt-2">
                Description
              </label>
              <div className="col-span-3">
                <Textarea
                  id="description"
                  name="description"
                  value={newTeam.description || ""}
                  onChange={(e) => handleInputChange(e, false)}
                  placeholder="Brief description of the team and its purpose"
                  rows={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addTeam} disabled={loading}>
              {loading ? "Creating..." : "Create Team"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>Update team information.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-name" className="text-right">
                Team Name*
              </label>
              <div className="col-span-3">
                <Input
                  id="edit-name"
                  name="name"
                  value={editedTeam.name}
                  onChange={(e) => handleInputChange(e, true)}
                  className={formErrors.name ? "border-red-500" : ""}
                  required
                />
                {formErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <label htmlFor="edit-description" className="text-right pt-2">
                Description
              </label>
              <div className="col-span-3">
                <Textarea
                  id="edit-description"
                  name="description"
                  value={editedTeam.description || ""}
                  onChange={(e) => handleInputChange(e, true)}
                  placeholder="Brief description of the team and its purpose"
                  rows={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateTeam} disabled={loading}>
              {loading ? "Updating..." : "Update Team"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Team Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the team
              {teamToDelete && (
                <span className="font-semibold"> "{teamToDelete.name}"</span>
              )}
              and remove all members. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTeamToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteTeam}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Deleting..." : "Delete Team"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
