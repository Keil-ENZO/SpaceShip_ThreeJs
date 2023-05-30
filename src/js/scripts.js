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



let segmentDistance = 10;
let totalSegments = 500;
let roadWidth = 10;
let wallThickness = 1;

// Déterminer les limites de la route
let roadLimits = {
  minX: -190 - roadWidth / 2 - wallThickness, // Coordonnée x minimale du mur de gauche
  maxX: -190 + roadWidth / 2 + wallThickness, // Coordonnée x maximale du mur de droite
  minZ: 0, // Coordonnée z minimale (début de la route)
  maxZ: (totalSegments - 1) * segmentDistance, // Coordonnée z maximale (fin de la route)
};

let startTime = 0; // Temps de départ
let endTime = 0; // Temps de fin
let isRaceStarted = false; // Indicateur de début de course
let isRaceFinished = false; // Indicateur de fin de course
let raceElapsedTime = 0; // Temps écoulé depuis le début de la course

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
  const wallMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: false,
    opacity: 1,
  });

  const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
  leftWall.position.x = roadLimits.minX - 3;
  leftWall.position.y = 10;
  scene.add(leftWall);
  const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
  rightWall.position.x = roadLimits.maxX + 3;
  rightWall.position.y = 10;
  scene.add(rightWall);
});

// creation d'obsacles pneu
const obstacle = new GLTFLoader();
obstacle.load("./assets/pneu.glb", function (gltf) {
  const obstacleModel = gltf.scene;

  const totalPneu = 50;
  const segmentPneu = 50;

  const minObstacleOffset = -roadWidth / 2; // Offset minimal pour la position de l'obstacle
  const maxObstacleOffset = roadWidth / 2; // Offset maximal pour la position de l'obstacle

  for (let i = 0; i < totalPneu; i++) {
    const obstacleInstance = obstacleModel.clone();

    // Positionnement du segment de route en ligne droite
    const segmentOffset = i * segmentPneu;
    obstacleInstance.position.set(-190, 8, segmentOffset);

    // Génération de coordonnées aléatoires pour l'obstacle
    const obstacleX =
      Math.random() * (maxObstacleOffset - minObstacleOffset) +
      minObstacleOffset;
    const obstacleZ = segmentOffset;

    obstacleInstance.position.x += obstacleX;
    obstacleInstance.position.z += obstacleZ;

    obstacleInstance.rotateY(Math.PI / 2);

    scene.add(obstacleInstance);
  }
});

// ***************************************************************
// plane pour que le vehicle ne tombe pas
const planeGeo = new THREE.PlaneGeometry(25, 25);
const planeMat = new THREE.MeshBasicMaterial({ visible: false });
const planeMesh = new THREE.Mesh(planeGeo, planeMat);
planeMesh.position.x = -Math.PI / 2;
scene.add(planeMesh);
planeMesh.name = "plane";

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

// fonction pour le mouvement du vehicle
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

  // console.log(vehicle.rotation);

  // console.log("vehicule", vehicle.position);
}

const time = new YUKA.Time();

// animation du vehicle et de la camera
function animate(t) {
  const delta = time.update().getDelta();

  entityManager.update(delta);
  group.position.y = 0.2 * Math.sin(t / 500);

  camera.position.copy(vehicle.position).add(new THREE.Vector3(0, 3, -8));

  if (vehicle.position.z >= roadLimits.maxZ && !isRaceFinished) {
    endTime = Date.now(); // Enregistrer le temps de fin
    isRaceFinished = true; // Indiquer que la course est terminée
    const raceTime = endTime - startTime;
    updateRaceTime(raceTime); // Mettre à jour l'affichage du temps
  }

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

function updateRaceTime(time) {
  const minutes = Math.floor(time / 60000);
  const seconds = Math.floor((time % 60000) / 1000);
  const milliseconds = Math.floor((time % 1000) / 10);
  const formattedTime = `${minutes}:${padNumber(seconds, 2)}.${padNumber(
    milliseconds,
    2
  )}`;
  document.getElementById("race-time").textContent = formattedTime;
  this.document.getElementById("msg").textContent = "La course est fini !";
}

function padNumber(number, length) {
  return number.toString().padStart(length, "0");
}
// ecouteur d'evenement pour les touches du clavier
window.addEventListener("keydown", function (e) {
  handleKeyDown(e);
  if (!isRaceStarted) {
    startTime = Date.now(); // Enregistrer le temps de départ
    isRaceStarted = true; // Indiquer que la course a commencé
    this.setTimeout(() => {
      this.document.getElementById("msg").textContent = "";
    }, 1000);
    this.document.getElementById("msg").textContent = "La course a commencé !";
  }
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