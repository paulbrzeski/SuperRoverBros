
var container, stats, controls, bike, road;

var camera, scene, renderer;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;


init();
animate();


function init() {

  container = document.createElement( 'div' );
  document.body.appendChild( container );

  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
  camera.position.z = 100;

  // scene

  scene = new THREE.Scene();

  var ambient = new THREE.AmbientLight( 0x444444 );
  scene.add( ambient );

  var directionalLight = new THREE.DirectionalLight( 0xffeedd );
  directionalLight.position.set( 0, 0, 1 ).normalize();
  scene.add( directionalLight );
 
  // model

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
  scene.add( road );


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

  if (bike && bike.position) {
    camera.lookAt( bike.position );
  }

  if (road && road.material) {
    road.material.map.offset.y -= .05;
  }

  controls.update();
  renderer.render( scene, camera );

}