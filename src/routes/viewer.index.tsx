import { Link, createFileRoute } from "@tanstack/react-router";
import { ROUTES } from "./routerPaths";

export const Route = createFileRoute("/viewer/")({
  component: ViewerIndexPage,
});

function ViewerIndexPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-950 px-6 text-slate-100">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-[0_20px_60px_rgba(2,6,23,0.5)] backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          Viewer
        </p>
        <h1 className="mt-3 font-[Sora] text-3xl font-semibold tracking-tight text-white">
          Select a model first
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          Open the catalog and pick a model before entering the 3D viewer route.
        </p>
        <Link
          to={ROUTES.home}
          className="mt-6 inline-flex rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/15"
        >
          Open catalog
        </Link>
      </div>
    </div>
  );
}
