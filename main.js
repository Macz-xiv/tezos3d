// --- Tezos Wallet Connect (Beacon SDK) ---
const { DAppClient } = beacon;
const client = new DAppClient({ name: "Tezos Metaverse Demo" });
const connectBtn = document.getElementById("connect-wallet");
const walletAddressDiv = document.getElementById("wallet-address");

connectBtn.onclick = async () => {
  try {
    const permissions = await client.requestPermissions();
    walletAddressDiv.innerText = "Connected: " + permissions.address;
  } catch (err) {
    walletAddressDiv.innerText = "Wallet connection cancelled.";
  }
};

// --- Three.js 3D Scene ---
const container = document.getElementById("canvas-container");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 800/600, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(800, 600);
container.appendChild(renderer.domElement);

const light = new THREE.HemisphereLight(0xffffff, 0x444444, 2);
scene.add(light);

camera.position.set(0, 1.5, 3);
scene.background = new THREE.Color(0x222233);

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// --- Load .glb Model ---
const glbInput = document.getElementById("glb-url");
const loadBtn = document.getElementById("load-glb");
const loader = new THREE.GLTFLoader();

loadBtn.onclick = () => {
  const url = glbInput.value.trim();
  if (!url) { alert("Paste a .glb URL!"); return; }
  loader.load(
    url,
    function (gltf) {
      // Remove previous model
      for (let i = scene.children.length - 1; i >= 0; i--) {
        const obj = scene.children[i];
        if (obj.type === "Group") scene.remove(obj);
      }
      scene.add(gltf.scene);
    },
    undefined,
    function (error) {
      alert("Failed to load model. Check your URL and CORS policy.");
    }
  );
};
