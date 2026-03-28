import {
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import {
  OrbitControls,
  Html,
  PerspectiveCamera,
  useProgress,
  useGLTF,
  useAnimations,
} from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import type {
  MaterialFinish,
  ModelConfig,
  ModelMetalTextureTargets,
  ModelTextureOption,
} from "../data/models";
import { DEFAULT_VIEWER_ENVIRONMENT_URL } from "../data/models";
import { prepareModelScene } from "../utils/modelScene";
import StudioEnvironment from "./StudioEnvironment";
import { useNavigate } from "@tanstack/react-router";
import { ROUTES } from "../../../routes/routerPaths";

// ─── Types ────────────────────────────────────────────────────────────────────

type FrameData = {
  height: number;
  radius: number;
  boundingRadius: number;
  centerY: number;
};

type SurfaceTextureSelection = {
  surface: "metal" | "glass";
  texture?: ModelTextureOption;
  targets?: ModelMetalTextureTargets;
};

type MatKind = "glass" | "water" | "concrete" | "metal" | "generic";

type PreparedMaterial = THREE.MeshStandardMaterial & THREE.MeshPhysicalMaterial;

type MaterialSnapshot = {
  kind: MatKind;
  color: string;
  map: THREE.Texture | null;
  roughnessMap: THREE.Texture | null;
  metalnessMap: THREE.Texture | null;
  normalMap: THREE.Texture | null;
  bumpMap: THREE.Texture | null;
  bumpScale: number;
  normalScale: THREE.Vector2;
  metalness: number;
  roughness: number;
  reflectivity: number;
  envMapIntensity: number;
  clearcoat: number;
  clearcoatRoughness: number;
  transmission: number;
  opacity: number;
  transparent: boolean;
  side: THREE.Side;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_TEXTURE_OPTIONS: ModelTextureOption[] = [];

const GLASS = {
  BASE_COLOR: "#ffffff",
  ROUGHNESS: 0.05,
  TRANSMISSION: 0.98,
  THICKNESS: 0.12,
  REFLECTIVITY: 0.55,
  ENV_INTENSITY: 0.18,
  CLEARCOAT: 0.45,
  CLEARCOAT_ROUGHNESS: 0.12,
} as const;

const DEFAULT_FRAME: FrameData = {
  height: 2,
  radius: 1,
  boundingRadius: 1.35,
  centerY: 1,
};

// ─── Shared texture loader (one instance, lives for app lifetime) ──────────────

const imageTextureLoader = new THREE.TextureLoader();

// ─── Loader ───────────────────────────────────────────────────────────────────

const Loader = memo(function Loader() {
  const { progress } = useProgress();
  const width = Math.round(progress);
  return (
    <Html center>
      <div className="flex min-w-52 flex-col items-center gap-3 rounded-3xl border border-white/10 bg-slate-950/90 px-7 py-6 shadow-[0_25px_80px_rgba(2,6,23,0.6)] backdrop-blur-xl">
        <span className="text-sm font-medium tracking-wide text-slate-200">
          Loading model…
        </span>
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-sky-400/90 transition-all duration-300"
            style={{ width: `${width}%` }}
          />
        </div>
        <span className="text-xs tabular-nums text-slate-500">{width}%</span>
      </div>
    </Html>
  );
});

// ─── Icons (memoised, zero props = stable reference) ─────────────────────────

const PlayIcon = memo(() => (
  <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
  </svg>
));
const PauseIcon = memo(() => (
  <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M6 4a1 1 0 00-1 1v10a1 1 0 102 0V5a1 1 0 00-1-1zm8 0a1 1 0 00-1 1v10a1 1 0 102 0V5a1 1 0 00-1-1z"
      clipRule="evenodd"
    />
  </svg>
));
const RewindIcon = memo(() => (
  <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
  </svg>
));
const RotateIcon = memo(() => (
  <svg
    className="h-3.5 w-3.5 shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
));
const WireframeIcon = memo(() => (
  <svg
    className="h-3.5 w-3.5 shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M12 3l9 5.5-9 5.5-9-5.5L12 3zm0 0v11m9-5.5v5.5L12 20l-9-5.5V9"
    />
  </svg>
));
const ResetIcon = memo(() => (
  <svg
    className="h-3.5 w-3.5 shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M3 12a9 9 0 109-9M3 12V7m0 5H8"
    />
  </svg>
));

// ─── Material helpers ─────────────────────────────────────────────────────────

/**
 * Per-scene caches. Stored on the scene's userData so they're naturally
 * scoped to one model load and GC'd when the scene is disposed.
 */
function getSceneCaches(root: THREE.Object3D) {
  const data = root.userData as {
    _upgradedMaterials?: WeakSet<THREE.Material>;
    _materialSnapshots?: WeakMap<THREE.Material, MaterialSnapshot>;
    _meshSizeCache?: WeakMap<THREE.Mesh, THREE.Vector3>;
    _textureCache?: Map<string, THREE.Texture>;
  };
  data._upgradedMaterials ??= new WeakSet();
  data._materialSnapshots ??= new WeakMap();
  data._meshSizeCache ??= new WeakMap();
  data._textureCache ??= new Map();
  return {
    upgradedMaterials: data._upgradedMaterials,
    materialSnapshots: data._materialSnapshots,
    meshSizeCache: data._meshSizeCache,
    textureCache: data._textureCache,
  };
}

function getCachedTexture(
  cache: Map<string, THREE.Texture>,
  url: string,
  repeat?: [number, number],
  srgb = false,
): THREE.Texture {
  const [rx, ry] = repeat ?? [1, 1];
  const key = `${url}|${rx}|${ry}|${srgb}`;
  let tex = cache.get(key);
  if (!tex) {
    tex = imageTextureLoader.load(url);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(rx, ry);
    if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    cache.set(key, tex);
  }
  return tex;
}

function classifyMaterial(
  mesh: THREE.Mesh,
  mat: THREE.Material & Partial<THREE.MeshStandardMaterial>,
): MatKind {
  const names = [mat.name, mesh.name, mesh.parent?.name ?? ""].map((n) =>
    (n ?? "").toLowerCase(),
  );

  if (names.some((n) => /glass|window|vitr|glazing|crystal/.test(n)))
    return "glass";
  if (
    names.some((n) =>
      /concrete|cement|stone|urban|pavement|floor|ground|sol|dalle|terr/.test(
        n,
      ),
    )
  )
    return "concrete";
  if (names.some((n) => /metal|steel|alumin|iron|chrome|zinc/.test(n)))
    return "metal";
  if (mat.transparent && (mat.opacity ?? 1) < 0.9) return "glass";

  const color = (mat as THREE.MeshStandardMaterial).color;
  if (color) {
    const { r, g, b } = color;
    if (r > 0.82 && g > 0.82 && b > 0.82) return "glass";
    if (b > 0.8 && g > 0.8 && r < 0.15) return "glass";
    if (
      b > 0.45 &&
      (b > r * 1.25 || g > r * 1.25) &&
      r < 0.72 &&
      !(r > 0.78 && g > 0.78)
    )
      return "water";
    const lum = (r + g + b) / 3;
    if (
      lum > 0.55 &&
      Math.abs(r - g) < 0.12 &&
      Math.abs(g - b) < 0.16 &&
      b >= r
    )
      return "concrete";
    if (r < 0.08 && g < 0.08 && b < 0.08) return "metal";
    if (lum < 0.22 && Math.abs(r - g) < 0.04 && Math.abs(g - b) < 0.04)
      return "metal";
  }
  return "generic";
}

/** Mutate-in-place for MeshPhysicalMaterial; otherwise build a new one. */
function upgradeToPhysical(
  mat: THREE.Material,
  kind: MatKind,
): THREE.MeshPhysicalMaterial {
  const old = mat as THREE.MeshStandardMaterial &
    THREE.MeshBasicMaterial &
    THREE.MeshPhysicalMaterial;
  const origColor =
    (old.color as THREE.Color | undefined)?.clone() ??
    new THREE.Color(0xffffff);
  const map = old.map ?? null;

  if (old.isMeshPhysicalMaterial) {
    old.userData = {
      ...(old.userData ?? {}),
      originalMaterialName:
        (old.userData?.originalMaterialName as string | undefined) ??
        old.name ??
        "",
    };
    // Mutate in-place — avoids new GPU resource allocation
    switch (kind) {
      case "glass":
        old.color.set(GLASS.BASE_COLOR);
        old.metalness = 0;
        old.roughness = GLASS.ROUGHNESS;
        old.transmission = GLASS.TRANSMISSION;
        old.thickness = GLASS.THICKNESS;
        old.ior = 1.52;
        old.reflectivity = GLASS.REFLECTIVITY;
        old.clearcoat = GLASS.CLEARCOAT;
        old.clearcoatRoughness = GLASS.CLEARCOAT_ROUGHNESS;
        old.envMapIntensity = GLASS.ENV_INTENSITY;
        old.transparent = true;
        old.opacity = 1;
        old.side = THREE.DoubleSide;
        break;
      case "water":
        old.color.lerp(new THREE.Color(0x0a2a4a), 0.35);
        old.metalness = 0;
        old.roughness = 0;
        old.transmission = 0.88;
        old.thickness = 1.2;
        old.ior = 1.333;
        old.reflectivity = 1;
        old.clearcoat = 1;
        old.clearcoatRoughness = 0;
        old.envMapIntensity = 1.5;
        old.transparent = true;
        old.opacity = 0.92;
        old.side = THREE.DoubleSide;
        break;
      case "concrete":
        old.color.r = Math.min(1, old.color.r * 1.08);
        old.color.g = Math.min(1, old.color.g * 1.04);
        old.color.b = Math.min(1, old.color.b * 0.88);
        old.metalness = 0;
        old.roughness = 0.88;
        old.reflectivity = 0.05;
        old.clearcoat = 0.04;
        old.clearcoatRoughness = 0.9;
        old.envMapIntensity = 0.2;
        old.transparent = false;
        break;
      case "metal":
        old.metalness = 0.88;
        old.roughness = 0.22;
        old.reflectivity = 0.8;
        old.clearcoat = 0.3;
        old.clearcoatRoughness = 0.15;
        old.envMapIntensity = 1.0;
        old.transparent = false;
        break;
      default:
        old.metalness = Math.max(old.metalness, 0.3);
        old.roughness = Math.min(old.roughness, 0.55);
        old.reflectivity = 0.4;
        old.clearcoat = 0.08;
        old.clearcoatRoughness = 0.4;
        old.envMapIntensity = 0.6;
    }
    old.needsUpdate = true;
    return old;
  }

  // Build a new physical material and dispose the old one
  let next: THREE.MeshPhysicalMaterial;
  switch (kind) {
    case "glass":
      next = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(GLASS.BASE_COLOR),
        metalness: 0,
        roughness: GLASS.ROUGHNESS,
        transmission: GLASS.TRANSMISSION,
        thickness: GLASS.THICKNESS,
        ior: 1.52,
        reflectivity: GLASS.REFLECTIVITY,
        envMapIntensity: GLASS.ENV_INTENSITY,
        clearcoat: GLASS.CLEARCOAT,
        clearcoatRoughness: GLASS.CLEARCOAT_ROUGHNESS,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide,
      });
      break;
    case "water":
      next = new THREE.MeshPhysicalMaterial({
        color: origColor.clone().lerp(new THREE.Color(0x0a2a4a), 0.35),
        metalness: 0,
        roughness: 0,
        transmission: 0.88,
        thickness: 1.2,
        ior: 1.333,
        reflectivity: 1,
        envMapIntensity: 1.5,
        clearcoat: 1,
        clearcoatRoughness: 0,
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide,
      });
      break;
    case "concrete": {
      const c = origColor.clone();
      c.r = Math.min(1, c.r * 1.08);
      c.g = Math.min(1, c.g * 1.04);
      c.b = Math.min(1, c.b * 0.88);
      next = new THREE.MeshPhysicalMaterial({
        color: c,
        map,
        metalness: 0,
        roughness: 0.88,
        reflectivity: 0.05,
        envMapIntensity: 0.2,
        clearcoat: 0.04,
        clearcoatRoughness: 0.9,
        transparent: false,
        side: THREE.FrontSide,
      });
      break;
    }
    case "metal":
      next = new THREE.MeshPhysicalMaterial({
        color: origColor,
        map,
        metalness: 0.88,
        roughness: 0.22,
        reflectivity: 0.8,
        envMapIntensity: 0.6,
        clearcoat: 0.3,
        clearcoatRoughness: 0.15,
        transparent: false,
        side: THREE.FrontSide,
      });
      break;
    default:
      next = new THREE.MeshPhysicalMaterial({
        color: origColor,
        map,
        metalness: 0.1,
        roughness: 0.65,
        reflectivity: 0.15,
        envMapIntensity: 0.5,
        clearcoat: 0.08,
        clearcoatRoughness: 0.4,
        transparent: false,
        side: old.side ?? THREE.FrontSide,
      });
  }
  const originalMaterialName = old.name ?? "";
  const originalUserData = { ...(old.userData ?? {}) };
  old.dispose();
  next.name = originalMaterialName;
  next.userData = {
    ...originalUserData,
    originalMaterialName,
  };
  return next;
}

function snapshotMaterial(mat: PreparedMaterial): MaterialSnapshot {
  return {
    kind: "generic", // will be overwritten by caller
    color: `#${mat.color.getHexString()}`,
    map: mat.map ?? null,
    roughnessMap: mat.roughnessMap ?? null,
    metalnessMap: mat.metalnessMap ?? null,
    normalMap: mat.normalMap ?? null,
    bumpMap: mat.bumpMap ?? null,
    bumpScale: mat.bumpScale ?? 1,
    normalScale: mat.normalScale?.clone?.() ?? new THREE.Vector2(1, 1),
    metalness: mat.metalness ?? 0,
    roughness: mat.roughness ?? 1,
    reflectivity: mat.reflectivity ?? 0.5,
    envMapIntensity: mat.envMapIntensity ?? 1,
    clearcoat: mat.clearcoat ?? 0,
    clearcoatRoughness: mat.clearcoatRoughness ?? 0,
    transmission: mat.transmission ?? 0,
    opacity: mat.opacity ?? 1,
    transparent: mat.transparent,
    side: mat.side,
  };
}

function makeReflective(root: THREE.Object3D) {
  const { upgradedMaterials, materialSnapshots } = getSceneCaches(root);

  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const upgraded = mats.map((mat) => {
      if (upgradedMaterials.has(mat)) return mat;
      const kind = classifyMaterial(
        mesh,
        mat as THREE.Material & Partial<THREE.MeshStandardMaterial>,
      );
      const result = upgradeToPhysical(mat, kind);
      upgradedMaterials.add(result);

      const snap = snapshotMaterial(result as PreparedMaterial);
      snap.kind = kind;
      materialSnapshots.set(result, snap);
      return result;
    });

    mesh.material = upgraded.length === 1 ? upgraded[0] : upgraded;
  });
}

function restoreBaseMaterial(
  material: PreparedMaterial,
  snapshots: WeakMap<THREE.Material, MaterialSnapshot>,
) {
  const s = snapshots.get(material);
  if (!s) return;
  material.color.set(s.color);
  material.map = s.map;
  material.roughnessMap = s.roughnessMap;
  material.metalnessMap = s.metalnessMap;
  material.normalMap = s.normalMap;
  material.bumpMap = s.bumpMap;
  material.bumpScale = s.bumpScale;
  material.normalScale.copy(s.normalScale);
  material.metalness = s.metalness;
  material.roughness = s.roughness;
  material.reflectivity = s.reflectivity;
  material.envMapIntensity = s.envMapIntensity;
  material.clearcoat = s.clearcoat;
  material.clearcoatRoughness = s.clearcoatRoughness;
  material.transmission = s.transmission;
  material.opacity = s.opacity;
  material.transparent = s.transparent;
  material.side = s.side;
  material.needsUpdate = true;
}

function getMeshSize(
  mesh: THREE.Mesh,
  cache: WeakMap<THREE.Mesh, THREE.Vector3>,
): THREE.Vector3 {
  let size = cache.get(mesh);
  if (!size) {
    size = new THREE.Box3().setFromObject(mesh).getSize(new THREE.Vector3());
    cache.set(mesh, size);
  }
  return size;
}

function isLineLikeSurface(
  mesh: THREE.Mesh,
  material: THREE.Material & Partial<THREE.MeshStandardMaterial>,
) {
  return [mesh.name, mesh.parent?.name ?? "", material.name ?? ""]
    .map((n) => n.toLowerCase())
    .some((n) => /line|wire|trim|plane|rectangle/.test(n));
}

function getNamePrefix(name?: string) {
  return name?.replace(/[0-9_-].*$/, "") ?? "";
}

function matchesPrefix(name: string | undefined, prefixes?: string[]) {
  if (!name || !prefixes?.length) return false;
  const lower = name.toLowerCase();
  return prefixes.some((prefix) => lower.startsWith(prefix.toLowerCase()));
}

function matchesMetalTextureTargets(
  mesh: THREE.Mesh,
  material: THREE.Material & Partial<THREE.MeshStandardMaterial>,
  targets?: ModelMetalTextureTargets,
) {
  if (!targets) return true;

  const nodeNames = [mesh.name, mesh.parent?.name];
  const materialName =
    (material.userData?.originalMaterialName as string | undefined) ??
    material.name ??
    "";

  if (
    targets.excludedNodePrefixes?.length &&
    nodeNames.some((name) =>
      matchesPrefix(getNamePrefix(name), targets.excludedNodePrefixes),
    )
  ) {
    return false;
  }

  if (
    targets.nodePrefixes?.length &&
    !nodeNames.some((name) =>
      matchesPrefix(getNamePrefix(name), targets.nodePrefixes),
    )
  ) {
    return false;
  }

  if (
    targets.materialNames?.length &&
    !targets.materialNames.includes(materialName)
  ) {
    return false;
  }

  if (
    targets.materialNameIncludes?.length &&
    !targets.materialNameIncludes.some((needle) => materialName.includes(needle))
  ) {
    return false;
  }

  return true;
}

function isThinProfile(
  mesh: THREE.Mesh,
  cache: WeakMap<THREE.Mesh, THREE.Vector3>,
) {
  const size = getMeshSize(mesh, cache);
  const [smallest, middle, largest] = [size.x, size.y, size.z].sort(
    (a, b) => a - b,
  );
  const longToMiddle = largest / Math.max(middle, 0.0001);
  const middleToSmallest = middle / Math.max(smallest, 0.0001);
  return (
    (largest > 0.16 && middle < 0.08 && smallest < 0.05) ||
    (largest > 0.12 &&
      longToMiddle > 9 &&
      middleToSmallest > 1.6 &&
      middle < 0.08) ||
    (largest > 0.18 && longToMiddle > 6.5 && middleToSmallest < 4.5) ||
    (largest > 0.18 && longToMiddle > 12 && middle < 0.12)
  );
}

function isGenericMetalCandidate(
  mesh: THREE.Mesh,
  material: THREE.Material & Partial<THREE.MeshStandardMaterial>,
  cache: WeakMap<THREE.Mesh, THREE.Vector3>,
) {
  if (isLineLikeSurface(mesh, material) || isThinProfile(mesh, cache))
    return false;
  const names = [mesh.name, mesh.parent?.name ?? "", material.name ?? ""].map(
    (n) => n.toLowerCase(),
  );
  if (names.some((n) => /box|shape|sub|cube|circle|frame/.test(n))) return true;
  const size = getMeshSize(mesh, cache);
  const dims = [size.x, size.y, size.z].sort((a, b) => a - b);
  return dims[2] > 0.16 && dims[1] > 0.035;
}

function applyFinishOverrides(
  material: PreparedMaterial,
  finish: MaterialFinish,
  textureCache: Map<string, THREE.Texture>,
) {
  if (finish.mapUrl) {
    material.map = getCachedTexture(
      textureCache,
      finish.mapUrl,
      finish.repeat,
      true,
    );
    if (!finish.color) material.color.set("#ffffff");
  }
  if (finish.roughnessMapUrl)
    material.roughnessMap = getCachedTexture(
      textureCache,
      finish.roughnessMapUrl,
      finish.repeat,
    );
  if (finish.metalnessMapUrl)
    material.metalnessMap = getCachedTexture(
      textureCache,
      finish.metalnessMapUrl,
      finish.repeat,
    );
  if (finish.normalMapUrl) {
    material.normalMap = getCachedTexture(
      textureCache,
      finish.normalMapUrl,
      finish.repeat,
    );
    if (Array.isArray(finish.normalScale))
      material.normalScale.set(finish.normalScale[0], finish.normalScale[1]);
    else if (typeof finish.normalScale === "number")
      material.normalScale.setScalar(finish.normalScale);
  }
  if (finish.bumpMapUrl)
    material.bumpMap = getCachedTexture(
      textureCache,
      finish.bumpMapUrl,
      finish.repeat,
    );
  if (finish.bumpScale !== undefined) material.bumpScale = finish.bumpScale;
  if (finish.color) material.color.set(finish.color);
  if (finish.metalness !== undefined) material.metalness = finish.metalness;
  if (finish.roughness !== undefined) material.roughness = finish.roughness;
  if (finish.reflectivity !== undefined)
    material.reflectivity = finish.reflectivity;
  if (finish.envMapIntensity !== undefined)
    material.envMapIntensity = finish.envMapIntensity;
  if (finish.clearcoat !== undefined) material.clearcoat = finish.clearcoat;
  if (finish.clearcoatRoughness !== undefined)
    material.clearcoatRoughness = finish.clearcoatRoughness;
  if (finish.transmission !== undefined)
    material.transmission = finish.transmission;
  if (finish.opacity !== undefined) material.opacity = finish.opacity;
  material.transparent =
    finish.opacity !== undefined
      ? finish.opacity < 1 || material.transmission > 0
      : material.transparent;
  material.needsUpdate = true;
}

function applyTextureOptions(
  root: THREE.Object3D,
  textures: SurfaceTextureSelection[],
) {
  const { materialSnapshots, meshSizeCache, textureCache } =
    getSceneCaches(root);

  // Single pass: restore then apply
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;

    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((mat) => {
      if (
        mat instanceof THREE.MeshStandardMaterial ||
        mat instanceof THREE.MeshPhysicalMaterial
      ) {
        restoreBaseMaterial(mat as PreparedMaterial, materialSnapshots);
      }

      textures.forEach(({ surface, texture, targets }) => {
        if (!texture?.materials) return;
        const material = mat as PreparedMaterial;
        const materialLike =
          material as THREE.Material & Partial<THREE.MeshStandardMaterial>;
        const kind =
          materialSnapshots.get(material)?.kind ??
          classifyMaterial(mesh, materialLike);
        const isLineLike = isLineLikeSurface(mesh, materialLike);
        const isThin = isThinProfile(mesh, meshSizeCache);
        let finish = texture.materials[kind];

        if (surface === "metal") {
          const isTargeted = matchesMetalTextureTargets(
            mesh,
            materialLike,
            targets,
          );

          if (!isTargeted || isLineLike || isThin) {
            finish = undefined;
          } else {
            finish =
              finish ??
              texture.materials.metal ??
              (kind === "generic"
                ? texture.materials.metal
                : undefined);
          }
        } else if (
          !finish &&
          kind === "generic" &&
          isGenericMetalCandidate(mesh, materialLike, meshSizeCache)
        ) {
          finish = texture.materials.generic;
        }

        if (finish) applyFinishOverrides(material, finish, textureCache);
      });
    });
  });
}

// ─── CementFloor (stable geometry ref) ───────────────────────────────────────

const floorGeometry = new THREE.PlaneGeometry(20, 20);

const CementFloor = memo(function CementFloor() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.001, 0]}
      geometry={floorGeometry}
    >
      <meshPhysicalMaterial
        color="#111827"
        metalness={0.05}
        roughness={0.9}
        reflectivity={0.06}
        envMapIntensity={0.18}
      />
    </mesh>
  );
});

// ─── AnimatedModel ────────────────────────────────────────────────────────────

const AnimatedModel = memo(function AnimatedModel({
  glbPath,
  textures,
  wireframe,
  playing,
  reversed,
  onFinish,
  onPrepared,
}: {
  glbPath: string;
  textures: SurfaceTextureSelection[];
  wireframe: boolean;
  playing: boolean;
  reversed: boolean;
  onFinish: () => void;
  onPrepared: (frame: FrameData) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(glbPath);
  const prepared = useMemo(() => {
    const next = prepareModelScene(scene, 3.5);
    makeReflective(next.root);
    return next;
  }, [scene]);
  const { actions, names } = useAnimations(animations, group);
  const finishedRef = useRef(false);

  useEffect(() => {
    onPrepared({
      height: prepared.height,
      radius: prepared.radius,
      boundingRadius: prepared.boundingRadius,
      centerY: prepared.centerY,
    });
  }, [onPrepared, prepared]);

  useEffect(() => {
    applyTextureOptions(prepared.root, textures);
  }, [prepared.root, textures]);

  useEffect(() => {
    prepared.root.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      mats.forEach((mat) => {
        const m = mat as THREE.MeshStandardMaterial;
        if (m.wireframe !== undefined) m.wireframe = wireframe;
      });
    });
  }, [prepared.root, wireframe]);

  useEffect(() => {
    if (!names.length) return;
    finishedRef.current = false;
    names.forEach((name) => {
      const action = actions[name];
      if (!action) return;
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      if (playing) {
        action.timeScale = reversed ? -1 : 1;
        if (reversed && action.time <= 0.001)
          action.time = action.getClip().duration;
        if (!reversed && action.time >= action.getClip().duration - 0.001)
          action.reset();
        action.paused = false;
        if (!action.isRunning()) action.play();
      } else {
        action.paused = true;
      }
    });
  }, [playing, reversed, actions, names, glbPath]);

  useFrame(() => {
    if (!playing || !names.length || finishedRef.current) return;
    const allDone = names.every((name) => {
      const action = actions[name];
      if (!action) return true;
      const dur = action.getClip().duration;
      return reversed ? action.time <= 0.001 : action.time >= dur - 0.001;
    });
    if (allDone) {
      finishedRef.current = true;
      onFinish();
    }
  });

  return (
    <group ref={group}>
      <primitive
        object={prepared.root}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      />
    </group>
  );
});

// ─── AutoFrameCamera ──────────────────────────────────────────────────────────

function AutoFrameCamera({
  frame,
  controlsRef,
  camRef,
}: {
  frame: FrameData;
  controlsRef: { current: OrbitControlsImpl | null };
  camRef: RefObject<THREE.PerspectiveCamera | null>;
}) {
  const { size } = useThree();

  useEffect(() => {
    const controls = controlsRef.current;
    const cam = camRef.current;
    if (!controls || !cam) return;

    const aspect = Math.max(size.width / Math.max(size.height, 1), 0.01);
    const vFov = THREE.MathUtils.degToRad(cam.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
    const halfHeight = Math.max(frame.height * 0.5, 0.35);
    const halfWidth = Math.max(frame.radius, 0.35);
    const fitDistance =
      Math.max(
        halfHeight / Math.tan(vFov / 2),
        halfWidth / Math.tan(hFov / 2),
      ) * 1.9;
    const targetY = Math.max(0.35, frame.centerY);
    const cameraY = targetY + Math.max(0.35, frame.height * 0.08);

    cam.position.set(0, cameraY, fitDistance);
    cam.near = 0.02;
    cam.far = Math.max(60, fitDistance * 8);
    cam.updateProjectionMatrix();

    const minDistance = Math.max(0.25, frame.radius * 0.22, fitDistance * 0.12);
    controls.target.set(0, targetY, 0);
    controls.minDistance = minDistance;
    controls.maxDistance = Math.max(minDistance + 2, fitDistance * 5.5);
    controls.update();
    controls.saveState();
  }, [camRef, controlsRef, frame, size.height, size.width]);

  return null;
}

// ─── Shared button style helpers ──────────────────────────────────────────────

const BTN_BASE =
  "flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-[13px] font-medium tracking-wide transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40";
const BTN_DEFAULT = `${BTN_BASE} border-white/8 bg-white/4 text-slate-300 hover:border-white/16 hover:bg-white/8 hover:text-white`;
const BTN_ACTIVE = `${BTN_BASE} border-sky-400/30 bg-sky-400/14 text-sky-300 hover:bg-sky-400/20`;

// ─── Main viewer ──────────────────────────────────────────────────────────────

export default function ModelViewer({
  model,
  onBack,
}: {
  model: ModelConfig;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const camRef = useRef<THREE.PerspectiveCamera>(null);

  const [autoRotate, setAutoRotate] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [reversed, setReversed] = useState(false);
  const [variantIdx, setVariantIdx] = useState(0);
  const [metalTextureIdx, setMetalTextureIdx] = useState(0);
  const [glassTextureIdx, setGlassTextureIdx] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [frame, setFrame] = useState<FrameData>(DEFAULT_FRAME);

  const glbPath = model.variants[variantIdx].glb;
  const metalTextures = model.surfaceOptions?.metal ?? EMPTY_TEXTURE_OPTIONS;
  const glassTextures = model.surfaceOptions?.glass ?? EMPTY_TEXTURE_OPTIONS;

  // Stable reference when indices haven't changed
  const activeTextures = useMemo<SurfaceTextureSelection[]>(
    () => [
      {
        surface: "metal",
        texture: metalTextures[metalTextureIdx],
        targets: model.metalTextureTargets,
      },
      { surface: "glass", texture: glassTextures[glassTextureIdx] },
    ],
    [
      glassTextures,
      glassTextureIdx,
      metalTextures,
      metalTextureIdx,
      model.metalTextureTargets,
    ],
  );

  const handleAnimationFinish = useCallback(() => {
    setPlaying(false);
    setReversed((v) => !v);
  }, []);

  const handlePrepared = useCallback((nextFrame: FrameData) => {
    setFrame(nextFrame);
  }, []);

  const handleMarkInteracted = useCallback(() => setHasInteracted(true), []);

  // Reset animation state when model variant changes
  useEffect(() => {
    const id = setTimeout(() => {
      setPlaying(false);
      setReversed(false);
    }, 0);
    return () => clearTimeout(id);
  }, [glbPath]);

  const resetCamera = useCallback(() => controlsRef.current?.reset(), []);

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-slate-950 text-slate-100"
      onPointerDown={handleMarkInteracted}
      onWheel={handleMarkInteracted}
    >
      {/* Ambient gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(56,189,248,0.08),transparent)]" />

      {/* Interaction hint */}
      <div
        className={`pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center transition-opacity duration-1000 ${
          hasInteracted ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-6 py-5 shadow-2xl backdrop-blur-md">
          <svg
            className="h-8 w-8 animate-bounce text-white/80"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
            />
          </svg>
          <span className="text-xs font-semibold tracking-[0.1em] text-white/90 uppercase">
            Click &amp; Drag to Interact
          </span>
        </div>
      </div>

      {/* Three.js canvas */}
      <Canvas
        className="h-full w-full"
        gl={{
          antialias: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.9,
        }}
        dpr={1}
        frameloop="demand"
      >
        <color attach="background" args={["#0b1220"]} />

        <PerspectiveCamera
          ref={camRef}
          makeDefault
          position={[0, 2, 8]}
          fov={34}
          near={0.02}
        />

        <ambientLight intensity={0.4} />
        <hemisphereLight args={["#ffffff", "#94a3b8", 0.6]} />
        <spotLight
          position={[4, 10, 5]}
          intensity={18}
          angle={0.26}
          penumbra={0.5}
          distance={30}
        />
        <spotLight
          position={[-5, 4.5, -8]}
          intensity={5}
          angle={0.42}
          penumbra={0.7}
          distance={25}
          color={model.accent}
        />
        <directionalLight
          position={[6, 3, -6]}
          intensity={0.9}
          color="#dbeafe"
        />
        <pointLight
          position={[0, 1.5, 5]}
          intensity={5}
          distance={16}
          color={model.accent}
        />

        <StudioEnvironment
          accent={model.accent}
          intensity={1.0}
          environmentMapUrl={DEFAULT_VIEWER_ENVIRONMENT_URL}
        />

        <Suspense key={glbPath} fallback={<Loader />}>
          <AnimatedModel
            glbPath={glbPath}
            textures={activeTextures}
            wireframe={wireframe}
            playing={playing}
            reversed={reversed}
            onFinish={handleAnimationFinish}
            onPrepared={handlePrepared}
          />
        </Suspense>

        <AutoFrameCamera
          frame={frame}
          controlsRef={controlsRef}
          camRef={camRef}
        />
        <CementFloor />

        <OrbitControls
          ref={controlsRef}
          autoRotate={autoRotate}
          autoRotateSpeed={0.4}
          enableDamping
          dampingFactor={0.07}
          zoomSpeed={1.2}
          minPolarAngle={Math.PI / 3.5}
          maxPolarAngle={Math.PI / 1.75}
          target={[0, 1, 0]}
          makeDefault
          regress
        />
      </Canvas>

      {/* Edge vignettes */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_100%_at_50%_50%,transparent_48%,rgba(2,6,23,0.72)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[rgba(2,6,23,0.76)] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[rgba(2,6,23,0.92)] to-transparent" />

      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-20 px-4 pt-4 sm:px-6 lg:px-8 lg:pt-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-2xl border border-white/8 bg-slate-950/55 px-3 py-2.5 shadow-[0_8px_32px_rgba(2,6,23,0.4)] backdrop-blur-xl sm:px-4 lg:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={onBack}
              className="pointer-events-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-white/5 text-slate-300 transition duration-200 hover:border-white/16 hover:bg-white/10 hover:text-white"
              aria-label="Back to catalog"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-[IBM_Plex_Sans] text-[15px] font-semibold tracking-tight text-white sm:text-base">
                  {model.name}
                </h1>
              </div>
            </div>
          </div>

          <div className="hidden shrink-0 rounded-full border border-white/8 bg-white/4 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.26em] text-slate-100 lg:block">
            Drag · Scroll · Pinch
          </div>
        </div>
      </header>

      <aside className="absolute bottom-4 left-4 z-20 sm:bottom-5 sm:left-5 lg:bottom-6 lg:left-7">
        <div className="pointer-events-auto w-full max-h-[calc(100vh-8rem)] overflow-y-auto no-scrollbar rounded-2xl border border-white/8 bg-slate-950/65 p-3.5 shadow-[0_16px_48px_rgba(2,6,23,0.5)] backdrop-blur-xl sm:w-72 sm:p-4">

          {model.description && (
            <p className="mb-4 text-xs leading-relaxed text-slate-300">
              {model.description}
            </p>
          )}

          {model.specs && model.specs.length > 0 && (
            <div className="mb-5 rounded-xl border border-white/5 bg-white/5 p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Specifications
              </p>
              <div className="grid gap-2">
                {model.specs.map((s, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-slate-400">{s.label}</span>
                    <span className="font-medium text-slate-200">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {model.variants.length > 1 && (
            <div className="mb-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-600">
                Variant
              </p>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {model.variants.map((v, i) => (
                  <button
                    key={v.label}
                    onClick={() => {
                      setVariantIdx(i);
                      setPlaying(false);
                      setReversed(false);
                    }}
                    className={variantIdx === i ? btnActive : btnDefault}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setPlaying((v) => !v)}
              className={playing ? btnActive : btnDefault}
            >
              {playing ? (<><PauseIcon /> Pause</>) : reversed ? (<><RewindIcon /> Rewind</>) : (<><PlayIcon /> Play</>)}
            </button>

            <button
              onClick={() => setAutoRotate((v) => !v)}
              className={autoRotate ? btnActive : btnDefault}
            >
              <RotateIcon />
              {autoRotate ? "Stop spin" : "Rotate"}
            </button>

            <button
              onClick={() => setWireframe((v) => !v)}
              className={wireframe ? btnActive : btnDefault}
            >
              <WireframeIcon /> Wireframe
            </button>

            <button onClick={resetCamera} className={btnDefault}>
              <ResetIcon /> Reset view
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <button
              onClick={() => navigate({ to: ROUTES.galleryById, params: { modelId: model.id } })}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-sky-400/30 bg-sky-400/10 px-3.5 py-3 text-[13px] font-semibold tracking-wide text-sky-300 transition duration-200 hover:bg-sky-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              View gallery
            </button>
            <a
              href="mailto:contact@example.com?subject=Build My 3D Website"
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3.5 py-3 text-[13px] font-semibold tracking-wide text-emerald-300 transition duration-200 hover:bg-emerald-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Make your own 3d website
            </a>
          </div>

          <div
            className="mt-3.5 h-px w-full rounded-full opacity-30"
            style={{ background: `linear-gradient(90deg, transparent, ${model.accent}, transparent)` }}
          />
          <p className="mt-2 text-center text-[10px] text-slate-600">
            Interactive 3D viewer
          </p>
        </div>
      </aside>
    </div>
  );
}