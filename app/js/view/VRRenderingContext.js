import '../lib/WEBVR';
import '../../../node_modules/three/examples/js/controls/VRControls';
import '../../../node_modules/three/examples/js/effects/VREffect';
import '../../../node_modules/three/examples/js/vr/ViveController';
import '../../../node_modules/three/examples/js/loaders/OBJLoader';
import RenderingContext from './RenderingContext';

export default class VRRenderingContext extends RenderingContext {
    initialize(container) {
        super.initialize(container);

        this.controls = new THREE.VRControls(this.camera);
        this.controls.standing = true;
        this.effect = new THREE.VREffect( this.renderer );

        if (THREE.WEBVR.isAvailable() === true) {
            document.body.appendChild( THREE.WEBVR.getButton( this.effect ) );
            // setTimeout(() => {
            //     this.effect.requestPresent();
            // }, 1000);
        }
        this.addControllers();
    }

    onRender(cb) {
        this.effect.requestAnimationFrame(cb);
        this.controls.update();
        const head = { position: this.getHeadsetPosition(), rotation: this.getHeadsetRotation() };
        for (let i = 0; i < this.controllers.length; i++) {
            this.controllers[i].update();
            this.controllers[i].matrixWorld.decompose(this.controllers[i].realPosition, this.controllers[i].realRotation, this.controllers[i].realScale);
        }
        this.dispatchEvent('onControllerPositionChange', { controllers: this.controllers, head: head });
        
        this.effect.render(this.scene, this.camera);
    }

    setSize(width, height) {
        this.effect.setSize(window.innerWidth, window.innerHeight);
    }

    addControllers() {
        this.controllers = [
            new THREE.ViveController(0),
            new THREE.ViveController(1)
        ];

        for (const controller of this.controllers) {
            controller.realPosition = new THREE.Vector3();
            controller.realRotation = new THREE.Euler();
            controller.realScale = new THREE.Vector3();
        }

        const loader = new THREE.OBJLoader();
        loader.setPath( 'models/vive-controller/' );
        loader.load( 'vr_controller_vive_1_5.obj', (object) => {
            const texLoader = new THREE.TextureLoader();
            texLoader.setPath( 'models/vive-controller/' );
            const controllerMesh = object.children[0];
            controllerMesh.material.map = texLoader.load( 'onepointfive_texture.png' );
            controllerMesh.material.specularMap = texLoader.load( 'onepointfive_spec.png' );

            for (const controller of this.controllers) {
                controller.add(object.clone());
                controller.standingMatrix = this.controls.getStandingMatrix();
                this.scene.add(controller);
            }
        });
    }

    getController(index) {
        return this.controllers[index];
    }
}