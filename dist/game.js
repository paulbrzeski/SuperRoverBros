// Instances of THREE classes
var container;
var stats;
var controls;
var clock;
// Instances of custom objects
var front_wheel;
var rear_wheel;
var effectController;
// Instances of renderer objects
var camera;
var scene;
var renderer;
var light;
// Instances of scene objects
var bike;
var boardwalk;
var sky;
var sunSphere;
// Controls
var keys = reverse({
  UP: [87, 38],
  DOWN: [83, 40],
  LEFT: [65, 37],
  RIGHT: [68, 39]
});

// Global variables
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
// Main script execution
init();
animate();

// Base Function definitions
function init() {

  container = document.createElement( 'div' );
  document.body.appendChild( container );

  stats = new Stats();
  container.appendChild( stats.dom );

  clock = new THREE.Clock();

  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000000 );
  camera.position.y = 30;
  camera.position.z = 120;

  // scene
  scene = new THREE.Scene();

  var dLight = 300;
  var sLight = dLight * 0.25;
  
  light = new THREE.DirectionalLight( 0xffffff, 1);
  light.position.set( 500, 1500, 500 );
  light.target.position.set( 0, 0, 0 );
  light.castShadow = true;
  light.shadow = new THREE.LightShadow( new THREE.PerspectiveCamera( 45, 1, 1000, 20000 ) );
  light.shadow.bias = 0.0001;
  light.shadow.mapSize.width = 2048 * 2;
  light.shadow.mapSize.height = 2048 * 2;
  scene.add( light );
  //scene.add(new THREE.CameraHelper(light.shadow.camera));
 
  // model
  rear_wheel = new THREE.Group();
  front_wheel = new THREE.Group();
  
  var onProgress = function ( xhr ) {
    if ( xhr.lengthComputable ) {
      var percentComplete = xhr.loaded / xhr.total * 100;
      console.log( Math.round(percentComplete, 2) + '% downloaded' );
    }
  };

  var onError = function ( xhr ) { };

  THREE.Loader.Handlers.add( /\.dds$/i, new THREE.DDSLoader() );

  var mtlLoader = new THREE.MTLLoader();
  mtlLoader.setPath( 'assets/' );
  mtlLoader.load( 'bike.mtl', function( materials ) {

    materials.preload();

    var objLoader = new THREE.OBJLoader();
    objLoader.setMaterials( materials );
    objLoader.setPath( 'assets/' );
    objLoader.load( 'bike.obj', function ( object ) {

      object.position.y = - 50;
      object.rotation.y = Math.PI / 2;
      bike = object;
      
      scene.add( bike );
  
    }, onProgress, onError );

  });

  buildPath();

  renderer = new THREE.WebGLRenderer();
  renderer.shadowMap.enabled = true;
  
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement );

  controls = new THREE.OrbitControls( camera, renderer.domElement );
  //controls.addEventListener( 'change', render ); // add this only if there is no animation loop (requestAnimationFrame)
 

  window.addEventListener( 'resize', onWindowResize, false );

  var keyEvent = function (eventType) {
    return function(event) {
      handleKeys(eventType, event);
    };
  };
  window.addEventListener( 'keyup', keyEvent(true), false);
  window.addEventListener( 'keydown', keyEvent(false), false);
  
  initSky();
}

// Loop through a M:1 key-value obj and reverse it so many values resolve to original key.
function reverse(obj) {
  var newObj = {};

  for (var key in obj) {
    
    var isMultiDimensional = Array.isArray(obj[key]);
    if (isMultiDimensional) {
      for (var value in obj[key]) {
        newObj[obj[key][value]] = key;
      }
    }
    else {
      newObj[obj[key]] = key;
    }
  }

  return newObj;
}

function handleKeys(eventType, event) {
  console.log(keys);
  if (keys[event.keyCode]) {
    // console.log(eventType, event);
    // console.log(keys);
  }
}

function onWindowResize() {

  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {

  requestAnimationFrame( animate );
  TWEEN.update();
  //render();
}

/* World building functions */
function initSky() {
  // Add Sky Mesh
  sky = new THREE.Sky();
  scene.add( sky.mesh );
  // Add Sun Helper
  sunSphere = new THREE.Mesh(
    new THREE.SphereBufferGeometry( 20000, 16, 8 ),
    new THREE.MeshBasicMaterial( { color: 0xffffff } )
  );
  sunSphere.position.y = - 700000;
  sunSphere.visible = false;
  scene.add( sunSphere );
  /// GUI
  effectController  = {
    turbidity: 10,
    rayleigh: 2,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.8,
    luminance: 1,
    inclination: 0.4, // elevation / inclination
    azimuth: 0.15, // Facing front,
    sun: ! true
  };

  var sun_cycle = new TWEEN.Tween(effectController)
    .to({inclination: 0.6}, 10000)
    .repeat(Infinity)
    .yoyo(true)
    .start();

}

function buildPath () {
  boardwalk = [];
  var segments = 50;

  for (var i = 0; i < segments; i++) {
    var map = new THREE.TextureLoader().load( '/vendor/threejs/examples/textures/hardwood2_diffuse.jpg' );
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.offset.x = Math.random() * 10;
    var material = new THREE.MeshLambertMaterial( { map: map, side: THREE.DoubleSide, transparent: true, opacity: 1 } );
    var object = new THREE.Mesh( new THREE.BoxGeometry( 100, 3, 10, 4, 4, 4 ), material );
    object.position.set( 0, -52, -12 * i );
    object.receiveShadow = true;
    boardwalk.unshift(object);
    scene.add( boardwalk[0] );
  }
}
