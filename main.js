var App = (function(){
  	var container, stats;
  	var camera, controls, scene, renderer;
	var mesh, texture;
	var worldWidth = 264, worldDepth = 264, worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2;
	var worldSize = worldWidth * worldDepth;
	var movement = true;
	var worldData = new Uint8Array(new ArrayBuffer(worldSize));
	var clock = new THREE.Clock();

	return {

		init : function() {
			container = document.createElement( 'div' );
			container.setAttribute("id", "canvas-container");
			container.setAttribute("class", "canvas-container");
			document.body.appendChild( container );

			// Camera setup
			camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 15000 );
			camera.position.x = 3000;
			camera.position.y = worldData[ worldHalfWidth + worldHalfDepth * worldWidth ] * 10 + 3000;

			// Controls setup
			controls = new THREE.OrbitControls( camera );
			controls.rotateSpeed = 0.02;
			controls.enableDamping = true;
			controls.dampingFactor = 0.05;
			controls.minPolarAngle = Math.PI / 3;
			controls.maxPolarAngle = Math.PI / 3;
			controls.enableZoom = false;
			controls.autoRotate = true;
			controls.autoRotateSpeed = .1;
			
			// Noise setup
			noise.seed(Math.random()), quality = 1, z = 0;

			// Scene setup
			scene = new THREE.Scene();

			scene.fog = new THREE.FogExp2( 0x141428, 0.00038 );

			this.generateHeights();

			geometry = new THREE.PlaneBufferGeometry( 7500, 7500, worldWidth - 1, worldDepth - 1 );
			geometry.rotateX( - Math.PI / 2 );
			geometry.dynamic = true;

			mesh = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial({color:0x999999, wireframe:true}));

			this.updateMesh();

			scene.add( mesh );

			// Renderer setup
			renderer = new THREE.WebGLRenderer();
			renderer.setClearColor( 0x141428 );
			renderer.setPixelRatio( window.devicePixelRatio );
			renderer.setSize( window.innerWidth, window.innerHeight );

			container.innerHTML = "";
			container.appendChild( renderer.domElement );

			// Show stats if available
			try{
				stats = new Stats();
				container.appendChild( stats.dom );
			}catch(e){

			}

			// Scene fade in
			container.style.opacity = 0;
			new TWEEN.Tween(container.style).to({opacity: 1}, 2000 ).start();

			// Disable controls on touch devices
			if(this.util.isTouchDevice()) controls.enabled = false, movement = false;

			// Start animation
			this.animate();

		},

		resize: function() {

			camera.aspect = window.innerWidth / (window.innerHeight);
			camera.updateProjectionMatrix();
			renderer.setSize( window.innerWidth, window.innerHeight);

		},

		generateHeights: function() {

			for ( var j = 0; j < 4; j ++ ) {

				for ( var i = 0; i < worldSize; i ++ ) {

					var x = i % worldWidth, y = ~~ ( i / worldWidth );
					worldData[ i ] += Math.abs( noise.perlin3( x / quality, y / quality, z ) * quality * 1.5 );

				}

				quality *= 5;
			}

		},

		updateHeights: function () {

			quality = 1
			z += .005;

			for ( var i = 0; i < worldSize; i ++ ) {
				worldData[ i ] = 0;
			}

			for ( var j = 0; j < 4; j ++ ) {

				for ( var i = 0; i < worldSize; i ++ ) {

					var x = i % worldWidth, y = ~~ ( i / worldWidth );
					worldData[ i ] += Math.abs( noise.perlin3( x / quality, y / quality, z ) * quality * 1.5);
					
				}

				quality *= 5.5;
			}

		},

		updateMesh: function(){

			var vertices = mesh.geometry.attributes.position.array;

			for ( var i = 0, j = 0, l = vertices.length; i < l; i ++, j += 3 ) {

				vertices[ j + 1 ] = worldData[ i ] * 10;

			}

			mesh.geometry.attributes.position.needsUpdate = true;

		},

		animate: function(){
			TWEEN.update();

			requestAnimationFrame(this.animate.bind(this));
			controls.update();
			renderer.render( scene, camera );

			if(movement) {
				this.updateHeights();
				this.updateMesh();
			}

			if(stats) stats.update();

		},

		pause: function(){

			controls.autoRotate = false;
			movement = false;

		},

		restart: function(){

			controls.autoRotate = true;
			if(!this.util.isTouchDevice()) movement = true;

		},

		toggleMovement: function() {
			movement = (movement) ? false : true;
		},

		util : {
			isTouchDevice: function() {
				
				return 'ontouchstart' in window        // works on most browsers 
				|| navigator.maxTouchPoints;       // works on IE10/11 and Surface
			
			}
		}
	};
})();

// Window events setup
window.addEventListener( 'DOMContentLoaded', function(){
	App.init();
}, false );

window.addEventListener( 'resize', function(){
	App.resize();			
}, false );

window.addEventListener( 'scroll', function(){

	if(document.body.scrollTop > window.innerHeight) {
		App.pause();
	}else{
		App.restart();
	}

}, false );