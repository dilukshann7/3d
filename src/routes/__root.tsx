import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
import { ROUTES } from "./routerPaths";

export const Route = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: NotFoundPage,
});

function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-950 px-6 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-[0_20px_60px_rgba(2,6,23,0.5)] backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          404
        </p>
        <h1 className="mt-3 font-[Sora] text-3xl font-semibold tracking-tight text-white">
          Page not found
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          The route does not exist. Use the catalog to open a model viewer.
        </p>
        <Link
          to={ROUTES.home}
          className="mt-6 inline-flex rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/15"
        >
          Back to catalog
        </Link>
      </div>
    </div>
  );
}
