var HEIGHT = window.innerHeight;
var WIDTH = window.innerWidth;
var SCALE = 4;

var G = -1/2000;
var FPS = 72;
var K = 1;

var now = Date.now();
var then = Date.now();
var interval = 1000 / FPS;
var delta = now - then;

var printCount = 0;
var print = function(string) {
	if (printCount++ < 300) {
		console.log(string);
	}
}

var Hand = function(hM) {
	
	this.setStart = function() {
		this.j = (this.i + 1) % hM.length;
		
		ih = hM[this.i];
		jh = hM[this.j];
	}	
	
	this.move = function() {
		this.t = (now/1000 - this.ti) % hM[hM.length - 1].t;		//same thing as Ball.t
		var tt = this.t - ih.ti;
		var ihtt = K*(ih.t - ih.ti);
		if (this.t < ih.ti || this.t > ih.t) {
			this.i = (this.i + 1) % hM.length;
			this.setStart();
		} else {
			this.p.x = 
				(2*ih.p.x - 2*jh.p.x + ih.v.x*ihtt + jh.v.x*ihtt) / Math.pow(ihtt, 3) * 
				tt*tt*tt + 
				(-3*ih.p.x + 3*jh.p.x - 2*ih.v.x*ihtt - jh.v.x*ihtt) / Math.pow(ihtt, 2) * 
				tt*tt + 
				ih.v.x*tt + 
				ih.p.x;
			this.p.y = 
				(2*ih.p.y - 2*jh.p.y + ih.v.y*ihtt + jh.v.y*ihtt) / Math.pow(ihtt, 3) * 
				tt*tt*tt + 
				(-3*ih.p.y + 3*jh.p.y - 2*ih.v.y*ihtt - jh.v.y*ihtt) / Math.pow(ihtt, 2) * 
				tt*tt + 
				ih.v.y*tt + 
				ih.p.y;
		}
	}
	
	this.draw = function(ctx) {
		ctx.save();
		ctx.fillStyle = "#000000";
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
	
	this.init = function(time) {
		this.ti = time/1000;
		
		this.p = {};
		
		this.i = 0;
		this.setStart();
	}
	
	var ih;
	var jh;
}

var Ball = function(color, radius, bM) {
	
	this.setStart = function() {
		this.tci = bM[this.i].throw.ti;
		this.tc = bM[this.i].throw.t;
		this.tf = bM[this.i].catch.t;
	}
	
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
				.5*G*(this.t - this.tci)*(this.t - this.tci) + 
				((-.5*G*(this.tc - this.tci)*(this.tc - this.tci) + bM[this.i].catch.p.y - bM[this.i].throw.p.y) / (this.tc - this.tci))*(this.t - this.tci) + 
				bM[this.i].throw.p.y;
		} else {
			bM[this.i].catch.h.grab(this);
		}
	}
	
	this.setPos = function(p) {
		this.p.x = p.x;
		this.p.y = p.y;
	}
	
	this.draw = function(ctx) {
		ctx.save();
		ctx.fillStyle = this.c;
		ctx.beginPath();
		ctx.arc(WIDTH / 2 + SCALE * this.p.x, 
				HEIGHT / 2 - SCALE * this.p.y, 
				SCALE * this.r / 2, 0, 2 * Math.PI);
		ctx.fill()
		ctx.restore();
	}
	
	this.init = function(time, offset) {		
		this.ti = time;
		this.offset = offset;
		
		this.p = {};
		
		this.c = color;
		this.r = radius;
		
		this.i = 0;
		
		this.setStart();
	}
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
				x:50,
				y:200
			},
			ti:0,
			t:.5
		},
		{
			p: {
				x:-35,
				y:0
			},
			v: {
				x:-50,
				y:-180
			},
			ti:.5,
			t:1
		}
	];
	var handMovements2 = [
		{
			p: {
				x:35,
				y:0
			},
			v: {
				x:50,
				y:-180
			},
			ti:0,
			t:.5
		},
		{
			p: {
				x:5,
				y:0
			},
			v: {
				x:-50,
				y:180
			},
			ti:.5,
			t:1
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
				t:1000
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
				t:2500
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
		new Ball("#FF0000", 7, ballMovements),
		new Ball("#00FF00", 7, ballMovements),
		new Ball("#0000FF", 7, ballMovements)
	];
	
	balls[0].init(now, 0);
	balls[1].init(now, 2000);
	balls[2].init(now, 4000);
	
	
	//
	
	
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
			rightHand.draw(ctx);
			for (var i = 0; i < balls.length; i++) balls[i].draw(ctx);
			leftHand.move();
			rightHand.move();
			for (var i = 0; i < balls.length; i++) balls[i].move();
		}
	}
	
	window.requestAnimationFrame(draw);
}

init();