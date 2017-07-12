import MainView from './view/MainView';
import {hslToRgb, lerp} from './util';

export default class Controller {
    constructor(renderingContextFactory) {
        this.view = new MainView(this, renderingContextFactory);
        this.view.initialize();
        this.initialize();
    }

    initialize() {
        this.room = new THREE.Mesh(new THREE.BoxBufferGeometry( 6, 6, 6, 8, 8, 8 ));
        this.room.position.y = 3;

        this.view.scene.add( this.room );

        for (let index = 0; index < this.view.renderingContext.controllers.length; index++) {
            const controller = this.view.renderingContext.controllers[index];
            controller.addEventListener('triggerdown', () => { this.onTriggerDown(index); });
            controller.addEventListener('menudown', () => { this.onMenuDown(index); });
        }
    }

    onTriggerDown(index) {

    }

    onMenuDown(index) {

    }

    onControllerMoved(controllers, head) {

    }
}