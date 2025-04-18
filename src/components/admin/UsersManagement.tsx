import { useState, useEffect } from "react";
import { User, UpdateUserParams, PromoteToAdminParams } from "@/types/users";
import { UserPlus, EyeIcon, Pencil, Trash2 } from "lucide-react";
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
import ManagementBase from "./ManagementBase";
import usersApi from "@/api/users";
import authApi from "@/api/auth";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

interface UsersManagementProps {
  users: User[];
  totalUsers?: number;
}

export default function UsersManagement({
  users: initialUsers,
  totalUsers: initialTotalUsers,
}: UsersManagementProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [totalUsers, setTotalUsers] = useState<number>(
    initialTotalUsers || initialUsers.length
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editedUser, setEditedUser] = useState({
    username: "",
    email: "",
    is_site_admin: false,
  });
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [formErrors, setFormErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
  }>({});

  // Fetch the total count from the admin dashboard if not provided
  useEffect(() => {
    const fetchTotalCount = async () => {
      if (initialTotalUsers) {
        return; // If count is already provided, don't fetch
      }

      try {
        const response = await usersApi.getAdminDashboardData();
        const { total_users } = response.data.data;
        setTotalUsers(total_users);
      } catch (error: unknown) {
        console.error("Failed to fetch total user count:", error);
      }
    };

    fetchTotalCount();
  }, [initialTotalUsers]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user types
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = () => {
    const errors: {
      username?: string;
      email?: string;
      password?: string;
    } = {};

    if (!newUser.username.trim()) {
      errors.username = "Username is required";
    }

    if (!newUser.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(newUser.email)) {
      errors.email = "Email is invalid";
    }

    if (!newUser.password.trim()) {
      errors.password = "Password is required";
    } else if (newUser.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const addUser = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create a new user by using the auth register endpoint
      const response = await authApi.register({
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
      });

      // Optimistically add the new user to the list
      const createdUser: User = {
        id: response.data.data.user.id,
        username: newUser.username,
        email: newUser.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_site_admin: false,
      };

      setUsers((prevUsers) => [...prevUsers, createdUser]);
      setTotalUsers((prev) => prev + 1);
      setDialogOpen(false);
      setNewUser({ username: "", email: "", password: "" });

      // Show success message
      toast.success(`User ${newUser.username} created successfully`);
    } catch (error: unknown) {
      const errorMessage =
        typeof error === "object" && error !== null
          ? (error as any).response?.data?.msg ||
            (error as any).response?.data?.message ||
            (error as any).message ||
            "Failed to create user"
          : "Failed to create user";

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const deleteUser = async () => {
    if (!userToDelete) return;

    try {
      setLoading(true);
      setError(null);

      // Optimistically remove the user from the list
      setUsers((prevUsers) =>
        prevUsers.filter((user) => user.id !== userToDelete.id)
      );
      setTotalUsers((prev) => Math.max(0, prev - 1));

      // Get the token from localStorage
      const token = localStorage.getItem("token");

      // If no token is available, we should handle it gracefully
      if (!token) {
        throw new Error("You must be logged in to delete users");
      }

      // Make the API call to delete the user
      await usersApi.deleteUser(userToDelete.id.toString());

      // Show success message
      toast.success(`User ${userToDelete.username} deleted successfully`);

      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error: unknown) {
      // Revert the optimistic update on error
      setUsers(initialUsers);
      setTotalUsers(initialTotalUsers || initialUsers.length);

      const errorMessage =
        typeof error === "object" && error !== null
          ? (error as any).response?.data?.msg ||
            (error as any).response?.data?.message ||
            (error as any).message ||
            "Failed to delete user"
          : "Failed to delete user";

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user: User) => {
    setUserToEdit(user);
    setEditedUser({
      username: user.username,
      email: user.email,
      is_site_admin: user.is_site_admin || false,
    });
    setEditDialogOpen(true);
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateEditForm = () => {
    const errors: {
      username?: string;
      email?: string;
    } = {};

    if (!editedUser.username.trim()) {
      errors.username = "Username is required";
    }

    if (!editedUser.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(editedUser.email)) {
      errors.email = "Email is invalid";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdminStatusChange = (checked: boolean | "indeterminate") => {
    setEditedUser((prev) => ({
      ...prev,
      is_site_admin: checked === true,
    }));
  };

  const updateUser = async () => {
    if (!userToEdit || !validateEditForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Prepare the update parameters
      const updateParams: UpdateUserParams = {
        username: editedUser.username,
        email: editedUser.email,
      };

      // Check if admin status has changed
      const adminStatusChanged =
        userToEdit.is_site_admin !== editedUser.is_site_admin;

      // Optimistically update the user in the list
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userToEdit.id
            ? {
                ...user,
                username: editedUser.username,
                email: editedUser.email,
                is_site_admin: editedUser.is_site_admin,
                updated_at: new Date().toISOString(),
              }
            : user
        )
      );

      // Make the API call to update the user details
      await usersApi.updateUser(userToEdit.id.toString(), updateParams);

      // If admin status changed, make an additional API call to update admin status
      if (adminStatusChanged) {
        const promoteParams: PromoteToAdminParams = {
          is_site_admin: editedUser.is_site_admin,
        };
        await usersApi.promoteToAdmin(userToEdit.id.toString(), promoteParams);

        if (editedUser.is_site_admin) {
          // Show admin promotion success message
          toast.success(
            `User ${editedUser.username} promoted to admin successfully`
          );
        } else {
          // Show admin demotion success message
          toast.success(
            `User ${editedUser.username} removed from admin role successfully`
          );
        }
      } else {
        // Show regular update success message
        toast.success(`User ${editedUser.username} updated successfully`);
      }

      setEditDialogOpen(false);
      setUserToEdit(null);
      setEditedUser({ username: "", email: "", is_site_admin: false });
    } catch (error: any) {
      // Revert the optimistic update on error
      setUsers(initialUsers);
      setTotalUsers(initialTotalUsers || initialUsers.length);

      const errorMessage =
        error.response?.data?.msg ||
        error.response?.data?.message ||
        error.message ||
        "Failed to update user";

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ManagementBase
        title="Users Management"
        description={`Manage site users and their permissions (${totalUsers} total)`}
        addButtonLabel="Add User"
        addButtonIcon={<UserPlus className="mr-2 h-4 w-4" />}
        onAddButtonClick={() => setDialogOpen(true)}
        loading={loading}
        error={error}
      >
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.id}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.is_site_admin ? (
                          <Badge className="bg-primary">Admin</Badge>
                        ) : (
                          <Badge variant="outline">User</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8 cursor-pointer"
                            title="View User"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8 cursor-pointer"
                            title="Edit User"
                            onClick={() => handleEditClick(user)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8 cursor-pointer text-destructive hover:bg-destructive/10"
                            title="Delete User"
                            onClick={() => handleDeleteClick(user)}
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

      {/* Add User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Enter user details to create a new account.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="username" className="text-right">
                Username
              </label>
              <div className="col-span-3">
                <Input
                  id="username"
                  name="username"
                  value={newUser.username}
                  onChange={handleInputChange}
                  className={formErrors.username ? "border-red-500" : ""}
                  required
                />
                {formErrors.username && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.username}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="email" className="text-right">
                Email
              </label>
              <div className="col-span-3">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={newUser.email}
                  onChange={handleInputChange}
                  className={formErrors.email ? "border-red-500" : ""}
                  required
                />
                {formErrors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.email}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="password" className="text-right">
                Password
              </label>
              <div className="col-span-3">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={newUser.password}
                  onChange={handleInputChange}
                  className={formErrors.password ? "border-red-500" : ""}
                  required
                />
                {formErrors.password && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.password}
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addUser} disabled={loading}>
              {loading ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update the user's information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-username" className="text-right">
                Username
              </label>
              <div className="col-span-3">
                <Input
                  id="edit-username"
                  name="username"
                  value={editedUser.username}
                  onChange={handleEditInputChange}
                  className={formErrors.username ? "border-red-500" : ""}
                  required
                />
                {formErrors.username && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.username}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-email" className="text-right">
                Email
              </label>
              <div className="col-span-3">
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  value={editedUser.email}
                  onChange={handleEditInputChange}
                  className={formErrors.email ? "border-red-500" : ""}
                  required
                />
                {formErrors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.email}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="admin-status" className="text-right">
                Admin Access
              </label>
              <div className="col-span-3">
                <Checkbox
                  id="admin-status"
                  checked={editedUser.is_site_admin}
                  onCheckedChange={handleAdminStatusChange}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateUser} disabled={loading}>
              {loading ? "Updating..." : "Update User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the user
              {userToDelete && (
                <span className="font-semibold"> {userToDelete.username}</span>
              )}
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
