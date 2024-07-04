import * as THREE from 'three';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import ShaderMaterialCreator from '/public/libs/ShaderMaterialCreator';

export default class SceneController {
  constructor() {
    this.dataStrings = {
      spritePath: '/particles/4.png',
      textureSky: '/laufenurg_church_2k.exr',
      modelBook1: '/public/models/book1/book_encyclopedia_set_01_1k.fbx',
      modelChicken: '/public/models/chicken/CHICKEN.glb',
      modelDragon: '/public/models/dragon/DragonAttenuation.glb',
      nameModel: 'Dragon',
      cameraFolderName: 'Camera',
      shakeControlName: 'Shake',
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight
    };
    this.fbxLoader = new FBXLoader();
    this.exrLoader = new EXRLoader();
    this.gltfLoader = new GLTFLoader();
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.particles = null;
    this.purpleLight = null;
    this.modelBooks = null;
    this.shaderMaterial = null;
    this.mouseX = 0;
    this.mouseY = 0;
    this.windowHalfX = this.dataStrings.windowWidth / 2;
    this.windowHalfY = this.dataStrings.windowHeight / 2;
    this.maxMoveDistance = 50;
    this.isCameraShake = false;
    this.isModelReady = false;
  }

  init() {
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({
      antialias: true
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.dataStrings.windowWidth, this.dataStrings.windowHeight);
    document.body.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(75, this.dataStrings.windowWidth / this.dataStrings.windowHeight, 0.1, 1000);
    this.camera.position.set(0, 0, 5);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.setupEventListeners();

    const shaderMaterialCreator = new ShaderMaterialCreator();
    shaderMaterialCreator.setShaderMaterial();
    this.shaderMaterial = shaderMaterialCreator.shaderMaterial;

    this.setupGUI();

    this.initObjects();

    this.animate();
  }

  initObjects() {
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
    const sphere = new THREE.Mesh(sphereGeometry, this.shaderMaterial);
    sphere.position.set(5, 0, -2)
    this.scene.add(sphere);

    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const colors = [];
    const sprite = new THREE.TextureLoader().load(this.dataStrings.spritePath);
    sprite.colorSpace = THREE.SRGBColorSpace;

    for (let i = 0; i < 30; i++) {
      const radius = 1;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 2;
      const posX = radius * Math.sin(theta) * Math.cos(phi);
      const posY = radius * Math.sin(theta) * Math.sin(phi);
      const posZ = radius * Math.cos(theta);

      vertices.push(posX, posY, posZ);

      if (i === 0) {
        colors.push(0.6, 0, 1);
      } else {
        colors.push(1, 1, 0);
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.5,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      map: sprite,
      depthWrite: false,
      alphaTest: 0.5,
      transparent: true,
      vertexColors: true
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);

    this.purpleLight = new THREE.PointLight(0x9900ff, 1, 2);
    this.scene.add(this.purpleLight);

    this.fbxLoader.load(this.dataStrings.modelBook1, (group) => {
      const model = group;
      model.scale.multiplyScalar(0.05);
      model.position.set(-1, -1, 0);
      this.scene.add(model);

      this.modelBooks = model;
      this.isModelReady = true;
    });

    this.exrLoader.load(this.dataStrings.textureSky, (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;

      const geometry = new THREE.SphereGeometry(500, 60, 40);
      geometry.scale(-1, 1, 1);

      const material = new THREE.MeshBasicMaterial({
        map: texture
      });

      const sphere = new THREE.Mesh(geometry, material);
      this.scene.add(sphere);
    });

    this.gltfLoader.load(this.dataStrings.modelChicken, (gltf) => {
      const model = gltf.scene;
      model.position.set(-5, 0, -5);

      const scaleFactor = 5;
      model.scale.set(scaleFactor, scaleFactor, scaleFactor);

      this.scene.add(model);
    });

    this.gltfLoader.load(this.dataStrings.modelDragon, (gltf) => {
      const model = gltf.scene;
      model.position.set(0, 0, -7);

      model.traverse((child) => {
        if (child.isMesh && child.name === this.dataStrings.nameModel) {
          child.material.transparent = true;
          child.material.opacity = 0;
        }
      });

      this.scene.add(model);
    });
  }

  setupEventListeners() {
    document.addEventListener('mousemove', this.onDocumentMouseMove.bind(this));
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  setupGUI() {
    const gui = new GUI();
    const sceneFolder = gui.addFolder(this.dataStrings.cameraFolderName);
    sceneFolder.add(this, 'isCameraShake').name(this.dataStrings.shakeControlName);
    document.body.appendChild(gui.domElement);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    this.shaderMaterial.uniforms.time.value += 0.01;

    if (this.isModelReady) {
      this.animateParticles();
    }

    if (this.isCameraShake) {
      const targetX = this.mouseX * 0.05;
      const targetY = -this.mouseY * 0.05;
      this.camera.position.x += (targetX - this.camera.position.x) * 0.1;
      this.camera.position.y += (targetY - this.camera.position.y) * 0.1;
      this.camera.lookAt(this.scene.position);
    }

    this.renderer.render(this.scene, this.camera);
  }

  animateParticles() {
    const positionsArray = this.particles.geometry.attributes.position.array;
    const time = Date.now() * 0.001;

    for (let i = 0; i < positionsArray.length; i += 3) {
      positionsArray[i] += Math.sin(time + i * 0.1) * 0.01;
      positionsArray[i + 1] += Math.cos(time + i * 0.1) * 0.01;
      positionsArray[i + 2] += Math.sin(time + i * 0.1) * Math.cos(time + i * 0.1) * 0.01;
    }

    this.particles.geometry.attributes.position.needsUpdate = true;

    this.purpleLight.position.copy(new THREE.Vector3(positionsArray[0], positionsArray[1], positionsArray[2]));
  }

  onDocumentMouseMove(event) {
    if (this.isCameraShake) {
      this.mouseX = Math.min(Math.max((event.clientX - this.windowHalfX) / 2, -this.maxMoveDistance), this.maxMoveDistance);
      this.mouseY = Math.min(Math.max((event.clientY - this.windowHalfY) / 2, -this.maxMoveDistance), this.maxMoveDistance);
    }
  }

  onWindowResize() {
    this.dataStrings.windowWidth = window.innerWidth;
    this.dataStrings.windowHeight = window.innerHeight;

    if (this.isCameraShake) {
      this.windowHalfX = this.dataStrings.windowWidth / 2;
      this.windowHalfY = this.dataStrings.windowWidth / 2;
    }

    this.renderer.setSize(this.dataStrings.windowWidth, this.dataStrings.windowHeight);
    this.camera.aspect = this.dataStrings.windowWidth / this.dataStrings.windowHeight;
    this.camera.updateProjectionMatrix();
  }
}