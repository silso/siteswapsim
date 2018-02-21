//script2.js
//Chris Roelofs
//takes in a juggling pattern and ladder timing information and creates a mostly physically accurate juggling animation.
//handles interactions with the canvas such as panning and zooming
//
//TO DO:
//create settings menu:
//		-time-scaling slider (maybe outside settings menu)
//		-k and g value sliders
//		-cool graphics effects (globalCompositeOperation)
//make canvas resize faster on low fps (and just in general)
//get rid of ghosts when you zoom in while panning at the same time
//stop panning (simulate mouseUp) when mouse leaves canvas (is it possible?)

let balls = [];
let hands = {};

let AnimationScript = function() {
	"use strict";
	let wrapper,
		HEIGHT,
		WIDTH,
		SCALE = 4,
		TRANSX = 0,
		TRANSY = 0,

		SPEED = 4,

		//gravitational acceleration
		G = -1/2000,
		//frames per second (max)
		FPS = 144,
		//scales the start and end velocities of the hand movements
		K = 0.001,

		now = Date.now(),
		then = Date.now(),
		interval = 1000/FPS,
		delta = now - then,

		canvas,
		ctx;

	let eventsAdded = false;

	////////
	//Hand class: moves and draws a hand according to the array/loop of hand movements hM.
	//refer to the start of the init() function for the structure of these arrays
	let Hand = function(hM, offset, ID) {
		//current and next movement objects and indices
		let curMove,
			nextMove,
			curIndex,
			nextIndex;

		//coefficients used for the path functions shown in the next function
		let coefXA,
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
			let totalTime = K * (curMove.end - curMove.start);

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
			// console.log(":::", this.t, );
			//time relative to the start of the hand movements loop
			this.t = (now - this.ti + this.offset) % hM[hM.length - 1].end;
			//time relative to the start of the hand movement
			let t = K*(this.t - curMove.start);

			//check whether this.t is within the current hand movement
			if (this.t < curMove.start || this.t > curMove.end) {
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

			this.offset = offset;

			//initializing other properties of the class that are used elsewhere
			this.t = this.ti;
			this.p = {};

			this.id = ID;

			curIndex = 0;
			this.setStart();
		};
	};


	////////
	//Ball class: moves and draws a ball according the ballMovements, and a hand's movements when it is grabbed
	let Ball = function(color, radius, bM, offset, ID) {
		//position in the ballMovements array
		let index;

		//timings for start and end of current throw and catch
		let throwStart,
			throwEnd,
			catchEnd;

		//called whenever the time is outside the current ballMovement
		this.setStart = function() {
			throwStart = bM[index].throw.start;
			throwEnd = bM[index].throw.end;
			catchEnd = bM[index].catch.end;
		};

		//called every frame, positions the ball according to a parabolic trajectory when in the middle of a throw, and according a hand's position when in a catch
		this.move = function() {
			//setting t to now relative to the length of time of the loop
			this.t = (now - this.ti + this.offset) % bM[bM.length - 1].catch.end;

			//if this.t is outside of range of ballMovement
			if (this.t > catchEnd || this.t < throwStart) {
				index = (index + 1) % bM.length;
				this.setStart();

			//if the throw is still happening
			} else if (this.t < throwEnd) {
				this.p = {
					x: ((bM[index].catch.p.x - bM[index].throw.p.x) / (throwEnd - throwStart))*(this.t - throwStart) +
						bM[index].throw.p.x,
					y: 0.5*G*(this.t - throwStart)*(this.t - throwStart) +
						((-0.5*G*(throwEnd - throwStart)*(throwEnd - throwStart) + bM[index].catch.p.y - bM[index].throw.p.y) / (throwEnd - throwStart))*(this.t - throwStart) +
						bM[index].throw.p.y
				};
			//if the ball is caught
			} else {
				hands[bM[index].catch.hand].grab(this);
			}
		};

		//used by a hand when the ball is grabbed
		this.setPos = function(p) {
			this.p.x = p.x;
			this.p.y = p.y;
		};

		//called before move each frame, draws a circle at appropriate position
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

		//called to initialize a bunch of variables
		this.init = function(time) {
			this.ti = time;
			this.offset = offset;

			this.p = {};

			this.c = color;
			this.r = radius;

			index = 0;

			this.bM = bM;
			this.id = ID;

			this.setStart();
		};
	};


	//


	this.init = function(inputPreset) {

		now = Date.now();

		wrapper = document.getElementById("animationWrapper");
		HEIGHT = wrapper.clientHeight;
		WIDTH = wrapper.clientWidth;
		canvas = document.getElementById("animationCanvas");
		ctx = canvas.getContext("2d");

		//handles events with a couple meta variables
		let events = {
			//true while mouse is dragging
			dragging: false,
			//where the mouse started dragging from
			startX: 0,
			startY: 0,
			mouseDown: function(e) {
				let r = canvas.getBoundingClientRect();
				//left click starts a drag
				if (e.button === 0) {
					events.dragging = true;

					events.startX = (e.clientX - r.left) - TRANSX;
					events.startY = (e.clientY - r.top) - TRANSY;
				}
				//middle mouse resets camera
				else if (e.button === 1) {
					TRANSX = 0;
					TRANSY = 0;
					SCALE = 4;
				}
				//right click logs debug info (currently coordinates of cursor)
				else {
					console.log((-TRANSX + (e.clientX - r.left - r.width/2))/SCALE + ", " + (TRANSY - (e.clientY - r.top - r.height/2))/SCALE);
				}
			},

			//translate the canvas according to where the mouse is compared to where is started
			mouseMove: function(e) {
				if (events.dragging) {
					let r = canvas.getBoundingClientRect();
					let x = e.clientX - r.left;
					let y = e.clientY - r.top;

					TRANSX = (x - events.startX);
					TRANSY = (y - events.startY);
				}
			},

			//stop dragging when mouse is released
			mouseUp: function(e) {
				events.dragging = false;
			},

			//zoom in and out when scroll wheel is used
			mouseWheel: function(e) {
				e.preventDefault();

				let scaleFactor = 1.4;
				let scrollDir = e.wheelDelta;
				let r = canvas.getBoundingClientRect();

				//in-animation coordinates of mouse relative to image origin (center of juggling patter typically)
				let mX = (e.clientX - r.left - r.width/2)/SCALE;
				let mY = (e.clientY - r.top - r.height/2)/SCALE;
				//in-animation coordinates of how much image origin has moved relative to canvas origin
				let TX = TRANSX/SCALE;
				let TY = TRANSY/SCALE;

				//why was this so hard to figure out
				if (scrollDir > 0) {
					//pan camera so that the camera zooms in on the mouse
					TRANSX = (mX + (TX - mX)*scaleFactor)*SCALE;
					TRANSY = (mY + (TY - mY)*scaleFactor)*SCALE;

					//zoom in
					SCALE *= scaleFactor;
				}
				else {
					TRANSX = (mX + (TX - mX)/scaleFactor)*SCALE;
					TRANSY = (mY + (TY - mY)/scaleFactor)*SCALE;

					SCALE /= scaleFactor;
				}
			}
		};

		if (!eventsAdded) {
			canvas.addEventListener('mousedown', events.mouseDown, false);
			canvas.addEventListener('mousemove', events.mouseMove, false);
			canvas.addEventListener('mouseup', events.mouseUp, false);
			canvas.addEventListener('mousewheel', events.mouseWheel, false);
			canvas.addEventListener('DOMMouseScroll', events.mouseWheel, false);

			eventsAdded = true;
		}






		//take siteswap and generate movements accordingly
		const site = inputPreset.site.site;
		const loops = inputPreset.site.loops;

		let lH = [];
		let rH = [];


		/*for (let i = 0; i < site.length; i++) {
			lH[2*i] = {
				p: {x:-5, y:0},
				v: {
					//these are the wrong numbers, x should depend on throw height too
					x:30,
					y:100*(site[i] - 1)
				},
				ti:1000*(2*i),
				t:1000*(2*i+1)
			}
			lH[2*i + 1] = {
				p: {x:-35, y:0},
				v: {
					x:-30,
					y:-50*(site[(i + 1) % site.length] - 1)
				},
				ti:1000*(2*i+1),
				t:1000*(2*i+2)
			}
			rH[2*i] = {
				p: {x:35, y:0},
				v: {
					x:30,
					y:-50*(site[i] - 1)
				},
				ti:1000*(2*i),
				t:1000*(2*i+1)
			}
			rH[2*i + 1] = {
				p: {x:5, y:0},
				v: {
					x:-30,
					y:100*(site[(i + 1) % site.length] - 1)
				},
				ti:1000*(2*i+1),
				t:1000*(2*i+2)
			}
		}*/

		/*(function() {
			let bP = JSON.parse(JSON.stringify(inputPreset.beatPattern));
			bP.forEach(function(thr) {
				thr.start /= SPEED/500;
				thr.end /= SPEED/500;
			});

			let siteSum = 0;
			for (let i = 0; i < site.length; i++) {
				siteSum += site[i];
			}

			let realLength = site.length * (siteSum % 2 + 1);

			for (let i = 0; i < realLength; i++) {
				let index = i % site.length;
				let nextI = (index + 1) % site.length;
				if (site[index] instanceof Array) {
					let multiplexSum = 0;
					for (let j = 0; j < site[index].length; j++) {
						multiplexSum += site[index][j];
					}

					let throwBP = bP[index];
					//bP element of where this throw will land
					let catchBP = bP[(index + Math.min(...site[index]) - 1) % site.length];

					if (!(i % 2)) {
						lH.push({
							p: {
								x: -5,
								y: 0
							},
							v: {
								x: (35 - (-5))/(catchBP.end - throwBP.start),
								y: 150*Math.log(Math.min(...site[index]) + 1)
							},
							start: throwBP.start,
							end: throwBP.end
						},
						{
							p: {
								x: -35,
								y: 0
							},
							v: {
								x: -30,
								y: -250
							},
							start: throwBP.end,
							end: bP[(index + 2) % bP.length].start
						});
					}
					else {
						rH.push({
							p: {
								x: 5,
								y: 0
							},
							v: {
								x: (-35 - 5)/(catchBP.end - throwBP.start),
								y: 150*Math.log(Math.min(...site[index]) + 1)
							},
							start: throwBP.start,
							end: throwBP.end
						},
						{
							p: {
								x: 35,
								y: 0
							},
							v: {
								x: 30,
								y: -250
							},
							start: throwBP.end,
							end: bP[(index + 2) % bP.length].start
						});
					}
				}
				else {
					let throwBP = bP[index];
					//bP element of where this throw will land
					let catchBP = bP[(index + site[index] - 1) % site.length];

					if (!(i % 2)) {
						lH.push({
							p: {
								x: -5,
								y: 0
							},
							v: {
								x: (35 - (-5))/(catchBP.end - throwBP.start),
								y: 150*Math.log(site[index] + 1)
							},
							start: throwBP.start,
							end: throwBP.end
						},
						{
							p: {
								x: -35,
								y: 0
							},
							v: {
								x: -30,
								y: -250
							},
							start: throwBP.end,
							end: bP[(index + 2) % bP.length].start
						});
					}
					else {
						rH.push({
							p: {
								x: 5,
								y: 0
							},
							v: {
								x: (-35 - 5)/(catchBP.end - throwBP.start),
								y: 150*Math.log(site[index] + 1)
							},
							start: throwBP.start,
							end: throwBP.end
						},
						{
							p: {
								x: 35,
								y: 0
							},
							v: {
								x: 30,
								y: -250
							},
							start: throwBP.end,
							end: bP[(index + 2) % bP.length].start
						});
					}
				}
			}
		})();*/

		/*(function() {
			let bP = JSON.parse(JSON.stringify(inputPreset.beatPattern));
			bP.forEach(function(thr) {
				thr.start /= SPEED/1000;
				thr.end /= SPEED/1000;
			});

			let siteSum = 0;
			for (let i = 0; i < site.length; i++) {
				siteSum += site[i];
			}

			let realLength = site.length * (siteSum % 2 + 1);

			for (let i = 0; i < realLength; i++) {
				let index = i % bP.length;
				let nextI = (index + 1) % bP.length;
				if (site[index] instanceof Array) {
					let multiplexSum = 0;
					for (let j = 0; j < site[index].length; j++) {
						multiplexSum += site[index][j];
					}

					let throwBP = bP[index];
					//bP element of where this throw will land
					let catchBP = bP[(index + Math.min(...site[index]) - 1) % site.length];

					if (!(i % 2)) {
						lH.push({
							p: {
								x: -5,
								y: 0
							},
							v: {
								x: (35 - (-5))/(catchBP.end - throwBP.start),
								y: 150*Math.log(Math.min(...site[index]) + 1)
							},
							start: throwBP.start,
							end: throwBP.end
						},
						{
							p: {
								x: -35,
								y: 0
							},
							v: {
								x: -30,
								y: -250
							},
							start: throwBP.end,
							end: bP[(index + 2) % bP.length].start
						});
					}
					else {
						rH.push({
							p: {
								x: 5,
								y: 0
							},
							v: {
								x: (-35 - 5)/(catchBP.end - throwBP.start),
								y: 150*Math.log(Math.min(...site[index]) + 1)
							},
							start: throwBP.start,
							end: throwBP.end
						},
						{
							p: {
								x: 35,
								y: 0
							},
							v: {
								x: 30,
								y: -250
							},
							start: throwBP.end,
							end: bP[(index + 2) % bP.length].start
						});
					}
				}
				else {
					let throwBP = bP[index];
					let nextThrowBP = bP[(index + 2) % bP.length];
					console.log(throwBP);
					//bP element of where this throw will land
					let catchBP = bP[(index + site[index % site.length] - 1) % site.length];

					if (!(i % 2)) {
						lH.push({
							p: {
								x: -5,
								y: 0
							},
							v: {
								x: (35 - (-5))/(catchBP.end - throwBP.start),
								y: 150*Math.log(site[index] + 1)
							},
							start: throwBP.start,
							end: nextThrowBP.start
						},
						{
							p: {
								x: -35,
								y: 0
							},
							v: {
								x: -30,
								y: -250
							},
							start: nextThrowBP.start,
							end: nextThrowBP.end
						});
					}
					else {
						rH.push({
							p: {
								x: 5,
								y: 0
							},
							v: {
								x: (-35 - 5)/(catchBP.end - throwBP.start),
								y: 150*Math.log(site[index] + 1)
							},
							start: throwBP.start,
							end: nextThrowBP.start
						},
						{
							p: {
								x: 35,
								y: 0
							},
							v: {
								x: 30,
								y: -250
							},
							start: nextThrowBP.start,
							end: nextThrowBP.end
						});
					}
				}
			}
		})();*/

		// lH = [
		// 	{
		// 		p: {
		// 			x: -5,
		// 			y: 0
		// 		},
		// 		v: {
		// 			x: 10,
		// 			y: 250
		// 		},
		// 		start: 0,
		// 		end: 750
		// 	},
		// 	{
		// 		p: {
		// 			x: -35,
		// 			y: 0
		// 		},
		// 		v: {
		// 			x: -50,
		// 			y: -150
		// 		},
		// 		start: 750,
		// 		end: 1000
		// 	}
		// ];
		// rH = [
		// 	{
		// 		p: {
		// 			x: 5,
		// 			y: 0
		// 		},
		// 		v: {
		// 			x: -10,
		// 			y: 250
		// 		},
		// 		start: 0,
		// 		end: 750
		// 	},
		// 	{
		// 		p: {
		// 			x: 35,
		// 			y: 0
		// 		},
		// 		v: {
		// 			x: 50,
		// 			y: -150
		// 		},
		// 		start: 750,
		// 		end: 1000
		// 	}
		// ];

		(function() {
			let site = inputPreset.site.site;
			console.log(site);
			let bP = JSON.parse(JSON.stringify(inputPreset.beatPattern));
			bP.forEach(function(thr) {
				thr.start /= SPEED/1000;
				thr.end /= SPEED/1000;
			});

			//hM arrays have to start at t=0, so the absolute timings from bP have to be shifted for the right hand
			let rHOffset = bP[0].end;
			let endTime = inputPreset.throwInfo.endTime*1000/SPEED;
			let bPLength = bP.length - 1;

			for (let i = 0; i < bPLength; i += 2) {
				console.log(i);

				let lHThrow = bP[i].start;
				let rHCatch = bP[i].end - rHOffset;
				let rHThrow = bP[i + 1].start - rHOffset;
				let lHCatch = bP[i + 1].end;

				//when the hand throws next
				let lHNextThrow = bP[(i + 2) % bPLength].start;
				if (lHNextThrow === 0) lHNextThrow = endTime;
				let rHNextCatch = (bP[(i + 2) % bPLength].end - rHOffset) % endTime;
				if (rHNextCatch === 0) rHNextCatch = endTime;

				//when the ball is going to land
				let lHThrowCatch = bP[(i + site[i % site.length]) % bPLength].start;
				if (lHThrowCatch === 0) lHThrowCatch = endTime;
				let rHThrowCatch = (bP[(i + 1 + site[i % site.length]) % bPLength].start - rHOffset) % endTime;
				if (rHThrowCatch === 0) rHThrowCatch = endTime;

				lH.push(
					{
						p: {
							x: -5,
							y: 0
						},
						v: {
							x: (35 - (-5))/(lHThrowCatch - lHThrow),
							y: 100*(site[i % site.length] + 1)
						},
						start: lHThrow,
						end: lHCatch
					},
					{
						p: {
							x: -35,
							y: 0
						},
						v: {
							x: -30,
							y: -150
						},
						start: lHCatch,
						end: lHNextThrow
					}
				);

				rH.push(
					{
						p: {
							x: 35,
							y: 0
						},
						v: {
							x: 10,
							y: -100
						},
						start: rHCatch,
						end: rHThrow
					},
					{
						p: {
							x: 5,
							y: 0
						},
						v: {
							x: (-35 - 5)/(rHThrowCatch - rHThrow),
							y: 100*(site[(i + 1) % site.length] + 1)
						},
						start: rHThrow,
						end: rHNextCatch
					}
				);
			}

			let leftHand = new Hand(lH, 0, "left");
			console.log(rHOffset);
			let rightHand = new Hand(rH, rHOffset + bP[1].start + 2*endTime, "right");

			hands = {
				left: leftHand,
				right: rightHand
			};

			for (let hand in hands) {
				hands[hand].init(now);
			}
		})();

		console.log(lH, rH);

		// let balls = [];

		let handMovements = [
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
		let handMovements2 = [
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



		//create a dwellpath array of objects, and use those to define the start and endpoints of the balls.


		console.log("%%%%%%%%%%%%%%%");
		//loop through loops
		for (let i = 0; i < loops.length; i++) {
			let loop = loops[i];
			//sum of throw numbers in a loop to find number of props
			let loopSum = 0;
			for (let j = 0; j < loop.length; j++) {
				loopSum += loop[j].n;
			}


			//number of balls to be created
			let loopPropCount = loopSum / site.length;


			//beat pattern
			let bP = inputPreset.beatPattern;

			//length of loop when accounting for ball landing in original hand
			let realLength = loop.length * (loopSum % 2 + 1);


			for (let j = 0; j < loopPropCount; j++) {
				let bM = [];

				// console.log(i, j);

				let sitePos = j * (site.length / loopPropCount);
				let endTime = inputPreset.throwInfo.endTime;


				//index of current throw in loop
				let loopIndex = 0;
				//index of next throw in loop
				let nextLoopIndex = (loopIndex + 1) % loop.length;


				//throw object with n = throw number and i = bP index
				//need to make these throw objects work for siteswaps (i includes i and j)
				let curThrow = loop[loopIndex];


				//index of current throw in beatPattern (and throwInfo)
				let throwIndex = j * (endTime / loopPropCount) +  curThrow.i % endTime;
				//index of next throw in beatPattern
				let nextThrowIndex = (throwIndex + curThrow.n) % endTime;
				//index of current catch in beatPattern (where current throw is landing) (nextThrowIndex - 1)
				let catchIndex = (nextThrowIndex + endTime - 1) % endTime;

				// console.log(throwIndex, nextThrowIndex, catchIndex);

				//shifts the ball movement such that first throw starts at t=0
				let shift = bP[throwIndex].start;

				console.log(i, j, shift);

				for (let k = 0; k < realLength; k++) {

					//apply aforementioned shift
					function shiftTime(time) {
						return ((time + endTime - shift) % endTime)/SPEED * 1000;
					}

					let isLeft = !(throwIndex % 2);
					let isNextLeft = !(nextThrowIndex % 2);

					//if the last catch is at the very last time, do not set it to zero, set it to the last time
					let lastCatch;
					if (shiftTime(bP[nextThrowIndex].start) === 0) {
						lastCatch = endTime/SPEED * 1000;
					}
					else {
						lastCatch = shiftTime(bP[nextThrowIndex].start);
					}

					bM[k] = {
						throw: {
							p: {
								x: isLeft ? -5 : 5,
								y: 0 //dP
							},
							start: shiftTime(bP[throwIndex].start),
							end: shiftTime(bP[catchIndex].end)
						},
						catch: {
							p: {
								x: isNextLeft ? -35 : 35,
								y: 0
							},
							start: shiftTime(bP[catchIndex].end),
							end: lastCatch,
							hand: isNextLeft ? "left" : "right"
						}
					}

					//update vars
					loopIndex = nextLoopIndex;
					nextLoopIndex = (loopIndex + 1) % loop.length;

					curThrow = loop[loopIndex];

					throwIndex = nextThrowIndex;
					nextThrowIndex = (throwIndex + curThrow.n) % endTime;
					catchIndex = (nextThrowIndex + endTime - 1) % endTime;
				}

				let color = "rgb(" + Math.floor(Math.random()*255) + "," + Math.floor(Math.random()*255) + "," + Math.floor(Math.random()*255) + ")";
				let newBall = new Ball(color, 7, bM, -shift/SPEED * 1000, i + "," + j);
				newBall.init(now);
				console.log(i, j, newBall);
				balls.push(newBall);
			}
		}





		function draw() {

			now = Date.now();

			//for some reason, the canvas likes to be a little bit larger than the wrapper, so I multiply by .995
			HEIGHT = 0.995*wrapper.clientHeight;
			WIDTH = 0.995*wrapper.clientWidth;
			if (Math.floor(HEIGHT) !== canvas.height) {
				canvas.height = HEIGHT;
			}
			if (Math.floor(WIDTH) !== canvas.width) {
				canvas.width = WIDTH;
			}

			// ctx.globalCompositeOperation = "luminosity";

			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.clearRect(0, 0, WIDTH, HEIGHT);
			ctx.translate(TRANSX, TRANSY);

			hands.left.draw(ctx);
			hands.right.draw(ctx);
			for (let i = 0; i < balls.length; i++) balls[i].draw(ctx);
			hands.left.move();
			hands.right.move();
			for (let i = 0; i < balls.length; i++) balls[i].move();

			window.requestAnimationFrame(draw);
		}

		window.requestAnimationFrame(draw);

	};
};

let animationInstance = new AnimationScript();
