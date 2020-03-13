// Instances of THREE classes
var container, stats, controls, clock;
// Instances of custom objects
var front_wheel, rear_wheel, effectController;
// Instances of renderer objects
var camera, scene, renderer, light;
// Instances of scene objects
var bike, boardwalk, sky, sunSphere;
// Controls
var key_states = {},
    key_mappings = {
      UP:      [87, 38],
      DOWN:    [83, 40],
      LEFT:    [65, 37],
      RIGHT:   [68, 39]
    },
    reverse_key_mappings = reverse(key_mappings);

function setupKeyStates() {
  for (var button in key_mappings) {
    // Populate the key state array with a status field for the key.
    key_states[button] = 'up';
  }
}

function handleKeypress(eventType, event) {
  var new_state;
  if (eventType == 'up') {
    new_state = 'up';
  }
  if (eventType == 'down') {
    new_state = 'down';
  }
  if (reverse_key_mappings[event.keyCode]) {   
    if (reverse_key_mappings[event.keyCode] === "UP") {
      key_states['UP'] = new_state;
    }
    if (reverse_key_mappings[event.keyCode] === "DOWN") {
      key_states['DOWN'] = new_state;
    }
    if (reverse_key_mappings[event.keyCode] === "LEFT") {
      key_states['LEFT'] = new_state;
    }
    if (reverse_key_mappings[event.keyCode] === "RIGHT") {
      key_states['RIGHT'] = new_state;
    }
  }
}

function animateKeypress() {
  if (key_states['UP'] == 'down') {
    bike.translateZ(-1);
  }
  if (key_states['DOWN'] == 'down') {
    bike.translateZ(1);
  }
  if (key_states['LEFT'] == 'down') {
    bike.rotateY(Math.PI/180);
  }
  if (key_states['RIGHT'] == 'down') {
    bike.rotateY(-Math.PI/180);
  }
}

// Global variables
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
var rear_present = false, front_present = false;

// Main script execution
init();
animate();

// Base Function definitions
function init() {
  setupKeyStates();
  container = document.createElement( 'div' );
  document.body.appendChild( container );

  stats = new Stats();
  container.appendChild( stats.dom );

  clock = new THREE.Clock();

  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000000 );
  camera.position.z = 195;
  camera.position.y = 87;

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
      bike = object;
     
      bike.add(camera);
      scene.add( bike );
      bike.position.y = - 50;
      bike.position.z = -50;
      bike.rotateY(Math.PI / 2);

      bike.updateMatrix();
      bike.children.forEach(function(mesh){
        if (mesh.geometry) {
          mesh.geometry.applyMatrix( bike.matrix );
        }
      });

      bike.position.set( 0, 0, 0 );
      bike.rotation.set( 0, 0, 0 );
      bike.scale.set( 1, 1, 1 );
      bike.updateMatrix();
  
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
      handleKeypress(eventType, event);
    };
  }
  window.addEventListener( 'keyup', keyEvent('up'), false);
  window.addEventListener( 'keydown', keyEvent('down'), false);
  
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

function onWindowResize() {

  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {

  requestAnimationFrame( animate );
  animateKeypress();
  TWEEN.update();
  render();
}

function render() {
  var delta = clock.getDelta();

  if (bike && bike.position) {
    rotateSpokes(delta);
  }

  if (boardwalk && boardwalk.length > 0) {
    animatePath(delta);
  }

  if (effectController && effectController.inclination) {
    var distance = 400000;
  
    var uniforms = sky.material.uniforms;
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
    sky.material.uniforms.sunPosition.value.copy( sunSphere.position );
  }

  controls.update();
  stats.update();
  
  renderer.render( scene, camera );
}

/* Wheel specific functions.. cause it was hard! */
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
  if (front_spokes.length > 0 || rear_spokes > 0) {
    prepareSpokes(delta);
  }

  if (front_present) {
    front_wheel.rotation.x -= delta;
  }
  if (rear_present) {
    rear_wheel.rotation.x -= delta;
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
    front_wheel.position.z = -75;
    front_wheel.position.y = -35;
    bike.add(front_wheel);
    front_present = true;
  }

  if (rear_spokes.length == 0) {
    rear_wheel.scale.set(2,2,2);
    rear_wheel.position.z = -25;
    rear_wheel.position.y = -35;
    bike.add(rear_wheel);
    rear_present = true;
  }
}

/* World building functions */
function initSky() {
  // Add Sky Mesh
  sky = new THREE.Sky();
  sky.scale.setScalar( 450000 );
  scene.add( sky );
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
    .to({inclination: 0.6}, 1000000)
    .repeat(Infinity)
    .yoyo(true)
    .start();

}

function buildPath () {
  boardwalk = [];
  var segments = 50;

  for (var i = 0; i < segments; i++) {
    var map = new THREE.TextureLoader().load( 'https://threejs.org/examples/textures/hardwood2_diffuse.jpg' );
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

function animatePath(delta) {
  boardwalk.forEach(function(plank, index){
    plank.position.z += delta * 50;
    if (plank.position.z > 80) {
      var plank_fade = new TWEEN.Tween(plank.material)
        .to({opacity: 0.0}, 250)
        .start();
    }
    if (plank.position.z > 200) {
      scene.remove(boardwalk[index]);
      boardwalk.splice(index, 1);
      var front_z = boardwalk[0].position.z - 12;
      var map = new THREE.TextureLoader().load( 'https://threejs.org/examples/textures/hardwood2_diffuse.jpg' );
      map.wrapS = map.wrapT = THREE.RepeatWrapping;
      map.offset.x = Math.random() * 10;
      var material = new THREE.MeshLambertMaterial( { map: map, side: THREE.DoubleSide, transparent: true, opacity: 0 } );
      var object = new THREE.Mesh( new THREE.BoxGeometry( 100, 3, 10, 4, 4, 4 ), material );
      object.position.set( 0, -52, front_z );
      object.receiveShadow = true;
      boardwalk.unshift(object);
      var plank_fade = new TWEEN.Tween(boardwalk[0].material)
        .to({opacity: 1.0}, 3000)
        .start();
      scene.add( boardwalk[0] );
      
    }
  });
}
