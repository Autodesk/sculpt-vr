import {getUrlParameterByName} from './js/util';
import 'three';
import Controller from './js/Controller';
import RenderingContextFactory from './js/view/RenderingContextFactory';

const renderingContextFactory = new RenderingContextFactory(getUrlParameterByName('mode'));
const controller = new Controller(renderingContextFactory);


