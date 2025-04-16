import EventForm from "@/components/events/EventForm";

export default function CreateEvent() {
  return (
    <section className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Create Event</h1>
      <EventForm />
    </section>
  );
}
