import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import eventsApi from "@/api/events";
import { Category } from "@/types/events";
import { EventFormProps } from "@/types/eventCard";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  location: z.string().min(1, "Location is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  price: z.coerce.number().min(0, "Price must be 0 or greater"),
  max_attendees: z.coerce.number().min(1, "Must allow at least 1 attendee"),
  status: z.enum(["published", "draft"]),
  category: z.string().min(1, "Event type is required"),
  is_public: z.boolean(),
  event_img_url: z.string().optional(),
  event_image: z.instanceof(File).optional(), // File input
});

type FormData = z.infer<typeof formSchema>;

export default function EventForm({
  event,
  isEditing = false,
}: EventFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    eventsApi.getEventCategories().then((res) => {
      setCategories(res.data.categories);
    });
  }, []);

  // Format datetime string for input fields
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16); // Format: "YYYY-MM-DDThh:mm"
  };

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      // Clear the URL input when file is selected
      form.setValue("event_img_url", "");
    }
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle URL input change
  const handleUrlChange = (value: string) => {
    if (value) {
      // Clear file selection when URL is entered
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  // Define the form with defaults based on whether we're editing
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: event?.title || "",
      description: event?.description || "",
      location: event?.location || "",
      start_time: event?.start_time ? formatDateForInput(event.start_time) : "",
      end_time: event?.end_time ? formatDateForInput(event.end_time) : "",
      price: event?.price ?? 0,
      max_attendees: event?.max_attendees ?? 10,
      status: (event?.status as "draft" | "published") || "draft",
      category: event?.category || "",
      is_public: event?.is_public ?? true,
      event_img_url: event?.event_img_url || "",
    },
  });

  async function onSubmit(data: FormData) {
    try {
      setIsSubmitting(true);
      setError(null);

      // Format dates as ISO strings
      const formattedData = {
        ...data,
        start_time: new Date(data.start_time).toISOString(),
        end_time: new Date(data.end_time).toISOString(),
      };

      if (isEditing && event?.id) {
        // Update existing event
        if (selectedFile) {
          // Use FormData for file upload
          const formData = new FormData();
          formData.append("event_image", selectedFile);

          // Add other fields
          Object.entries(formattedData).forEach(([key, value]) => {
            if (key !== "event_img_url" && key !== "event_image") {
              formData.append(key, value?.toString() || "");
            }
          });

          await eventsApi.updateEventWithFile(event.id.toString(), formData);
        } else {
          // Update without file
          await eventsApi.updateEvent(event.id.toString(), formattedData);
        }
      } else {
        // Create new event
        if (selectedFile) {
          // Use FormData for file upload
          const formData = new FormData();
          formData.append("event_image", selectedFile);

          // Add other fields
          Object.entries(formattedData).forEach(([key, value]) => {
            if (key !== "event_img_url" && key !== "event_image") {
              formData.append(key, value?.toString() || "");
            }
          });

          await eventsApi.createEventWithFile(formData);
        } else {
          // Create without file
          await eventsApi.createEvent(formattedData);
        }
      }

      // Redirect to events page
      navigate("/events");
    } catch (error: unknown) {
      console.error(
        `Failed to ${isEditing ? "update" : "create"} event:`,
        error
      );
      setError(
        (error as Error)?.message ||
          `Failed to ${
            isEditing ? "update" : "create"
          } event. Please try again.`
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        {isEditing ? "Edit Event" : "Create New Event"}
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Event title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe your event"
                    className="min-h-32"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="Event location" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="start_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="end_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="max_attendees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Attendees</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" placeholder="10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <FormItem>
              <FormLabel>Event Image</FormLabel>
              <FormDescription>
                Upload an image file or provide a URL. File uploads are
                preferred.
              </FormDescription>

              {/* File Upload */}
              <div className="space-y-2">
                <FormLabel className="text-sm font-medium">
                  Upload Image File
                </FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                <FormDescription>
                  Supported formats: JPEG, PNG, GIF, WebP. Max size: 5MB.
                </FormDescription>
              </div>

              {/* Image Preview */}
              {(previewUrl || event?.event_img_url) && (
                <div className="mt-4">
                  <FormLabel className="text-sm font-medium">
                    Image Preview
                  </FormLabel>
                  <div className="mt-2">
                    <img
                      src={previewUrl || event?.event_img_url}
                      alt="Event preview"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                  </div>
                </div>
              )}

              {/* URL Input */}
              <div className="space-y-2">
                <FormLabel className="text-sm font-medium">
                  Or Provide Image URL
                </FormLabel>
                <FormField
                  control={form.control}
                  name="event_img_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="Enter URL for event image"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleUrlChange(e.target.value);
                          }}
                          disabled={!!selectedFile}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a URL to an image that represents your event
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormItem>
          </div>

          <FormField
            control={form.control}
            name="is_public"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Public Event</FormLabel>
                  <FormDescription>
                    Make this event visible to everyone
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Save as Draft</SelectItem>
                    <SelectItem value="published">Publish Now</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Draft events are not visible to attendees until published
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate("/dashboard")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : isEditing
                ? "Update Event"
                : "Create Event"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
