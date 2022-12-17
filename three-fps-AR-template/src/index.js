import * as THREE from './js/three125/three.module.js';
//import './styles/index.scss';
//import * as SceneSetup from './js/utils/sceneSetup';
//import * as ThreeMeshUI from 'three-mesh-ui';
import { TextureLoader, Vector3 } from './js/three';
//import * as THREE from 'three';
import { GLTFLoader } from "./js/three/jsm/GLTFLoader.js"
//import { DRACOLoader } from './js/three/examples/jsm/DRACOLoader'
import { ARButton } from './js/ARButton.js';
import { LoadingBar } from './js/LoadingBar.js';

class App{
    constructor(){
        const container = document.createElement( 'div' );
		document.body.appendChild( container );

        this.loadingBar = new LoadingBar();
        this.loadingBar.visible = false;

        this.assetsPath = './ar-shop/';

        this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 20 );
		this.camera.position.set( 0, 1.6, 0 );

        this.scene = new THREE.Scene();

        const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        ambient.position.set( 0.5, 1, 0.25 );
		this.scene.add(ambient);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.outputEncoding = THREE.sRGBEncoding;
		container.appendChild( this.renderer.domElement );
        this.skybox();

        this.reticle = new THREE.Mesh(
            new THREE.RingBufferGeometry( 0.15, 0.2, 32 ).rotateX( - Math.PI / 2 ),
            new THREE.MeshBasicMaterial()
        );

        this.reticle.matrixAutoUpdate = false;
        this.reticle.visible = false;
        this.scene.add( this.reticle );
        
        this.setupAR();
		
		window.addEventListener('resize', this.resize.bind(this) );
    }

    setupAR(){
        this.renderer.xr.enabled = true;

        if( 'xr' in navigator){
            navigator.xr.isSessionSupported( 'immersive-ar' ).then( (supported) => {
                if(supported){
                const collection = document.getElementsByClassName("ar-button");
                [...collection].forEach( el => {
                    el.style.display = 'block';
                });
            }
            });
        }

        const self = this;

        this.hitTestSourceRequested = false;
        this.hitTestSource = null;

        function onSelect() {
            if (self.chair===undefined) return;
            
            if (self.reticle.visible){
                self.chair.position.setFromMatrixPosition( self.reticle.matrix );
                self.chair.visible = true;
            }
        }

        this.controller = this.renderer.xr.getController( 0 );
        this.controller.addEventListener( 'select', onSelect );
        
        this.scene.add( this.controller );
    }

    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
    	this.camera.updateProjectionMatrix();
    	this.renderer.setSize( window.innerWidth, window.innerHeight ); 
    }

    skybox(){
    
        let materialArray = [];
        textureLoader = new TextureLoader();
        let texture_ft = textureLoader.load('skybox/bay_ft.jpg');
        let texture_bk = textureLoader.load('skybox/bay_bk.jpg');
        let texture_up = textureLoader.load('skybox/bay_up.jpg');
        let texture_dn = textureLoader.load('skybox/bay_dn.jpg');
        let texture_rt = textureLoader.load('skybox/bay_rt.jpg');
        let texture_lf = textureLoader.load('skybox/bay_lf.jpg');
        
        materialArray.push(new THREE.MeshBasicMaterial( { map: texture_ft }));
        materialArray.push(new THREE.MeshBasicMaterial( { map: texture_bk }));
        materialArray.push(new THREE.MeshBasicMaterial( { map: texture_up }));
        materialArray.push(new THREE.MeshBasicMaterial( { map: texture_dn }));
        materialArray.push(new THREE.MeshBasicMaterial( { map: texture_rt }));
        materialArray.push(new THREE.MeshBasicMaterial( { map: texture_lf }));
       
        for (let i = 0; i < 6; i++)
        materialArray[i].side = THREE.BackSide;
       
        let skyboxGeo = new THREE.BoxGeometry( 10000, 10000, 10000);
        const skybox = new THREE.Mesh( skyboxGeo, materialArray );
        scene.add( skybox );
    }

    showObject(id){
        this.initAR();
        
		const loader = new GLTFLoader( ).setPath(this.assetsPath);
        const self = this;
        
        this.loadingBar.visible = true;

		
		loader.load(
			
			`chair${id}.glb`,
			
			function ( gltf ) {

				self.scene.add( gltf.scene );
                self.chair = gltf.scene;
        
                self.chair.visible = false; 
                
                self.loadingBar.visible = false;
                
                self.renderer.setAnimationLoop( self.render.bind(self) );
			},
			
			function ( xhr ) {

				self.loadingBar.progress = (xhr.loaded / xhr.total);
				
			}
		);
	}	
    
    initAR(){
        let currentSession = null;
        const self = this;

        const sessionInit = { requiredFeatures: ['hit-test']};

        function onSessionStarted(session){
            session.addEventListener('end', onSessionEnded);

            self.renderer.xr.setReferenceSpaceType('local');
            self.renderer.xr.getSession(session);

            currentSession = session;
        }

        function onSessionEnded(){
            currentSession.removeEventListener( 'end', onSessionEnded);
            currentSession = null;

            if(self.chair !== null){
                self.scene.remove(self.chair);
                self.chair = null;
            }

            self.renderer.setAnimationLoop( null );
        }

        if ( currentSession === null ) {

            navigator.xr.requestSession( 'immersive-ar', sessionInit ).then( onSessionStarted );

        } else {

            currentSession.end();

        }
    }

    requestHitTestSource(){
        const self = this;
        
        const session = this.renderer.xr.getSession();

        session.requestReferenceSpace( 'viewer' ).then( function ( referenceSpace ) {
            
            session.requestHitTestSource( { space: referenceSpace } ).then( function ( source ) {

                self.hitTestSource = source;

            } );

        } );

        session.addEventListener( 'end', function () {

            self.hitTestSourceRequested = false;
            self.hitTestSource = null;
            self.referenceSpace = null;

        } );

        this.hitTestSourceRequested = true;

    }

    getHitTestResults( frame ){
        const hitTestResults = frame.getHitTestResults( this.hitTestSource );

        if ( hitTestResults.length ) {
            
            const referenceSpace = this.renderer.xr.getReferenceSpace();
            const hit = hitTestResults[ 0 ];
            const pose = hit.getPose( referenceSpace );

            this.reticle.visible = true;
            this.reticle.matrix.fromArray( pose.transform.matrix );

        } else {

            this.reticle.visible = false;

        }

    }
    
    render( timestamp, frame ) {

        if ( frame ) {
            if ( this.hitTestSourceRequested === false ) this.requestHitTestSource( )

            if ( this.hitTestSource ) this.getHitTestResults( frame );
        }

        this.renderer.render( this.scene, this.camera );

    }
}

export { App };