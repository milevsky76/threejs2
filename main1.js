import './style.css'
import * as THREE from 'three';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import {
  OrbitControls
} from 'three/examples/jsm/controls/OrbitControls';
import {
  EXRLoader
} from 'three/examples/jsm/loaders/EXRLoader';
import {
  FBXLoader
} from 'three/examples/jsm/loaders/FBXLoader';
import {
  GLTFLoader
} from 'three/examples/jsm/loaders/GLTFLoader';

const manager = new THREE.LoadingManager();

let camera, scene, renderer, model, fbxLoader;
let book, particles, cube, sphere, torus, material, purpleLight;

let cubeCamera, cubeRenderTarget;

let controls;


let mouseX = 0;
let mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;
let maxMoveDistance = 50;
let isCameraShake = false;


init();

function init() {
  renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  document.body.appendChild(renderer.domElement);


  window.addEventListener('resize', onWindowResize);


  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 5);


  document.addEventListener('mousemove', onDocumentMouseMove);

  scene = new THREE.Scene();


  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);


  controls = new OrbitControls(camera, renderer.domElement);
  document.body.style.touchAction = 'none';


  const bookGeometry = new THREE.BoxGeometry(1, 0.2, 1.5);
  const bookMaterial = new THREE.MeshPhongMaterial({
    color: 0x964B00
  });
  book = new THREE.Mesh(bookGeometry, bookMaterial);
  scene.add(book);

  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const colors = [];

  const sprite = new THREE.TextureLoader().load('/particles/4.png');
  sprite.colorSpace = THREE.SRGBColorSpace;

  for (let i = 0; i < 30; i++) {
    const radius = 1.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 2;
    const posX = radius * Math.sin(theta) * Math.cos(phi);
    const posY = radius * Math.sin(theta) * Math.sin(phi);
    const posZ = radius * Math.cos(theta);

    vertices.push(posX, posY, posZ);

    if (i === 0) {
      colors.push(.6, 0, 1);
    } else {
      colors.push(1, 1, 0);
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  material = new THREE.PointsMaterial({
    size: 0.5,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    map: sprite,
    depthWrite: false,
    alphaTest: 0.5,
    transparent: true,
    vertexColors: true
  });

  particles = new THREE.Points(geometry, material);
  scene.add(particles);

  purpleLight = new THREE.PointLight(0x9900ff, 1, 2);
  scene.add(purpleLight);


  fbxLoader = new FBXLoader(manager);
  loadAsset('/book1/book_encyclopedia_set_01_1k.fbx');

  const loader = new EXRLoader();
  loader.load('/laufenurg_church_2k.exr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;

    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    const material = new THREE.MeshBasicMaterial({
      map: texture
    });

    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
  });

  const gltfLoader = new GLTFLoader();
  gltfLoader.load(
    '/DragonAttenuation.glb',
    function (gltf) {
      let model1 = gltf.scene;

      model1.position.set(0, 0, -5)

      model1.traverse((child) => {
        if (child.isMesh && child.name === "Dragon") {
          child.material.transparent = true;
          child.material.opacity = 0;
        }
      });

      scene.add(model1);
    }
  );

  setupGUI();
};

function animateParticles() {
  const positionsArray = particles.geometry.attributes.position.array;
  const time = Date.now() * 0.001;

  for (let i = 0; i < positionsArray.length; i += 3) {
    positionsArray[i] += Math.sin(time + i * 0.1) * 0.01;
    positionsArray[i + 1] += Math.cos(time + i * 0.1) * 0.01;
    positionsArray[i + 2] += Math.sin(time + i * 0.1) * Math.cos(time + i * 0.1) * 0.01;
  }

  particles.geometry.attributes.position.needsUpdate = true;

  purpleLight.position.copy(new THREE.Vector3(positionsArray[0], positionsArray[1], positionsArray[2]));
}

function onDocumentMouseMove(event) {
  console.log(isCameraShake)
  if (isCameraShake) {
    mouseX = Math.min(Math.max((event.clientX - windowHalfX) / 2, -maxMoveDistance), maxMoveDistance);
    mouseY = Math.min(Math.max((event.clientY - windowHalfY) / 2, -maxMoveDistance), maxMoveDistance);
  }
}

function loadAsset(asset) {
  fbxLoader.load(asset, function (group) {
    model = group;

    model.scale.multiplyScalar(0.05);
    model.position.set(0, 0, 0)

    scene.add(model);

    // const modelPosition = model.position;

    // const geometry = new THREE.BufferGeometry();
    // const vertices = [];
    // const colors = [];
    // const sprite = new THREE.TextureLoader().load(this.dataStrings.spritePath);
    // sprite.colorSpace = THREE.SRGBColorSpace;

    // for (let i = 0; i < 30; i++) {
    //   const radius = 20;
    //   const theta = Math.random() * Math.PI * 2;
    //   const phi = Math.random() * Math.PI * 2;
    //   const posX = radius * Math.sin(theta) * Math.cos(phi);
    //   const posY = radius * Math.sin(theta) * Math.sin(phi);
    //   const posZ = radius * Math.cos(theta);

    //   vertices.push(posX, posY, posZ);

    //   if (i === 0) {
    //     colors.push(0.6, 0, 1);
    //   } else {
    //     colors.push(1, 1, 0);
    //   }
    // }

    // geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    // geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    // const material = new THREE.PointsMaterial({
    //   size: 0.5,
    //   sizeAttenuation: true,
    //   blending: THREE.AdditiveBlending,
    //   map: sprite,
    //   depthWrite: false,
    //   alphaTest: 0.5,
    //   transparent: true,
    //   vertexColors: true
    // });

    // this.particles = new THREE.Points(geometry, material);
    // this.scene.add(this.particles);

    // this.purpleLight = new THREE.PointLight(0x9900ff, 100, 2);
    // this.scene.add(this.purpleLight);

    // this.particles.position.copy(modelPosition);

    // model.add(this.particles);
  })
}

function setupGUI() {
  const gui = new GUI();

  const sceneFolder = gui.addFolder('Scene');
  sceneFolder.add(camera.position, 'z').min(-10).max(10).step(0.1).name('Camera Z');

  let action = {
    isCameraShake: isCameraShake
  }

  // const modelFolder = gui.addFolder('Model');
  // modelFolder.add(model.position, 'x').name('position X');
  // modelFolder.add(model.position, 'y').name('position Y');
  // modelFolder.add(model.position, 'z').name('position Z');
  // modelFolder.add(actionModel, 'playModelRotation').name('Play rotation');
  // modelFolder.add(actionModel, 'stopModelRotation').name('Stop rotation');
  // modelFolder.add(actionModel, 'clippingPlanes').name('Clipping');

  sceneFolder.add(action, 'isCameraShake').name('Camera Shake');

  document.body.appendChild(gui.domElement);
}

function animate() {
  animateParticles();

  if (isCameraShake) {
    const targetX = mouseX * 0.05;
    const targetY = -mouseY * 0.05;
    camera.position.x += (targetX - camera.position.x) * 0.1;
    camera.position.y += (targetY - camera.position.y) * 0.1;
    camera.lookAt(scene.position);
  }

  renderer.render(scene, camera);
}

function onWindowResize() {
  if (isCameraShake) {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
  }

  renderer.setSize(window.innerWidth, window.innerHeight);

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}