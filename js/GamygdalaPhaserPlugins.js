////////////////////////
//The code below presents two Phaser plugins
//The first, Phaser.Plugin.GamygdalaWrapper, is a wrapper to create a Gamygdala instance as a phaser plugin
//The second, Phaser.Plugin.GamygdalaExpression, is used to render expressions using the Phaser system
//////////////////////////

/**
* This is the Phaser plugin that wraps around the main Gamygdala class.
* To use gamygdala as a Phaser plugin, simply create an instance of Phaser.Plugin.GamygdalaWrapper, and add it to your Phaser game as a plugin.
* By default it is active. 
* The easiest way to add it is as follows:
* @example
* gamygdalaPlugin=new Phaser.Plugin.GamygdalaWrapper();//create the plugin.
* mygame.plugins.add(gamygdalaPlugin);//add the plugin to the game
* gamygdala=gamygdalaPlugin.getGamygdala(); //this gives you a ref to the actual underlying emotion engine, so that you can do what you need to do.
* @class Phaser.Plugin.GamygdalaWrapper
* @constructor
*/
Phaser.Plugin.GamygdalaWrapper = function(){
	this.gamygdala=new TUDelft.Gamygdala();
	this.active=true;
};

Phaser.Plugin.GamygdalaWrapper.prototype = Object.create(Phaser.Plugin.prototype);
Phaser.Plugin.GamygdalaWrapper.prototype.constructor = Phaser.Plugin.GamygdalaWrapper;

/**
* This is run when the plugins update during the core game loop.
* It performs a regular decay, if phaserManagedDecay = true.
* @method Phaser.Plugin.GamygdalaWrapper.update
*/
Phaser.Plugin.GamygdalaWrapper.prototype.update = function () {
	//only call the decay function
	if (this.phaserManagedDecay)
		this.gamygdala.decayAll();
	
	
};

/**
* Returns the gamygdala instance you need to do all emotional stuff.
* @method Phaser.Plugin.GamygdalaWrapper.getGamygdala
* @returns {TUDelft.Gamygdala} The Gamygdala instance reference created by this plugin.
*/
Phaser.Plugin.GamygdalaWrapper.prototype.getGamygdala = function(){
	return this.gamygdala;
};



/**
* This Phaser plugin class renders the emotions in a crude way to visualize what happens to an agent
* It is provided for convenience, depends on Phaser functionality, and it is not suggested that this is the only (or even preferred) way emotions should be used in a game
* One is free to use emotions in any way (e.g. changing gameplay, storyline, enemy behaviour, using rendered faces on the actual sprites, etc..)
* See gamygdala_demo.html for a clear example of how to use this class.
* @class Phaser.Plugin.GamygdalaExpression
* @constructor 
* @param {Phaser.Game} game Your Phaser game
* @param {Phaser.Sprite} sprite The sprite to which this expression belongs
* @param {TUDelft.Gamygdala.Agent} agent The emotional agent who's  emotional state will be expressed.
* @param {boolean} [showOnlyMaxIntensity] Setting showOnlyMaxIntensity to true shows only the expression with the highest intensity. False or omitted results in showing all.
*/
Phaser.Plugin.GamygdalaExpression = function (game, sprite, agent, showOnlyMaxIntensity) {
    this.agent = agent;
    this.sprite = sprite;
	this.game=game;
	
	if (showOnlyMaxIntensity)
		this.showOnlyMaxIntensity=true;
	else
		this.showOnlyMaxIntensity=false;
	
	agent.expressionPlugin=this;
	
	this.map=[];
	this.map['distress']=0;
	this.map['fear']=1;
	this.map['hope']=2;
	this.map['joy']=3;
	this.map['satisfaction']=4;
	this.map['fear-confirmed']=5;
	this.map['disappointment']=6;
	this.map['relief']=7;
	this.map['happy-for']=8;
	this.map['resentment']=9;
	this.map['pity']=10;
	this.map['gloating']=11;
	this.map['gratitude']=12;
	this.map['anger']=13;
	this.map['gratification']=14;
	this.map['remorse']=15;
	
	this.THRESHOLD=0.1;
	this.EMOTION_MAX_SIZE=128;
	this.EMOTION_TEXTURE_SIZE=256;
	this.baseScale=this.EMOTION_MAX_SIZE/this.EMOTION_TEXTURE_SIZE;
	
	this.expressions = [];
	for (var i=0;i<16;i++)
	{	this.expressions[i]=game.add.sprite(sprite.x+i*this.EMOTION_MAX_SIZE, sprite.y-50, 'emotions', i);
		this.expressions[i].scale.x=0;
		this.expressions[i].scale.y=0;
	}
	
	
};

Phaser.Plugin.GamygdalaExpression.prototype = Object.create(Phaser.Plugin.prototype);
Phaser.Plugin.GamygdalaExpression.prototype.constructor = Phaser.Plugin.GamygdalaExpression;

Phaser.Plugin.GamygdalaExpression.prototype.update = function() {
	if (this.visible==false){
		for (var i=0;i<16;i++)
		{	this.expressions[i].scale.x=0;
			this.expressions[i].scale.y=0;
		}
	}
};

/**
* This is run automatically when the Phaser plugins update is performed during the core game loop
* It renders the emotional expression for the sprite to whom the expression is coupled
* @method Phaser.Plugin.GamygdalaExpression.update
*/
Phaser.Plugin.GamygdalaExpression.prototype.render = function() {
	var totalSize=0;
	var max=0;
	var emotionalState=this.agent.getEmotionalState(true);//get the emotional state WITH gain factor.
    for (var i=0;i<emotionalState.length;i++){
		if (emotionalState[i].intensity>this.THRESHOLD){
			totalSize+=emotionalState[i].intensity*this.EMOTION_MAX_SIZE;
		}
		if (emotionalState[i].intensity>max)
			max=emotionalState[i].intensity;
	}
	for (var i=0;i<16;i++)
	{	this.expressions[i].scale.x=0;
		this.expressions[i].scale.y=0;
	}
	var sum=0;
	for (var i=0;i<emotionalState.length;i++){
		if ((this.showOnlyMaxIntensity==true & emotionalState[i].intensity==max & emotionalState[i].intensity>this.THRESHOLD) | (this.showOnlyMaxIntensity==false & emotionalState[i].intensity>this.THRESHOLD)){
			this.expressions[this.map[emotionalState[i].name]].scale.x=emotionalState[i].intensity*this.baseScale;
			this.expressions[this.map[emotionalState[i].name]].scale.y=emotionalState[i].intensity*this.baseScale;
			if (this.showOnlyMaxIntensity)
				this.expressions[this.map[emotionalState[i].name]].x=-(emotionalState[i].intensity*this.EMOTION_MAX_SIZE)/2+this.sprite.body.x+this.sprite.width/2;
			else
				this.expressions[this.map[emotionalState[i].name]].x=sum-totalSize/2+this.sprite.body.x+this.sprite.width/2;
			this.expressions[this.map[emotionalState[i].name]].y=this.sprite.y-emotionalState[i].intensity*this.EMOTION_MAX_SIZE;
			sum+=emotionalState[i].intensity*this.EMOTION_MAX_SIZE;
		}
	}
};



