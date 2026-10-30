import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import { JointAngles } from './gaitEngine';
import { PostureType } from '../calculator/biomechanicsCalculator';

export class WalkerModel {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;

  // Treadmill & Environment
  private treadmillGroup: THREE.Group;
  private treadmillBeltMesh: THREE.Mesh;
  private treadmillCanvas: HTMLCanvasElement;
  private treadmillCtx: CanvasRenderingContext2D;
  private treadmillTexture: THREE.CanvasTexture;
  private beltOffset = 0;

  // Mannequin Hierarchical Skeleton
  private mannequinRoot: THREE.Group;
  private pelvisGroup: THREE.Group;
  private spineLowerGroup: THREE.Group;
  private spineUpperGroup: THREE.Group;
  private neckGroup: THREE.Group;
  private headGroup: THREE.Group;

  // Left Leg Hierarchy
  private leftHipGroup: THREE.Group;
  private leftKneeGroup: THREE.Group;
  private leftAnkleGroup: THREE.Group;
  private leftToesGroup: THREE.Group;

  // Right Leg Hierarchy
  private rightHipGroup: THREE.Group;
  private rightKneeGroup: THREE.Group;
  private rightAnkleGroup: THREE.Group;
  private rightToesGroup: THREE.Group;

  // Left Arm Hierarchy
  private leftClavicleGroup: THREE.Group;
  private leftShoulderGroup: THREE.Group;
  private leftElbowGroup: THREE.Group;
  private leftHandGroup: THREE.Group;

  // Right Arm Hierarchy
  private rightClavicleGroup: THREE.Group;
  private rightShoulderGroup: THREE.Group;
  private rightElbowGroup: THREE.Group;
  private rightHandGroup: THREE.Group;

  // Visual Stress Vectors
  private vectorGroup: THREE.Group;
  private neckVector: THREE.ArrowHelper;
  private spineVector: THREE.ArrowHelper;
  private leftKneeVector: THREE.ArrowHelper;
  private rightKneeVector: THREE.ArrowHelper;
  private leftAnkleVector: THREE.ArrowHelper;
  private rightAnkleVector: THREE.ArrowHelper;

  // Holographic Alignment Plane
  private alignmentPlane: THREE.Mesh;

  // Materials cache
  private boneMaterial: THREE.MeshStandardMaterial;
  private jointMaterial: THREE.MeshStandardMaterial;
  private accentMaterial: THREE.MeshStandardMaterial;
  private glowMaterial: THREE.MeshBasicMaterial;

  private isDisposed = false;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020617);
    this.scene.fog = new THREE.FogExp2(0x020617, 0.12);

    // 2. Camera setup
    const aspect = container.clientWidth / (container.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 50);
    this.camera.position.set(3.2, 1.8, 3.8);

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    container.appendChild(this.renderer.domElement);

    // 4. Orbit Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 0.95, 0);
    this.controls.maxPolarAngle = Math.PI / 2 + 0.05;
    this.controls.minDistance = 1.0;
    this.controls.maxDistance = 12.0;

    // 5. Materials
    this.boneMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.25,
      metalness: 0.85,
      wireframe: false
    });

    this.jointMaterial = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.9
    });

    this.accentMaterial = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.7
    });

    this.glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.6
    });

    // 6. Lights
    this.setupLights();

    // 7. Infinite Treadmill Floor
    const treadmillData = this.createTreadmill();
    this.treadmillGroup = treadmillData.group;
    this.treadmillBeltMesh = treadmillData.beltMesh;
    this.treadmillCanvas = treadmillData.canvas;
    this.treadmillCtx = treadmillData.ctx;
    this.treadmillTexture = treadmillData.texture;
    this.scene.add(this.treadmillGroup);

    // 8. Humanoid Skeleton Mannequin
    const mannequinData = this.buildMannequin();
    this.mannequinRoot = mannequinData.root;
    this.pelvisGroup = mannequinData.pelvis;
    this.spineLowerGroup = mannequinData.spineLower;
    this.spineUpperGroup = mannequinData.spineUpper;
    this.neckGroup = mannequinData.neck;
    this.headGroup = mannequinData.head;

    this.leftHipGroup = mannequinData.leftHip;
    this.leftKneeGroup = mannequinData.leftKnee;
    this.leftAnkleGroup = mannequinData.leftAnkle;
    this.leftToesGroup = mannequinData.leftToes;

    this.rightHipGroup = mannequinData.rightHip;
    this.rightKneeGroup = mannequinData.rightKnee;
    this.rightAnkleGroup = mannequinData.rightAnkle;
    this.rightToesGroup = mannequinData.rightToes;

    this.leftClavicleGroup = mannequinData.leftClavicle;
    this.leftShoulderGroup = mannequinData.leftShoulder;
    this.leftElbowGroup = mannequinData.leftElbow;
    this.leftHandGroup = mannequinData.leftHand;

    this.rightClavicleGroup = mannequinData.rightClavicle;
    this.rightShoulderGroup = mannequinData.rightShoulder;
    this.rightElbowGroup = mannequinData.rightElbow;
    this.rightHandGroup = mannequinData.rightHand;
    this.scene.add(this.mannequinRoot);

    // 9. Dynamic Alignment Vectors
    const vectorsData = this.createStressVectors();
    this.vectorGroup = vectorsData.group;
    this.neckVector = vectorsData.neck;
    this.spineVector = vectorsData.spine;
    this.leftKneeVector = vectorsData.leftKnee;
    this.rightKneeVector = vectorsData.rightKnee;
    this.leftAnkleVector = vectorsData.leftAnkle;
    this.rightAnkleVector = vectorsData.rightAnkle;
    this.scene.add(this.vectorGroup);

    // 10. Holographic Alignment Plane
    this.alignmentPlane = this.createAlignmentPlane();
    this.scene.add(this.alignmentPlane);

    // Window resize handler
    window.addEventListener('resize', this.onResize);
  }

  private setupLights() {
    // Ambient fill
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.2);
    this.scene.add(ambientLight);

    // Main key light
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(4, 7, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 15;
    keyLight.shadow.bias = -0.001;
    this.scene.add(keyLight);

    // Cyan rim light (Cyber feel)
    const rimLight = new THREE.DirectionalLight(0x06b6d4, 2.5);
    rimLight.position.set(-4, 3, -4);
    this.scene.add(rimLight);

    // Bio-emerald floor bounce light
    const floorBounce = new THREE.PointLight(0x10b981, 1.8, 6);
    floorBounce.position.set(0, 0.4, 0);
    this.scene.add(floorBounce);

    // Overhead surgical examination spotlight
    const spotLight = new THREE.SpotLight(0x38bdf8, 3.0, 10, Math.PI / 4, 0.5, 1);
    spotLight.position.set(0, 5, 1);
    spotLight.target.position.set(0, 0.9, 0);
    this.scene.add(spotLight);
    this.scene.add(spotLight.target);
  }

  private createTreadmill() {
    const group = new THREE.Group();

    // Treadmill Deck frame
    const deckGeo = new THREE.BoxGeometry(1.4, 0.12, 4.2);
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      metalness: 0.9,
      roughness: 0.3
    });
    const deckMesh = new THREE.Mesh(deckGeo, deckMat);
    deckMesh.position.y = -0.06;
    deckMesh.receiveShadow = true;
    group.add(deckMesh);

    // Dynamic moving belt texture via 2D Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 4);

    const beltGeo = new THREE.PlaneGeometry(1.1, 3.8);
    const beltMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.6,
      metalness: 0.2
    });
    const beltMesh = new THREE.Mesh(beltGeo, beltMat);
    beltMesh.rotation.x = -Math.PI / 2;
    beltMesh.position.y = 0.002;
    beltMesh.receiveShadow = true;
    group.add(beltMesh);

    // Initial draw on belt canvas
    this.updateBeltTexture(ctx, canvas, 0);

    // Dual neon side rail guides
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.8
    });
    const railGeo = new THREE.BoxGeometry(0.04, 0.03, 3.8);

    const leftRail = new THREE.Mesh(railGeo, railMat);
    leftRail.position.set(-0.58, 0.015, 0);
    group.add(leftRail);

    const rightRail = new THREE.Mesh(railGeo, railMat);
    rightRail.position.set(0.58, 0.015, 0);
    group.add(rightRail);

    // Floor kinetic grid surrounding treadmill
    const gridHelper = new THREE.GridHelper(16, 32, 0x06b6d4, 0x1e293b);
    gridHelper.position.y = -0.12;
    const gridMat = gridHelper.material as THREE.Material;
    gridMat.transparent = true;
    gridMat.opacity = 0.35;
    group.add(gridHelper);

    return { group, beltMesh, canvas, ctx, texture };
  }

  private updateBeltTexture(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, offset: number) {
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Cyber track lines
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
    ctx.lineWidth = 4;

    // Moving horizontal stripes
    const stripeCount = 16;
    const stripeSpacing = canvas.height / stripeCount;
    for (let i = 0; i < stripeCount; i++) {
      const y = (i * stripeSpacing + offset) % canvas.height;
      ctx.beginPath();
      ctx.moveTo(30, y);
      ctx.lineTo(canvas.width - 30, y);
      ctx.stroke();

      // Mini dashes
      ctx.fillStyle = 'rgba(16, 185, 129, 0.6)';
      ctx.fillRect(canvas.width / 2 - 15, y - 3, 30, 6);
    }

    // Border glowing tracks
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 0, canvas.width - 20, canvas.height);
  }

  // Build the complete anatomical articulated humanoid skeleton
  private buildMannequin() {
    const root = new THREE.Group();

    // Helper to create a joint sphere
    const makeJoint = (radius: number, color = 0x06b6d4) => {
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.6,
        metalness: 0.9,
        roughness: 0.2
      });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 20, 20), mat);
      mesh.castShadow = true;
      return mesh;
    };

    // Helper to create sleek tapered bone capsules/cylinders
    const makeBone = (topRadius: number, bottomRadius: number, length: number) => {
      const geo = new THREE.CylinderGeometry(topRadius, bottomRadius, length, 16);
      const mesh = new THREE.Mesh(geo, this.boneMaterial);
      mesh.position.y = -length / 2;
      mesh.castShadow = true;

      // Add cyber rings around bones
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(topRadius * 1.15, 0.003, 8, 24), ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -length * 0.35;
      mesh.add(ring);

      return mesh;
    };

    // 1. Pelvis base
    const pelvis = new THREE.Group();
    pelvis.position.set(0, 0.94, 0); // Base height of hip center above ground
    root.add(pelvis);

    const pelvisMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.11, 0.12, 16),
      this.boneMaterial
    );
    pelvisMesh.rotation.z = Math.PI / 2;
    pelvisMesh.castShadow = true;
    pelvis.add(pelvisMesh);

    const sacrumJoint = makeJoint(0.04, 0x10b981);
    pelvis.add(sacrumJoint);

    // 2. Spine & Torso
    const spineLower = new THREE.Group();
    spineLower.position.set(0, 0.06, 0);
    pelvis.add(spineLower);

    const lumbarBone = makeBone(0.045, 0.05, 0.14);
    lumbarBone.position.y = 0.07;
    spineLower.add(lumbarBone);

    const spineUpper = new THREE.Group();
    spineUpper.position.set(0, 0.14, 0);
    spineLower.add(spineUpper);

    // Ribcage / Chest
    const ribcageGeo = new THREE.BoxGeometry(0.28, 0.22, 0.16);
    const ribcageMesh = new THREE.Mesh(ribcageGeo, this.boneMaterial);
    ribcageMesh.position.y = 0.11;
    ribcageMesh.castShadow = true;
    spineUpper.add(ribcageMesh);

    // Glowing chest arc reactor / central biomechanical sensor
    const sensorGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.03, 24);
    const sensorMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.2
    });
    const chestSensor = new THREE.Mesh(sensorGeo, sensorMat);
    chestSensor.rotation.x = Math.PI / 2;
    chestSensor.position.set(0, 0.12, 0.08);
    spineUpper.add(chestSensor);

    // 3. Neck & Head
    const neck = new THREE.Group();
    neck.position.set(0, 0.22, 0);
    spineUpper.add(neck);

    const neckJoint = makeJoint(0.03, 0x10b981);
    neck.add(neckJoint);

    const head = new THREE.Group();
    head.position.set(0, 0.06, 0);
    neck.add(head);

    // Cyber visor head
    const craniumGeo = new THREE.SphereGeometry(0.09, 20, 20);
    craniumGeo.scale(0.85, 1.15, 0.95);
    const headMesh = new THREE.Mesh(craniumGeo, this.boneMaterial);
    headMesh.position.y = 0.08;
    headMesh.castShadow = true;
    head.add(headMesh);

    // Glowing curved visor
    const visorGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.035, 16, 1, false, -Math.PI / 3, (2 * Math.PI) / 3);
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.5,
      roughness: 0.1
    });
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.position.set(0, 0.08, 0.045);
    head.add(visorMesh);

    // 4. Legs Setup
    const hipWidth = 0.12;

    // --- LEFT LEG ---
    const leftHip = new THREE.Group();
    leftHip.position.set(-hipWidth, -0.04, 0);
    pelvis.add(leftHip);
    leftHip.add(makeJoint(0.04, 0x06b6d4));

    const leftFemurLength = 0.44;
    const leftFemurMesh = makeBone(0.042, 0.035, leftFemurLength);
    leftHip.add(leftFemurMesh);

    const leftKnee = new THREE.Group();
    leftKnee.position.set(0, -leftFemurLength, 0);
    leftHip.add(leftKnee);
    leftKnee.add(makeJoint(0.038, 0x10b981));

    const leftTibiaLength = 0.42;
    const leftTibiaMesh = makeBone(0.034, 0.028, leftTibiaLength);
    leftKnee.add(leftTibiaMesh);

    const leftAnkle = new THREE.Group();
    leftAnkle.position.set(0, -leftTibiaLength, 0);
    leftKnee.add(leftAnkle);
    leftAnkle.add(makeJoint(0.03, 0x06b6d4));

    // Left Foot
    const leftFootMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.045, 0.16),
      this.boneMaterial
    );
    leftFootMesh.position.set(0, -0.025, 0.05);
    leftFootMesh.castShadow = true;
    leftAnkle.add(leftFootMesh);

    const leftToes = new THREE.Group();
    leftToes.position.set(0, -0.025, 0.13);
    leftAnkle.add(leftToes);

    const leftToesMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.075, 0.03, 0.06),
      this.boneMaterial
    );
    leftToesMesh.position.set(0, 0, 0.03);
    leftToes.add(leftToesMesh);

    // --- RIGHT LEG ---
    const rightHip = new THREE.Group();
    rightHip.position.set(hipWidth, -0.04, 0);
    pelvis.add(rightHip);
    rightHip.add(makeJoint(0.04, 0x06b6d4));

    const rightFemurMesh = makeBone(0.042, 0.035, leftFemurLength);
    rightHip.add(rightFemurMesh);

    const rightKnee = new THREE.Group();
    rightKnee.position.set(0, -leftFemurLength, 0);
    rightHip.add(rightKnee);
    rightKnee.add(makeJoint(0.038, 0x10b981));

    const rightTibiaMesh = makeBone(0.034, 0.028, leftTibiaLength);
    rightKnee.add(rightTibiaMesh);

    const rightAnkle = new THREE.Group();
    rightAnkle.position.set(0, -leftTibiaLength, 0);
    rightKnee.add(rightAnkle);
    rightAnkle.add(makeJoint(0.03, 0x06b6d4));

    // Right Foot
    const rightFootMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.045, 0.16),
      this.boneMaterial
    );
    rightFootMesh.position.set(0, -0.025, 0.05);
    rightFootMesh.castShadow = true;
    rightAnkle.add(rightFootMesh);

    const rightToes = new THREE.Group();
    rightToes.position.set(0, -0.025, 0.13);
    rightAnkle.add(rightToes);

    const rightToesMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.075, 0.03, 0.06),
      this.boneMaterial
    );
    rightToesMesh.position.set(0, 0, 0.03);
    rightToes.add(rightToesMesh);

    // 5. Arms Setup
    const shoulderWidth = 0.18;
    const armLength = 0.28;
    const forearmLength = 0.25;

    // --- LEFT ARM ---
    const leftClavicle = new THREE.Group();
    leftClavicle.position.set(-shoulderWidth, 0.20, 0);
    spineUpper.add(leftClavicle);

    const leftShoulder = new THREE.Group();
    leftClavicle.add(leftShoulder);
    leftShoulder.add(makeJoint(0.035, 0x06b6d4));

    const leftHumerusMesh = makeBone(0.032, 0.025, armLength);
    leftShoulder.add(leftHumerusMesh);

    const leftElbow = new THREE.Group();
    leftElbow.position.set(0, -armLength, 0);
    leftShoulder.add(leftElbow);
    leftElbow.add(makeJoint(0.028, 0x10b981));

    const leftForearmMesh = makeBone(0.025, 0.02, forearmLength);
    leftElbow.add(leftForearmMesh);

    const leftHand = new THREE.Group();
    leftHand.position.set(0, -forearmLength, 0);
    leftElbow.add(leftHand);

    const leftHandMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.07, 0.02),
      this.boneMaterial
    );
    leftHandMesh.position.set(0, -0.035, 0);
    leftHand.add(leftHandMesh);

    // --- RIGHT ARM ---
    const rightClavicle = new THREE.Group();
    rightClavicle.position.set(shoulderWidth, 0.20, 0);
    spineUpper.add(rightClavicle);

    const rightShoulder = new THREE.Group();
    rightClavicle.add(rightShoulder);
    rightShoulder.add(makeJoint(0.035, 0x06b6d4));

    const rightHumerusMesh = makeBone(0.032, 0.025, armLength);
    rightShoulder.add(rightHumerusMesh);

    const rightElbow = new THREE.Group();
    rightElbow.position.set(0, -armLength, 0);
    rightShoulder.add(rightElbow);
    rightElbow.add(makeJoint(0.028, 0x10b981));

    const rightForearmMesh = makeBone(0.025, 0.02, forearmLength);
    rightElbow.add(rightForearmMesh);

    const rightHand = new THREE.Group();
    rightHand.position.set(0, -forearmLength, 0);
    rightElbow.add(rightHand);

    const rightHandMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.07, 0.02),
      this.boneMaterial
    );
    rightHandMesh.position.set(0, -0.035, 0);
    rightHand.add(rightHandMesh);

    return {
      root,
      pelvis,
      spineLower,
      spineUpper,
      neck,
      head,
      leftHip,
      leftKnee,
      leftAnkle,
      leftToes,
      rightHip,
      rightKnee,
      rightAnkle,
      rightToes,
      leftClavicle,
      leftShoulder,
      leftElbow,
      leftHand,
      rightClavicle,
      rightShoulder,
      rightElbow,
      rightHand
    };
  }

  // Create 3D Torque & Shear Stress Vectors
  private createStressVectors() {
    const group = new THREE.Group();

    // Helper to create ArrowHelper
    const makeArrow = (dir: THREE.Vector3, origin: THREE.Vector3, length: number, hex: number) => {
      const arrow = new THREE.ArrowHelper(dir.normalize(), origin, length, hex, 0.07, 0.04);
      group.add(arrow);
      return arrow;
    };

    const neck = makeArrow(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1.45, 0), 0.25, 0xef4444);
    const spine = makeArrow(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 1.05, 0), 0.25, 0xef4444);
    const leftKnee = makeArrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(-0.14, 0.5, 0), 0.22, 0xef4444);
    const rightKnee = makeArrow(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0.14, 0.5, 0), 0.22, 0xef4444);
    const leftAnkle = makeArrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(-0.14, 0.08, 0), 0.2, 0xef4444);
    const rightAnkle = makeArrow(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0.14, 0.08, 0), 0.2, 0xef4444);

    return { group, neck, spine, leftKnee, rightKnee, leftAnkle, rightAnkle };
  }

  // Create holographic sagittal/coronal alignment grid plane
  private createAlignmentPlane() {
    const planeGeo = new THREE.PlaneGeometry(0.8, 1.9);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      wireframe: true
    });
    const mesh = new THREE.Mesh(planeGeo, planeMat);
    mesh.position.set(0, 0.95, 0);
    return mesh;
  }

  // Apply real-time computed kinematics angles from GaitEngine
  public applyKinematics(
    angles: JointAngles,
    posture: PostureType,
    isAutoCorrected: boolean,
    walkingSpeedKmh: number,
    delta: number
  ) {
    // 1. Move infinite treadmill belt
    const beltSpeed = (walkingSpeedKmh / 5.0) * 1200 * delta;
    this.beltOffset += beltSpeed;
    this.updateBeltTexture(this.treadmillCtx, this.treadmillCanvas, this.beltOffset);
    this.treadmillTexture.needsUpdate = true;

    // 2. Pelvis movement
    this.pelvisGroup.position.y = 0.94 + angles.pelvisY;
    this.pelvisGroup.rotation.z = angles.pelvisRoll;
    this.pelvisGroup.rotation.y = angles.pelvisYaw;
    this.pelvisGroup.rotation.x = angles.pelvisPitch;

    // 3. Spine & Head
    this.spineLowerGroup.rotation.x = angles.spinePitch * 0.5;
    this.spineUpperGroup.rotation.x = angles.spinePitch * 0.5;
    this.spineUpperGroup.rotation.y = angles.spineYaw;
    this.neckGroup.rotation.x = angles.neckPitch;
    this.headGroup.rotation.x = angles.headPitch;

    // 4. Left Leg
    this.leftHipGroup.rotation.x = angles.leftHipPitch;
    this.leftHipGroup.rotation.z = angles.leftHipRoll;
    this.leftHipGroup.rotation.y = angles.leftHipYaw;

    this.leftKneeGroup.rotation.x = angles.leftKneePitch;
    this.leftKneeGroup.rotation.z = angles.leftKneeRoll;

    this.leftAnkleGroup.rotation.x = angles.leftAnklePitch;
    this.leftAnkleGroup.rotation.z = angles.leftAnkleRoll;
    this.leftToesGroup.rotation.x = angles.leftToesPitch;

    // 5. Right Leg
    this.rightHipGroup.rotation.x = angles.rightHipPitch;
    this.rightHipGroup.rotation.z = angles.rightHipRoll;
    this.rightHipGroup.rotation.y = angles.rightHipYaw;

    this.rightKneeGroup.rotation.x = angles.rightKneePitch;
    this.rightKneeGroup.rotation.z = angles.rightKneeRoll;

    this.rightAnkleGroup.rotation.x = angles.rightAnklePitch;
    this.rightAnkleGroup.rotation.z = angles.rightAnkleRoll;
    this.rightToesGroup.rotation.x = angles.rightToesPitch;

    // 6. Arms
    this.leftShoulderGroup.rotation.x = angles.leftShoulderPitch;
    this.leftElbowGroup.rotation.x = angles.leftElbowPitch;

    this.rightShoulderGroup.rotation.x = angles.rightShoulderPitch;
    this.rightElbowGroup.rotation.x = angles.rightElbowPitch;

    // 7. Update Stress Vectors
    this.updateStressVectors(posture, isAutoCorrected);
  }

  // Dynamically position and color alignment & stress vectors
  private updateStressVectors(posture: PostureType, isAutoCorrected: boolean) {
    const worldPos = new THREE.Vector3();

    // Color: Red (fault active) vs Bio-Emerald (corrected/optimal)
    const activeColor = isAutoCorrected || posture === 'optimal' ? 0x10b981 : 0xef4444;

    // Neck vector position
    this.neckGroup.getWorldPosition(worldPos);
    this.neckVector.position.copy(worldPos);
    const neckDir = posture === 'text_neck' && !isAutoCorrected
      ? new THREE.Vector3(0, -0.3, 1).normalize()
      : new THREE.Vector3(0, 1, 0);
    this.neckVector.setDirection(neckDir);
    this.neckVector.setColor(activeColor);
    this.neckVector.visible = posture === 'text_neck' || isAutoCorrected;

    // Spine vector
    this.spineLowerGroup.getWorldPosition(worldPos);
    this.spineVector.position.copy(worldPos);
    this.spineVector.setColor(activeColor);
    this.spineVector.visible = posture === 'heavy_heel' || isAutoCorrected;

    // Knees vectors
    this.leftKneeGroup.getWorldPosition(worldPos);
    this.leftKneeVector.position.copy(worldPos);
    let leftKneeDir = new THREE.Vector3(0, 1, 0);
    if (!isAutoCorrected) {
      if (posture === 'overpronation') leftKneeDir = new THREE.Vector3(1, -0.2, 0).normalize();
      else if (posture === 'supination') leftKneeDir = new THREE.Vector3(-1, -0.2, 0).normalize();
    }
    this.leftKneeVector.setDirection(leftKneeDir);
    this.leftKneeVector.setColor(activeColor);
    this.leftKneeVector.visible = posture === 'overpronation' || posture === 'supination' || isAutoCorrected;

    this.rightKneeGroup.getWorldPosition(worldPos);
    this.rightKneeVector.position.copy(worldPos);
    let rightKneeDir = new THREE.Vector3(0, 1, 0);
    if (!isAutoCorrected) {
      if (posture === 'overpronation') rightKneeDir = new THREE.Vector3(-1, -0.2, 0).normalize();
      else if (posture === 'supination') rightKneeDir = new THREE.Vector3(1, -0.2, 0).normalize();
    }
    this.rightKneeVector.setDirection(rightKneeDir);
    this.rightKneeVector.setColor(activeColor);
    this.rightKneeVector.visible = this.leftKneeVector.visible;

    // Ankles vectors
    this.leftAnkleGroup.getWorldPosition(worldPos);
    this.leftAnkleVector.position.copy(worldPos);
    this.leftAnkleVector.setColor(activeColor);
    this.leftAnkleVector.visible = posture === 'overpronation' || posture === 'supination' || posture === 'heavy_heel' || isAutoCorrected;

    this.rightAnkleGroup.getWorldPosition(worldPos);
    this.rightAnkleVector.position.copy(worldPos);
    this.rightAnkleVector.setColor(activeColor);
    this.rightAnkleVector.visible = this.leftAnkleVector.visible;

    // Holographic Alignment Plane opacity
    const targetPlaneOpacity = isAutoCorrected ? 0.35 : 0.0;
    const planeMat = this.alignmentPlane.material as THREE.MeshBasicMaterial;
    planeMat.opacity += (targetPlaneOpacity - planeMat.opacity) * 0.1;
  }

  // Smooth camera view transitions
  public setCameraPreset(preset: 'orbit' | 'side' | 'front' | 'top' | 'foot') {
    let targetPos = new THREE.Vector3(3.2, 1.8, 3.8);
    let targetLook = new THREE.Vector3(0, 0.95, 0);

    switch (preset) {
      case 'side':
        // Sagittal view (ideal for inspecting heel strike, spine posture & knee angles)
        targetPos = new THREE.Vector3(4.6, 1.2, 0);
        targetLook = new THREE.Vector3(0, 0.9, 0);
        break;
      case 'front':
        // Coronal view (ideal for inspecting overpronation valgus & pelvic drop)
        targetPos = new THREE.Vector3(0, 1.2, 4.4);
        targetLook = new THREE.Vector3(0, 0.9, 0);
        break;
      case 'top':
        // Transverse view (ideal for axial pelvic & trunk rotation)
        targetPos = new THREE.Vector3(0, 4.8, 0.2);
        targetLook = new THREE.Vector3(0, 0.5, 0);
        break;
      case 'foot':
        // Zoomed contact view
        targetPos = new THREE.Vector3(1.2, 0.35, 1.2);
        targetLook = new THREE.Vector3(0, 0.12, 0);
        break;
      case 'orbit':
      default:
        targetPos = new THREE.Vector3(3.2, 1.8, 3.8);
        targetLook = new THREE.Vector3(0, 0.95, 0);
        break;
    }

    gsap.to(this.camera.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 1.2,
      ease: 'power3.out'
    });

    gsap.to(this.controls.target, {
      x: targetLook.x,
      y: targetLook.y,
      z: targetLook.z,
      duration: 1.2,
      ease: 'power3.out',
      onUpdate: () => this.controls.update()
    });
  }

  // Animation frame render
  public render() {
    if (this.isDisposed) return;
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  private onResize = () => {
    if (!this.container || this.isDisposed) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight || 1;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public dispose() {
    this.isDisposed = true;
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
