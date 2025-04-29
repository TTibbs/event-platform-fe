import { ContainerTextFlip } from "@/components/ui/container-text-flip";
import { useEffect, useState } from "react";
import { Event } from "@/types/events";
import { eventsApi } from "@/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { testimonials } from "@/lib/mockData";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const navigate = useNavigate();

  const formattedDate = (date: string) => {
    return format(new Date(date), "MMM d, yyyy");
  };

  const formattedTime = (date: string) => {
    return format(new Date(date), "h:mm a");
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await eventsApi.getAllEvents();
        setEvents(response.data.events || []);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchEvents();
  }, []);

  const featuredEvents = events.slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-b from-background to-muted">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="max-w-3xl space-y-4">
              <h1 className="text-3xl font-bold md:text-4xl lg:text-5xl">
                Find Your Next{" "}
                <ContainerTextFlip
                  words={["Local", "Tech", "Community"]}
                  className="text-3xl md:text-4xl lg:text-5xl"
                />{" "}
                Event
              </h1>
              <p className="text-xl text-muted-foreground md:text-2xl">
                Discover and book the best events happening near you. From
                concerts to workshops, we've got you covered.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">Featured Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredEvents.map((event) => (
              <Card key={event.id}>
                <CardHeader>
                  <CardTitle>{event.title}</CardTitle>
                  <CardDescription>{event.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <img
                    src={event.event_img_url}
                    alt={event.title}
                    className="w-full h-40 object-cover"
                  />
                  <div className="flex items-center text-sm pt-2">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div className="ml-0">
                      <p>
                        Duration: {formattedDate(event.start_time)},{" "}
                        {formattedTime(event.start_time)} -{" "}
                        {formattedTime(event.end_time)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-2 cursor-pointer"
                    onClick={() => navigate(`/events/${event.id}`)}
                  >
                    Learn More
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-4">Testimonials</h1>
          <p className="text-muted-foreground mb-8">
            Find out what our users have to say about us
          </p>
          <InfiniteMovingCards items={testimonials} speed="slow" />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 border bg-gradient-to-b from-background to-muted">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-4 text-center">
            Looking for your next event?
          </h1>
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/login")}
              className="cursor-pointer"
            >
              Sign In
            </Button>
            <Button
              onClick={() => navigate("/register")}
              className="cursor-pointer"
            >
              Sign Up
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
