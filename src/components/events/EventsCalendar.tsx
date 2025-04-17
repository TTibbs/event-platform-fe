import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, CalendarIcon, ListIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, isFuture, isPast, compareAsc } from "date-fns";
import usersApi from "@/api/users";
import eventsApi from "@/api/events";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Registration {
  id: number;
  event_id: number;
  user_id: number;
  registration_time: string;
  status: string;
  start_time: string;
  end_time: string;
  event_title: string;
  event_description: string;
  event_location: string;
  event_status: string;
  team_name: string;
}

function EventsCalendar({ userId }: { userId: string }) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDayEvents, setSelectedDayEvents] = useState<Registration[]>(
    []
  );
  const navigate = useNavigate();

  // Fetch user's event registrations
  useEffect(() => {
    const fetchRegistrations = async () => {
      setIsLoading(true);
      try {
        const response = await usersApi.getUserEventRegistrations(userId);
        setRegistrations(response.data.registrations || []);
      } catch (error) {
        console.error("Failed to fetch event registrations:", error);
        toast.error("Failed to load your registered events");
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchRegistrations();
    }
  }, [userId]);

  // Get dates with events for highlighting in the calendar
  const getDatesWithEvents = () => {
    return registrations
      .filter((reg) => reg && reg.start_time) // Filter out registrations without valid start_time
      .map((reg) => new Date(reg.start_time));
  };

  // Update selected day events when date changes
  useEffect(() => {
    if (date) {
      const selectedDate = new Date(date);
      selectedDate.setHours(0, 0, 0, 0);

      const eventsOnSelectedDay = registrations
        .filter((reg) => reg && reg.start_time) // Filter out registrations without valid start_time
        .filter((reg) => {
          const eventDate = new Date(reg.start_time);
          eventDate.setHours(0, 0, 0, 0);
          return eventDate.getTime() === selectedDate.getTime();
        });

      setSelectedDayEvents(eventsOnSelectedDay);
    } else {
      setSelectedDayEvents([]);
    }
  }, [date, registrations]);

  // Handle canceling registration
  const handleCancelRegistration = async (registrationId: number) => {
    try {
      await eventsApi.cancelRegistration(registrationId.toString());
      // Remove the canceled registration from state
      setRegistrations((regs) =>
        regs.filter((reg) => reg.id !== registrationId)
      );
      toast.success("Registration canceled successfully");
    } catch (error) {
      console.error("Failed to cancel registration:", error);
      toast.error("Failed to cancel registration");
    }
  };

  // View event details
  const viewEventDetails = (eventId: number) => {
    navigate(`/events/${eventId}`);
  };

  // Sort and group events into upcoming and past
  const upcomingEvents = registrations
    .filter(
      (reg) => reg && reg.start_time && isFuture(new Date(reg.start_time))
    )
    .sort((a, b) => compareAsc(new Date(a.start_time), new Date(b.start_time)));

  const pastEvents = registrations
    .filter((reg) => reg && reg.start_time && isPast(new Date(reg.start_time)))
    .sort((a, b) => compareAsc(new Date(b.start_time), new Date(a.start_time)));

  // Event card component to reuse for both views
  const EventCard = ({ registration }: { registration: Registration }) => (
    <div
      key={registration.id}
      className="p-3 border rounded-lg flex justify-between items-start mb-3"
    >
      <div>
        <h4 className="font-medium">{registration.event_title}</h4>
        <p className="text-sm text-muted-foreground">
          {format(new Date(registration.start_time), "MMM d, yyyy")} •{" "}
          {format(new Date(registration.start_time), "h:mm a")} -
          {format(new Date(registration.end_time), "h:mm a")}
        </p>
        {registration.event_location && (
          <p className="text-xs text-muted-foreground mt-1">
            {registration.event_location}
          </p>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => viewEventDetails(registration.event_id)}
          >
            View details
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleCancelRegistration(registration.id)}
            className="text-red-600"
          >
            Cancel registration
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Events Calendar</CardTitle>
        <CardDescription>
          View and manage your registered events
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="calendar" className="w-full">
          <div className="px-6 pt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="calendar">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Calendar View
              </TabsTrigger>
              <TabsTrigger value="list">
                <ListIcon className="h-4 w-4 mr-2" />
                List View
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="calendar" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                  modifiers={{
                    eventDay: getDatesWithEvents(),
                  }}
                  modifiersStyles={{
                    eventDay: {
                      fontWeight: "bold",
                      backgroundColor: "rgba(59, 130, 246, 0.1)",
                      borderRadius: "100%",
                      color: "rgb(59, 130, 246)",
                    },
                  }}
                />
              </div>
              <div className="space-y-4">
                <h3 className="font-medium">
                  {date ? format(date, "MMMM d, yyyy") : "Select a date"}
                </h3>

                {isLoading ? (
                  <div>Loading events...</div>
                ) : (
                  <>
                    {selectedDayEvents.length === 0 ? (
                      <p className="text-muted-foreground">
                        No events on this day
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {selectedDayEvents
                          .filter((registration) => registration)
                          .map((registration) => (
                            <EventCard
                              key={registration.id}
                              registration={registration}
                            />
                          ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="list" className="px-6 pb-6">
            {isLoading ? (
              <div>Loading events...</div>
            ) : (
              <>
                {registrations.length === 0 ? (
                  <p className="text-muted-foreground">
                    You have no registered events
                  </p>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-4 flex items-center">
                        <span className="text-green-600 inline-block mr-2">
                          ●
                        </span>
                        Upcoming Events
                      </h3>
                      {upcomingEvents.length === 0 ? (
                        <p className="text-muted-foreground mb-3">
                          No upcoming events
                        </p>
                      ) : (
                        <ScrollArea className="h-[250px] rounded-md border p-3">
                          {upcomingEvents.map((registration) => (
                            <EventCard
                              key={registration.id}
                              registration={registration}
                            />
                          ))}
                        </ScrollArea>
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold mb-4 flex items-center">
                        <span className="text-gray-400 inline-block mr-2">
                          ●
                        </span>
                        Past Events
                      </h3>
                      {pastEvents.length === 0 ? (
                        <p className="text-muted-foreground mb-3">
                          No past events
                        </p>
                      ) : (
                        <ScrollArea className="h-[250px] rounded-md border p-3">
                          {pastEvents.map((registration) => (
                            <EventCard
                              key={registration.id}
                              registration={registration}
                            />
                          ))}
                        </ScrollArea>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default EventsCalendar;
