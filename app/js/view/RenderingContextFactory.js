import StandardRenderingContext from './StandardRenderingContext';
import VRRenderingContext from './VRRenderingContext';

export default class RenderingContextFactory {
    constructor(type) {
        this.type = type;
    }

    createRenderingContext(domContainer) {
        if (this.type === 'emu') {
            return new StandardRenderingContext(domContainer);
        } else {
            return new VRRenderingContext(domContainer);
        }
    }

}