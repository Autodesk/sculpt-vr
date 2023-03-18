import './style.css';
import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import DentModifier from './DentModifier';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';

var isVRActive = false;
var controls;
var animate;
var container;
var camera, scene, renderer;
var controller1, controller2;


var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

var isCarving = false;
var force;
var dentModifier;
var sphereTool, surface;

// Parameters
var toolFactor = 0.6;
var bodyRadius = 0.5;
var toolRadius = 0.1 * toolFactor;
var direction = 1;
var surfaceCenter = new THREE.Vector3(0, bodyRadius + 0.9, 0);

init()

function createTool() {
	var sphereToolGeo = new THREE.SphereGeometry(toolRadius);
	var sphereMaterial = new THREE.MeshBasicMaterial({color: 0x00FF00, opacity: 0.5, transparent: true});
	sphereTool = new THREE.Mesh(sphereToolGeo, sphereMaterial);
	sphereTool.scale.set(toolFactor, toolFactor, toolFactor);
//				scene.add(sphereTool);
}

function createSurfaceMesh() {
	var geometry = new THREE.IcosahedronGeometry(bodyRadius, 63);
	var material = new THREE.MeshStandardMaterial( { wireframe: false, color:0x484F52, side: THREE.DoubleSide, metalness: 0.4});
	
//				mesh.position.add(surfaceCenter);
	var vertices = geometry.attributes.position.array;
	for (var i = 0; i < vertices.length; i+=3) {
		vertices[i + 1] += surfaceCenter.y;
	}

	geometry.attributes.position.needsUpdate = true;
	geometry.computeBoundingSphere();

	geometry = BufferGeometryUtils.mergeVertices(geometry);
//				geometry.attributes.position.needsUpdate = true;
	var mesh = new THREE.Mesh(geometry, material);
	return mesh;
}

function init() {
	container = document.createElement( 'div' );
	document.body.appendChild( container );

	scene = new THREE.Scene();

	// if (isVRActive) {
		camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
	// } else {
	// 	camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000);
	// 	camera.position.set( 0, 4, 5);
	// }

	surface = createSurfaceMesh();

	scene.add(surface);

	scene.add( camera );

	scene.add( new THREE.HemisphereLight( 0xffffff, 0x00ff00, 0.6 ));

	var light = new THREE.SpotLight( 0xffffff );
	light.position.set( 10, 10, 20 );
	light.target.position.set(0, 0, 0);

	scene.add( light );

	var light2 = new THREE.SpotLight( 0xffffff );
	light2.position.set( -10, 10, -20 );
	light2.target.position.set(0, 0, 0);
	scene.add( light2 );

	var gridHelper = new THREE.GridHelper( 10, 50 );
	scene.add( gridHelper );

	createTool();

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setClearColor( 0x505050 );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.sortObjects = false;
	container.appendChild( renderer.domElement );

	// Add VR button
	document.body.appendChild( VRButton.createButton( renderer ) );

	renderer.xr.enabled = true;

	if (isVRActive) {
		// controllers
		// controller1 = new THREE.ViveController( 0 );
		// controller1.standingMatrix = renderer.vr.getStandingMatrix();
		// controller1.addEventListener( 'thumbpaddown', onThumbpadDown );
		// controller1.addEventListener( 'thumbpadup', onThumbpadUp );
		// controller1.addEventListener( 'axischanged', onAxisChanged );
		// scene.add( controller1 );

		// controller2 = new THREE.ViveController( 1 );
		// controller2.standingMatrix = renderer.vr.getStandingMatrix();
		// scene.add( controller2 );

		// var loader = new THREE.OBJLoader();
		// loader.setPath( 'models/' );
		// loader.load( 'vr_controller_vive_1_5.obj', function ( object ) {
		// 	var loader = new THREE.TextureLoader();
		// 	loader.setPath( 'models/' );

		// 	var controller = object.children[ 0 ];
		// 	controller.material.map = loader.load( 'onepointfive_texture.png' );
		// 	controller.material.specularMap = loader.load( 'onepointfive_spec.png' );
		// 	controller.material.transparent = true;
		// 	controller.material.opacity = 0.3;
		// 	controller1.add( object.clone() );
		// 	controller2.add( object.clone() );

		// 	controller1.add(sphereTool);
		// });
	} else {
		controls = new OrbitControls(camera, renderer.domElement);
		controls.target.set(0, 0, 0);

		document.addEventListener( 'mousedown', onMouseDown, false );
		document.addEventListener( 'mouseup', onMouseUp, false );
		document.addEventListener( 'mousemove', onMouseMove, false );
	}

	window.addEventListener( 'resize', onWindowResize, false );

	dentModifier = new DentModifier();
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );
}

function onMouseMove( event ) {
	controls.enabled = !event.shiftKey;

	event.preventDefault();

	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function onMouseUp(event) {
	isCarving = false;
}

function onMouseDown(event) {
	if (event.shiftKey) {
		isCarving = true;
	}

	if (event.button == 0) {
		force = -1;
	} else {
		force = 1;
	}
}

var thumbPadPressed = false;
function onThumbpadDown( event ) {
	thumbPadPressed = true;
}

function onThumbpadUp( event ) {
	thumbPadPressed = false;
}

function onAxisChanged( event ) {
	if (!thumbPadPressed) {
		return;
	}

	var axes = event.axes;

	if (axes[1] > 0.5) {
		direction = 1;
	} else if (axes[1] < -0.5) {
		direction = -1;
	}
	if (direction > 0) {
		sphereTool.material.color.setHex(0x00FF00);
	} else {
		sphereTool.material.color.setHex(0x0000FF);
	}

	if (axes[0] > 0.5) {
		toolFactor += 0.01;
	} else if (axes[0] < -0.5) {
		toolFactor -= 0.01;
	}

	if (toolFactor > 2) toolFactor = 2;
	if (toolFactor < 0.1) toolFactor = 0.1;

	sphereTool.scale.set(toolFactor, toolFactor, toolFactor);
}

var controlPos = new THREE.Vector3();
function handleController( controller, id ) {
	controller.update();

	if (id !== 0) return;

	if (controller.getButtonState('trigger')) {
//                    var controlPos = controller.position.clone();
//					controlPos.applyMatrix4(controller.standingMatrix);
		controlPos.setFromMatrixPosition(sphereTool.matrixWorld);

		var toCenter = controlPos.clone().sub(surfaceCenter).multiplyScalar(-direction).normalize();
		dentModifier.set(controlPos, toCenter, toolRadius * toolFactor, direction > 0 ? 1 : 0).modify(surface.geometry);

		if (symmetry) {
			var symControlPos = controlPos.clone();
			symControlPos.x = -symControlPos.x;
			var toCenterSym = symControlPos.clone().sub(surfaceCenter).multiplyScalar(-direction).normalize();
			dentModifier.set(symControlPos, toCenterSym, toolRadius * toolFactor, direction > 0 ? 1 : 0).modify(surface.geometry);
		}
	}
}

var symmetry = true;
function render() {
	isVRActive = renderer.xr.isPresenting;
	if (isVRActive) {
		// handleController( controller1, 0 );
		// handleController( controller2, 1 );
	} else {
		controls.update();

		raycaster.setFromCamera(mouse, camera);

		var intersects = raycaster.intersectObject(surface);
		if (intersects.length > 0) {
			var intersectPnt = intersects[0].point.clone();

			sphereTool.visible = true;
			sphereTool.position.copy(intersects[0].point);

			if (isCarving) {
				var toCenter = intersectPnt.clone().sub(surfaceCenter).multiplyScalar(force).normalize();
				dentModifier.set(intersectPnt, toCenter, toolRadius, 1).modify(intersects[0].object.geometry);
			}
		} else {
			sphereTool.visible = false;
		}
	}

	renderer.render( scene, camera );
}

renderer.setAnimationLoop(render);