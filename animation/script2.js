var HEIGHT = window.innerHeight;
var WIDTH = window.innerWidth;
var SCALE = 2;

var G = -980;
var FPS = 72;
var K = .1;
G /= Math.pow(FPS, 2);

var now = Date.now();
var then = Date.now();
var interval = 1000 / FPS;
var delta = now - then;

//create a global clock to solve the desync issue. At the each setStart, have the objects take note of their start time. Then just find the current time by subtracting global clock from that start time. should implement easily. i doubt you'll be able to solve the current desync issue.

var Hand = function(hM) {
	
	this.setStart = function() {
		this.ti = now/1000;
		this.t = this.ti;
		
		this.j = (this.i + 1) % hM.length;
		
		ih = hM[this.i];
		jh = hM[this.j];
		
		this.p = {
			x:
				ih.p.x,
			y:
				ih.p.y
		}
		/*this.v = {
			x:
				ih.v.x,
			y:
				ih.v.y
		}
		this.a = {
			x:
				2 * (-3*ih.p.x + 3*jh.p.x - 2*ih.v.x*ih.t - jh.v.x*ih.t) / Math.pow(ih.t, 2),
			y:
				2 * (-3*ih.p.y + 3*jh.p.y - 2*ih.v.y*ih.t - jh.v.y*ih.t) / Math.pow(ih.t, 2)
		}
		this.j = {
			x:
				6 * (2*ih.p.x - 2*jh.p.x + ih.v.x*ih.t + jh.v.x*ih.t) / Math.pow(ih.t, 3),
			y:
				6 * (2*ih.p.y - 2*jh.p.y + ih.v.y*ih.t + jh.v.y*ih.t) / Math.pow(ih.t, 3)
		}*/
	}	
	
	this.move = function() {
		this.t = (now/1000 - this.ti);
		if (this.t < ih.t) {
			this.p.x = (2*ih.p.x - 2*jh.p.x + ih.v.x*ih.t + jh.v.x*ih.t) / Math.pow(ih.t, 3) * 
				Math.pow(this.t, 3) + 
				(-3*ih.p.x + 3*jh.p.x - 2*ih.v.x*ih.t - jh.v.x*ih.t) / Math.pow(ih.t, 2) * 
				Math.pow(this.t, 2) + 
				ih.v.x*this.t + 
				ih.p.x;
			this.p.y = (2*ih.p.y - 2*jh.p.y + ih.v.y*ih.t + jh.v.y*ih.t) / Math.pow(ih.t, 3) * 
				Math.pow(this.t, 3) + 
				(-3*ih.p.y + 3*jh.p.y - 2*ih.v.y*ih.t - jh.v.y*ih.t) / Math.pow(ih.t, 2) * 
				Math.pow(this.t, 2) + 
				ih.v.y*this.t + 
				ih.p.y;
		}
		else {
			this.i = (this.i + 1) % hM.length;
			this.setStart();
			//this.move();
		}
	}
	
	this.draw = function(ctx) {
		ctx.save();
		ctx.fillStyle = "#005500";
		ctx.beginPath();
		ctx.arc(WIDTH/2+SCALE*this.p.x,
			HEIGHT/2-SCALE*this.p.y, 
			SCALE*9/2, 0, 2*Math.PI);
		ctx.fill();
		ctx.restore();
	}
	
	this.grab = function(ball) {
		ball.setPos(this.p);
	}
	
	var ih;
	var jh;
	
	this.i = 0;
	this.setStart();
}

var Ball = function(color, radius, bM) {
	
	this.setStart = function() {
		var i = this.i;
		
		this.ti = now/1000;
		this.t = 0;
		this.tc = bM[i].throw.t;
		this.tf = this.tc + bM[i].catch.t;
		
		this.x = bM[i].throw.p.x;
		this.y = bM[i].throw.p.y;
		this.xf = bM[i].catch.p.x;
		this.yf = bM[i].catch.p.y;
		this.vx = (bM[i].catch.p.x - bM[i].throw.p.x) / (this.tc*FPS);
		this.vy = (-.5*G*Math.pow(this.tc*FPS, 2) + bM[i].catch.p.y - bM[i].throw.p.y) / (this.tc*FPS);
	}
	
	this.move = function() {
		this.t = (now/1000 - this.ti);
		if (this.t < this.tc) {
			this.x += this.vx;
			this.y += this.vy;
			this.vy += G;
		} else if(this.t < this.tf) {
			bM[this.i].catch.h.grab(this);
		} else {
			this.i = (this.i + 1) % bM.length;
			this.setStart();
			//this.move();
			/*this.x = this.xf;
			this.y = this.yf;
			this.t = this.tf;*/
		}
	}
	
	this.setPos = function(p) {
		this.x = p.x;
		this.y = p.y;
	}
	
	this.draw = function(ctx) {
		ctx.save();
		ctx.fillStyle = this.c;
		ctx.beginPath();
		ctx.arc(WIDTH / 2 + SCALE * this.x, 
				HEIGHT / 2 - SCALE * this.y, 
				SCALE * this.r / 2, 0, 2 * Math.PI);
		ctx.fill()
		ctx.restore();
	}
	
	
	//
	
	
	this.c = color;
	this.r = radius;
	
	this.i = 0;
	
	this.setStart();
}


//


function init() {
	
	var handMovements = [
		{
			p: {
				x:-5,
				y:0
			},
			v: {
				x:0,
				y:200
			},
			t:1
		},
		{
			p: {
				x:-35,
				y:0
			},
			v: {
				x:-10,
				y:-50
			},
			t:.5
		}
	];
	
	leftHand = new Hand(handMovements);
	
	var ballMovements = [
		{
			throw: {
				p: {
					x:-5,
					y:0
				},
				t:1
			},
			catch: {
				p: {
					x:-35,
					y:0
				},
				t:.5,
				h:leftHand
			}
		}
	];	
	
	var ball = new Ball("#FF0000", 7, ballMovements);
	
	function draw() {
		requestAnimationFrame(draw);
		
		now = Date.now();
		delta = now - then;
		
		if (delta > interval) {
			then = now - (delta % interval);
			
			var ctx = document.getElementById("canvas").getContext("2d");
			
			
			//ctx.globalCompositeOperation = 'copy';
			ctx.clearRect(0, 0, WIDTH, HEIGHT);
			
			leftHand.draw(ctx);
			ball.draw(ctx);
			leftHand.move();
			ball.move();
		}
	}
	
	window.requestAnimationFrame(draw);
}

init();