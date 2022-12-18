import * as THREE from './libs/three125/three.module.js';
import { OrbitControls } from './libs/three/jsm/OrbitControls.js';
import { GLTFLoader } from './libs/three/jsm/GLTFLoader.js';
import { RGBELoader } from './libs/three/jsm/RGBELoader.js';
import { ARButton } from './libs/ARButton.js';
import { LoadingBar } from './libs/LoadingBar.js';
import { Player } from './libs/Player.js';
import { ControllerGestures } from './libs/ControllerGestures.js'

class App{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );

        this.clock = new THREE.Clock();
        
        this.loadingBar = new LoadingBar();
        this.loadingBar.visible = false;

		this.assetsPath = '../assets/ar-shop/';
        
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

        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        this.controls.target.set(0, 3.5, 0);
        this.controls.update();
        
        this.reticle = new THREE.Mesh(
            new THREE.RingBufferGeometry( 0.15, 0.2, 32 ).rotateX( - Math.PI / 2 ),
            new THREE.MeshBasicMaterial()
        );

        this.origin = new THREE.Vector3();
        this.euler = new THREE.Euler();
        this.quaternion = new THREE.Quaternion();
        
        this.reticle.matrixAutoUpdate = false;
        this.reticle.visible = false;
        this.scene.add( this.reticle );
        
        this.setupAR();
        this.setupVR();
        const vr=false;
        const ar=false;
		
		window.addEventListener('resize', this.resize.bind(this) );

        const listener = new THREE.AudioListener();
        this.camera.add( listener );

        const sound = new THREE.Audio( listener );

        const audioLoader = new THREE.AudioLoader();
        audioLoader.load( '../assets/lofi.mp3', function( buffer ) {
	    sound.setBuffer( buffer );
	    sound.setLoop( true );
	    sound.setVolume( 0.1 );
	    sound.play();
        });
	}

    remove(){
        if(self.object != null){
            self.scene.remove( self.object.object ); 
        }
    }

    setupVR(){
        this.renderer.xr.enabled = true;

        if ( 'xr' in navigator ) {

			navigator.xr.isSessionSupported( 'immersive-vr' ).then( ( supported ) => {

                if (supported){
                    const collection = document.getElementsByClassName("ar-button");
                    [...collection].forEach( el => {
                        el.style.display = 'block';
                    });
                }
			} );
            
		} 
    }


    setupAR(){
        this.renderer.xr.enabled = true;
        
        if ( 'xr' in navigator ) {

			navigator.xr.isSessionSupported( 'immersive-ar' ).then( ( supported ) => {

                if (supported){
                    const collection = document.getElementsByClassName("ar-button");
                    [...collection].forEach( el => {
                        el.style.display = 'block';
                    });
                }
			} );
            
		} 

        const self = this;

        this.hitTestSourceRequested = false;
        this.hitTestSource = null;
        
        function onSelect() {
            if (self.object===undefined) return;
            
            if (self.reticle.visible){
                self.object.object.position.setFromMatrixPosition( self.reticle.matrix );
                self.object.visible = true;
            }
        }

        this.controller = this.renderer.xr.getController( 0 );
        this.controller.addEventListener( 'select', onSelect );
        
        this.scene.add( this.controller );

        this.gestures = new ControllerGestures( this.renderer );
        this.gestures.addEventListener( 'tap', (ev)=>{
            if (self.object===undefined) return;
            if (self.reticle.visible){
                self.object.object.position.setFromMatrixPosition( self.reticle.matrix );
                self.object.visible = true;
                self.scene.add( self.object.object ); 
               
            }
            else{
                self.object.object.position.setFromMatrixPosition( self.reticle.matrix );
                self.object.object.visible = true;
                self.scene.add( self.object.object ); 
            }
            // if (!self.object.object.visible){
            //     self.object.object.visible = true;
            //     self.object.object.position.setFromMatrixPosition( self.reticle.matrix );
            //     //self.object.object.position.set( 0, -0.3, -0.5 ).add( ev.position );
            //     self.scene.add( self.object.object ); 
            // }
        });
        
        this.gestures.addEventListener( 'pan', (ev)=>{
            if (ev.initialise !== undefined){
                self.startPosition = self.object.object.position.clone();
            }else{
                const pos = self.startPosition.clone().add( ev.delta.multiplyScalar(3) );
                self.object.object.position.copy( pos );
            } 
        });
        this.gestures.addEventListener( 'swipe', (ev)=>{
            if (self.object.object.visible){
                self.object.object.visible = false;
                self.scene.remove( self.object.object ); 
            }
        });
        this.gestures.addEventListener( 'pinch', (ev)=>{
            if (ev.initialise !== undefined){
                self.startScale = self.object.object.scale.clone();
            }else{
                const scale = self.startScale.clone().multiplyScalar(ev.scale);
                self.object.object.scale.copy( scale );
            }
        });
        this.gestures.addEventListener( 'rotate', (ev)=>{
            if (ev.initialise !== undefined){
                self.startQuaternion = self.object.object.quaternion.clone();
            }else{
                self.object.object.quaternion.copy( self.startQuaternion );
                self.object.object.rotateY( ev.theta );
            }
        });
        
        this.renderer.setAnimationLoop( this.render.bind(this) );
    }

    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
    	this.camera.updateProjectionMatrix();
    	this.renderer.setSize( window.innerWidth, window.innerHeight ); 
    }
    
    VR(){
        this.vr=true;
        this.ar=false;
    }
    AR(){
        this.ar=true;
        this.vr=false;
    }

    VRBackground(){
        //this.scene.background = envmap;
		this.scene.position.z = -2;
    }

	showObject(id){
        if(this.ar)
        {
            this.initAR();
        }
        if(this.vr){
            this.initVR();
        }

        
		const loader = new GLTFLoader( ).setPath(this.assetsPath);
        const self = this;
        
        this.loadingBar.visible = true;
		

		// Load a glTF resource
		loader.load(
			// resource URL
			`object${id}.glb`,
			// called when the resource is loaded
			function ( gltf ) {

				//self.scene.add( gltf.scene );
                //self.object = gltf.scene;
        
                const object = gltf.scene;
				
				const options = {
					object: object,
					speed: 0.5,
					animations: gltf.animations,
					clip: gltf.animations[0],
					app: self,
					name: 'object',
					npc: false
				};

                self.object = new Player(options);
                self.object.visible = false; 
                
                self.loadingBar.visible = false;
                
                self.renderer.setAnimationLoop( self.render.bind(self) );
			},
			// called while loading is progressing
			function ( xhr ) {

				self.loadingBar.progress = (xhr.loaded / xhr.total);
				
			},
			// called when loading has errors
			function ( error ) {

				console.log( 'An error happened' );

			}
		);
	}	
    
    setEnvironment(){
        const loader = new RGBELoader();
        const pmremGenerator = new THREE.PMREMGenerator( this.renderer );
        pmremGenerator.compileEquirectangularShader();
        
        loader.load( '../assets/hdr/venice_sunset_1k.hdr', ( texture ) => {
          let envmap = pmremGenerator.fromEquirectangular( texture ).texture;
          pmremGenerator.dispose();

          this.scene.background = envmap;

        }, undefined, (err)=>{
            console.error( 'An error occurred setting the environment');
          console.error(err);
        } );
    }

    initAR(){
        let currentSession = null;
        const self = this;
        
        const sessionInit = { requiredFeatures: [ 'hit-test' ] };
        
        
        function onSessionStarted( session ) {

            session.addEventListener( 'end', onSessionEnded );

            self.renderer.xr.setReferenceSpaceType( 'local' );
            self.renderer.xr.setSession( session );
       
            currentSession = session;
            
        }

        function onSessionEnded( ) {

            currentSession.removeEventListener( 'end', onSessionEnded );

            currentSession = null;
            
            if (self.object !== null){
                self.scene.remove( self.object );
                self.object = null;
            }
            
            self.renderer.setAnimationLoop( null );

        }

        if ( currentSession === null ) {

            navigator.xr.requestSession( 'immersive-ar', sessionInit ).then( onSessionStarted );

        } else {

            currentSession.end();

        }
    }

    initVR(){

        let currentSession = null;

        this.setEnvironment();
        
        const self = this;

			async function onSessionStarted( session ) {

				session.addEventListener( 'end', onSessionEnded );

				await self.renderer.xr.setSession( session );

				currentSession = session;

			}

			function onSessionEnded( /*event*/ ) {

				currentSession.removeEventListener( 'end', onSessionEnded );

				currentSession = null;

                if (self.object !== null){
                    self.scene.remove( self.object );
                    self.object = null;
                }
                
                self.renderer.setAnimationLoop( null );

			}

        if ( currentSession === null ) {

            const sessionInit = { optionalFeatures: [ 'local-floor', 'bounded-floor', 'hand-tracking', 'layers' ] };
            navigator.xr.requestSession( 'immersive-vr', sessionInit ).then( onSessionStarted );

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
        const dt = this.clock.getDelta();

        if(this.ar){
            if ( this.renderer.xr.isPresenting ){
                this.gestures.update();
               
            }
    
            if ( frame ) {
                if ( this.hitTestSourceRequested === false ) this.requestHitTestSource( )
    
                if ( this.hitTestSource ) this.getHitTestResults( frame );
            }
        }
       

        if ( this.object !== undefined ) this.object.update(dt);
        this.renderer.render( this.scene, this.camera );

    }
}

export { App };