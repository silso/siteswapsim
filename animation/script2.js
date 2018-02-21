/*jshint esversion: 6 */
/*global window, document, console */
window.onload = function() {
	"use strict";
	var wrapper = document.getElementById("animationWrapper"),
		HEIGHT = wrapper.clientHeight,
		WIDTH = wrapper.clientWidth,
		SCALE = 4,
		TRANSX = 0,
		TRANSY = 0,

		//gravitational acceleration
		G = -1/2000,
		//frames per second (max)
		FPS = 60,
		//scales the start and end velocities of the hand movements
		K = 0.001,

		now = Date.now(),
		then = Date.now(),
		interval = 1000/FPS,
		delta = now - then;

	var canvas = document.getElementById("animationCanvas");
	var ctx = canvas.getContext("2d");

	var printCount = 0;
	var print = function(string) {
		if ((printCount += 1) < 300) {
			console.log(string);
		}
	};


	////////
	//Hand class: moves and draws a hand according to the array/loop of hand movements hM.
	//refer to the start of the init() function for the structure of these arrays
	var Hand = function(hM) {
		//current and next movement objects and indices
		var curMove,
			nextMove,
			curIndex,
			nextIndex;

		//coefficients used for the path functions shown in the next function
		var coefXA,
			coefXB,
			coefYA,
			coefYB;


		//called at the start of every movement, sets relative times and relevant movements
		this.setStart = function() {
			//next index in the hand movements loop (loops around if necessary)
			nextIndex = (curIndex + 1) % hM.length;

			//current and next movement objects
			curMove = hM[curIndex];
			nextMove = hM[nextIndex];

			//temporary variable used for the next calculation
			let totalTime = K * (curMove.t - curMove.ti);

			//the path the hands follow is of the form ax^3 + bx^2 + cx + d
			//this applies to the x and the y directions
			//a and b are calculated and stored as coefXA, coefXB, coefYA, etc.
			coefXA = (2 * curMove.p.x - 2 * nextMove.p.x + curMove.v.x * totalTime + nextMove.v.x * totalTime) / (totalTime * totalTime * totalTime);
			coefXB = (-3 * curMove.p.x + 3 * nextMove.p.x - 2 * curMove.v.x * totalTime - nextMove.v.x * totalTime) / (totalTime * totalTime);

			coefYA = (2 * curMove.p.y - 2 * nextMove.p.y + curMove.v.y * totalTime + nextMove.v.y * totalTime) / (totalTime * totalTime * totalTime);
			coefYB = (-3 * curMove.p.y + 3 * nextMove.p.y - 2 * curMove.v.y * totalTime - nextMove.v.y * totalTime) / (totalTime * totalTime);
		};


		//called each frame, moves the hand depending on the time relative to the loop of hand movements
		this.move = function() {
			//time relative to the start of the hand movements loop
			this.t = (now - this.ti) % hM[hM.length - 1].t;
			//time relative to the start of the hand movement
			let t = K*(this.t - curMove.ti);

			//check whether this.t is within the current hand movement
			if (this.t < curMove.ti || this.t > curMove.t) {
				//if it's not, increment index and set the start variables
				curIndex = (curIndex + 1) % hM.length;
				this.setStart();
				this.move();
			} else {
				//if it is, set position appropriately using the form mentioned earlier
				this.p = {
					x: coefXA*t*t*t + coefXB*t*t + curMove.v.x*t + curMove.p.x,
					y: coefYA*t*t*t + coefYB*t*t + curMove.v.y*t + curMove.p.y
				};
			}
		};


		//called each frame before the move method, draws a circle at the Hand's position
		this.draw = function(ctx) {
			//save the current context brush(?)
			ctx.save();
			//color it black (for now)
			ctx.fillStyle = "#222";
			//trace a circular path at the appropriate position, (0, 0) is at the center of the screen
			ctx.beginPath();
			ctx.arc(WIDTH/2 + SCALE*this.p.x,
				HEIGHT/2 - SCALE*this.p.y,
				SCALE*9/2, 0, 2*Math.PI);
			ctx.fill();
			//restore the previous context brush(?)
			ctx.restore();
		};


		//called by a ball during the ball's "catch" phase, sets the ball's position to the hand's position
		this.grab = function(ball) {
			ball.setPos(this.p);
		};


		//called during the global init() function, sets the origin time for the hand movements, declares Hand properties, then runs the method setStart()
		this.init = function(time) {
			//the Date.now() time corresponding to when the loop's t=0 is based
			this.ti = time;

			//initializing other properties of the class that are used elsewhere
			this.t = this.ti;
			this.p = {};

			curIndex = 0;
			this.setStart();
		};
	};


	////////
	//Ball class:
	var Ball = function(color, radius, bM, offset) {

		this.setStart = function() {
			this.tci = bM[this.i].throw.ti;
			this.tc = bM[this.i].throw.t;
			this.tf = bM[this.i].catch.t;
		};

		this.move = function() {
			this.t = (now - this.ti + this.offset) % bM[bM.length - 1].catch.t;		//setting t to now relative to the length of time of the loop
			if (this.t > this.tf || this.t < this.tci) {				//if this.t is outside of range of ballMovement
				this.i = (this.i + 1) % bM.length;
				this.setStart();
			} else if (this.t < this.tc) {
				this.p.x =
					((bM[this.i].catch.p.x - bM[this.i].throw.p.x) / (this.tc - this.tci))*(this.t - this.tci) +
					bM[this.i].throw.p.x;
				this.p.y =
					0.5*G*(this.t - this.tci)*(this.t - this.tci) +
					((-0.5*G*(this.tc - this.tci)*(this.tc - this.tci) + bM[this.i].catch.p.y - bM[this.i].throw.p.y) / (this.tc - this.tci))*(this.t - this.tci) +
					bM[this.i].throw.p.y;
			} else {
				bM[this.i].catch.h.grab(this);
			}
		};

		this.setPos = function(p) {
			this.p.x = p.x;
			this.p.y = p.y;
		};

		this.draw = function(ctx) {
			ctx.save();
			ctx.fillStyle = this.c;
			ctx.beginPath();
			ctx.arc(WIDTH / 2 + SCALE * this.p.x,
					HEIGHT / 2 - SCALE * this.p.y,
					SCALE * this.r / 2, 0, 2 * Math.PI);
			ctx.fill();
			ctx.restore();
		};

		this.init = function(time) {
			this.ti = time;
			this.offset = offset;

			this.p = {};

			this.c = color;
			this.r = radius;

			this.i = 0;

			this.setStart();
		};
	};


	//


	function init() {

		var handMovements = [
			{
				p: {
					x:-5,
					y:0
				},
				v: {
					x:30,
					y:500
				},
				ti:0,
				t:300
			},
			{
				p: {
					x:-35,
					y:0
				},
				v: {
					x:-30,
					y:-250
				},
				ti:300,
				t:600
			}
		];
		var handMovements2 = [
			{
				p: {
					x:35,
					y:0
				},
				v: {
					x:30,
					y:-250
				},
				ti:0,
				t:300
			},
			{
				p: {
					x:5,
					y:0
				},
				v: {
					x:-30,
					y:500
				},
				ti:300,
				t:600
			}
		];

		var leftHand = new Hand(handMovements);
		var rightHand = new Hand(handMovements2);

		leftHand.init(now);
		rightHand.init(now);

		var ballMovements = [
			{
				throw: {
					p: {
						x:-5,
						y:0
					},
					ti:0,
					t:1200
				},
				catch: {
					p: {
						x:35,
						y:0
					},
					t:1500,
					h:rightHand
				}
			},
			{
				throw: {
					p: {
						x:5,
						y:0
					},
					ti:1500,
					t:2700
				},
				catch: {
					p: {
						x:-35,
						y:0
					},
					t:3000,
					h:leftHand
				}
			}
		];

		var balls = [
			new Ball("#FF0000", 7, ballMovements, 0),
			new Ball("#00FF00", 7, ballMovements, 600),
			new Ball("#0000FF", 7, ballMovements, 1200),
			new Ball("#FF00FF", 7, ballMovements, 1800),
			new Ball("#00FFFF", 7, ballMovements, 2400)
		];

		balls.forEach(function(a) {a.init(now);});


		//


		function draw() {
			window.requestAnimationFrame(draw);

			now = Date.now();
			delta = now - then;

			if (delta > interval) {
				then = now - (delta % interval);

				//for some reason, the canvas likes to be a little bit larger than the wrapper, so I multiply by .995
				HEIGHT = 0.995*wrapper.clientHeight;
				WIDTH = 0.995*wrapper.clientWidth;
				// if (Math.floor(HEIGHT) !== canvas.height) {
					canvas.height = HEIGHT;
				// }
				// if (Math.floor(WIDTH) !== canvas.width) {
					canvas.width = WIDTH;
				// }

				//console.log(HEIGHT + ", " + canvas.height);

				// ctx.globalCompositeOperation = "luminosity";

				ctx.clearRect(0, 0, WIDTH, HEIGHT);

				ctx.setTransform(1, 0, 0, 1, 0, 0);
				ctx.translate(TRANSX, TRANSY);

				leftHand.draw(ctx);
				rightHand.draw(ctx);
				for (let i = 0; i < balls.length; i++) balls[i].draw(ctx);
				leftHand.move();
				rightHand.move();
				for (let i = 0; i < balls.length; i++) balls[i].move();
			}
		}

		window.requestAnimationFrame(draw);
	}

	var events = {
		dragging: false,
		startX: 0,
		startY: 0,
		mouseDown: function(e) {
			var r = canvas.getBoundingClientRect();
			if (e.button === 0) {
				events.dragging = true;

				events.startX = (e.clientX - r.left) - TRANSX;
				events.startY = (e.clientY - r.top) - TRANSY;
			}
			else if (e.button === 1) {
				TRANSX = 0;
				TRANSY = 0;
				SCALE = 4;
			}
			else {
				console.log("mX = " + (e.clientX - r.left - r.width/2)/SCALE + ", TX = " + TRANSX/SCALE);
			}
		},

		mouseMove: function(e) {
			if (events.dragging) {
				var r = canvas.getBoundingClientRect();
				var x = e.clientX - r.left;
				var y = e.clientY - r.top;

				TRANSX = (x - events.startX);
				TRANSY = (y - events.startY);
			}
		},

		mouseUp: function(e) {
			events.dragging = false;
		},

		mouseWheel: function(e) {
			var scaleFactor = 1.4;
			var scrollDir = e.wheelDelta;
			var r = canvas.getBoundingClientRect();

			var mX = (e.clientX - r.left - r.width/2)/SCALE;
			var mY = (e.clientY - r.top - r.height/2)/SCALE;
			var TX = TRANSX/SCALE;
			var TY = TRANSY/SCALE;

			//why was this so hard to figure out
			if (scrollDir > 0) {
				TRANSX = (mX + (TX - mX)*scaleFactor)*SCALE;
				TRANSY = (mY + (TY - mY)*scaleFactor)*SCALE;

				SCALE *= scaleFactor;
			}
			else {
				TRANSX = (mX + (TX - mX)/scaleFactor)*SCALE;
				TRANSY = (mY + (TY - mY)/scaleFactor)*SCALE;

				SCALE /= scaleFactor;
			}
		},

		doubleClick: function(e) {
			console.log("double!");
			e.preventDefault();
		}
	}

	canvas.addEventListener('mousedown', events.mouseDown, false);
	canvas.addEventListener('mousemove', events.mouseMove, false);
	canvas.addEventListener('mouseup', events.mouseUp, false);
	canvas.addEventListener('mousewheel', events.mouseWheel, false);
	canvas.addEventListener('DOMMouseScroll', events.mouseWheel, false);
	//canvas.addEventListener('dblclick', events.doubleClick, false);

	init();
}

//FIGURE OUT WHY SETTING CANVAS HEIGHT AND WIDTH EVERY FRAM HAS AN EFFECT ON PANNING
