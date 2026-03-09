import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MODELS } from "../features/viewer/data/models";
import ModelViewer from "../features/viewer/components/ModelViewer";
import { ROUTES } from "./routerPaths";

export const Route = createFileRoute("/viewer/$modelId")({
  component: ViewerPage,
});

function ViewerPage() {
  const { modelId } = Route.useParams();
  const navigate = useNavigate();
  const model = MODELS.find((m) => m.id === modelId);

  if (!model) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
        Model not found.{" "}
        <button
          onClick={() => navigate({ to: ROUTES.home })}
          className="ml-2 underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <ModelViewer model={model} onBack={() => navigate({ to: ROUTES.home })} />
  );
}
