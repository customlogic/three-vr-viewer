/**
 * @author mflux / http://minmax.design
 * Based on @mattdesl three-orbit-viewer
 */

const Emitter = require( 'events' );
const WEBVR = require( './thirdparty/webvr' );

module.exports = function create( {

  emptyRoom               = true,
  standing                = true,
  loadControllers         = true,
  vrButton                = true,
  antiAlias               = true,
  clearColor              = 0x505050,
  pathToControllers       = 'models/obj/vive-controller/',
  controllerModelName     = 'vr_controller_vive_1_5.obj',
  controllerTextureMap    = 'onepointfive_texture.png',
  controllerSpecMap       = 'onepointfive_spec.png',
  THREE
} = {} ){

const VREffect = require( './thirdparty/vreffect' )( THREE );
const VRControls = require( './thirdparty/vrcontrols' )( THREE );
const ViveController = require( './thirdparty/vivecontroller' )( THREE );
const OBJLoader = require( './thirdparty/objloader' )( THREE );

  if ( WEBVR.isLatestAvailable() === false ) {
    document.body.appendChild( WEBVR.getMessage() );
  }

  const events = new Emitter();

  const container = document.createElement( 'div' );
  document.body.appendChild( container );


  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 10 );
  scene.add( camera );

  if( emptyRoom ){
    const room = new THREE.Mesh(
      new THREE.BoxGeometry( 6, 6, 6, 8, 8, 8 ),
      new THREE.MeshBasicMaterial( { color: 0x404040, wireframe: true } )
    );
    room.position.y = 3;
    scene.add( room );

    scene.add( new THREE.HemisphereLight( 0x606060, 0x404040 ) );

    let light = new THREE.DirectionalLight( 0xffffff );
    light.position.set( 1, 1, 1 ).normalize();
    scene.add( light );
  }

  const renderer = new THREE.WebGLRenderer( { antialias: antiAlias } );
  renderer.setClearColor( clearColor );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.sortObjects = false;
  container.appendChild( renderer.domElement );

  const controls = new THREE.VRControls( camera );
  controls.standing = standing;


  const controller1 = new THREE.ViveController( 0 );
  const controller2 = new THREE.ViveController( 1 );
  scene.add( controller1, controller2 );

  if( loadControllers ){
    controller1.standingMatrix = controls.getStandingMatrix();
    controller2.standingMatrix = controls.getStandingMatrix();

    const loader = new THREE.OBJLoader();
    loader.setPath( pathToControllers );
    loader.load( controllerModelName, function ( object ) {

      const textureLoader = new THREE.TextureLoader();
      textureLoader.setPath( pathToControllers );

      const controller = object.children[ 0 ];
      controller.material.map = textureLoader.load( controllerTextureMap );
      controller.material.specularMap = textureLoader.load( controllerSpecMap );

      controller1.add( object.clone() );
      controller2.add( object.clone() );

    } );
  }

  const effect = new THREE.VREffect( renderer );

  if ( WEBVR.isAvailable() === true ) {
    if( vrButton ){
      document.body.appendChild( WEBVR.getButton( effect ) );
    }

    /*

    Sigh.

    Some day, when the world is a more trustworthy place, you can be back.

    if( autoEnter ){
      setTimeout( ()=>effect.requestPresent(), 1000 );
    }

    */
  }

  window.addEventListener( 'resize', function(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    effect.setSize( window.innerWidth, window.innerHeight );

    events.emit( 'resize', window.innerWidth, window.innerHeight );
  }, false );


  const clock = new THREE.Clock();
  clock.start();

  function animate() {
    const dt = clock.getDelta();

    controller1.update();
    controller2.update();

    controls.update();

    events.emit( 'tick',  dt );

    render();

    events.emit( 'render', dt )
    
    effect.requestAnimationFrame( animate );
  }

  function render() {
    effect.render( scene, camera );
  }

  function toggleVR(){
    effect.isPresenting ? effect.exitPresent() : effect.requestPresent();
  }


  animate();

  return {
    scene, camera, controls, renderer, vrEffect: effect,
    controllers: [ controller1, controller2 ],
    events,
    toggleVR
  };
}


if( window ){
  window.VRViewer = module.exports;
}