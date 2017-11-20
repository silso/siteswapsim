var HEIGHT = window.innerHeight;
var WIDTH = window.innerWidth;
var SCALE = 2;


var console;
var window;

var G = -980;
G + 1;
var FPS = 60;
G /= Math.pow(FPS, 2);

var now = Date.now();
var then = Date.now();
var interval = 1000 / FPS;
var delta = now - then;


function Hand(hM) {			//stands for handMovements must be length >= 2
	var len = hM.length;
	this.hM = Array(hM.length);
	console.log(this.hM);
	while (len--) this.hm[len] = hM[len];			//make this clone the array of objs correctly
	console.log("this.hM");
	this.t = 0;					//current time in frames (relative to curren handMovement)
	this.tf = (function() {		//end time (t_f)
		var sum = 0;
		hM.forEach(function(handMove) {
			sum += handMove.t * FPS;
		});
		hM.fo
		return sum;
	})();
	this.i = 0;					//active index of handMovements

	this.p = Object.assign({}, hM[0].p);	//copy start position
	this.v = Object.assign({}, hM[0].v);	//copy start velocity
	this.j = {								//calculate constant jerk
		x: (hM[1].p.x - hM[0].p.x) / Math.pow(hM[0].t, 3),
		y: (hM[1].p.y - hM[0].p.y) / Math.pow(hM[0].t, 3)
	};
	this.a = {								//calculate start acceleration
		x: (-.5*this.j.x*Math.pow(hM[0].t, 2) + hM[1].v.x - hM[0].v.x) / hM[0].t,
		y: (-.5*this.j.y*Math.pow(hM[0].t, 2) + hM[1].v.y - hM[0].v.y) / hM[0].t
	};
	
	this.move = function() {
		if(this.t > this.hM[this.i].t) {
			this.t = this.t - this.hM[this.i].t;
			var iNext = (this.i + 1) % this.hM.length;
			
			this.j = {
				x: (hM[iNext].p.x - hM[i].p.x) / Math.pow(hM[i].t, 3),
				y: (hM[iNext].p.y - hM[i].p.y) / Math.pow(hM[i].t, 3)
			};
			this.p = {
				x: this.hM[iNext].p.x + this.v.x * this.t,
				y: this.hM[iNext].p.y + this.v.y * this.t
			};
			this.v = {
				x: this.hM[iNext].v.x + this.a.x * this.t,
				y: this.hM[iNext].v.y + this.a.y * this.t
			};
			this.a = {
				x: (-.5*this.j.x*Math.pow(hM[i].t, 2) + hM[iNext].v.x - hM[i].v.x) / hM[i].t + this.j.x * this.t,
				y: (-.5*this.j.y*Math.pow(hM[i].t, 2) + hM[iNext].v.y - hM[i].v.y) / hM[i].t + this.j.y * this.t
			};
		} else {
			this.p.x += this.v.x;
			this.p.y += this.v.y;
			this.v.x += this.a.x;
			this.v.y += this.a.y;
			this.a.x += this.j.x;
			this.a.y += this.j.y;
			
			this.t++;
		}
	}
	
	this.draw = function(ctx) {
		ctx.save();
		ctx.beginPath();
		ctx.arc(WIDTH / 2 + SCALE * this.x, HEIGHT / 2 - SCALE * this.y, SCALE * 5 / 2, 0, 2 * Math.PI);
		ctx.fillStyle = "00FF00";
		ctx.fill()
		ctx.restore();
		
	}
}

/*class Ball {
	constructor(color, radius, start, end, time) {
		time *= FPS;
		this.c = color;
		this.r = radius;
		this.t = 0;
		this.tf = time;
		this.x = start.x;
		this.y = start.y;
		this.xf = end.x;
		this.yf = end.y;
		
		
		this.vx = (end.x - start.x) / time;
		this.vy = (-.5*G*Math.pow(time, 2) + end.y - start.y) / time;
	}
	
	move() {
		if (this.t < this.tf) {
			if(Math.random() < 0.0001) {
				this.vx = Math.random()*0.2 - 0.1;
				this.vy = Math.random()*0.2 - 0.1;
				this.c = "rgba(" + parseInt(Math.random() * 256) + ", " + parseInt(Math.random() * 256) + ", " + parseInt(Math.random() * 256) + ", 1)";
			}
			this.x += this.vx;
			this.y += this.vy;
			this.vy += G;
			this.t++;
		} else {
			this.x = this.xf;
			this.y = this.yf;
			this.t = this.tf;
		}
	}
	
	draw(ctx) {
		ctx.save();
		ctx.beginPath();
		ctx.arc(WIDTH / 2 + SCALE * this.x, HEIGHT / 2 - SCALE * this.y, SCALE * this.r / 2, 0, 2 * Math.PI);
		ctx.fillStyle = this.c;
		ctx.globalCompositeOperation = options[parseInt(Math.random() * options.length)];
		ctx.fill()
		ctx.restore();
	}
}*/



function init() {
	var handMovements = [
		{
			p: {
				x:-100,
				y:0
			},
			v: {
				x:-10,
				y:-100
			},
			t: 1
		},
		{
			p: {
				x:100,
				y:100
			},
			v: {
				x:-50,
				y:200
			},
			t:2
		}
	];
	
	var hand = new Hand(handMovements); 
	
	function draw() {
		requestAnimationFrame(draw);
		
		now = Date.now();
		delta = now - then;
		
		if (delta > interval) {
			then = now - (delta % interval);
			
			var ctx = document.getElementById("canvas").getContext("2d");
			
			
			ctx.globalCompositeOperation = 'source-out';
			//ctx.clearRect(0, 0, WIDTH, HEIGHT);
			
			//hand.move();
			//hand.draw();
		}
	}
	
	window.requestAnimationFrame(draw);
}

init();