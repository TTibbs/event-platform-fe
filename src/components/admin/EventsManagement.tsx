import { useState } from "react";
import { Event } from "@/types/events";
import { Calendar, EyeIcon, Pencil, Trash2 } from "lucide-react";
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

interface EventsManagementProps {
  events: Event[];
}

export default function EventsManagement({ events }: EventsManagementProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getEventStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-500">Published</Badge>;
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleCreateEvent = () => {
    // Implement create event functionality
    console.log("Create event clicked");
  };

  return (
    <ManagementBase
      title="Events Management"
      description="Manage all events on the platform"
      addButtonLabel="Create Event"
      addButtonIcon={<Calendar className="mr-2 h-4 w-4" />}
      onAddButtonClick={handleCreateEvent}
      loading={loading}
      error={error}
    >
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    No events found
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.id}</TableCell>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>{event.team_name}</TableCell>
                    <TableCell>{formatDate(event.start_time)}</TableCell>
                    <TableCell>{getEventStatusBadge(event.status)}</TableCell>
                    <TableCell>{event.creator_username}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-8 cursor-pointer"
                          title="View Event"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-8 cursor-pointer"
                          title="Edit Event"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-8 cursor-pointer text-destructive hover:bg-destructive/10"
                          title="Delete Event"
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
