import * as THREE from "three";
import * as YUKA from "yuka";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Vehicle } from "yuka";

import space from "../../static/back.jpg";

// creation de la scene
const renderer = new THREE.WebGLRenderer({ antialias: true });
// ajout de la taille de la fenetre
renderer.setSize(window.innerWidth, window.innerHeight);
// ajout de la scene dans le body
document.body.appendChild(renderer.domElement);
// creation de la scene
const scene = new THREE.Scene();

// ajout d'un background
const loaderTexture = new THREE.TextureLoader();
const bgTexture = loaderTexture.load([
  space,
  space,
  space,
  space,
  space,
  space,
]);
scene.background = bgTexture;

// ajout d'un vehicle
const vehicle = new Vehicle();
vehicle.scale.set(0.5, 0.5, 0.5);

// ajout de la camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// positionnement de la camera
camera.position.set(0, 10, -20);
camera.lookAt(scene.position);

// ajout du movement du vehicle
const movementSpeed = 0.3;
const movement = {
  left: false,
  right: false,
  up: false,
  down: false,
};

// lumiere ambiante pour que le vehicle soit visible
const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(ambientLight);

// lumiere directionnelle pour que le vehicle soit visible
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
scene.add(directionalLight);

// synchronisation du vehicle avec la scene
function sync(entity, renderComponent) {
  renderComponent.matrix.copy(entity.worldMatrix);
}

// ajout du vehicle dans le entityManager
const entityManager = new YUKA.EntityManager();
entityManager.add(vehicle);

// chargement du vehicle et ajout dans la scene
const loader = new GLTFLoader();
const group = new THREE.Group();
loader.load("./assets/Striker.glb", function (glb) {
  const model = glb.scene;
  model.matrixAutoUpdate = false;
  group.add(model);
  scene.add(group);
  vehicle.position.set(-189.6, 8, 5);
  vehicle.setRenderComponent(model, sync);
});

// ***************************---CIRCUIT---**********************


const race = new GLTFLoader();
race.load("./assets/road.glb", function (gltf) {
  const roadModel = gltf.scene;
  roadModel.position.set(19, 7, -190);

  const segmentDistance = 10;
  const totalSegments = 1000;
  const roadWidth = 10; // Largeur de la route
  const wallThickness = 1; // Épaisseur des murs

  // Déterminer les limites de la route
  const roadLimits = {
    minX: -190 - roadWidth / 2 - wallThickness, // Coordonnée x minimale du mur de gauche
    maxX: -190 + roadWidth / 2 + wallThickness, // Coordonnée x maximale du mur de droite
    minZ: 0, // Coordonnée z minimale (début de la route)
    maxZ: (totalSegments - 1) * segmentDistance, // Coordonnée z maximale (fin de la route)
  };

  for (let i = 0; i < totalSegments; i++) {
    const roadInstance = roadModel.clone();

    // Positionnement du segment de route en ligne droite
    const segmentOffset = i * segmentDistance;
    roadInstance.position.set(-190, 7, segmentOffset);

    roadInstance.rotateY(Math.PI / 2);

    scene.add(roadInstance);
  }

  // Création des murs de chaque côté de la route
  const wallGeometry = new THREE.BoxGeometry(
    wallThickness,
    10,
    totalSegments * segmentDistance
  );
  const wallMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });
  const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
  leftWall.position.x = roadLimits.minX - 3;
  leftWall.position.y = 10;
  scene.add(leftWall);
  const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
  rightWall.position.x = roadLimits.maxX + 3;
  rightWall.position.y = 10;
  scene.add(rightWall);
});




// ***************************************************************
// plane pour que le vehicle ne tombe pas
const planeGeo = new THREE.PlaneGeometry(25, 25);
const planeMat = new THREE.MeshBasicMaterial({ visible: false });
const planeMesh = new THREE.Mesh(planeGeo, planeMat);
planeMesh.position.x = -Math.PI / 2;
scene.add(planeMesh);
planeMesh.name = "plane";

// ***************************---Mouse VISION---**********************
// Exemple d'écouteur d'événements pour la souris
// document.addEventListener("mousemove", handleMouseMove);

// // vu 360 du decord avec le vehicle
// function handleMouseMove(event) {
//   const x = event.clientX;
//   const y = event.clientY;
//   const z = event.clientZ;

//   vehicle.position.x = x;
//   vehicle.position.y = y;
//   vehicle.position.z = z;

//   camera.position.x = x;
//   camera.position.y = y;
//   camera.position.z = z;

//   // camera.lookAt(scene.position);

// }

// *************************************************************

// function pour gerer les touches du clavier et le mouvement du vehicle
function handleKeyDown(event) {
  if (event.key === "ArrowLeft" && !movement.left) {
    movement.left = true;
    move();
  }
  if (event.key === "ArrowRight" && !movement.right) {
    movement.right = true;
    move();
  }
  if (event.key === "ArrowUp" && !movement.up) {
    movement.up = true;
    move();
  }
  if (event.key === "ArrowDown" && !movement.down) {
    movement.down = true;
    move();
  }
}

// function pour gerer les touches du clavier et le mouvement du vehicle
function handleKeyUp(event) {
  if (event.key === "ArrowLeft") {
    movement.left = false;
    vehicle.rotation.z = 0;
    vehicle.rotation.y = 0;
  }
  if (event.key === "ArrowRight") {
    movement.right = false;
    vehicle.rotation.z = 0;
    vehicle.rotation.y = 0;
  }
  if (event.key === "ArrowUp") {
    movement.up = false;
  }
  if (event.key === "ArrowDown") {
    movement.down = false;
  }
}




function move() {
  var direction = new THREE.Vector3();
  if (movement.right) {
    // direction.x = -1;
    vehicle.rotation.z = 0.3;
    vehicle.rotation.y = -0.3;
    vehicle.position.x -= 0.2;
  }
  if (movement.left) {
    // direction.x = 1;
    vehicle.rotation.z = -0.3;
    vehicle.rotation.y = 0.3;
    vehicle.position.x += 0.2;
  }
  if (movement.down) {
    // direction.z -= 1;
    vehicle.position.z -= 0.5;
  }
  if (movement.up) {
    // direction.z += 1;
    vehicle.position.z += 0.5;
  }

  direction.normalize();

  direction.multiplyScalar(movementSpeed);
  // vehicle.position.add(direction);

  if (movement.left || movement.right || movement.up || movement.down) {
    requestAnimationFrame(move);
  }

  console.log(vehicle.rotation);

  console.log("vehicule", vehicle.position);
}

const time = new YUKA.Time();

// animation du vehicle et de la camera
function animate(t) {
  const delta = time.update().getDelta();

  entityManager.update(delta);
  group.position.y = 0.2 * Math.sin(t / 500);

  camera.position.copy(vehicle.position).add(new THREE.Vector3(0, 3, -8));

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);




// ecouteur d'evenement pour les touches du clavier
window.addEventListener("keydown", function (e) {
  handleKeyDown(e);
});

// ecouteur d'evenement pour les touches du clavier
window.addEventListener("keyup", function (e) {
  handleKeyUp(e);
});

// resize de la fenetre pour que la camera s'adapte
window.addEventListener("resize", function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
