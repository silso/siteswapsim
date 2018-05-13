//script2.js
//Chris Roelofs
//takes in a juggling pattern and ladder timing information and creates a mostly physically accurate juggling animation.
//handles interactions with the canvas such as panning and zooming
//
//TODO:
//make balls follow multiple repeats correctly
//make hands and balls completely time-dependant - no matter how you change time
//(forward, backwards, jumping) the positions will all be correct after one call of draw
//create settings menu:
//		-time-scaling slider (maybe outside settings menu)
//		-k and g value sliders
//		-cool graphics effects (globalCompositeOperation)
//make canvas resize faster on low fps (and just in general)
//get rid of ghosts when you zoom in while panning at the same time
//stop panning (simulate mouseUp) when mouse leaves canvas (is it possible?)


let hands = {};
let balls = [];

let AnimationScript = function() {
	"use strict";
	let wrapper,
		HEIGHT,
		WIDTH,
		SCALE = 4,

		SPEED = 1,
		PACE = 4,
		SHIFT = 100000,

		//gravitational acceleration
		G = -500,
		//frames per second (max)
		FPS = 144,
		//scales the start and end velocities of the hand movements
		K = 1,

		now = SPEED*Date.now()/1000,
		start = now,

		canvas,
		ctx;

	let EVENTSADDED = false;
	let dwellPath = [];

	let modCalls = 0;
	let mod = function(a, b) {
		if (modCalls++ > 1000){
			return "help";
		}
		return (a >= 0) ? a % b : mod(a + b, b);
	}

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
			//this was figured out using Cramer's rule
			coefXA = (2 * curMove.p.x - 2 * nextMove.p.x + curMove.v.x * totalTime + nextMove.v.x * totalTime) / (totalTime * totalTime * totalTime);
			coefXB = (-3 * curMove.p.x + 3 * nextMove.p.x - 2 * curMove.v.x * totalTime - nextMove.v.x * totalTime) / (totalTime * totalTime);

			coefYA = (2 * curMove.p.y - 2 * nextMove.p.y + curMove.v.y * totalTime + nextMove.v.y * totalTime) / (totalTime * totalTime * totalTime);
			coefYB = (-3 * curMove.p.y + 3 * nextMove.p.y - 2 * curMove.v.y * totalTime - nextMove.v.y * totalTime) / (totalTime * totalTime);
		};


		//called each frame, moves the hand depending on the time relative to the loop of hand movements
		this.move = function(time) {
			//time relative to the start of the hand movements loop
			modCalls = 0;
			this.t = mod(time - this.ti - this.offset, hM[hM.length - 1].end);
			if (this.t === "help") throw new Error("modulus failed in Hand.move");

			//time relative to the start of the hand movement
			let t = K*(this.t - curMove.start);

			//check whether this.t is within the current hand movement
			if (this.t < curMove.start || this.t > curMove.end) {
				//if it's not, increment index and set the start variables
				curIndex = (curIndex + 1) % hM.length;
				this.setStart();
				this.move(time);
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

			this.hM = hM;

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
		this.move = function(time) {
			//setting t to now relative to the length of time of the loop
			this.t = (time - this.ti + this.offset) % bM[bM.length - 1].catch.end;

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

	this.generateMovements = function(inputPreset, print) {
		dwellPath = [];
		balls = [];
		hands = {};

		//take siteswap and generate movements accordingly
		const site = inputPreset.site.site;
		const loops = inputPreset.site.loops;

		//generate dwellpath
		(function() {
			for (let i = 0; i < inputPreset.beats.right.length - 1; i += 2) {
				dwellPath[i] = [
					{
						x: -5,
						y: 0
					},
					{
						x: -35,
						y: 0
					}
				];
				dwellPath[i + 1] = [
					{
						x: 5,
						y: 0
					},
					{
						x: 35,
						y: 0
					}
				];
			}
		})();

		//generate handmovements
		(function() {
			let lH = [];
			let rH = [];

			let b = JSON.parse(JSON.stringify(inputPreset.beats));

			//hM arrays have to start at t=0, so the absolute timings from bP have to be shifted for the hands
			//the first number of beats.left is ignored, so now left and right arrays can be treated identically
			b.left.shift();

			for (let i = 0; i < b.left.length; i++) {
				b.left[i] /= PACE;
			}
			for (let i = 0; i < b.right.length; i++) {
				b.right[i] /= PACE;
			}

			let lHOffset = b.left[0];
			let rHOffset = b.right[0];
			let endTime = inputPreset.throwInfo.endTime/PACE;
			let bLength = b.right.length;

			for (let i = 0; i < bLength - 1; i += 2) {
				//pair of catch and throw times for each hand
				let rHCatch = b.right[i] - rHOffset;
				let lHCatch = b.left[i] - lHOffset;
				let rHThrow = b.right[i + 1] - rHOffset;
				let lHThrow = b.left[i + 1] - lHOffset;

				//when the hand throws next
				let rHNextCatch = b.right[(i + 2) % bLength] - rHOffset;
				if (rHNextCatch === 0) rHNextCatch = endTime;
				let lHNextCatch = b.left[(i + 2) % bLength] - lHOffset;
				if (lHNextCatch === 0) lHNextCatch = endTime;

				//when the ball is going to land (throw duration)
				let rHThrowNum = site[(i + 1) % site.length];
				if (rHThrowNum instanceof Array) {
					rHThrowNum = Math.min(...rHThrowNum);
				}

				//using mod function because the displacement time can sometimes be negative
				let rHThrowTime;
				if (rHThrowNum % 2) {
					rHThrowTime = mod(b.left[(i - 1 + rHThrowNum) % bLength] - rHOffset - rHThrow, endTime);
				}
				else {
					if (rHThrowNum === 0) {
						rHThrowTime = 0.5;
					}
					else {
						rHThrowTime = mod(b.right[(i + rHThrowNum) % bLength] - rHOffset - rHThrow, endTime);
					}
				}
				let lHThrowNum = site[(i + 2) % site.length];
				if (lHThrowNum instanceof Array) {
					lHThrowNum = Math.min(...lHThrowNum);
				}
				let lHThrowTime;
				if (lHThrowNum % 2) {
					lHThrowTime = mod(b.right[(i + 1 + lHThrowNum) % bLength] - lHOffset - lHThrow, endTime);
				}
				else {
					if (lHThrowNum === 0) {
						lHThrowTime = 0.5;
					}
					else {
						lHThrowTime = mod(b.left[(i + lHThrowNum) % bLength] - lHOffset - lHThrow, endTime);
					}
				}

				let rHThrowVel = {}, lHThrowVel = {};
				//copying speed of ball at time of throw (from Ball.move)
				rHThrowVel.y = -0.5*G*rHThrowTime*rHThrowTime + dwellPath[i + 1][1].y - dwellPath[i + 1][0].y / rHThrowTime;
				lHThrowVel.y = -0.5*G*lHThrowTime*lHThrowTime + dwellPath[(i + 2) % bLength][1].y - dwellPath[(i + 2) % bLength][0].y / lHThrowTime;

				//where the ball will be caught - where the ball is thrown from (displacement) divided by time to give velocity
				rHThrowVel.x = (dwellPath[(i + 1 + rHThrowNum) % bLength][1].x - dwellPath[(i + 1 + rHThrowNum) % bLength][0].x)/rHThrowTime;
				lHThrowVel.x = (dwellPath[(i + 2 + lHThrowNum) % bLength][1].x - dwellPath[(i + 2 + lHThrowNum) % bLength][0].x)/lHThrowTime;

				// console.log(i, lHThrowNum, lHThrowTime, lHThrowVel.y);

				rH.push(
					{
						p: dwellPath[mod(i - 1, bLength)][1],
						v: {
							x: 10,
							y: -35*rHThrowNum
						},
						start: rHCatch,
						end: rHThrow
					},
					{
						p: dwellPath[i + 1][0],
						v: {
							x: rHThrowVel.x,
							y: rHThrowVel.y
						},
						start: rHThrow,
						end: rHNextCatch
					}
				);

				lH.push(
					{
						p: dwellPath[i][1],
						v: {
							x: -30,
							y: -35*lHThrowNum
						},
						start: lHCatch,
						end: lHThrow
					},
					{
						p: dwellPath[(i + 2) % bLength][0],
						v: {
							x: lHThrowVel.x,
							y: lHThrowVel.y
						},
						start: lHThrow,
						end: lHNextCatch
					}
				);
			}

			let rightHand = new Hand(rH, rHOffset, "right");
			let leftHand = new Hand(lH, lHOffset, "left");

			hands = {
				left: leftHand,
				right: rightHand
			};

			for (let hand in hands) {
				hands[hand].init(start);
			}
		})();

		//generate ballmovements
		(function() {
			//beat pattern
			let b = JSON.parse(JSON.stringify(inputPreset.beats));

			for (let i = 0; i < b.left.length; i++) {
				b.left[i] /= PACE;
			}
			for (let i = 0; i < b.right.length; i++) {
				b.right[i] /= PACE;
			}

			for (let i = 0; i < loops.length; i++) {
				let loop = loops[i];

				//sum of throw numbers in a loop to find number of props
				let loopSum = 0;
				for (let j = 0; j < loop.length; j++) {
					loopSum += loop[j].n;
				}

				let endIndex = inputPreset.throwInfo.endTime;
				let endTime = endIndex/PACE;

				//number of balls to be created
				let loopPropCount = loopSum / site.length;
				//length of loop when accounting for ball landing in original hand
				let realLength = (endIndex / loopSum) * loop.length * (loopSum % 2 + 1);

				for (let j = 0; j < loopPropCount; j++) {
					let bM = [];

					let sitePos = j * (site.length / loopPropCount);

					//this function is needed to incorporate the new structure of Preset.beats
					function getBeatTime(index, start) {
						if (index % 2) {
							return start ? b.right[index] : b.left[index];
						}
						else {
							return start ? b.left[index] : b.right[index];
						}
					}

					//index of current throw in loop
					let loopIndex = 0;
					//index of next throw in loop
					let nextLoopIndex = (loopIndex + 1) % loop.length;

					//throw object with n = throw number and i = bP index
					//need to make these throw objects work for siteswaps (i includes i and j)
					let curThrow = loop[loopIndex];

					//index of current throw in beatPattern (and throwInfo)
					let throwIndex = j * (endIndex / loopPropCount) / (endIndex / loopSum) + curThrow.i % endIndex;
					//index of next throw in beatPattern
					let nextThrowIndex = (throwIndex + curThrow.n) % endIndex;
					//index of current catch in beatPattern (where current throw is landing) (nextThrowIndex - 1)
					let catchIndex = (nextThrowIndex + endIndex - 1) % endIndex;

					//shifts the ball movement such that first throw starts at t=0
					let shift = getBeatTime(throwIndex, true);

					for (let k = 0; k < realLength; k++) {
						//apply aforementioned shift
						function shiftTime(time) {
							//this rounds using toPrecision because modulus and floating point arithmetic don't mix well
							return parseFloat(Number(time + endTime - shift).toPrecision(6)) % endTime;
						}

						let isLeft = !(throwIndex % 2);
						let isNextLeft = !(nextThrowIndex % 2);

						//if the last catch is at the very last time, do not set it to zero, set it to the last time
						let lastCatch;
						if (shiftTime(getBeatTime(nextThrowIndex, true)) === 0) {
							lastCatch = endTime;
						}
						else {
							lastCatch = shiftTime(getBeatTime(nextThrowIndex, true));
						}

						bM[k] = {
							throw: {
								p: {
									x: isLeft ? -5 : 5,
									y: 0 //dP
								},
								start: shiftTime(getBeatTime(throwIndex, true)),
								end: curThrow.n === 2 ? shiftTime(getBeatTime(throwIndex, true)) : shiftTime(getBeatTime(catchIndex, false))
							},
							catch: {
								p: {
									x: isNextLeft ? -35 : 35,
									y: 0
								},
								start: curThrow.n === 2 ? shiftTime(getBeatTime(throwIndex, true)) : shiftTime(getBeatTime(catchIndex, false)),
								end: lastCatch,
								hand: isNextLeft ? "left" : "right"
							}
						}

						//update vars
						loopIndex = nextLoopIndex;
						nextLoopIndex = (loopIndex + 1) % loop.length;

						curThrow = loop[loopIndex];

						throwIndex = nextThrowIndex;
						nextThrowIndex = (throwIndex + curThrow.n) % endIndex;
						catchIndex = (nextThrowIndex + endIndex - 1) % endIndex;
					}

					let color = inputPreset.colors[i];
					let newBall = new Ball(color, 7, bM, -shift, i + "," + j);
					newBall.init(start);
					balls.push(newBall);
				}
			}
		})();

		if (print) {
			console.log(balls);
			console.log(hands);
		}
	}


	//


	this.init = function(inputPreset) {
		let TRANSX = 0,
			TRANSY = 300;

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

		if (!EVENTSADDED) {
			canvas.addEventListener('mousedown', events.mouseDown, false);
			canvas.addEventListener('mousemove', events.mouseMove, false);
			canvas.addEventListener('mouseup', events.mouseUp, false);
			canvas.addEventListener('mousewheel', events.mouseWheel, false);
			canvas.addEventListener('DOMMouseScroll', events.mouseWheel, false);

			EVENTSADDED = true;
		}


		this.generateMovements(inputPreset);

		let count = 0;
		function draw() {

			now = SPEED*Date.now()/1000 + SHIFT;
			// if (!(count++ % 50)) console.log(now);

			//for some reason, the canvas likes to be a little bit larger than the wrapper, so I multiply by .995
			HEIGHT = 0.995*wrapper.clientHeight;
			WIDTH = 0.995*wrapper.clientWidth;
			if (Math.floor(HEIGHT) !== canvas.height) {
				canvas.height = HEIGHT;
			}
			if (Math.floor(WIDTH) !== canvas.width) {
				canvas.width = WIDTH;
			}


			// ctx.globalCompositeOperation = "source-over";
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			// ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
			// ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
			// ctx.fillRect(0, 0, WIDTH, HEIGHT);
			ctx.clearRect(0, 0, WIDTH, HEIGHT);
			ctx.translate(TRANSX, TRANSY);

			// ctx.globalCompositeOperation = "multiply";

			hands.left.draw(ctx);
			hands.right.draw(ctx);
			for (let i = 0; i < balls.length; i++) balls[i].draw(ctx);
			hands.left.move(now);
			hands.right.move(now);
			for (let i = 0; i < balls.length; i++) balls[i].move(now);

			window.requestAnimationFrame(draw);
		}

		window.requestAnimationFrame(draw);

	};
};
