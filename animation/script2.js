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

var AnimationScript = function() {
	"use strict";
	var wrapper,
		HEIGHT,
		WIDTH,
		SCALE = 4,
		TRANSX = 0,
		TRANSY = 0,
		
		//gravitational acceleration
		G = -1/20000,
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
	
	var eventsAdded = false;
	
	////////
	//Hand class: moves and draws a hand according to the array/loop of hand movements hM.
	//refer to the start of the init() function for the structure of these arrays
	var Hand = function(hM, ID) {
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
			
			this.id = ID;
			
			curIndex = 0;
			this.setStart();
		};
	};
	
	
	////////
	//Ball class: moves and draws a ball according the ballMovements, and a hand's movements when it is grabbed
	var Ball = function(color, radius, bM, offset, ID) {
		//position in the ballMovements array
		var index;
		
		//timings for start and end of current throw and catch
		var throwStart,
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
		
		wrapper = document.getElementById("animationWrapper");
		HEIGHT = wrapper.clientHeight;
		WIDTH = wrapper.clientWidth;
		canvas = document.getElementById("animationCanvas");
		ctx = canvas.getContext("2d");
		
		//handles events with a couple meta variables
		var events = {
			//true while mouse is dragging
			dragging: false,
			//where the mouse started dragging from
			startX: 0,
			startY: 0,
			mouseDown: function(e) {
				var r = canvas.getBoundingClientRect();
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
					var r = canvas.getBoundingClientRect();
					var x = e.clientX - r.left;
					var y = e.clientY - r.top;
					
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
				
				var scaleFactor = 1.4;
				console.log(scaleFactor);
				var scrollDir = e.wheelDelta;
				var r = canvas.getBoundingClientRect();
				
				//in-animation coordinates of mouse relative to image origin (center of juggling patter typically)
				var mX = (e.clientX - r.left - r.width/2)/SCALE;
				var mY = (e.clientY - r.top - r.height/2)/SCALE;
				//in-animation coordinates of how much image origin has moved relative to canvas origin
				var TX = TRANSX/SCALE;
				var TY = TRANSY/SCALE;
				
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
		
		
		console.log(site);
		for (let i = 0; i < site.length; i++) {
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
		}
		
		// let balls = [];
		
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
		
		var leftHand = new Hand(lH, "left");
		var rightHand = new Hand(rH, "right");
		
		hands = {
			left: leftHand,
			right: rightHand
		};
		
		for (var hand in hands) {
			hands[hand].init(now);
		}
		
		
		//REDESIGN NEEDED:
		//create a dwellpath array of objects, and use those to define the start and endpoints of the balls.
		//create a bm for every single ball. to do this, run the bottom *** function (sorta) to find offsets
		//and number of balls in each loop. then with that in mind, keep track of which ball you're on, and
		//create a bm for each ball in the loop (run the function immediately below). then create the ball
		//and push it and i guess you should be good.
		
		
		console.log("%%%%%%%%%%%%%%%");
		//loop through loops
		for (let i = 0; i < loops.length; i++) {
			//sum of throw numbers in a loop to find number of props
			let loopSum = 0;
			for (let j = 0; j < loops[i].length; j++) {
				loopSum += loops[i][j].n;
			}
			
			
			//number of balls to be created
			let numBalls = loopSum / site.length;
			
			let loop = loops[i];
			
			//MOVE THESE TWO ELSEWHERE
			//beat pattern
			let bP = inputPreset.beatPattern;
			//throw info throws
			let tI = inputPreset.throwInfo.throws;
			
			// console.log(bP, tI);
			
			//length of loop when accounting for ball landing in original hand
			let realLength = loop.length * (loopSum % 2 + 1);
			//sum of previous throw numbers (to determine hand)
			let curSum = 0;
			
			//index of current throw in loop
			let loopIndex = 0;
			//index of next throw in loop
			let nextLoopIndex = (loopIndex + 1) % loop.length;
			
			//index of current throw in beatPattern (and throwInfo)
			let throwIndex = loop[0].i;
			//index of next throw in beatPattern
			let nextThrowIndex = tI[throwIndex].end % tI.length;
			//index of current catch in beatPattern (where current throw is landing) (nextThrowIndex - 1)
			let catchIndex = (nextThrowIndex + tI.length - 1) % tI.length;
			
			//shifts the ball movement such that first throw starts at t=0
			let endTime = inputPreset.throwInfo.endTime;
			let shift = bP[throwIndex].start;
			
			//runs through a loop - twice if the loop's sum is odd (so that it isn't asymmetrical)
			for (let j = 0; j < realLength; j++) {
				// console.log("j = " + j);
				// console.log(throwIndex, nextThrowIndex, catchIndex);
				
				//apply aforementioned shift
				function shiftThrow(time) {
					return ((time + endTime - shift) % endTime) * 1000;
				}
				
				//if offsetIndex is odd, switch all hands
				let offsetIndex = (j * inputPreset.site.loopTime / numBalls) % 2;
				
				//throw object with n = throw number and i = bP index
				let curThrow = loop[loopIndex];
				//true if current throw is from left hand
				let isLeft = !(curSum%2);
				//true if current throw will land in left hand
				let isNextLeft = !((curSum + curThrow.n) % 2);
				
				//if the last catch is at the very last time, do not set it to zero, set it to the last time
				let lastCatch;
				if (shiftThrow(bP[nextThrowIndex].start) === 0) {
					lastCatch = endTime * 1000;
				}
				else {
					lastCatch = shiftThrow(bP[nextThrowIndex].start);
				}
				
				//timings are multiplied by 1000 because beatPattern uses seconds instead of ms
				bM[j] = {
					throw: {
						p: {
							x: isLeft ^ offsetIndex ? -5 : 5,
							y: 0
						},
						start: shiftThrow(bP[throwIndex].start),
						end: shiftThrow(bP[catchIndex].end)
					},
					catch: {
						p: {
							x: isNextLeft ^ offsetIndex ? -35: 35,
							y: 0
						},
						start: shiftThrow(bP[catchIndex].end),
						end: lastCatch,
						hand: isNextLeft ^ offsetIndex ? "left" : "right"
					}
				};
				
				//update vars
				curSum += loop[j];
				
				loopIndex = nextLoopIndex;
				nextLoopIndex = (loopIndex + 1) % loop.length;
				
				throwIndex = nextThrowIndex;
				nextThrowIndex = tI[throwIndex].end % tI.length;
				catchIndex = (nextThrowIndex + tI.length - 1) % tI.length;
			}
			
			console.log(bM);
			
			
			console.log("***");
			for (let j = 0, curThrow = loop[0].i; j < numBalls; j++) {
				let color = "rgb(" + Math.floor(Math.random()*255) + "," + Math.floor(Math.random()*255) + "," + Math.floor(Math.random()*255) + ")";
				let offsetIndex = j * inputPreset.site.loopTime / numBalls;
				console.log(j, offsetIndex);
				
				//we don't want to pass by reference
				let tempBM = JSON.parse(JSON.stringify(bM));
				console.log(hands[tempBM[0].catch.hand].id);
				// if offsetIndex is odd, the hands should be flipped
				// if (offsetIndex % 2) {
				// 	for (let k = 0; k < tempBM.length; k++) {
				// 		console.log("switching");
				// 		if (bM[k].catch.hand === "left") {
				// 			tempBM[k].catch.hand = "right";
				// 		}
				// 		else {
				// 			tempBM[k].catch.hand = "left";
				// 		}
				// 	}
				// }
				console.log(hands[tempBM[0].catch.hand].id);
				let realBM = JSON.parse(JSON.stringify(tempBM));
				
				let newBall = new Ball(color, 7, realBM, bP[offsetIndex].start * 1000, i + "." + j);
				newBall.init(now);
				console.log(hands[newBall.bM[0].catch.hand].id);
				balls.push(newBall);
				
				curThrow = tI[curThrow].end;
			}
		}
		
		
		
		
		console.log("----------------------");
		//loop through loops
		for (let i = 0; i < loops.length; i++) {
			//sum of throw numbers in a loop to find number of props
			let loopSum = 0;
			for (let j = 0; j < loops[i].length; j++) {
				loopSum += loops[i][j].n;
			}
			
			
			//number of balls to be created
			let numBalls = loopSum / site.length;
			
			let loop = loops[i];
			
			//MOVE THESE TWO ELSEWHERE
			//beat pattern
			let bP = inputPreset.beatPattern;
			//throw info throws
			let tI = inputPreset.throwInfo.throws;
			
			// console.log(bP, tI);
			
			//length of loop when accounting for ball landing in original hand
			let realLength = loop.length * (loopSum % 2 + 1);
			//sum of previous throw numbers (to determine hand)
			let curSum = 0;
			
			//index of current throw in loop
			let loopIndex = 0;
			//index of next throw in loop
			let nextLoopIndex = (loopIndex + 1) % loop.length;
			
			//index of current throw in beatPattern (and throwInfo)
			let throwIndex = loop[0].i;
			//index of next throw in beatPattern
			let nextThrowIndex = tI[throwIndex].end % tI.length;
			//index of current catch in beatPattern (where current throw is landing) (nextThrowIndex - 1)
			let catchIndex = (nextThrowIndex + tI.length - 1) % tI.length;
			
			//shifts the ball movement such that first throw starts at t=0
			let endTime = inputPreset.throwInfo.endTime;
			let shift = bP[throwIndex].start;
			
			//runs through a loop - twice if the loop's sum is odd (so that it isn't asymmetrical)
			for (let j = 0; j < realLength; j++) {
				// console.log("j = " + j);
				// console.log(throwIndex, nextThrowIndex, catchIndex);
				
				//apply aforementioned shift
				function shiftThrow(time) {
					return ((time + endTime - shift) % endTime) * 1000;
				}
				
				//if offsetIndex is odd, switch all hands
				let offsetIndex = (j * inputPreset.site.loopTime / numBalls) % 2;
				
				//throw object with n = throw number and i = bP index
				let curThrow = loop[loopIndex];
				//true if current throw is from left hand
				let isLeft = !(curSum%2);
				//true if current throw will land in left hand
				let isNextLeft = !((curSum + curThrow.n) % 2);
				
				//if the last catch is at the very last time, do not set it to zero, set it to the last time
				let lastCatch;
				if (shiftThrow(bP[nextThrowIndex].start) === 0) {
					lastCatch = endTime * 1000;
				}
				else {
					lastCatch = shiftThrow(bP[nextThrowIndex].start);
				}
				
				//timings are multiplied by 1000 because beatPattern uses seconds instead of ms
				bM[j] = {
					throw: {
						p: {
							x: isLeft ^ offsetIndex ? -5 : 5,
							y: 0
						},
						start: shiftThrow(bP[throwIndex].start),
						end: shiftThrow(bP[catchIndex].end)
					},
					catch: {
						p: {
							x: isNextLeft ^ offsetIndex ? -35: 35,
							y: 0
						},
						start: shiftThrow(bP[catchIndex].end),
						end: lastCatch,
						hand: isNextLeft ^ offsetIndex ? "left" : "right"
					}
				};
				
				//update vars
				curSum += loop[j];
				
				loopIndex = nextLoopIndex;
				nextLoopIndex = (loopIndex + 1) % loop.length;
				
				throwIndex = nextThrowIndex;
				nextThrowIndex = tI[throwIndex].end % tI.length;
				catchIndex = (nextThrowIndex + tI.length - 1) % tI.length;
			}
			
			console.log(bM);
			
			
			console.log("***");
			for (let j = 0, curThrow = loop[0].i; j < numBalls; j++) {
				let color = "rgb(" + Math.floor(Math.random()*255) + "," + Math.floor(Math.random()*255) + "," + Math.floor(Math.random()*255) + ")";
				let offsetIndex = j * inputPreset.site.loopTime / numBalls;
				console.log(j, offsetIndex);
				
				//we don't want to pass by reference
				let tempBM = JSON.parse(JSON.stringify(bM));
				console.log(hands[tempBM[0].catch.hand].id);
				// if offsetIndex is odd, the hands should be flipped
				// if (offsetIndex % 2) {
				// 	for (let k = 0; k < tempBM.length; k++) {
				// 		console.log("switching");
				// 		if (bM[k].catch.hand === "left") {
				// 			tempBM[k].catch.hand = "right";
				// 		}
				// 		else {
				// 			tempBM[k].catch.hand = "left";
				// 		}
				// 	}
				// }
				console.log(hands[tempBM[0].catch.hand].id);
				let realBM = JSON.parse(JSON.stringify(tempBM));
				
				let newBall = new Ball(color, 7, realBM, bP[offsetIndex].start * 1000, i + "." + j);
				newBall.init(now);
				console.log(hands[newBall.bM[0].catch.hand].id);
				balls.push(newBall);
				
				curThrow = tI[curThrow].end;
			}
		}
		
		console.log(hands[balls[0].bM[0].catch.hand].id, hands[balls[1].bM[0].catch.hand].id);
		
		console.log("*********");
		
		console.log(balls);
		console.log("------------------");
		// return;
		//console.log(balls);
		
		// for (let i = 0; i < loops.length; i++) {
		// 	let loopSum = 0;
		// 	for (let j = 0; j < loops[i].length; j++) {
		// 		loopSum += loops[i][j];
		// 	}
			
		// 	let curSum = 0;
		// 	let curBM = [];
		// 	for (let j = 0; j < loops[i].length * ((loopSum%2) ? 2 : 1); j++) {
		// 		if (curSum%2) { //right hand
		// 			curBM[i] = {
		// 				throw: {
		// 					p: {
		// 						x:-5,
		// 						y:0
		// 					},
		// 					ti:300*curSum,
		// 					t:300
		// 				}
		// 			};
		// 		}
		// 		else { //left hand
					
		// 		}
				
		// 		curSum += loops[i][j];
		// 	}
			
		// 	for (let j = 0; j < loopSum/site.length; j++) {
		// 	}
		// }
		
		var ballMovements = [
			{
				throw: {
					p: {
						x:-5,
						y:0
					},
					start:0,
					end:1200
				},
				catch: {
					p: {
						x:35,
						y:0
					},
					start:1200,
					end:1500,
					hand:rightHand
				}
			},
			{
				throw: {
					p: {
						x:5,
						y:0
					},
					start:1500,
					end:2700
				},
				catch: {
					p: {
						x:-35,
						y:0
					},
					start:2700,
					end:3000,
					hand:leftHand
				}
			}
		];
		
		// var balls = [
		// 	new Ball("#FF0000", 7, ballMovements, 0),
		// 	new Ball("#00FF00", 7, ballMovements, 600),
		// 	new Ball("#0000FF", 7, ballMovements, 1200),
		// 	new Ball("#FF00FF", 7, ballMovements, 1800),
		// 	new Ball("#00FFFF", 7, ballMovements, 2400)
		// ];
		
		// balls.forEach(function(a) {a.init(now);});
		
		
		//
		
		
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
			
			leftHand.draw(ctx);
			rightHand.draw(ctx);
			for (let i = 0; i < balls.length; i++) balls[i].draw(ctx);
			leftHand.move();
			rightHand.move();
			for (let i = 0; i < balls.length; i++) balls[i].move();
			
			window.requestAnimationFrame(draw);
		}
		
		window.requestAnimationFrame(draw);
		
	};
};

let animationInstance = new AnimationScript();

// window.onload = animationInstance.init;