import { createFileRoute } from "@tanstack/react-router";
import Hero from "../features/Hero";
import Landing from "../features/Landing";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  return (
    <div>
      <Landing />
      <Hero />
    </div>
  );
}
