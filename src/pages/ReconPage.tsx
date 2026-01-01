import { useLocation } from "react-router-dom";

export function ReconPage() {
  const location = useLocation();
  const title =
    location.pathname.split("/").pop()?.replace("-", " ") || "Recon";
  const formattedTitle = title.charAt(0).toUpperCase() + title.slice(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-capitalize">
          {formattedTitle}
        </h1>
        <p className="text-muted-foreground">
          Tools and analysis for {formattedTitle}.
        </p>
      </div>

      <div className="flex items-center justify-center h-[50vh] border border-dashed rounded-lg">
        <p className="text-muted-foreground">
          Content for {formattedTitle} coming soon...
        </p>
      </div>
    </div>
  );
}
