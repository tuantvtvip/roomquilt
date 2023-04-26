
/* copyright Nikolaus Baumgarten http://nikkki.net */

var zoomquilt = function(options = {}){

	window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

    var container = options.container || '#zoomquilt';
	var canvas = document.createElement('canvas');
    $(container).append(canvas);

	var context = canvas.getContext('2d');
	//
	var window_w, window_h;
	var center_x, center_y;
	var element_w;
	var element_h;
	var startposition = 0;
	var z_position = 0
	var lastframe = null;
	var steps;
	//
	var playback = true;
	var hue = 0;
	var fx = options.fx || 'none';
	var keyboardMap = {up:false,down:false};
	//
	var speed = options.speed || 10;
	var speedfactor = 1;
	var portrait = false;
	var visiblesteps = 5;
	var loaded = false;
	var loadpercent = 0;
	var tilewidth;
	var tileheight;
	var loadcompleted = false;
	var z_opac = 0;
	var z_opac_target = 0;
	var filterelements = $(canvas);
	
	if (options.images) {
		var imgarray = options.images;
	} else {
		var imgarray = [];
		// var start = Math.floor( Math.random() * 54);
		start = 22
		for (var i = 46; i > 0; i--) {
			var n = start+i;
			if (n > 46) n -= 46;
			imgarray.push('artlarge/'+n+'.jpg');
		};
	}

	/* SETUP */
	$(window).resize(function() {
		resize();
	});

	function setup(){
		context = canvas.getContext('2d');
		resize();
		setupsteps();
		window.requestAnimationFrame(loop);
		setTimeout(function(){
			if (!loaded) $("#status").css({'opacity':'1'});
		},1000);
	}

	function resize(scale){

		if(window.devicePixelRatio !== undefined) {
		    dpr = window.devicePixelRatio;
		} else {
		    dpr = 1;
		}
		var w = $(container).width();
		var h = $(container).height();
		window_w = w * dpr;
		window_h = h * dpr;
		
		center_x = window_w/2;
		center_y = window_h/2;

		if (window_w>window_h*(tilewidth/tileheight)){
			element_w = window_w;
			element_h = window_w*(tileheight/tilewidth);
		} else {
			element_w = window_h*(tilewidth/tileheight);
			element_h = window_h;
		}
		portrait = (window_h > window_w);

		$(canvas).attr('width',window_w);
		$(canvas).attr('height',window_h);
		$(canvas).css('width',w);
		$(canvas).css('height',h);

		lastdrawn = null;

	}
	function loadstatus(){
		if (!loaded) {		
			loadpercent = 0;
			var isready = steps.every(function(element){
				if (element.ready) loadpercent += 100/steps.length;
				return element.ready;
			});
			if (isready) {
				$(canvas).animate({'opacity':1},(100-z_opac)*5);
				loadcompleted = true;
				// navFade();
			}
			return isready;
		} else return true;
	}

	/* IMG OBJECT */
	var imagesloaded = 0;
	function zoom_img(src) {
		this.ready = false;
		this.img = new Image();
		this.img.onload = ()=>{
			imagesloaded++;
			if (imagesloaded == 1) {
				tilewidth = this.img.width;
				tileheight = this.img.height;
				resize();
			}
			console.log(tilewidth,tileheight)
			this.ready = true;
			if (loadstatus()){
				loaded = true;
			}
		};
		this.img.src = src;
	}

	/* POPULATE STEP OBJECTS ARRAY */
	function setupsteps() {
		steps = [];
		for (var i = 0; i < imgarray.length; i++) {
			steps.push(new zoom_img(imgarray[i]));
		}
	}

	/* ANIMATION LOOP */

	var lastdrawn = null;

	function loop(timestamp){
		var elapsed = 0;
		if (!lastframe) {
			lastframe = timestamp;
		} else {
  			elapsed = timestamp - lastframe;
  			lastframe = timestamp;
		}

		// CONTROL
		if (loaded) {
			var zoomspeed = 0.0003*elapsed

			if (keyboardMap.up) {
				z_position += zoomspeed*8;
			} else if (keyboardMap.down){
				z_position -= zoomspeed*8;
			} else if (playback) {
				z_position += (zoomspeed/8*((portrait)?speed*speedfactor:speed));
			}
			if (z_position<0) {
				z_position+=steps.length;
			}
			if (z_position>steps.length) {
				z_position-=steps.length;
			}
		}

		// DISPLAY
		if (lastdrawn != z_position || ! loadcompleted) {
			lastdrawn = z_position;

			context.clearRect(0, 0, canvas.width, canvas.height);
			// build array of visible steps, looping end to the beginning
			var steparray = [];
			for (var i = 0; i < visiblesteps; i++) {
				steparray.push( steps[ (Math.floor(z_position)+i)%steps.length ] );
			}
			// 
			var scale = Math.pow(2,(z_position%1));
			// draw the collected image steps
			for (var i = 0; i < steparray.length; i++) {
				var x = center_x - element_w/2*scale;
				var y = center_y - element_h/2*scale;
				var w = element_w*scale;
				var h = element_h*scale;

				if (steparray[i].ready) {
					context.drawImage(steparray[i].img,x,y,w,h);
	
				}
				scale *= 0.5;
			}
		}

		if (!loadcompleted) {
			if (steparray.every(function(e){return e.ready})){
				z_opac_target = loadpercent;
			}
			if (z_opac < z_opac_target) {
				z_opac +=0.5;
			}

			$(canvas).css('opacity',(z_opac/100));
			z_position = startposition;
		}

		if (fx === 'colors') {
			hue += elapsed/50;
			if (hue >= 360) hue-= 360;

			filterelements.css('-webkit-filter', 'hue-rotate('+hue+'deg)');
			filterelements.css('-moz-filter', 'hue-rotate('+hue+'deg)');
			filterelements.css('-ms-filter', 'hue-rotate('+hue+'deg)');
			filterelements.css('-o-filter', 'hue-rotate('+hue+'deg)');
			filterelements.css('filter', 'hue-rotate('+hue+'deg)');
		}

 		window.requestAnimationFrame(loop);
	}

	if(canvas.getContext) {
		setup();
	}

	//

	$(document).keydown(function(event) {

		if (event.which === 38) {keyboardMap.up = true;event.preventDefault();}
		if (event.which === 40) {keyboardMap.down = true;event.preventDefault();}
	});

	$(document).keyup(function(event) {
		if (event.which === 38) {keyboardMap.up = false;event.preventDefault();}
		if (event.which === 40) {keyboardMap.down = false;event.preventDefault();}
	});


	/****************/
	/* Wakelock		*/
	/****************/

	var wakeLock = null;

	async function requestWakelock() {
		try {
			wakeLock = await navigator.wakeLock.request("screen");
		} catch (err) {
			// The Wake Lock request has failed - usually system related, such as battery.
		}
	}

	function releaseWakelock() {
		wakeLock.release().then(() => {
			wakeLock = null;
		});		  
	}

	/****************/
	/* Fullscreen	*/
	/****************/

	var isFullscreen = false;

	$('#fullscreen').mousedown(function(e) {
		toggleFullScreen();
	});
	
	$(container).dblclick(function (e) {
		toggleFullScreen();
		e.stopPropagation();
	})

	document.addEventListener('fullscreenchange', function () {
	    isFullscreen = !!document.fullscreen;
	    fullscreenchange();
	}, false);
	document.addEventListener('mozfullscreenchange', function () {
	    isFullscreen = !!document.mozFullScreen;
	    fullscreenchange();
	}, false);
	document.addEventListener('webkitfullscreenchange', function () {
	    isFullscreen = !!document.webkitIsFullScreen;
	    fullscreenchange();
	}, false);
	function fullscreenchange() {
	    if(isFullscreen) {
			$('#fullscreen').addClass('active');
			$('body').removeClass('infovisible');
			requestWakelock()
	    } else {
			$('#fullscreen').removeClass('active');
			releaseWakelock()
	    }
	}
	function toggleFullScreen() {
		if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {
			if (document.documentElement.requestFullscreen) {
			  document.documentElement.requestFullscreen();
			} else if (document.documentElement.msRequestFullscreen) {
			  document.documentElement.msRequestFullscreen();
			} else if (document.documentElement.mozRequestFullScreen) {
			  document.documentElement.mozRequestFullScreen();
			} else if (document.documentElement.webkitRequestFullscreen) {
			  document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
			}
		} else {
			if (document.exitFullscreen) {
			  document.exitFullscreen();
			} else if (document.msExitFullscreen) {
			  document.msExitFullscreen();
			} else if (document.mozCancelFullScreen) {
			  document.mozCancelFullScreen();
			} else if (document.webkitExitFullscreen) {
			  document.webkitExitFullscreen();
			}
		}
	}


};

