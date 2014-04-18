function Soda (){
	/** The current dimensions of the screen (updated on resize) */
	var WIDTH = 0;
	var HEIGHT = 0;
	
	/** Wave settings */
	var DENSITY = .75;
	var FRICTION = 1.14;
	var MOUSE_PULL = 0.09; // The strength at which the mouse pulls particles within the AOE
	var AOE = 200; // Area of effect for mouse pull
	var DETAIL = Math.round( WIDTH / 60 ); // The number of particles used to build up the wave
	var WATER_DENSITY = 1.07;
	var AIR_DENSITY = 1.02;
	var TWITCH_INTERVAL = 2000; // The interval between random impulses being inserted into the wave to keep it moving
	
	/** Bubble settings */
	var MAX_BUBBLES = 100; // The maximum number of bubbles visible before FIFO is applied
	var BIG_BUBBLE_DISSOLVE = 5; // How many particles a bubble dissolves into when being clicked
	var SMALL_BUBBLE_DISSOLVE = 6;
	var BUBBLE_CREATE_FREQUENCY = 200; // Milliseconds between bubbles being added to the wave
	var BUBBLE_DISSOLVE_FREQUENCY = 300; // Milliseconds between bubbles being removed from the wave
	
	var canvas, context, particles, bubbles;

	var timeUpdateInterval, bubbleCreateInterval, bubbleDissolveInterval, twitchInterval;
	
	this.Initialize = function( canvasID ) {
		WIDTH = $('#' + canvasID).width();
		HEIGHT = $('#' + canvasID).height();
		DETAIL = Math.round( WIDTH / 20 );
		canvas = $('#' + canvasID)[0];

		if (canvas && canvas.getContext) {
			context = canvas.getContext('2d');

			particles = [];
			bubbles = [];

			// Generate our wave particles
			for( var i = 0; i < DETAIL+1; i++ ) {
					particles.push( { 
					x: WIDTH / (DETAIL-4) * (i-2), // Pad by two particles on each side
					y: HEIGHT*.2,
					original: {x: 0, y: HEIGHT * .2},
					velocity: {x: 0, y: Math.random()*3}, // Random for some initial movement in the wave
					force: {x: 0, y: 0},
					mass: 10
				} );
			}

			timeUpdateInterval = setInterval( TimeUpdate, 40 );
			bubbleCreateInterval = setInterval( CreateBubble, BUBBLE_CREATE_FREQUENCY );
			bubbleDissolveInterval = setInterval( DissolveBubble, BUBBLE_DISSOLVE_FREQUENCY );
			twitchInterval = setInterval( Twitch, TWITCH_INTERVAL );

			CreateBubble();
		}
		else {
			var soda = this;
			setTimeout(function(){soda.Initialize(canvasID);}, 400);
		}
	};
	
	function TimeUpdate(e) {
		var gradientFill = context.createLinearGradient(WIDTH*.5,HEIGHT*.2,WIDTH*.5,HEIGHT);
		//gradientFill.addColorStop(0,'#814116');
		gradientFill.addColorStop(0,'rgba(101,52,25,.8)');
		gradientFill.addColorStop(.5,'rgba(101,52,25,.8)');
		gradientFill.addColorStop(1,'rgba(69,122,39,.8)');

		context.clearRect(0, 0, WIDTH, HEIGHT);
		context.fillStyle = gradientFill;
		context.beginPath();
		context.moveTo(particles[0].x, particles[0].y);

		var len = particles.length;
		var i;
	
		var current, previous, next;

		for( i = 0; i < len; i++ ) {
			current = particles[i];
			previous = particles[i-1];
			next = particles[i+1];

			if (previous && next) {

				var forceY = 0;

				forceY += -DENSITY * ( previous.y - current.y );
				forceY += DENSITY * ( current.y - next.y );
				forceY += DENSITY/15 * ( current.y - current.original.y );

				current.velocity.y += - ( forceY / current.mass ) + current.force.y;
				current.velocity.y /= FRICTION;
				current.force.y /= FRICTION;
				current.y += current.velocity.y;

				// var distance = DistanceBetween( mp, current );
				// 
				// 				if( distance < AOE ) {
				// 					var distance = DistanceBetween( mp, {x:current.original.x, y:current.original.y} );
				// 
				// 					ms.x = ms.x * .98;
				// 					ms.y = ms.y * .98;
				// 
				// 					current.force.y += (MOUSE_PULL * ( 1 - (distance / AOE) )) * ms.y;
				// 				}

				// cx, cy, ax, ay
				context.quadraticCurveTo(previous.x, previous.y, previous.x + (current.x - previous.x) / 2, previous.y + (current.y - previous.y) / 2);
			}

		}

		context.lineTo(particles[particles.length-1].x, particles[particles.length-1].y);
		context.lineTo(WIDTH, HEIGHT);
		context.lineTo(0, HEIGHT);
		context.lineTo(particles[0].x, particles[0].y);

		context.fill();

		len = bubbles.length;

		context.fillStyle = "#rgba(255,255,255,0)";
		context.beginPath();

		var b, p;

		for (i = 0; i < len; i++) {
			var b = bubbles[i];
			var p = GetClosestParticle( b );

			b.velocity.y /= ( b.y > p.y ) ? WATER_DENSITY : AIR_DENSITY;
			b.velocity.y += ( p.y > b.y ) ? 1/b.mass : -((b.y-p.y)*0.002)/b.mass;
			b.y += b.velocity.y;

			if( b.x > WIDTH - b.currentSize ) b.velocity.x = -b.velocity.x;
			if( b.x < b.currentSize ) b.velocity.x = Math.abs(b.velocity.x);

			b.velocity.x /= 1.04;
			b.velocity.x = b.velocity.x < 0 ? Math.min( b.velocity.x, -.8/b.mass ) : Math.max( b.velocity.x, .8/b.mass )
			b.x += b.velocity.x;

			if( b.dissolved == false ) {
				context.moveTo(b.x,b.y);
				context.arc(b.x,b.y,b.currentSize,0,Math.PI*2,true);
			}
			else {
				b.velocity.x /= 1.15;
				b.velocity.y /= 1.05;

				while( b.children.length < b.dissolveSize ) {
					b.children.push( { x:0, y:0, size: Math.random()*b.dissolveSize, velocity: { x: (Math.random()*10)-10, y: -(Math.random()*5) } } );
				}

				for( var j = 0; j < b.children.length; j++ ) {
					var c = b.children[j];
					c.x += c.velocity.x;
					c.y += c.velocity.y;
					c.velocity.x /= 2;
					c.velocity.y += .2;
					c.size /= 1.1;

					context.moveTo(b.x+c.x,b.y+c.y); // needed in ff
					context.arc(b.x+c.x,b.y+c.y,c.size,0,Math.PI*2,true);
				}

			}

		}

		context.fill();
	}

	function GetClosestParticle(point){
		var closestIndex = 0;
		var closestDistance = 1000;

		var len = particles.length;

		for( var i = 0; i < len; i++ ) {
			var thisDistance = DistanceBetween( particles[i], point );

			if( thisDistance < closestDistance ) {
				closestDistance = thisDistance;
				closestIndex = i;
			}

		}

		return particles[closestIndex];
	}
	
	function Twitch() {
		var forceRange = .5; // -value to +value
		InsertImpulse( Math.random() * WIDTH, (Math.random()*(forceRange*2)-forceRange ) );
	}

	function InsertImpulse( positionX, forceY ) {
		var particle = particles[Math.round( positionX / WIDTH * particles.length )];

		if( particle ) {
			particle.force.y += forceY;
		}
	}
	
	function CreateBubble() {
		// if( bubbles.length > MAX_BUBBLES ) {
		// 	var i = 0;
		// 
		// 	if( bubbles[i].dissolved ) {
		// 		// Find a bubble thats not already on its way to dissolving
		// 		for( ; i < bubbles.length; i++ ) {
		// 			if( bubbles[i].dissolved == false ) {
		// 				bubbles[i].dissolveSize = BIG_BUBBLE_DISSOLVE;
		// 				DissolveBubble( i );
		// 				break;
		// 			}
		// 		}
		// 	}
		// 	else {
		// 		DissolveBubble( i );
		// 	}
		// }

		if(bubbles.length < MAX_BUBBLES){
			var minSize = 1;
			var maxSize = 5;
			var size = minSize + Math.random() * ( maxSize - minSize );
			var catapult = 10;

			var b = {
				x: maxSize + ( Math.random() * ( WIDTH - maxSize ) ),
				y: HEIGHT - maxSize,
				velocity: {x: (Math.random()*catapult)-catapult/2,y: 0},
				size: size,
				mass: (size / maxSize)+1,
				dissolved: false,
				dissolveSize: BIG_BUBBLE_DISSOLVE,
				children: []
			};

			b.currentSize = b.size;

			bubbles.push(b);
		}
	}
	
	function DissolveBubble() {
		var len = bubbles.length;
		for (i = 0; i < len; i++) {
			var b = bubbles[i];
			var p = GetClosestParticle( b );
			
			if(b.velocity.y > -0.1 && b.velocity.y < 0.1){
				if( b.dissolved == false ) {
					b.dissolved = true;

					setTimeout( function() {
						for( var i = 0; i < bubbles.length; i++ ) {
							if( bubbles[i] == b ) {
								bubbles.splice(i,1);
								break;
							}
						}

					}, 2000 );
					break;
				}
			}
		}
	}
	
	function DistanceBetween(p1,p2) {
		var dx = p2.x-p1.x;
		var dy = p2.y-p1.y;
		return Math.sqrt(dx*dx + dy*dy);
	}
}