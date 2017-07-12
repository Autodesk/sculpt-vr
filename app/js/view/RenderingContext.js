import Observable from '../Observable';

export default class RenderingContext extends Observable {
    constructor(container) {
        super();
        this.initialize(container);
    }

    initialize(container) {
        const width  = window.innerWidth, height = window.innerHeight;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(70, width / height, 0.01, 100);

        this.renderer = new THREE.WebGLRenderer( { antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setClearColor(0x050505, 1);

        this.hemiLight = new THREE.HemisphereLight( 0xffffff, 0x005570, 0.15 );
        this.scene.add(this.hemiLight);
    }

    getHeadsetPosition() {
        return this.camera.position;
    }

    getHeadsetRotation() {
        return this.camera.rotation;
    }

    getDomElement() {
        return this.renderer.domElement;
    }
}