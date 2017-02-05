// Instances of THREE classes
var container, stats, controls, clock;
// Instances of custom objects
var front_wheel, rear_wheel, effectController;
// Instances of renderer objects
var camera, scene, renderer, light;
// Instances of scene objects
var bike, road, sky, sunSphere;

// Global variables
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
var rear_present = false, front_present = false;

// Main script execution
init();
animate();

// Function definitions
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

  // Road
  var road_texture = new THREE.TextureLoader().load( 'assets/road.jpg' );
  road_texture.wrapS = road_texture.wrapT = THREE.RepeatWrapping;
  road_texture.repeat.set(1,20);
  road_texture.anisotropy = 16;
  var road_material = new THREE.MeshPhongMaterial( { map: road_texture, side: THREE.DoubleSide } );
  road_material.needsUpdate = true;
  road = new THREE.Mesh( new THREE.PlaneGeometry( 300, 6000, 4, 4 ), road_material );
  road.position.set( 0, -50, -1000 );
  road.rotation.x = - Math.PI / 2;
  road.receiveShadow = true;
  
  //scene.add( road );

  // var material2 = new THREE.MeshPhongMaterial( { color: 0x11CCFF, side: THREE.DoubleSide } );
  // var sphere = new THREE.Mesh(new THREE.SphereGeometry(50, 200, 100), material2);
  // sphere.castShadow = true;
  // sphere.position.set(0, 0, -300);
  // scene.add(sphere);

  buildPath();

  renderer = new THREE.WebGLRenderer();
  renderer.shadowMap.enabled = true;
  
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement );

  controls = new THREE.OrbitControls( camera, renderer.domElement );
  //controls.addEventListener( 'change', render ); // add this only if there is no animation loop (requestAnimationFrame)
 

  window.addEventListener( 'resize', onWindowResize, false );
  initSky();
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
  render();
}

function render() {
  var delta = clock.getDelta();

  if (bike && bike.position) {
    camera.lookAt( bike.position );
    rotateSpokes(delta);
  }

  if (road && road.material) {
    road.material.map.offset.y += .025;
  }

  if (effectController && effectController.inclination) {
    var distance = 400000;
  
    var uniforms = sky.uniforms;
    uniforms.turbidity.value = effectController.turbidity;
    uniforms.rayleigh.value = effectController.rayleigh;
    uniforms.luminance.value = effectController.luminance;
    uniforms.mieCoefficient.value = effectController.mieCoefficient;
    uniforms.mieDirectionalG.value = effectController.mieDirectionalG;
    var theta = Math.PI * ( effectController.inclination - 0.5 );
    var phi = 2 * Math.PI * ( effectController.azimuth - 0.5 );
    sunSphere.position.x = distance * Math.cos( phi );
    sunSphere.position.y = distance * Math.sin( phi ) * Math.sin( theta );
    sunSphere.position.z = distance * Math.sin( phi ) * Math.cos( theta );
    sunSphere.visible = effectController.sun;
    sky.uniforms.sunPosition.value.copy( sunSphere.position );
  }

  controls.update();
  stats.update();
  
  renderer.render( scene, camera );
}

var rear_spokes = [
  80,82,83,84,85,86,87,88,89,90,91,92,93,94,95,
  126,127,128,129,130,131,132,133,134,135,136,137,138,139,140
];

var front_spokes = [
  96,97,98,99,100,101,102,103,104,105,106,107,108,109,
  110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125
];

function rotateSpokes(delta) {
  delta *= Math.PI;
  prepareSpokes(delta);

  if (front_present) {
    front_wheel.rotation.z -= delta;
  }
  if (rear_present) {
    rear_wheel.rotation.z -= delta;
  }
}


function prepareSpokes(delta) {
  bike.children.forEach(function(mes, index) {
    mes.castShadow = true;
    if ( mes.name.indexOf('Cone') >= 0 )
    {
      cone_index = parseInt(mes.name.replace('Cone',''));
      if (rear_spokes.indexOf(cone_index) >=0 ){
        mes.geometry.center();
        rear_spokes.splice(rear_spokes.indexOf(cone_index), 1);
        rear_wheel.add(mes.clone());
        bike.remove(mes);
      }
      if (front_spokes.indexOf(cone_index) >=0 ){
        mes.geometry.center();
        front_spokes.splice(front_spokes.indexOf(cone_index), 1);
        front_wheel.add(mes.clone());
        bike.remove(mes);
      }
    }
    else {
      mes.castShadow = true;
    }
  });

  if (front_spokes.length == 0) {
    front_wheel.scale.set(2,2,2);
    front_wheel.position.z = - 25;
    front_wheel.position.y = - 35.5;
    front_wheel.rotation.y = Math.PI / 2;
    scene.add(front_wheel);
    front_present = true;
  }

  if (rear_spokes.length == 0) {
    rear_wheel.scale.set(2,2,2);
    rear_wheel.position.z = 25;
    rear_wheel.position.y = - 35.5;
    rear_wheel.rotation.y = Math.PI / 2;
    scene.add(rear_wheel);
    rear_present = true;
  }
}

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
  var segments = 30;
  var map = new THREE.TextureLoader().load( '/vendor/threejs/examples/textures/hardwood2_diffuse.jpg' );
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 16;
  var material = new THREE.MeshLambertMaterial( { map: map, side: THREE.DoubleSide } );

  for (var i = 0; i < segments; i++) {
    var object = new THREE.Mesh( new THREE.BoxGeometry( 100, 5, 10, 4, 4, 4 ), material );
    object.position.set( 0, -52, -12 * i );
    object.receiveShadow = true;
    scene.add( object );
  }
  
}
  