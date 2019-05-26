//Play state

var Play = function (game) {
	this.bitmapBleed = 32; //how much bigger the bitmap is than the camera
	// this.LIGHT_FLICKER_BASE = 3;
	// this.flickerAmount = this.LIGHT_FLICKER_BASE;
};
Play.prototype = {
	create: function () {
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

		//changin background color
		game.stage.backgroundColor = "#000000";

		//adding a group for the objs the player can hear
		this.noiseMakers = game.add.group();
		this.noiseMakers.enableBody = true;
		//group for solid objects
		this.keys = game.add.group();
		this.keys.enableBody = true;
		this.locks = game.add.group();
		this.locks.enableBody = true;

		// add enemy
		this.monster = new Enemy(game, "p1");
		game.add.existing(this.monster);

		this.noiseMakers.add(this.monster);

		//adding player
		this.player = new Player(game, "p1", this.monster);
		game.add.existing(this.player);

		//adding some walls to test ray tracing
		this.walls = game.add.group();
		this.walls.enableBody = true;

		//the camera follows the player object
		game.camera.follow(this.player, 0, 0.5, 0.5);
		this.addObjects();
		//Create a bitmap texture for drawing light cones
		//this should go at the bottom to cover all srpites 
		//that will be in darkness
		this.bitmap = game.add.bitmapData(game.world.width, game.world.height);
		this.bitmap.context.fillStyle = 'rgb(255, 255, 255)';
		this.bitmap.context.strokeStyle = 'rgb(255, 255, 255)';
		var lightBitmap = game.add.image(0, 0, this.bitmap);

		//adding blend mode to bitmap (requires webgl on the browser)
		lightBitmap.blendMode = Phaser.blendModes.MULTIPLY;
	},
	collectkey1: function () {
		//console.log('key 1 taken')
		keys1 = true;
		key1.destroy();
		//console.log('itll say true if you got the thing ' + blueJewel);
	},
	collectkey2: function () {
		//console.log('key 2 taken')
		keys2 = true;
		key2.destroy();
		//console.log('itll say true if you got the thing ' + blueJewel);
	},
	collectBlueEye: function () {
		//console.log('they overlap')
		blueJewel = true;
		blueEye.destroy();
		//console.log('itll say true if you got the thing ' + blueJewel);
	},
	collectYellowEye: function () {
		//console.log('they overlap')
		yellowJewel = true;
		yellowEye.destroy();
	},
	update: function () {
		this.player.listen(this.noiseMakers);
		this.rayCast();
		game.physics.arcade.overlap(this.player, this.monster, this.colPE, null, this);
		game.physics.arcade.collide(this.player, this.walls);
		//map
		game.physics.arcade.collide(this.player, this.mapLayer);

		//map & object collision
		game.physics.arcade.collide(this.player, this.wallsLayer);
		game.physics.arcade.collide(this.player, this.locks);
		game.physics.arcade.overlap(this.player, this.keys, this.collectItem, null, this);
		//stops player from going trhough doors and statue
		// game.physics.arcade.collide(this.player, statue);
		// game.physics.arcade.collide(this.player, door1);
		// game.physics.arcade.collide(this.player, door2);
		//picks up jewels or keys if player overlaps
		// game.physics.arcade.overlap(this.player, blueEye, this.collectBlueEye, null, this);
		// game.physics.arcade.overlap(this.player, yellowEye, this.collectYellowEye, null, this);
		// game.physics.arcade.overlap(this.player, key1, this.collectkey1, null, this);
		// game.physics.arcade.overlap(this.player, key2, this.collectkey2, null, this);
		//if player have the keys or jewels, it opens doors and destroys statue
		// if (keys2 == true && this.player.x > door1.x && this.player.y > door1.y) {
		// 	door1.destroy();
		// }
		// if (keys1 == true && this.player.x > door2.x && this.player.x < (door2.x + 100) && this.player.y > door2.y) {
		// 	door2.destroy();
		// }

		// if (yellowJewel == true && this.player.x > 1248 && this.player.x < 1344 && this.player.y > 448 && this.player.y < 480) {
		// 	statue.destroy();
		// }
	},
	colPE: function (player, enemy) {
		player.kill();
		enemy.kill();
		this.monster.sound[0].stop();
		this.monster.sound[1].stop();
		game.state.start("GameOver");
	},
	//adapted from: https://gamemechanicexplorer.com/#raycasting-2
	rayCast: function () {
		//fill the entire light bitmap with a dark shadow color.
		this.bitmap.context.fillStyle = 'rgb(0, 0, 0)';
		this.bitmap.context.fillRect(game.camera.x, game.camera.y, game.camera.width + this.bitmapBleed, game.camera.height + this.bitmapBleed);
		var rayLength = (this.player.lightSwitch) ? game.rnd.integerInRange(-this.player.flickerAmount, this.player.LIGHT_FLICKER_BASE) : 0; //animates the light flickering, this will be used by how close you are to the monster
		// Ray casting!
		// Cast rays at intervals in a large circle around the light.
		// Save all of the intersection points or ray end points if there was no intersection.
		var points = [];
		for (var a = 0; a < Math.PI * 2; a += Math.PI / 360) {
			var ray = new Phaser.Line(this.player.x, this.player.y,
				this.player.x + Math.cos(a) * this.player.lightRange, this.player.y + Math.sin(a) * this.player.lightRange);//last 2 parameters indicate length

			// Check if the ray intersected any walls
			var intersect = this.getWallIntersection(ray);

			// Save the intersection or the end of the ray
			if (intersect) {
				points.push(intersect);
			} else {
				points.push(ray.end);
			}
		}
		// Draw circle of light with a soft edge
		var gradient = this.bitmap.context.createRadialGradient(
			this.player.x, this.player.y, this.player.lightRange * 0.75 + rayLength,
			this.player.x, this.player.y, this.player.lightRange + rayLength);
		gradient.addColorStop(0, 'rgba(255, 225, 200, 1.0)');
		gradient.addColorStop(1, 'rgba(255, 225, 200, 0.0)');
		// Connect the dots and fill in the shape, which are cones of light,
		// with a bright white color. When multiplied with the background,
		// the white color will allow the full color of the background to
		// shine through.
		this.bitmap.context.beginPath();
		this.bitmap.context.fillStyle = gradient;//"rgb(255, 255, 255)"; //from 0 to 255. 255 is pitch black, 0 is clear
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
						game.math.distance(ray.start.x, ray.start.y, intersect.x, intersect.y);
					if (distance < distanceToWall) {
						distanceToWall = distance;
						closestIntersection = intersect;
					}
				}
			}
		}, this);
		return closestIntersection;
	},
	addObjects: function () {
		var j, i;
		var obj;
		for (i = 0, j = -1; i < objs.length; i += 3) {
			if (objs[i] == 0) {
				obj = new lock(game, objs[i + 1], objs[i + 2].x, objs[i + 2].y);
				game.add.existing(obj);
				this.locks.add(obj);
				j++;
			}
			else {
				if (this.locks.children[j] != undefined) {
					obj = new key(game, objs[i + 1], objs[i + 2].x, objs[i + 2].y, objs[i]);
					game.add.existing(obj);
					this.keys.add(obj);
					this.locks.getChildAt(j).addId(objs[i]);
				}
				else {
					console.log("OBJS ARRAY ERROR: a null solid found");
				}
			}
		}
	},
	collectItem: function (player, item) {
		player.pickUpItem(item);
		this.player.displayInventory();
	},
	displayKeysNeeded: function (group) { //debug only
		group.forEachAlive(function (item) {
			console.log(item);
			for (let i = 0; i < item.ids.length; i++) {
				console.log("	" + item.ids[i]);
			}
		}, this);
	},
};
