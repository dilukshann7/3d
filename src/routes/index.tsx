import { createFileRoute, useNavigate } from "@tanstack/react-router";
import ModelSelect from "../features/viewer/components/ModelSelect";
import type { ModelConfig } from "../features/viewer/data/models";
import { ROUTES } from "./routerPaths";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  const navigate = useNavigate();

  function handleSelect(model: ModelConfig) {
    navigate({ to: ROUTES.viewerById, params: { modelId: model.id } });
  }

  return <ModelSelect onSelect={handleSelect} />;
}
