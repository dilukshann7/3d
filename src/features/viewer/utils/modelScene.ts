import * as THREE from "three";

function cloneMaterial(material: THREE.Material) {
  const cloned = material.clone();

  if (cloned instanceof THREE.MeshStandardMaterial) {
    const currentEnvMapIntensity = cloned.envMapIntensity ?? 1;
    const roughness = cloned.roughness ?? 1;
    const metalness = cloned.metalness ?? 0;

    cloned.envMapIntensity = Math.max(
      currentEnvMapIntensity,
      metalness > 0.55 ? 1.35 : roughness < 0.35 ? 1.18 : 1.05,
    );

    if (metalness > 0.65 && roughness > 0.45) {
      cloned.roughness = 0.44;
    } else if (roughness > 0.92) {
      cloned.roughness = 0.88;
    }

    if ("clearcoat" in cloned) {
      const physicalMaterial = cloned as THREE.MeshPhysicalMaterial;
      physicalMaterial.clearcoat = Math.max(
        physicalMaterial.clearcoat ?? 0,
        0.04,
      );
      physicalMaterial.clearcoatRoughness = Math.min(
        physicalMaterial.clearcoatRoughness ?? 0.6,
        0.34,
      );
    }
  }

  return cloned;
}

export function prepareModelScene(source: THREE.Object3D, targetSize = 3) {
  const root = source.clone(true);

  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map(cloneMaterial);
      return;
    }

    mesh.material = cloneMaterial(mesh.material);
  });

  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  box.getSize(size);

  const largestAxis = Math.max(size.x, size.y, size.z) || 1;
  const scale = targetSize / largestAxis;
  root.scale.setScalar(scale);

  box.setFromObject(root);
  const center = new THREE.Vector3();
  box.getCenter(center);

  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y -= box.min.y;

  box.setFromObject(root);
  const groundedSize = new THREE.Vector3();
  box.getSize(groundedSize);

  return {
    root,
    height: groundedSize.y,
    radius: Math.max(groundedSize.x, groundedSize.z) / 2,
  };
}
