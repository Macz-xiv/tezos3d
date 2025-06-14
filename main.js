// Helper: Convert IPFS URI to HTTP URL
function ipfsToHttp(ipfsUri) {
  if (!ipfsUri) return "";
  return ipfsUri.replace("ipfs://", "https://ipfs.io/ipfs/");
}

// Load a GLB or GLTF model into the canvas
function loadGLBModel(url) {
  const container = document.getElementById('canvas-container');
  container.innerHTML = ""; // Clear previous

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(500, 500);
  container.appendChild(renderer.domElement);

  const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
  scene.add(light);

  const loader = new THREE.GLTFLoader();
  loader.load(url, function(gltf) {
    scene.add(gltf.scene);
    camera.position.set(0, 1.5, 3);
    function animate() {
      requestAnimationFrame(animate);
      gltf.scene.rotation.y += 0.005;
      renderer.render(scene, camera);
    }
    animate();
  }, undefined, function(error) {
    alert("Failed to load model. Check your URL and CORS policy.");
    console.error(error);
  });
}

// Example NFT metadata (replace with dynamic loading as needed)
const metadata = {
  "formats": [
    {
      "mimeType": "image/webp",
      "uri": "ipfs://QmSawSRjptebdRWASAvbKifT8WQ7kd2VNkBS7yvsAtZ8PH"
    },
    {
      "mimeType": "model/gltf-binary",
      "uri": "ipfs://QmahWdvfi3RMKwsRseM8GTqCmKuQEjs5DDgs8PvgtnYuAr"
    },
    {
      "mimeType": "image/webp",
      "uri": "ipfs://QmaXh5BERriSDAZyaCEVa1ap7RvcSJbzS1YpN2gz8sjcyf"
    }
  ]
};

document.addEventListener('DOMContentLoaded', () => {
  const formats = metadata.formats || [];
  // Filter for 3D assets only
  const threeDFormats = formats.filter(
    f => f.mimeType === "model/gltf-binary" || f.mimeType === "model/gltf+json"
  );
  const assetUri = threeDFormats.length > 0 ? ipfsToHttp(threeDFormats[0].uri) : null;

  if (assetUri) {
    loadGLBModel(assetUri);
  } else {
    alert("No 3D asset found in this NFT.");
  }
});
