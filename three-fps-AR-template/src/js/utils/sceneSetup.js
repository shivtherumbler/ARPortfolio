import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory';
import { Player } from '../..';

const controllerModelFactory = new XRControllerModelFactory();

export const camera = (width, height) => {
    const _FOV = 70;
    const _ASPECT = width / height;
    const _NEAR = 0.1;
    const _FAR = 100;
    return new THREE.PerspectiveCamera(_FOV, _ASPECT, _NEAR, _FAR);
};

export const controls = (isFPS,camera, element) => {
    return new OrbitControls(camera, element);   
};

export const gridHelper = (size) => {
    return new THREE.GridHelper(size, size);
};

export const scene = () => {
    return new THREE.Scene();
};

export const renderer = (options) => {
    let renderer = new THREE.WebGLRenderer(options || {antialias: true});
    renderer.xr.enabled = true;
    return renderer;
};

export const Controller = (renderer, scene, index) => {
    let controller = renderer.xr.getController(index);

    const geometry = new THREE.BufferGeometry().setFromPoints( [new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,-1), ]);

    const line = new THREE.Line( geometry);
    line.name = 'line';
    line.scale.z = 5;

    controller.add(line.clone());

    let controllerGrip = renderer.xr.getControllerGrip(index);
    controllerGrip.add(controllerModelFactory.createControllerModel(controllerGrip));
    //scene.add(controllerGrip);

    //scene.add(controller);
    Player.add(controllerGrip);
    Player.add(controller);

    return controller;
}
