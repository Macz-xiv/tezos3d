// ========== Helper Functions ==========

// Convert IPFS URI to public HTTP gateway URL
function ipfsToHttp(ipfsUri) {
  if (!ipfsUri) return "";
  return ipfsUri.replace("ipfs://", "https://ipfs.io/ipfs/");
}

// Load a GLB/GLTF model into the canvas
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

// ========== Wallet Connection ==========

let tezosAddress = null;
let walletClient = null;

async function connectWallet() {
  if (!window.beacon) {
    alert("Beacon SDK not loaded.");
    return;
  }
  try {
    // Use the Beacon SDK
    const { DAppClient } = window.beacon;
    walletClient = new DAppClient({ name: "Tezos 3D NFT Viewer" });
    const permissions = await walletClient.requestPermissions();
    tezosAddress = permissions.address;
    document.getElementById("wallet-address").textContent = tezosAddress;
    document.getElementById("address-input").placeholder = "Leave blank to use connected wallet";
  } catch (err) {
    alert("Wallet connection canceled or failed.");
  }
}

// ========== Fetch NFT Data ==========

async function fetchNFTs(address) {
  // Query FA2 tokens with nonzero balance
  const url = `https://api.tzkt.io/v1/tokens/balances?account=${address}&balance.ne=0&token.standard=fa2&select=token.metadata`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("Failed to fetch NFTs");
  return await resp.json();
}

function get3DAssetFromMetadata(metadata) {
  // filter for 3D assets
  const threeDFormats = (metadata.formats || []).filter(
    f => f.mimeType === "model/gltf-binary" || f.mimeType === "model/gltf+json"
  );
  if (threeDFormats.length > 0) {
    return ipfsToHttp(threeDFormats[0].uri);
  }
  // fallback: try artifactUri
  if (metadata.artifactUri && /\.(glb|gltf)$/i.test(metadata.artifactUri)) {
    return ipfsToHttp(metadata.artifactUri);
  }
  return null;
}

// ========== NFT Gallery UI ==========

function renderNFTList(nfts) {
  const nftList = document.getElementById("nft-list");
  nftList.innerHTML = "";
  let first3D = null;
  let renderIdx = 0;
  nfts.forEach((meta, idx) => {
    const assetUrl = get3DAssetFromMetadata(meta);
    if (!assetUrl) return;
    if (!first3D) first3D = { assetUrl, renderIdx };

    // thumbnail: prefer displayUri or thumbnailUri
    let thumb = meta.thumbnailUri || meta.displayUri || meta.image || "";
    thumb = ipfsToHttp(thumb);

    const name = meta.name || "Unnamed";
    const card = document.createElement("div");
    card.className = "nft-card";
    card.innerHTML = `
      <img src="${thumb}" alt="${name}" onerror="this.src=''; this.alt='No thumbnail';" />
      <div class="nft-title">${name}</div>
    `;
    card.addEventListener("click", () => {
      document.querySelectorAll('.nft-card').forEach(e => e.classList.remove('selected'));
      card.classList.add('selected');
      loadGLBModel(assetUrl);
    });
    nftList.appendChild(card);
    renderIdx++;
  });
  // Auto-select first 3D NFT
  if (first3D) {
    nftList.querySelectorAll('.nft-card')[first3D.renderIdx].classList.add('selected');
    loadGLBModel(first3D.assetUrl);
  } else {
    document.getElementById('canvas-container').innerHTML = "";
    nftList.innerHTML = "<div>No 3D NFTs found for this address.</div>";
  }
}

// ========== Main App Logic ==========

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById("connect-wallet").onclick = connectWallet;

  document.getElementById("load-nfts").onclick = async () => {
    let address = document.getElementById("address-input").value.trim();
    if (!address) {
      if (!tezosAddress) {
        alert("Connect wallet or enter a Tezos address.");
        return;
      }
      address = tezosAddress;
    }
    document.getElementById("nft-list").innerHTML = "Loading NFTs...";
    try {
      const nfts = await fetchNFTs(address);
      renderNFTList(nfts);
    } catch (err) {
      document.getElementById("nft-list").innerHTML = "Failed to load NFTs.";
      alert("Error loading NFTs: " + err.message);
    }
  };
});
