import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import InfiniteCardMarquee, {
  CardItem,
} from "@/components/ui/infinite-card-marquee";
import { ContainerTextFlip } from "@/components/ui/container-text-flip";

const eventCards: CardItem[] = [
  {
    id: 1,
    title: "Music Festival",
    description: "3-day outdoor event",
    content: (
      <div className="p-2">
        <p className="text-sm">
          Experience live performances from top artists across multiple genres
          in a vibrant festival atmosphere.
        </p>
      </div>
    ),
    footer: (
      <div className="flex justify-between w-full">
        <Badge variant="outline">Music</Badge>
        <Badge variant="outline">Jul 15-17</Badge>
      </div>
    ),
  },
  {
    id: 2,
    title: "Tech Conference",
    description: "Industry networking",
    content: (
      <div className="p-2">
        <p className="text-sm">
          Connect with industry leaders and discover the latest innovations in
          technology at our premier conference.
        </p>
      </div>
    ),
    footer: (
      <div className="flex justify-between w-full">
        <Badge variant="outline">Tech</Badge>
        <Badge variant="outline">Aug 10-12</Badge>
      </div>
    ),
  },
  {
    id: 3,
    title: "Food & Wine Festival",
    description: "Culinary excellence",
    content: (
      <div className="p-2">
        <p className="text-sm">
          Indulge in gourmet cuisine and fine wines from acclaimed chefs and
          wineries from around the world.
        </p>
      </div>
    ),
    footer: (
      <div className="flex justify-between w-full">
        <Badge variant="outline">Food</Badge>
        <Badge variant="outline">Sep 5-7</Badge>
      </div>
    ),
  },
  {
    id: 4,
    title: "Art Exhibition",
    description: "Contemporary showcase",
    content: (
      <div className="p-2">
        <p className="text-sm">
          Explore thought-provoking works from emerging and established artists
          in our curated gallery space.
        </p>
      </div>
    ),
    footer: (
      <div className="flex justify-between w-full">
        <Badge variant="outline">Art</Badge>
        <Badge variant="outline">Oct 20-25</Badge>
      </div>
    ),
  },
  {
    id: 5,
    title: "Wellness Retreat",
    description: "Mind & body balance",
    content: (
      <div className="p-2">
        <p className="text-sm">
          Rejuvenate your mind and body with guided meditation, yoga, and
          holistic health workshops.
        </p>
      </div>
    ),
    footer: (
      <div className="flex justify-between w-full">
        <Badge variant="outline">Wellness</Badge>
        <Badge variant="outline">Nov 12-14</Badge>
      </div>
    ),
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <section className="py-24">
        <div className="flex flex-col items-center">
          <div className="max-w-6xl space-y-4">
            <h1 className="text-2xl font-bold md:text-3xl lg:text-4xl">
              Find Your Next{" "}
              <ContainerTextFlip
                words={["local", "tech", "community"]}
                className="text-2xl md:text-3xl lg:text-4xl"
              />{" "}
              Event
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl">
              Discover and book the best events happening near you. From
              concerts to workshops, we've got you covered.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold">Trending Events</h2>
            <p className="text-muted-foreground">
              Discover what's popular this season
            </p>
          </div>
          <div className="w-full mb-12">
            <InfiniteCardMarquee
              cards={eventCards}
              speed="normal"
              cardWidth={280}
              pauseOnHover={true}
              scaleOnHover={true}
              gap={24}
              direction="left"
              orientation="horizontal"
              autoFill={true}
            />
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold">Browse by Category</h2>
            <p className="text-muted-foreground">
              Find events that match your interests
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              "Music",
              "Business",
              "Food & Drink",
              "Arts",
              "Sports",
              "Technology",
            ].map((category) => (
              <div
                key={category}
                className="flex flex-col items-center justify-center p-6 rounded-lg border bg-card hover:bg-accent/20 transition cursor-pointer"
              >
                <span className="text-lg font-medium">{category}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <h2 className="text-3xl font-bold">Never Miss an Event</h2>
            <p className="text-muted-foreground">
              Subscribe to our newsletter and get personalized event
              recommendations directly to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Your email address"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <Button>Subscribe</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
