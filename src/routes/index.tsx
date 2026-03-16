import { createFileRoute } from "@tanstack/react-router";
import Hero from "../features/Hero";
import Landing from "../features/Landing";
import Footer from "../features/Footer";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  return (
    <div>
      <Landing />
      <Hero />
      <Footer />
    </div>
  );
}
