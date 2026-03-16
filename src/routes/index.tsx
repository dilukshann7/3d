import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ModelConfig } from "../features/viewer/data/models";
import { ROUTES } from "./routerPaths";
import Hero from "../features/Hero";
import Landing from "../features/Landing";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  const navigate = useNavigate();

  function handleSelect(model: ModelConfig) {
    navigate({ to: ROUTES.viewerById, params: { modelId: model.id } });
  }

  return (
    <div>
      <Landing />
      <Hero />
    </div>
  );
}
