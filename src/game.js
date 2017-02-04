var container, stats, controls, clock, bike, road;
var front_wheel, rear_wheel;
var camera, scene, renderer;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;


init();
animate();


function init() {

  container = document.createElement( 'div' );
  document.body.appendChild( container );

  stats = new Stats();
  container.appendChild( stats.dom );

  clock = new THREE.Clock();

  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 20000 );
  camera.position.x = -105;
  camera.position.z = 150;

  // scene

  scene = new THREE.Scene();

  var ambient = new THREE.AmbientLight( 0x444444 );
  scene.add( ambient );

  var directionalLight = new THREE.DirectionalLight( 0xffeedd );
  directionalLight.position.set( 0, 0, 1 ).normalize();
  scene.add( directionalLight );
 
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
  var road_material = new THREE.MeshLambertMaterial( { map: road_texture, side: THREE.DoubleSide } );
  road = new THREE.Mesh( new THREE.PlaneGeometry( 300, 6000, 4, 4 ), road_material );
  road.position.set( 0, -50, -400 );
  road.rotation.x = Math.PI / 2;
  //scene.add( road );


  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement );

  controls = new THREE.OrbitControls( camera, renderer.domElement );
  //controls.addEventListener( 'change', render ); // add this only if there is no animation loop (requestAnimationFrame)
 

  window.addEventListener( 'resize', onWindowResize, false );

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
  render();

}

function render() {
  var delta = clock.getDelta();

  if (bike && bike.position) {
    camera.lookAt( bike.position );
    rotateSpokes(delta);
  }

  if (road && road.material) {
    road.material.map.offset.y -= .05;
  }

  controls.update();
  renderer.render( scene, camera );

}

var rear_spokes = [
  80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,
  126,127,128,129,
  130,131,132,133,134,135,136,137,138,139,140
];

var front_spokes = [
  96,97,98,99,100,101,102,
  103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,
  123,124,125
];

function rotateSpokes(delta) {
  delta *= 10;
  bike.children.forEach(function(mes, index) { 
    if ( mes.name.indexOf('Cone') >= 0 )
    {
      cone_index = parseInt(mes.name.replace('Cone',''));
      if (rear_spokes.indexOf(cone_index) >=0 ){
        bike.remove(mes);
        rear_wheel.add(mes);
      }
      if (front_spokes.indexOf(cone_index) >=0 ){
        bike.remove(mes);
        front_wheel.add(mes);
      }
    }
  });
}
