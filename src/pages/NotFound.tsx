import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="flex items-center justify-center gap-20 py-20">
      <img src="/404statusdog.jpg" alt="404" className="w-[500px]" />
      <div className="flex flex-col items-center justify-center">
        <p className="text-muted-foreground">
          Ruh Roh. The page you are looking for does not exist.
        </p>
        <Button asChild className="mt-4">
          <Link to="/">Go to Home</Link>
        </Button>
      </div>
    </section>
  );
}
