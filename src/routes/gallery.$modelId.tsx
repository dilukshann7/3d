import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { MODELS } from "../features/viewer/data/models";
import { ROUTES } from "./routerPaths";

export const Route = createFileRoute("/gallery/$modelId")({
  component: GalleryPage,
});

function GalleryPage() {
  const { modelId } = Route.useParams();
  const navigate = useNavigate();
  const model = MODELS.find((m) => m.id === modelId);

  if (!model) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050a14] text-white">
        Model not found.{" "}
        <button
          onClick={() => navigate({ to: ROUTES.home })}
          className="ml-2 underline text-sky-400 hover:text-sky-300"
        >
          Go back
        </button>
      </div>
    );
  }

  const images = model.irlImages || [model.image];

  return (
    <div className="min-h-screen bg-[#050a14] text-slate-50 selection:bg-sky-500/30">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(56,189,248,0.1),transparent)]" />
      
      <header className="sticky top-0 z-20 mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8 lg:pt-5">
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-slate-950/55 px-3 py-2.5 shadow-[0_8px_32px_rgba(2,6,23,0.4)] backdrop-blur-xl sm:px-4 lg:px-5">
          <div className="flex items-center gap-3">
            <Link
              to={ROUTES.viewerById}
              params={{ modelId: model.id }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-white/5 text-slate-300 transition duration-200 hover:border-white/16 hover:bg-white/10 hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-[15px] font-semibold tracking-tight text-white sm:text-base">
                {model.name} Gallery
              </h1>
              <p className="text-[11px] text-slate-400">{images.length} photos</p>
            </div>
          </div>
          <Link
            to={ROUTES.home}
            className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/4 px-3.5 py-2 text-[12px] font-medium tracking-wide text-slate-300 transition hover:border-white/16 hover:bg-white/8 hover:text-white"
          >
            Catalog
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
          {images.map((img, i) => (
            <div
              key={i}
              className="mb-6 break-inside-avoid overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-xl ring-1 ring-white/5 transition-all hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl hover:shadow-sky-500/10"
            >
              <img
                src={img}
                alt={`${model.name} shot ${i + 1}`}
                className="w-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
