////////////////////////////////////////////////////////////////////////
//GAMYGDALA EMOTION ENIGINE CODE. This is STANDALONE AND NOT DEPENDENT ON PHASER!
////////////////////////////////////////////////////////////////////////
TUDelft = function(){
	//simply create the namespace
};

/**
* This is the main appraisal engine class taking care of interpreting a situation emotionally. Typically you create one instance of this class and then register all agents (emotional entities) to it, as well as all goals.
*
* @class TUDelft.Gamygdala
* @constructor 
*/
TUDelft.Gamygdala = function () {
    this.agents = [];
	this.goals=[];
	this.decayFunction=this.exponentialDecay;
	this.decayFactor=0.8;
	this.lastMillis=Date.now();
	this.millisPassed;
	this.debug;
	
};

/**
* A facilitator method that creates a new Agent and registers it for you
*
* @method TUDelft.Gamygdala.createAgent
* @param {String} agentName The agent with agentName is created
* @return {TUDelft.Gamygdala.Agent} An agent reference to the newly created agent
*/
TUDelft.Gamygdala.prototype.createAgent = function(agentName){
	temp=new TUDelft.Gamygdala.Agent(agentName);
	this.registerAgent(temp);
	return temp;
}


/**
* A facilitator method to create a goal for a particular agent, that also registers the goal to the agent and gamygdala.
* This method is thus handy if you want to keep all gamygdala logic internal to Gamygdala.
* However, if you want to do more sophisticated stuff (e.g., goals for multiple agents, keep track of your own list of goals to also remove them, appraise events per agent without the need for gamygdala to keep track of goals, etc...) this method will probably be doing too much.
* @method TUDelft.Gamygdala.createGoalForAgent
* @param {String} agentName The agent's name to which the newly created goal has to be added.
* @param {String} goalName The goal's name.
* @param {double} goalUtility The goal's utility.
* @param {boolean} isMaintenanceGoal Defines if the goal is a maintenance goal or not [optional]. The default is that the goal is an achievement goal, i.e., a goal that once it's likelihood reaches true (1) or false (-1) stays that way.
* @return {TUDelft.Gamygdala.Goal} - a goal reference to the newly created goal.
*/
TUDelft.Gamygdala.prototype.createGoalForAgent = function(agentName, goalName, goalUtility, isMaintenanceGoal){
	tempAgent=this.getAgentByName(agentName);
	if (tempAgent){
		tempGoal=this.getGoalByName(goalName);
		if (tempGoal)
			console.log("Warning: I cannot make a new goal with the same name "+goalName+" as one is registered already. I assume the goal is a common goal and will add the already known goal with that name to the agent "+agentName);
		else {
			tempGoal=new TUDelft.Gamygdala.Goal(goalName, goalUtility);
			this.registerGoal(tempGoal);
		}
		tempAgent.addGoal(tempGoal);
		if (isMaintenanceGoal)
			tempGoal.isMaintenanceGoal=isMaintenanceGoal;
		return tempGoal;
	} else
	{	console.log("Error: agent with name "+ agentName + " does not exist, so I cannot add a create a goal for it.");
		return null;
	}
	
}

/**
* A facilitator method to create a relation between two agents. Both source and target have to exist and be registered with this Gamygdala instance.
* This method is thus handy if you want to keep all gamygdala logic internal to Gamygdala.
* @method TUDelft.Gamygdala.createRelation
* @param {String} sourceName The agent who has the relation (the source)
* @param {String} targetName The agent who is the target of the relation (the target)
* @param {double} relation The relation (between -1 and 1).
*/
TUDelft.Gamygdala.prototype.createRelation = function(sourceName, targetName, relation){
	source=this.getAgentByName(sourceName);
	target=this.getAgentByName(targetName);
	if (source && target && relation>=-1 && relation<=1){
		source.updateRelation(targetName, relation);
	} else
		console.log('Error: cannot relate ' + source + '  to ' + target + ' with intensity '+relation);
	
}

/**
* A facilitator method to appraise an event. It takes in the same as what the new Belief(...) takes in, creates a belief and appraises it for all agents that are registered.
* This method is thus handy if you want to keep all gamygdala logic internal to Gamygdala.
* @method TUDelft.Gamygdala.appraiseBelief
* @param {double} likelihood The likelihood of this belief to be true.
* @param {String} causalAgentName The agent's name of the causal agent of this belief.
* @param {String[]} affectedGoalNames An array of affected goals' names.
* @param {double[]} goalCongruences An array of the affected goals' congruences (i.e., the extend to which this event is good or bad for a goal [-1,1]).
* @param {boolean} [isIncremental] Incremental evidence enforces gamygdala to see this event as incremental evidence for (or against) the list of goals provided, i.e, it will add or subtract this belief's likelihood*congruence from the goal likelihood instead of using the belief as "state" defining the absolute likelihood
*/
TUDelft.Gamygdala.prototype.appraiseBelief = function(likelihood, causalAgentName, affectedGoalNames, goalCongruences, isIncremental){
	tempBelief=new TUDelft.Gamygdala.Belief(likelihood, causalAgentName, affectedGoalNames, goalCongruences, isIncremental);
	this.appraise(tempBelief);
}
/**
* Facilitator method to print all emotional states to the console.	
* @method TUDelft.Gamygdala.printAllEmotions
* @param {boolean} gain Whether you want to print the gained (true) emotional states or non-gained (false).
*/
TUDelft.Gamygdala.prototype.printAllEmotions = function(gain){
	for (var i=0;i<this.agents.length;i++){
		this.agents[i].printEmotionalState(gain);
		this.agents[i].printRelations(null);
	}
}

/**
* Facilitator to set the gain for the whole set of agents known to TUDelft.Gamygdala.
* For more realistic, complex games, you would typically set the gain for each agent type separately, to finetune the intensity of the response.
* @method TUDelft.Gamygdala.setGain
* @param {double} gain The gain value [0 and 20].
*/
TUDelft.Gamygdala.prototype.setGain =function(gain){
	for (var i=0;i<this.agents.length;i++){
		this.agents[i].setGain(gain);
	}
}

/**
* Sets the decay factor and function for emotional decay.
* It sets the decay factor and type for emotional decay, so that an emotion will slowly get lower in intensity.
* Whenever decayAll is called, all emotions for all agents are decayed according to the factor and function set here.
* @method TUDelft.Gamygdala.setDecay
* @param {double} decayFactor The decayfactor used. A factor of 1 means no decay, a factor 
* @param {function} decayFunction The decay function tobe used. choose between linearDecay or exponentialDecay (see the corresponding methods)
*/
TUDelft.Gamygdala.prototype.setDecay = function(decayFactor, decayFunction){
	
	this.decayFunction=decayFunction;
	this.decayFactor=decayFactor;
}
/**
* This starts the actual gamygdala decay process. It simply calls decayAll() at the specified interval.
* The timeMS only defines the interval at which to decay, not the rate over time, that is defined by the decayFactor and function.
* For more complex games (e.g., games where agents are not active when far away from the player, or games that do not need all agents to decay all the time) you should yourself choose when to decay agents individually.
* To do so you can simply call the agent.decay() method (see the agent class).
* @param {int} timeMS The "framerate" of the decay in milliseconds. 
*/
TUDelft.Gamygdala.prototype.startDecay = function(timeMS){
	setInterval(this.decayAll.bind(this), timeMS);
}

////////////////////////////////////////////////////////
//Below this is more detailed gamygdala stuff to use it more flexibly.
////////////////////////////////////////////////////////
 
/**
* For every entity in your game (usually NPC's, but can be the player character too) you have to first create an Agent object and then register it using this method.
* Registering the agent makes sure that Gamygdala will be able to emotionally interpret incoming Beliefs about the game state for that agent.
* @method TUDelft.Gamygdala.registerAgent
* @param {TUDelft.Gamygdala.Agent} agent The agent to be registered
*/
TUDelft.Gamygdala.prototype.registerAgent = function(agent){
    this.agents.push(agent);
	agent.gamygdalaInstance=this;
};

/**
* Simple agent getter by name.
* @method TUDelft.Gamygdala.getAgentByName
* @param {String} agentName The name of the agent to be found.
* @return {TUDelft.Gamygdala.Agent} null or an agent reference that has the name property equal to the agentName argument
*/
TUDelft.Gamygdala.prototype.getAgentByName = function(agentName){
    for(var i = 0; i <this.agents.length; i++){
        if(this.agents[i].name === agentName){
            return this.agents[i];
        }
    }
	console.log('Warning: agent '+agentName+' not found');
    return null;
};


/**
* For every goal that NPC's or player characters can have you have to first create a Goal object and then register it using this method.
* Registering the goals makes sure that Gamygdala will be able to find the correct goal references when a Beliefs about the game state comes in.
* @method TUDelft.Gamygdala.registerGoal
* @param {TUDelft.Gamygdala.Goal} goal The goal to be registered.
*/
TUDelft.Gamygdala.prototype.registerGoal = function(goal){
	if (this.getGoalByName(goal.name)==null)
		this.goals.push(goal);
	else{
		console.log("Warning: failed adding a second goal with the same name: "+goal.name);
	}
};

/**
* Simple goal getter by name.
* @method TUDelft.Gamygdala.getGoalByName
* @param {String} goalName The name of the goal to be found.
* @return {TUDelft.Gamygdala.Goal} null or a goal reference that has the name property equal to the goalName argument
*/
TUDelft.Gamygdala.prototype.getGoalByName = function(goalName){
    for(var i = 0; i <this.goals.length; i++){
        if(this.goals[i].name === goalName){
            return this.goals[i];
        }
    }
    return null;
};

/**
* This method is the main emotional interpretation logic entry point. It performs the complete appraisal of a single event (belief) for all agents (affectedAgent=null) or for only one agent (affectedAgent=true)
* if affectedAgent is set, then the complete appraisal logic is executed including the effect on relations (possibly influencing the emotional state of other agents),
* but only if the affected agent (the one owning the goal) == affectedAgent
* this is sometimes needed for efficiency, if you as a game developer know that particular agents can never appraise an event, then you can force Gamygdala to only look at a subset of agents.
* Gamygdala assumes that the affectedAgent is indeed the only goal owner affected, that the belief is well-formed, and will not perform any checks, nor use Gamygdala's list of known goals to find other agents that share this goal (!!!)
* @method TUDelft.Gamygdala.appraise 
* @param {TUDelft.Gamygdala.Belief} belief The current event, in the form of a Belief object, to be appraised
* @param {TUDelft.Gamygdala.Agent} [affectedAgent] The reference to the agent who needs to appraise the event. If given, this is the appraisal perspective (see explanation above).
*/
TUDelft.Gamygdala.prototype.appraise = function(belief, affectedAgent){
	if (affectedAgent==null){
		//check all
		if (this.debug)
			console.log(belief);
		
		if(belief.goalCongruences.length != belief.affectedGoalNames.length){
			console.log("Error: the congruence list was not of the same length as the affected goal list");
			return false; //The congruence list must be of the same length as the affected goals list.   
		}
		if (this.goals.length==0){
			console.log("Warning: no goals registered to Gamygdala, all goals to be considered in appraisal need to be registered.");
			return false; //The congruence list must be of the same length as the affected goals list.   
		}
			
		
		for (var i = 0; i < belief.affectedGoalNames.length; i++) {
			//Loop through every goal in the list of affected goals by this event.
			var currentGoal=this.getGoalByName(belief.affectedGoalNames[i]);
			
			if (currentGoal!=null){
				//the goal exists, appraise it
				var utility = currentGoal.utility;
				var deltaLikelihood = this.calculateDeltaLikelihood(currentGoal, belief.goalCongruences[i], belief.likelihood, belief.isIncremental);
				//var desirability = belief.goalCongruences[i] * utility;
				var desirability = deltaLikelihood * utility;
				if (this.debug)
					console.log('Evaluated goal: ' + currentGoal.name +'('+utility+', '+deltaLikelihood+')');
						
				
				//now find the owners, and update their emotional states
				for(var j = 0; j < this.agents.length; j++){
					if(this.agents[j].hasGoal(currentGoal.name)){
						var owner=this.agents[j];
						
						if (this.debug)
							console.log('....owned by '+owner.name);
						this.evaluateInternalEmotion(utility, deltaLikelihood, currentGoal.likelihood, owner);  
						this.agentActions(owner.name, belief.causalAgentName, owner.name, desirability, utility, deltaLikelihood); 
						//now check if anyone has a relation to this goal owner, and update the social emotions accordingly.
						for (var k=0;k<this.agents.length;k++){
							var relation=this.agents[k].getRelation(owner.name);
							if(relation!=null){
								if (this.debug){
									console.log(this.agents[k].name + ' has a relationship with '+owner.name);
									console.log(relation);
								}
								//The agent has relationship with the goal owner which has nonzero utility, add relational effects to the relations for agent[k]. 
								this.evaluateSocialEmotion(utility, desirability, deltaLikelihood, relation, this.agents[k]);
								//also add remorse and gratification if conditions are met within (i.e., agent[k] did something bad/good for owner)
								this.agentActions(owner.name, belief.causalAgentName, this.agents[k].name, desirability, utility, deltaLikelihood); 
							} else {
								if (this.debug)
									console.log(this.agents[k].name + ' has NO relationship with '+owner.name);
							}
						}	  
					}
				}   
			}
		}
	} else {
		//check only affectedAgent (which can be much faster) and does not involve console output nor checks
		for (var i = 0; i < belief.affectedGoalNames.length; i++) {
			//Loop through every goal in the list of affected goals by this event.
			var currentGoal=affectedAgent.getGoalByName(belief.affectedGoalNames[i]);
			var utility = currentGoal.utility;
			var deltaLikelihood = this.calculateDeltaLikelihood(currentGoal, belief.goalCongruences[i], belief.likelihood, belief.isIncremental);
			//var desirability = belief.goalCongruences[i] * utility;
			var desirability = deltaLikelihood * utility;
			//assume affectedAgent is the only owner to be considered in this appraisal round.
			
			var owner=affectedAgent;
			
			this.evaluateInternalEmotion(utility, deltaLikelihood, currentGoal.likelihood, owner);  
			this.agentActions(owner.name, belief.causalAgentName, owner.name, desirability, utility, deltaLikelihood); 
			//now check if anyone has a relation to this goal owner, and update the social emotions accordingly.
			for (var k=0;k<this.agents.length;k++){
				var relation=this.agents[k].getRelation(owner.name);
				if(relation!=null){
					if (this.debug){
						console.log(this.agents[k].name + ' has a relationship with '+owner.name);
						console.log(relation);
					}
					//The agent has relationship with the goal owner which has nonzero utility, add relational effects to the relations for agent[k]. 
					this.evaluateSocialEmotion(utility, desirability, deltaLikelihood, relation, this.agents[k]);
					//also add remorse and gratification if conditions are met within (i.e., agent[k] did something bad/good for owner)
					this.agentActions(owner.name, belief.causalAgentName, this.agents[k].name, desirability, utility, deltaLikelihood); 
				} else {
					if (this.debug)
						console.log(this.agents[k].name + ' has NO relationship with '+owner.name);
				}
			}	  
		}
	}
	//print the emotions to the console for debugging
	if (this.debug){
		this.printAllEmotions(false);
		//this.printAllEmotions(true);
	}
}

/**
* This method decays for all registered agents the emotional state and relations. It performs the decay according to the time passed, so longer intervals between consecutive calls result in bigger clunky steps.
* Typically this is called automatically when you use startDecay(), but you can use it yourself if you want to manage the timing.
* This function is keeping track of the millis passed since the last call, and will (try to) keep the decay close to the desired decay factor, regardless the time passed
* So you can call this any time you want (or, e.g., have the game loop call it, or have e.g., Phaser call it in the plugin update, which is default now).
* Further, if you want to tweak the emotional intensity decay of individual agents, you should tweak the decayFactor per agent not the "frame rate" of the decay (as this doesn't change the rate).
* @method TUDelft.Gamygdala.decayAll
*/
TUDelft.Gamygdala.prototype.decayAll = function(){
	this.millisPassed=Date.now()-this.lastMillis;
	this.lastMillis=Date.now();
	for (var i=0;i<this.agents.length;i++){
		this.agents[i].decay(this);
	}
}

////////////////////////////////////////////////////////
//Below this is internal gamygdala stuff not to be used publicly (i.e., never call these methods).
////////////////////////////////////////////////////////

TUDelft.Gamygdala.prototype.calculateDeltaLikelihood = function(goal, congruence, likelihood, isIncremental){
	//Defines the change in a goal's likelihood due to the congruence and likelihood of a current event.
	//We cope with two types of beliefs: incremental and absolute beliefs. Incrementals have their likelihood added to the goal, absolute define the current likelihood of the goal
	//And two types of goals: maintenance and achievement. If an achievement goal (the default) is -1 or 1, we can't change it any more (unless externally and explicitly by changing the goal.likelihood).
	var oldLikelihood = goal.likelihood; 
	var newLikelihood;
	if (goal.isMaintenanceGoal==false && (oldLikelihood>=1 | oldLikelihood<=-1))
		return 0;
	if (isIncremental){
		newLikelihood = oldLikelihood + likelihood*congruence;
		newLikelihood=Math.max(Math.min(newLikelihood,1), -1);
	}
	else
		newLikelihood = (congruence * likelihood + 1.0)/2.0;
    
	goal.likelihood=newLikelihood;
    if(oldLikelihood != null){
        return newLikelihood - oldLikelihood;     
    }else{
        return newLikelihood;
    }
}

TUDelft.Gamygdala.prototype.evaluateInternalEmotion = function(utility, deltaLikelihood, likelihood, agent){
	//This method evaluates the event in terms of internal emotions that do not need relations to exist, such as hope, fear, etc..
    var positive;
    var intensity;
    var emotion = [];
	
	if( utility >= 0){
        if ( deltaLikelihood >= 0){
            positive = true;
        }else {
            positive = false;
        }
    } else if ( utility < 0){
        if( deltaLikelihood >= 0){
            positive = false;
        } else {
            positive = true;
        }
    }  
    if(likelihood > 0 && likelihood < 1){
        if (positive === true){
            emotion.push('hope');    
        }else {
            emotion.push('fear');   
        }
    } else if(likelihood === 1){
        if (utility >= 0){
            if(deltaLikelihood < 0.5){
                emotion.push('satisfaction'); 
            }
            emotion.push('joy');
        }
        else {
            if(deltaLikelihood <0.5){
                emotion.push('fear-confirmed');
            }
            emotion.push('distress');
        }
    } else if(likelihood === 0){
        if( utility >= 0){
            if( deltaLikelihood > 0.5){
                emotion.push('disappointment');       
            }
            emotion.push('distress');
        }else {
            if( deltaLikelihood > 0.5){
                emotion.push('relief');  
            }
            emotion.push('joy');
        }
    }
    intensity = Math.abs(utility * deltaLikelihood);
	if(intensity != 0){
        for(var i = 0; i < emotion.length; i++){
			agent.updateEmotionalState(new TUDelft.Gamygdala.Emotion(emotion[i], intensity));   
        }
    }
}

TUDelft.Gamygdala.prototype.evaluateSocialEmotion = function(utility, desirability, deltaLikelihood, relation, agent){
    //This function is used to evaluate happy-for, pity, gloating or resentment.
    //Emotions that arise when we evaluate events that affect goals of others.
    //The desirability is the desirability from the goal owner's perspective.
    //The agent is the agent getting evaluated (the agent that gets the social emotion added to his emotional state).
    //The relation is a relation object between the agent being evaluated and the goal owner of the affected goal.
    var emotion = new TUDelft.Gamygdala.Emotion(null,null);
    if (desirability >= 0){
        if(relation.like >= 0){
            emotion.name = 'happy-for';
        }
        else {
            emotion.name = 'resentment';   
        }
    }
    else {
        if (relation.like >= 0){
            emotion.name = 'pity';   
        }
        else {
            emotion.name = 'gloating';   
        }
    }
    emotion.intensity = Math.abs(utility * deltaLikelihood * relation.like);
    if(emotion.intensity != 0){
        relation.addEmotion(emotion);  
		agent.updateEmotionalState(emotion);  //also add relation emotion the emotion to the emotional state
    }
    
}

TUDelft.Gamygdala.prototype.agentActions = function(affectedName, causalName, selfName, desirability, utility, deltaLikelihood){
	if (causalName!=null && causalName!=''){
		//If the causal agent is null or empty, then we we assume the event was not caused by an agent.
		//There are three cases here.
		//The affected agent is SELF and causal agent is other.
		//The affected agent is SELF and causal agent is SELF.
		//The affected agent is OTHER and causal agent is SELF.
		var emotion = new TUDelft.Gamygdala.Emotion(null,null);
		var relation;
		if(affectedName === selfName && selfName != causalName){
			//Case one 
			if(desirability >= 0){
				emotion.name = 'gratitude';
			}
			else {
				emotion.name = 'anger';  
			}
			emotion.intensity = Math.abs(utility * deltaLikelihood);
			var self = this.getAgentByName(selfName);
			if(self.hasRelationWith(causalName)){
				relation = self.getRelation(causalName);          
			}else{
				self.updateRelation(causalName, 0.0);
				relation = self.getRelation(causalName); 
			}
			relation.addEmotion(emotion);
			self.updateEmotionalState(emotion);  //also add relation emotion the emotion to the emotional state
		}
		if(affectedName === selfName && selfName === causalName){
			//Case two
			//This case is not included in TUDelft.Gamygdala.
			//This should include pride and shame
		}
		if(affectedName != selfName && causalName === selfName){
			//Case three
			relation;
			if( this.getAgentByName(causalName).hasRelationWith(affectedName)){
				relation = this.getAgentByName(causalName).getRelation(affectedName);   
				if(desirability >= 0){
					if(relation.like >= 0){
						emotion.name = 'gratification';
						emotion.intensity = Math.abs(utility * deltaLikelihood * relation.like);
						relation.addEmotion(emotion);
						this.getAgentByName(causalName).updateEmotionalState(emotion);  //also add relation emotion the emotion to the emotional state
					}
				}
				else {
					if(relation.like >= 0){
						emotion.name = 'remorse';  
						emotion.intensity = Math.abs(utility * deltaLikelihood * relation.like);
						relation.addEmotion(emotion);
						this.getAgentByName(causalName).updateEmotionalState(emotion);  //also add relation emotion the emotion to the emotional state
					}
					
				}
				
			}   
		}
	}
}
	
/** A linear decay function that will decrease the emotion intensity of an emotion every tick by a constant defined by the decayFactor in the gamygdala instance.
* You can set Gamygdala to use this function for all emotion decay by calling setDecay() and passing this function as second parameter. This function is not to be called directly.
* @method TUDelft.Gamygdala.linearDecay 
*/
TUDelft.Gamygdala.prototype.linearDecay = function(value){
	//assumes the decay of the emotional state intensity is linear with a factor equal to decayFactor per second.
	return value-this.decayFactor*(this.millisPassed/1000);
}
	
/** An exponential decay function that will decrease the emotion intensity of an emotion every tick by a factor defined by the decayFactor in the gamygdala instance.
* You can set Gamygdala to use this function for all emotion decay by calling setDecay() and passing this function as second parameter. This function is not to be called directly.
* @method TUDelft.Gamygdala.exponentialDecay 
*/
TUDelft.Gamygdala.prototype.exponentialDecay = function(value){
	//assumes the decay of the emotional state intensity is exponential with a factor equal to decayFactor per second.
	return value*Math.pow(this.decayFactor, this.millisPassed/1000);
}










/**
* This is the emotion agent class taking care of emotion management for one entity 
*
* @class TUDelft.Gamygdala.Agent
* @constructor 
* @param {String} name The name of the agent to be created. This name is used as ref throughout the appraisal engine.
*/
TUDelft.Gamygdala.Agent = function(name){
    this.name = name;
    this.goals = [];
    this.currentRelations = [];
    this.internalState = [];
    this.gain=1;
	this.gamygdalaInstance;
	
	this.mapPAD=[];
	this.mapPAD['distress']=[-0.61,0.28,-0.36];
	this.mapPAD['fear']=[-0.64,0.6,-0.43];
	this.mapPAD['hope']=[0.51,0.23,0.14];
	this.mapPAD['joy']=[0.76,.48,0.35];
	this.mapPAD['satisfaction']=[0.87,0.2,0.62];
	this.mapPAD['fear-confirmed']=[-0.61,0.06,-0.32];//defeated
	this.mapPAD['disappointment']=[-0.61,-0.15,-0.29];
	this.mapPAD['relief']=[0.29,-0.19,-0.28];
	this.mapPAD['happy-for']=[0.64,0.35,0.25];
	this.mapPAD['resentment']=[-0.35,0.35,0.29];
	this.mapPAD['pity']=[-0.52,0.02,-0.21];//regretful
	this.mapPAD['gloating']=[-0.45,0.48,0.42];//cruel
	this.mapPAD['gratitude']=[0.64,0.16,-0.21];//grateful
	this.mapPAD['anger']=[-0.51,0.59,0.25];
	this.mapPAD['gratification']=[0.69,0.57,0.63];//triumphant
	this.mapPAD['remorse']=[-0.57,0.28,-0.34];//guilty
	
};
/**
* Adds a goal to this agent's goal list (so this agent becomes an owner of the goal)
* @method TUDelft.Gamygdala.Agent.addGoal
* @param {TUDelft.Gamygdala.Goal} goal The goal to be added.
*/
TUDelft.Gamygdala.Agent.prototype.addGoal = function(goal) {
	//no copy, cause we need to keep the ref,
	//one goal can be shared between agents so that changes to this one goal are reflected in the emotions of all agents sharing the same goal
    this.goals.push(goal);   
};
/**
* Adds a goal to this agent's goal list (so this agent becomes an owner of the goal)
* @method TUDelft.Gamygdala.Agent.removeGoal
* @param {String} goalName The name of the goal to be added. 
* @return {boolean} True if the goal could be removed, false otherwise.
*/
TUDelft.Gamygdala.Agent.prototype.removeGoal = function(goalName){
    for(var i = 0; i < this.goals.length; i++){
        if(this.goals[i].name === goalName){
            this.goals.splice(i, 1);
            return true;
        }
    }
    return false;
};
/**
* Checks if this agent owns a goal.
* @method TUDelft.Gamygdala.Agent.hasGoal
* @param {String} goalName The name of the goal to be checked.
* @return {boolean} True if this agent owns the goal, false otherwise.
*/
TUDelft.Gamygdala.Agent.prototype.hasGoal= function(goalName){
	return (this.getGoalByName(goalName)!=null);
}
/**
* If this agent has a goal with name goalName, this method returns that goal.
* @method TUDelft.Gamygdala.Agent.getGoalByName
* @param {String} goalName The name of the goal to be found.
* @return {TUDelft.Gamygdala.Goal} the reference to the goal.
*/
TUDelft.Gamygdala.Agent.prototype.getGoalByName = function(goalName){
   for(var i = 0; i < this.goals.length; i++){
        if(this.goals[i].name === goalName){
            return this.goals[i];
        }
    }
    return null;  
}
/**
* Sets the gain for this agent.

* @method TUDelft.Gamygdala.Agent.setGain
* @param {double} gain The gain value [0 and 20].
*/
TUDelft.Gamygdala.Agent.prototype.setGain = function(gain){
	if (gain<=0 || gain>20)
		console.log('Error: gain factor for appraisal integration must be between 0 and 20');
	else
		this.gain=gain;
}
/**
* A facilitating method to be able to appraise one event only from the perspective of the current agent (this).
* Needs an instantiated gamygdala object (automatic when the agent is registered with Gamygdala.registerAgent(agent) to a Gamygdala instance).
* @method TUDelft.Gamygdala.Agent.appraise
* @param {TUDelft.Gamygdala.Belief} belief The belief to be appraised.
*/
TUDelft.Gamygdala.Agent.prototype.appraise = function(belief){
	this.gamygdalaInstance.appraise(belief, this);
}

TUDelft.Gamygdala.Agent.prototype.updateEmotionalState = function(emotion){
	for(var i = 0; i < this.internalState.length; i++){
        if(this.internalState[i].name === emotion.name){
            //Appraisals simply add to the old value of the emotion
			//So repeated appraisals without decay will result in the sum of the appraisals over time
			//To decay the emotional state, call .decay(decayFunction), or simply use the facilitating function in Gamygdala setDecay(timeMS).
			this.internalState[i].intensity+=emotion.intensity;
            return;
        }
    }
	//copy on keep, we need to maintain a list of current emotions for the state, not a list references to the appraisal engine
    this.internalState.push(new TUDelft.Gamygdala.Emotion(emotion.name, emotion.intensity));
};

/**
* This function returns either the state as is (gain=false) or a state based on gained limiter (limited between 0 and 1), of which the gain can be set by using setGain(gain).
* A high gain factor works well when appraisals are small and rare, and you want to see the effect of these appraisals
* A low gain factor (close to 0 but in any case below 1) works well for high frequency and/or large appraisals, so that the effect of these is dampened.
* @method TUDelft.Gamygdala.Agent.getEmotionalState
* @param {boolean} useGain Whether to use the gain function or not.
* @return {TUDelft.Gamygdala.Emotion[]} An array of emotions.
*/
TUDelft.Gamygdala.Agent.prototype.getEmotionalState = function(useGain){
	if (useGain){
		var gainState=[];
		
		for (var i=0;i<this.internalState.length;i++){
			var gainEmo=(this.gain*this.internalState[i].intensity)/(this.gain*this.internalState[i].intensity+1);
			gainState.push(new TUDelft.Gamygdala.Emotion(this.internalState[i].name, gainEmo));
		}
		
		return gainState;
	} else
		return this.internalState;   
};
/**
* This function returns a summation-based Pleasure Arousal Dominance mapping of the emotional state as is (gain=false), or a PAD mapping based on a gained limiter (limited between 0 and 1), of which the gain can be set by using setGain(gain).
* It sums over all emotions the equivalent PAD values of each emotion (i.e., [P,A,D]=SUM(Emotion_i([P,A,D])))), which is then gained or not.
* A high gain factor works well when appraisals are small and rare, and you want to see the effect of these appraisals.
* A low gain factor (close to 0 but in any case below 1) works well for high frequency and/or large appraisals, so that the effect of these is dampened.
* @method TUDelft.Gamygdala.Agent.getPADState
* @param {boolean} useGain Whether to use the gain function or not.
* @return {double[]} An array of doubles with Pleasure at index 0, Arousal at index [1] and Dominance at index [2].
*/
TUDelft.Gamygdala.Agent.prototype.getPADState = function(useGain){
	var PAD=[];
	PAD[0]=0;
	PAD[1]=0;
	PAD[2]=0;
	
	for (var i=0;i<this.internalState.length;i++){
		PAD[0]+=(this.internalState[i].intensity*this.mapPAD[this.internalState[i].name][0]);
		PAD[1]+=(this.internalState[i].intensity*this.mapPAD[this.internalState[i].name][1]);
		PAD[2]+=(this.internalState[i].intensity*this.mapPAD[this.internalState[i].name][2]);
	}
	if (useGain){
		PAD[0]=(PAD[0]>=0?this.gain*PAD[0]/(this.gain*PAD[0]+1):-this.gain*PAD[0]/(this.gain*PAD[0]-1));
		PAD[1]=(PAD[1]>=0?this.gain*PAD[1]/(this.gain*PAD[1]+1):-this.gain*PAD[1]/(this.gain*PAD[1]-1));
		PAD[2]=(PAD[2]>=0?this.gain*PAD[2]/(this.gain*PAD[2]+1):-this.gain*PAD[2]/(this.gain*PAD[2]-1));
		return PAD;
	} else
		return PAD;   
};

/**
* This function prints to the console either the state as is (gain=false) or a state based on gained limiter (limited between 0 and 1), of which the gain can be set by using setGain(gain).
* A high gain factor works well when appraisals are small and rare, and you want to see the effect of these appraisals
* A low gain factor (close to 0 but in any case below 1) works well for high frequency and/or large appraisals, so that the effect of these is dampened.
* @method TUDelft.Gamygdala.Agent.printEmotionalState
* @param {boolean} useGain Whether to use the gain function or not.
*/
TUDelft.Gamygdala.Agent.prototype.printEmotionalState = function(useGain){
	var output=this.name + ' feels ';
	var i;
	var emotionalState=this.getEmotionalState(useGain);
	for (i=0;i<emotionalState.length; i++){
		output+=emotionalState[i].name+":"+emotionalState[i].intensity+", ";
	}
	if (i>0)
		console.log(output);
}

/**
* Sets the relation this agent has with the agent defined by agentName. If the relation does not exist, it will be created, otherwise it will be updated.
* @method TUDelft.Gamygdala.Agent.updateRelation
* @param {String} agentName The agent who is the target of the relation.
* @param {double} like The relation (between -1 and 1).
*/
TUDelft.Gamygdala.Agent.prototype.updateRelation = function(agentName, like){
    if(!this.hasRelationWith(agentName)){
        //This relation does not exist, just add it.
         this.currentRelations.push(new TUDelft.Gamygdala.Relation(agentName,like));   
    }else {
        //The relation already exists, update it.
        for(var i = 0; i < this.currentRelations.length; i++){
            if(this.currentRelations[i].agentName === agentName){
                this.currentRelations[i].like = like;
            }
        }
    }
};
/**
* Checks if this agent has a relation with the agent defined by agentName.
* @method TUDelft.Gamygdala.Agent.hasRelationWith
* @param {String} agentName The agent who is the target of the relation.
* @param {boolean} True if the relation exists, otherwise false.
*/
TUDelft.Gamygdala.Agent.prototype.hasRelationWith = function (agentName){
    return (this.getRelation(agentName)!=null);
};
/**
* Returns the relation object this agent has with the agent defined by agentName.
* @method TUDelft.Gamygdala.Agent.getRelation
* @param {String} agentName The agent who is the target of the relation.
*/
TUDelft.Gamygdala.Agent.prototype.getRelation = function (agentName){
    for(var i = 0; i < this.currentRelations.length; i++){
        if(this.currentRelations[i].agentName === agentName){
            return this.currentRelations[i];    
        }
    } 
	return null;
};
/**
* Returns the relation object this agent has with the agent defined by agentName.
* @method TUDelft.Gamygdala.Agent.printRelations
* @param {String} [agentName] The agent who is the target of the relation will only be printed, or when omitted all relations are printed.
*/
TUDelft.Gamygdala.Agent.prototype.printRelations = function (agentName){
	var output=this.name+ ' has the following sentiments:\n   ';
	var i;
	var found=false;
    for(i = 0; i < this.currentRelations.length; i++){
		
        if(agentName==null || this.currentRelations[i].agentName === agentName){
            for (var j=0;j<this.currentRelations[i].emotionList.length;j++){
				output+=this.currentRelations[i].emotionList[j].name+'('+this.currentRelations[i].emotionList[j].intensity+') ';    
				found=true;
			}
        }
		output+=' for '+this.currentRelations[i].agentName;
		if (i<this.currentRelations.length-1)
			 output+=', and\n   ';
    } 
	if (found)
		console.log(output);
};
/**
* This method decays the emotional state and relations according to the decay factor and function defined in gamygdala. 
* Typically this is called automatically when you use startDecay() in Gamygdala, but you can use it yourself if you want to manage the timing.
* This function is keeping track of the millis passed since the last call, and will (try to) keep the decay close to the desired decay factor, regardless the time passed
* So you can call this any time you want (or, e.g., have the game loop call it, or have e.g., Phaser call it in the plugin update, which is default now).
* Further, if you want to tweak the emotional intensity decay of individual agents, you should tweak the decayFactor per agent not the "frame rate" of the decay (as this doesn't change the rate).
* @method TUDelft.Gamygdala.decayAll
* @param {TUDelft.Gamygdala} gamygdalaInstance A reference to the correct gamygdala instance that contains the decayFunction property to be used )(so you could use different gamygdala instances to manage different groups of  agents)
*/
TUDelft.Gamygdala.Agent.prototype.decay = function(gamygdalaInstance){
    for(var i= 0; i < this.internalState.length; i++){
		var newIntensity=gamygdalaInstance.decayFunction(this.internalState[i].intensity);
        if( newIntensity < 0){
            this.internalState.splice(i,1);   
        } else{
            this.internalState[i].intensity = newIntensity;   
        }
    }
    for (var i=0;i<this.currentRelations.length;i++)
		this.currentRelations[i].decay(gamygdalaInstance);
};



















/**
* This is the class that represents a relation one agent has with other agents.
* It's main role is to store and manage the emotions felt for a target agent (e.g angry at, or pity for).
* Each agent maintains a list of relations, one relation for each target agent.
* @class TUDelft.Gamygdala.Relation
* @constructor 
* @param {String} targetName The agent who is the target of the relation.
* @param {double} relation The relation [-1 and 1].
*/
TUDelft.Gamygdala.Relation = function (targetName, like) {
    this.agentName = targetName ;
    this.like = like;
    this.emotionList = [];
};

TUDelft.Gamygdala.Relation.prototype.addEmotion = function(emotion) {
    var added = false;
    for (var i = 0; i < this.emotionList.length; i++){
        if (this.emotionList[i].name === emotion.name){
			/*
			
            if (this.emotionList[i].intensity < emotion.intensity){
                this.emotionList[i].intensity = emotion.intensity;
            }*/
			this.emotionList[i].intensity += emotion.intensity;
            added = true;
        }    
    }
    if(added === false){
		//copy on keep, we need to maintain a list of current emotions for the relation, not a list refs to the appraisal engine
		this.emotionList.push(new TUDelft.Gamygdala.Emotion(emotion.name, emotion.intensity));   
    }
};

TUDelft.Gamygdala.Relation.prototype.decay = function(gamygdalaInstance){
    for (var i = 0; i < this.emotionList.length; i++){
		var newIntensity=gamygdalaInstance.decayFunction(this.emotionList[i].intensity);
		
        if (newIntensity < 0){
            //This emotion has decayed below zero, we need to remove it.
            this.emotionList.splice(i, 1);
        } 
        else {
            this.emotionList[i].intensity = newIntensity;   
        }
    }   
};



/**
* This class is a data structure to store one Belief for an agent
* A belief is created and fed into a Gamygdala instance (method Gamygdala.appraise()) for evaluation
* @class  TUDelft.Gamygdala.Belief
* @constructor
* @param {double} likelihood The likelihood of this belief to be true.
* @param {String} causalAgentName The agent's name of the causal agent of this belief.
* @param {String[]} affectedGoalNames An array of affected goals' names.
* @param {double[]} goalCongruences An array of the affected goals' congruences (i.e., the extend to which this event is good or bad for a goal [-1,1]).
* @param {boolean} [isIncremental] Incremental evidence enforces gamygdala to see this event as incremental evidence for (or against) the list of goals provided, i.e, it will add or subtract this belief's likelihood*congruence from the goal likelihood instead of using the belief as "state" defining the absolute likelihood
*/
TUDelft.Gamygdala.Belief = function(likelihood, causalAgentName, affectedGoalNames, goalCongruences, isIncremental) {
	if (isIncremental)
		this.isIncremental=isIncremental;//incremental evidence enforces gamygdala to use the likelihood as delta, i.e, it will add or subtract this belief's likelihood from the goal likelihood instead of using the belief as "state" defining the absolute likelihood
    else
		this.isIncremental=false;
	this.likelihood = Math.min(1,Math.max(-1,likelihood));
    this.causalAgentName = causalAgentName;
    this.affectedGoalNames = [];
    this.goalCongruences = [];
	
	//copy on keep
    for(var i = 0; i < affectedGoalNames.length; i++){
        this.affectedGoalNames.push(affectedGoalNames[i]);   
    }
    for(var i = 0; i < goalCongruences.length; i++){
        this.goalCongruences.push(Math.min(1,Math.max(-1,goalCongruences[i])));   
    }
};










/**
* This class is mainly a data structure to store an emotion with its intensity
* @class TUDelft.Gamygdala.Emotion
* @constructor
* @param {String} name The string ref of the emotion
* @param {double} intensity The intensity at which the emotion is set upon construction.
*/
TUDelft.Gamygdala.Emotion = function (name, intensity) {
    this.name = name;
    this.intensity = intensity;
};










/**
* This class is mainly a data structure to store a goal with it's utility and likelihood of being achieved
* This is used as basis for interpreting Beliefs
* @class TUDelft.Gamygdala.Goal
* @constructor
* @param {String} name The name of the goal
* @param {double} utility The utility of the goal
* @param {boolean} [isMaintenanceGoal] Defines if the goal is a maintenance goal or not. The default is that the goal is an achievement goal, i.e., a goal that once it's likelihood reaches true (1) or false (-1) stays that way.
*/
TUDelft.Gamygdala.Goal = function(name, utility, isMaintenanceGoal){
    this.name = name;
    this.utility = utility;
    this.likelihood = 0.5; //The likelihood is unknown at the start so it starts in the middle between disconfirmed (0) and confirmed (1)
	if (isMaintenanceGoal)
		this.isMaintenanceGoal=isMaintenanceGoal; //There are maintenance and achievement goals. When an achievement goal is reached (or not), this is definite (e.g., to a the promotion or not). A maintenance goal can become true/false indefinitely (e.g., to be well-fed)
	else
		this.isMaintenanceGoal=false;
}

