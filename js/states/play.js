//Play state

var Play = function(game) {
    this.MAX_VELOCITY = 300;
    this.LIGHT_RANGE = 200;
    this.EAR_RANGE = 280;
	this.monsterSound = [];
};
Play.prototype = {
	create: function() {
	    //map
	    this.map = game.add.tilemap('level');
		this.map.addTilesetImage('trialSprites', 'tilesheet');
		this.floorLayer = this.map.createLayer('ground');
		this.wallsLayer = this.map.createLayer('walls');
		this.map.setCollisionByExclusion([], true, this.wallsLayer);
		this.wallsLayer.resizeWorld();
		
		console.log("Play");
        //adding physics
        game.physics.startSystem(Phaser.Physics.ARCADE);
        
        //changin background color (while testing the light only)
		game.stage.backgroundColor = "#000000";
        
        //adding player
        this.player = new Player(game, "p1");
        game.add.existing(this.player);
        
        //adding cursor keys
        cursors = game.input.keyboard.createCursorKeys();
        
        // add enemy
        this.monster = new Enemy(game, "monster");
        game.add.existing(this.monster);
        //adding TMP enemy audio
		this.monsterSound[0] = game.add.audio("monsterL");
		this.monsterSound[1] = game.add.audio("monsterR");
        
        //adding some walls to test ray tracing
		this.walls = this.game.add.group();
		this.walls.enableBody = true;
		var i, x, y, tmp;
		for (i = 0; i < 4; i++) {
			x = i * this.game.width / 4 + 50;
			y = this.game.rnd.integerInRange(50, this.game.height - 200);
			tmp = this.walls.create(x, y, "p1");
			tmp.scale.setTo(3, 3);
			tmp.body.immovable = true;
			tmp.tint = 0x000000;
		}
		//Create a bitmap texture for drawing light cones
		this.bitmap = this.game.add.bitmapData(this.game.width, this.game.height);
		this.bitmap.context.fillStyle = 'rgb(255, 255, 255)';
		this.bitmap.context.strokeStyle = 'rgb(255, 255, 255)';
		var lightBitmap = this.game.add.image(0, 0, this.bitmap);

		//adding blend mode to bitmap (requires webgl on the browser)
		lightBitmap.blendMode = Phaser.blendModes.MULTIPLY;
		
		
		//statue puzzle
		game.camera.follow(this.player, 0, 0.5, 0.5);

		blueEye = game.add.sprite(1480, 1150, 'blueEye');
		game.physics.enable(blueEye);
		blueEye.enableBody = true;
		yellowEye = game.add.sprite(250, 950, 'yellowEye');
		game.physics.enable(yellowEye);
		yellowEye.enableBody = true;

		key1 = game.add.sprite(1312, 448, 'key');
		game.physics.enable(key1);
		key1.enableBody = true;
		key2 = game.add.sprite(360, 256, 'key');
		game.physics.enable(key2);
		key2.enableBody = true;

		statue = game.add.sprite(1312, 448, 'statue');
		game.physics.enable(statue);
		statue.enableBody = true;
		statue.body.immovable = true;
		statue.scale.setTo(1.5, 1);
			
	},
	collectkey1: function() {
		console.log('key 1 taken')
			keys1 = true;
			key1.destroy();
			//console.log('itll say true if you got the thing ' + blueJewel);
	},
	collectkey2: function() {
		console.log('key 2 taken')
			keys2 = true;
			key2.destroy();
			//console.log('itll say true if you got the thing ' + blueJewel);
	},
	collectBlueEye: function() {
		//console.log('they overlap')
			blueJewel = true;
			blueEye.destroy();
			//console.log('itll say true if you got the thing ' + blueJewel);
	},
	collectYellowEye: function() {
		console.log('they overlap')
			yellowJewel = true;
			yellowEye.destroy();
	},
	update: function() {
	    this.move();
	    this.rayCast();
	    this.playMonsterSound();
	    game.physics.arcade.overlap(this.player, this.monster, this.colPE, null, this);
	    game.physics.arcade.collide(this.player, this.walls);
	    //map
	    game.physics.arcade.collide(this.player, this.mapLayer);
	    
	    //map & object collision
	    game.physics.arcade.collide(this.player, this.wallsLayer);
		game.physics.arcade.collide(this.player, statue);
		game.physics.arcade.overlap(this.player, blueEye, this.collectBlueEye, null, this);
		game.physics.arcade.overlap(this.player, yellowEye, this.collectYellowEye, null, this);

		game.physics.arcade.overlap(this.player, key1, this.collectkey1, null, this);
		game.physics.arcade.overlap(this.player, key2, this.collectkey2, null, this);
	},
	move: function() {
	    //moving x axis
	    if (cursors.right.isDown) {
	        this.player.body.velocity.x = this.MAX_VELOCITY;
	    }
	    else if (cursors.left.isDown) {
	        this.player.body.velocity.x = -this.MAX_VELOCITY;
	    }
	    else {
	        this.player.body.velocity.x = 0;
	    }
	    
	    //moving y axis
	    if (cursors.up.isDown) {
	        this.player.body.velocity.y = -this.MAX_VELOCITY;
	    }
	    else if (cursors.down.isDown) {
	        this.player.body.velocity.y = this.MAX_VELOCITY;
	    }
	    else {
	        this.player.body.velocity.y = 0;
	    }
	},
	colPE: function(player, enemy) {
	    player.kill();
	    enemy.kill();
	    this.monsterSound[0].stop();
	    this.monsterSound[1].stop();
	    game.state.start("GameOver");
	},
	//adapted from: https://gamemechanicexplorer.com/#raycasting-2
	rayCast: function () {
	    //fill the entire light bitmap with a dark shadow color.
		this.bitmap.context.fillStyle = 'rgb(0, 0, 0)';
		this.bitmap.context.fillRect(0, 0, this.wallsLayer.widthInPixels, this.wallsLayer.heightInPixels);
	    
	    //var gradient = this.bitmap.context.createRadialGradient(
        //    this.player.x, this.player.y, this.LIGHT_RANGE * 0.75,
        //    this.player.x, this.player.y, this.LIGHT_RANGE);
        //gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
        //gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

        //this.bitmap.context.beginPath();
        //this.bitmap.context.fillStyle = gradient;
        //this.bitmap.context.arc(this.game.input.activePointer.x, this.game.input.activePointer.y,
        //this.LIGHT_RANGE, 0, Math.PI*2);
        //this.bitmap.context.fill();

		// Ray casting!
		// Cast rays at intervals in a large circle around the light.
		// Save all of the intersection points or ray end points if there was no intersection.
		var points = [];
		for (var a = 0; a < Math.PI * 2; a += Math.PI / 360) {
			var ray = new Phaser.Line(this.player.x, this.player.y,
				this.player.x + Math.cos(a) * this.LIGHT_RANGE, this.player.y + Math.sin(a) * this.LIGHT_RANGE);//last 2 parameters indicate length

			// Check if the ray intersected any walls
			var intersect = this.getWallIntersection(ray);

			// Save the intersection or the end of the ray
			if (intersect) {
				points.push(intersect);
			} else {
				points.push(ray.end);
			}
		}

		// Connect the dots and fill in the shape, which are cones of light,
		// with a bright white color. When multiplied with the background,
		// the white color will allow the full color of the background to
		// shine through.
		this.bitmap.context.beginPath();
		this.bitmap.context.fillStyle = "rgb(255, 255, 255)"; //from 0 to 255. 0 is pitch black, 255 is clear
		this.bitmap.context.moveTo(points[0].x, points[0].y);
		for (var i = 0; i < points.length; i++) {
			this.bitmap.context.lineTo(points[i].x, points[i].y);
		}
		this.bitmap.context.closePath();
		this.bitmap.context.fill();

		// This just tells the engine it should update the texture cache
		this.bitmap.dirty = true;
	},
	// Given a ray, this function iterates through all of the walls and
	// returns the closest wall intersection from the start of the ray
	// or null if the ray does not intersect any walls.
	//from: https://gamemechanicexplorer.com/#raycasting-2
	getWallIntersection: function (ray) {
		var distanceToWall = Number.POSITIVE_INFINITY;
		var closestIntersection = null;

		// For each of the walls...
		this.walls.forEach(function (wall) {
			// Create an array of lines that represent the four edges of each wall
			var lines = [
				new Phaser.Line(wall.x, wall.y, wall.x + wall.width, wall.y),
				new Phaser.Line(wall.x, wall.y, wall.x, wall.y + wall.height),
				new Phaser.Line(wall.x + wall.width, wall.y,
					wall.x + wall.width, wall.y + wall.height),
				new Phaser.Line(wall.x, wall.y + wall.height,
					wall.x + wall.width, wall.y + wall.height)
			];

			// Test each of the edges in this wall against the ray.
			// If the ray intersects any of the edges then the wall must be in the way.
			for (var i = 0; i < lines.length; i++) {
				var intersect = Phaser.Line.intersects(ray, lines[i]);
				if (intersect) {
					// Find the closest intersection
					distance =
						this.game.math.distance(ray.start.x, ray.start.y, intersect.x, intersect.y);
					if (distance < distanceToWall) {
						distanceToWall = distance;
						closestIntersection = intersect;
					}
				}
			}
		}, this);
		return closestIntersection;
	},
	playMonsterSound: function () {
		var xDistance;

		xDistance = this.player.x - this.monster.x;
		xDistance = (xDistance < 0) ? -xDistance : xDistance; //abs value

		if (xDistance < this.EAR_RANGE) { //in the range of listening
			if (this.player.x > this.monster.x) {
				this.monsterSound[0].volume = 1;
				this.monsterSound[1].volume = (this.EAR_RANGE - xDistance) / this.EAR_RANGE;
			}
			else {
				this.monsterSound[0].volume = (this.EAR_RANGE - xDistance) / this.EAR_RANGE;
				this.monsterSound[1].volume = 1;
			}
			if (!this.monsterSound[0].isPlaying) {
				this.monsterSound[0].play('', 0, this.monsterSound[0].volume, true);
			}
			if (!this.monsterSound[1].isPlaying) {
				this.monsterSound[1].play('', 0, this.monsterSound[1].volume, true);
			}
		}
		else {
			this.monsterSound[0].stop();
			this.monsterSound[1].stop();
		}
	}
};