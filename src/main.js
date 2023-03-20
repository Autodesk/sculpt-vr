import './style.css';
import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton';
import { OrbitControls } from 'three/addons/controls/OrbitControls';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory';
import DentModifier from './DentModifier';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';

var isVRActive = false;
var controls;
var animate;
var container;
var camera, scene, renderer;
var controller1, controller2;
var controllerGrip1, controllerGrip2;
var controllerModelFactory;

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

var isCarving = false;
var force;
var dentModifier;
var sphereTool, surface;

// Parameters
var toolFactor = 0.6;
var bodyRadius = 0.5;
var toolRadius = 0.1;
var direction = 1;
var surfaceCenter = new THREE.Vector3(0, bodyRadius + 0.9, 0);

init()

function createTool() {
	var sphereToolGeo = new THREE.SphereGeometry(toolRadius);
	var sphereMaterial = new THREE.MeshBasicMaterial({color: 0x00FF00, opacity: 0.5, transparent: true});
	sphereTool = new THREE.Mesh(sphereToolGeo, sphereMaterial);
	sphereTool.scale.set(toolFactor, toolFactor, toolFactor);
	scene.add(sphereTool);
}

function createSurfaceMesh() {
	var geometry = new THREE.IcosahedronGeometry(bodyRadius, 64);
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
		// camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
	// } else {
		camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000);
		camera.position.set( 0, 4, 5);
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

	// if (true) {
		initControllers();
	// } else {
		controls = new OrbitControls(camera, renderer.domElement);
		controls.target.set(0, 0, 0);

		document.addEventListener( 'mousedown', onMouseDown, false );
		document.addEventListener( 'mouseup', onMouseUp, false );
		document.addEventListener( 'mousemove', onMouseMove, false );
	// }

	window.addEventListener( 'resize', onWindowResize, false );

	dentModifier = new DentModifier();
}

function initControllers() {
	function onSelectStart() {
		this.userData.isSelecting = true;
	}

	function onSelectEnd() {
		this.userData.isSelecting = false;
	}

	controller1 = renderer.xr.getController( 0 );
	controller1.addEventListener( 'selectstart', onSelectStart );
	controller1.addEventListener( 'selectend', onSelectEnd );
	controller1.addEventListener( 'squeezestart', onSqueezeStart );
	// controller1.addEventListener( 'squeezeend', onSqueezeEnd );
	controller1.addEventListener( 'connected', (e) => {
		controller1.gamepad = e.data.gamepad
	});
	controller1.userData.id = 0;
	scene.add( controller1 );

	// controller2 = renderer.xr.getController( 1 );
	// controller2.addEventListener( 'selectstart', onSelectStart );
	// controller2.addEventListener( 'selectend', onSelectEnd );
	// controller2.userData.id = 1;
	// scene.add( controller2 );

	controllerModelFactory = new XRControllerModelFactory();

	controllerGrip1 = renderer.xr.getControllerGrip( 0 );
	controllerGrip1.add( controllerModelFactory.createControllerModel( controllerGrip1 ) );
	scene.add( controllerGrip1 );
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

function onSqueezeStart() {
	direction = -direction;
	if (direction > 0) {
		sphereTool.material.color.setHex(0x00FF00);
	} else {
		sphereTool.material.color.setHex(0x0000FF);
	}
}

var controlPos = new THREE.Vector3();
var symControlPos = new THREE.Vector3();
function handleController( controller ) {
	const matrix = controller.matrixWorld;

	const { gamepad } = controller;
	const { axes } = gamepad;
	if (axes[3] > 0.5) {
		toolFactor += 0.01;
	} else if (axes[3] < -0.5) {
		toolFactor -= 0.01;
	}

	if (toolFactor > 2) toolFactor = 2;
	if (toolFactor < 0.1) toolFactor = 0.1;

	sphereTool.scale.set(toolFactor, toolFactor, toolFactor);

	const supportHaptic = 'hapticActuators' in gamepad && gamepad.hapticActuators != null && gamepad.hapticActuators.length > 0;

	sphereTool.position.setFromMatrixPosition( matrix );

	if ( controller.userData.isSelecting ) {
		controlPos.setFromMatrixPosition(matrix);

		var toCenter = controlPos.clone().sub(surfaceCenter).multiplyScalar(-direction).normalize();
		let modified = dentModifier.set(controlPos, toCenter, toolRadius * toolFactor, direction > 0 ? 1 : 0).modify(surface.geometry);

		if (symmetry) {
			symControlPos.copy(controlPos);
			symControlPos.x = -symControlPos.x;
			var toCenterSym = symControlPos.clone().sub(surfaceCenter).multiplyScalar(-direction).normalize();
			dentModifier.set(symControlPos, toCenterSym, toolRadius * toolFactor, direction > 0 ? 1 : 0).modify(surface.geometry);
		}

		if ( modified && supportHaptic ) {
			gamepad.hapticActuators[ 0 ].pulse( intensity, 100 );
		}
	}
}

var symmetry = true;
var wasPresenting = false;
function render() {
	isVRActive = renderer.xr.isPresenting;
	if (wasPresenting !== isVRActive) { // Got switched
		if (isVRActive) {
			// camera.position.set(0, 0, 2);
			camera.far = 20;
			sphereTool.visible = true;
		} else {
			camera.far = 1000;
		}
	}
	if (isVRActive) {
		if (!controller1) {
			initControllers();
		}
		handleController( controller1 );
		// handleController( controller2 );
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
				dentModifier.set(intersectPnt, toCenter, toolRadius * toolFactor, 1).modify(intersects[0].object.geometry);
			}
		} else {
			sphereTool.visible = false;
		}
	}

	renderer.render( scene, camera );

	wasPresenting = isVRActive;
}

renderer.setAnimationLoop(render);