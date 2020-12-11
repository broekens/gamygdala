from gamygdala.concepts import Emotion, Goal, Belief, Relation

'''
self is the emotion agent class taking care of emotion management for one entity 
@class pygamygdala.Agent
@constructor 
@param {String} name The name of the agent to be created. self name is used as ref throughout the appraisal engine.
'''
class Agent:
	def __init__(self, name='agent'):
		self.name = name
		self.goals = []
		self.currentRelations = []
		self.internalState = []
		self.gamygdalaInstance = None
		self.mapPAD = {}
		self.gain = 1
		self.mapPAD['distress']=[-0.61,0.28,-0.36]
		self.mapPAD['fear']=[-0.64,0.6,-0.43]
		self.mapPAD['hope']=[0.51,0.23,0.14]
		self.mapPAD['joy']=[0.76,.48,0.35]
		self.mapPAD['satisfaction']=[0.87,0.2,0.62]
		self.mapPAD['fear-confirmed']=[-0.61,0.06,-0.32]#defeated
		self.mapPAD['disappointment']=[-0.61,-0.15,-0.29]
		self.mapPAD['relief']=[0.29,-0.19,-0.28]
		self.mapPAD['happy-for']=[0.64,0.35,0.25]
		self.mapPAD['resentment']=[-0.35,0.35,0.29]
		self.mapPAD['pity']=[-0.52,0.02,-0.21]#regretful
		self.mapPAD['gloating']=[-0.45,0.48,0.42]#cruel
		self.mapPAD['gratitude']=[0.64,0.16,-0.21]#grateful
		self.mapPAD['anger']=[-0.51,0.59,0.25]
		self.mapPAD['gratification']=[0.69,0.57,0.63]#triumphant
		self.mapPAD['remorse']=[-0.57,0.28,-0.34]#guilty
	
	def addGoal(self, goal):
		self.goals.append(goal)
	
	def removeGoal(self, goalName):
		for i in range(len(self.goals)):
			if self.goals[i].name == goalName:
				self.goals.pop(i)
				return True
		return False
	
	def hasGoal(self, goalName):
		for i in range(len(self.goals)):
			if self.goals[i].name == goalName:
				return True
		return False
	
	def getGoalByName(self, goalName):
		for i in range(len(self.goals)):
			if self.goals[i].name == goalName:
				return self.goals[i]
		return None
	
	def setGain(self, gain):
		assert gain > 0 and gain  <= 20, 'Error: gain factor for appraisal integration must be between 0 and 20'
		self.gain = gain
	
	def appraise(self, belief):
		self.gamygdalaInstance.appraise(belief, self)

	def updateEmotionalState(self, emotion):
		for i in range(len(self.internalState)):
			if self.internalState[i].name == emotion.name:
				#Appraisals simply add to the old value of the emotion
				#So repeated appraisals without decay will result in the sum of the appraisals over time
				#To decay the emotional state, call .decay(decayFunction), or simply use the facilitating function in Gamygdala setDecay(timeMS).
				self.internalState[i].intensity += emotion.intensity
				return
		#copy on keep, we need to maintain a list of current emotions for the state, not a list references to the appraisal engine
		self.internalState.append(Emotion(emotion.name, emotion.intensity))

	'''
	This function returns either the state as is (gain=false) or a state based on gained limiter (limited between 0 and 1), of which the gain can be set by using setGain(gain).
	A high gain factor works well when appraisals are small and rare, and you want to see the effect of these appraisals
	A low gain factor (close to 0 but in any case below 1) works well for high frequency and/or large appraisals, so that the effect of these is dampened.
	@method gamygdala.Agent.getEmotionalState
	@param {boolean} useGain Whether to use the gain function or not.
	@return {gamygdala.Emotion[]} An array of emotions.
	'''
	def getEmotionalState(self, useGain):
		if useGain:
			gainState=[]
			for i in range(len(self.internalState)):
				gainEmo=(self.gain*self.internalState[i].intensity)/(self.gain*self.internalState[i].intensity+1)
				gainState.append(Emotion(self.internalState[i].name, gainEmo))
			return gainState
		else:
			return self.internalState

	'''
	This function returns a summation-based Pleasure Arousal Dominance mapping of the emotional state as is (gain=false), or a PAD mapping based on a gained limiter (limited between 0 and 1), of which the gain can be set by using setGain(gain).
	It sums over all emotions the equivalent PAD values of each emotion (i.e., [P,A,D]=SUM(Emotion_i([P,A,D])))), which is then gained or not.
	A high gain factor works well when appraisals are small and rare, and you want to see the effect of these appraisals.
	A low gain factor (close to 0 but in any case below 1) works well for high frequency and/or large appraisals, so that the effect of these is dampened.
	@method gamygdala.Agent.getPADState
	@param {boolean} useGain Whether to use the gain function or not.
	@return {double[]} An array of doubles with Pleasure at index 0, Arousal at index [1] and Dominance at index [2].
	'''
	def getPADState(self, useGain):
		PAD=[0, 0, 0]
		for i in range(len(self.internalState)):
			PAD[0] += self.internalState[i].intensity*self.mapPAD[self.internalState[i].name][0]
			PAD[1] += self.internalState[i].intensity*self.mapPAD[self.internalState[i].name][1]
			PAD[2] += self.internalState[i].intensity*self.mapPAD[self.internalState[i].name][2]
		if useGain:
			PAD[0] = self.gain*PAD[0]/(self.gain*PAD[0]+1) if PAD[0]>=0 else -self.gain*PAD[0]/(self.gain*PAD[0]-1)
			PAD[1] = self.gain*PAD[1]/(self.gain*PAD[1]+1) if PAD[1]>=0 else -self.gain*PAD[1]/(self.gain*PAD[1]-1)
			PAD[2] = self.gain*PAD[2]/(self.gain*PAD[2]+1) if PAD[2]>=0 else -self.gain*PAD[2]/(self.gain*PAD[2]-1)
			return PAD
		else:
			return PAD
 
	'''
	This function prints to the console either the state as is (gain=false) or a state based on gained limiter (limited between 0 and 1), of which the gain can be set by using setGain(gain).
	A high gain factor works well when appraisals are small and rare, and you want to see the effect of these appraisals
	A low gain factor (close to 0 but in any case below 1) works well for high frequency and/or large appraisals, so that the effect of these is dampened.
	@method gamygdala.Agent.printEmotionalState
	@param {boolean} useGain Whether to use the gain function or not.
	'''
	def printEmotionalState(self, useGain):
		output = self.name + ' feels '
		emotionalState=self.getEmotionalState(useGain)
		k = 0
		for i in range(len(emotionalState)):
			k += 1
			output+=emotionalState[i].name+" : "+str(emotionalState[i].intensity)+", "
		if k>0:
			print(output)
	'''
	Sets the relation this agent has with the agent defined by agentName. If the relation does not exist, it will be created, otherwise it will be updated.
	@method gamygdala.Agent.updateRelation
	@param {String} agentName The agent who is the target of the relation.
	@param {double} like The relation (between -1 and 1).
	'''
	def updateRelation(self, agentName, like):
		if not self.hasRelationWith(agentName):
			#This relation does not exist, just add it.
			self.currentRelations.append(Relation(agentName,like))   
		else:
			#The relation already exists, update it.
			for i in range(len(self.currentRelations)):
				if self.currentRelations[i].agentName == agentName:
					self.currentRelations[i].like = like

	'''
	Checks if this agent has a relation with the agent defined by agentName.
	@method gamygdala.Agent.hasRelationWith
	@param {String} agentName The agent who is the target of the relation.
	@param {boolean} True if the relation exists, otherwise false.
	'''
	def hasRelationWith(self, agentName):
		return self.getRelation(agentName) is not None

	'''
	Returns the relation object this agent has with the agent defined by agentName.
	@method gamygdala.Agent.getRelation
	@param {String} agentName The agent who is the target of the relation.
	@param {gamygdala.Relation} The relation object or null if non existing.
	'''
	def getRelation(self, agentName):
		for i in range(len(self.currentRelations)):
			if self.currentRelations[i].agentName == agentName:
				return self.currentRelations[i]    
		return None


	'''
	Returns the relation object this agent has with the agent defined by agentName.
	@method gamygdala.Agent.printRelations
	@param {String} [agentName] The agent who is the target of the relation will only be printed, or when omitted all relations are printed.
	'''
	def printRelations(self, agentName):
		output = self.name + ' has the following sentiments:\n   '
		found=False
		for i in range(len(self.currentRelations)):
			if agentName is not None or self.currentRelations[i].agentName == agentName:
				for j in range(len(self.currentRelations[i].emotionList)):
					output += self.currentRelations[i].emotionList[j].name + '(' + self.currentRelations[i].emotionList[j].intensity+') ' 
					found = True
			output += ' for ' + self.currentRelations[i].agentName
			if i < len(self.currentRelations)-1:
				output+=', and\n   '
		if found:
			print(output)

	'''
	This method decays the emotional state and relations according to the decay factor and function defined in gamygdala. 
	Typically this is called automatically when you use startDecay() in Gamygdala, but you can use it yourself if you want to manage the timing.
	This function is keeping track of the millis passed since the last call, and will (try to) keep the decay close to the desired decay factor, regardless the time passed
	So you can call this any time you want (or, e.g., have the game loop call it, or have e.g., Phaser call it in the plugin update, which is default now).
	Further, if you want to tweak the emotional intensity decay of individual agents, you should tweak the decayFactor per agent not the "frame rate" of the decay (as this doesn't change the rate).
	@method gamygdala.decayAll
	@param {gamygdala} gamygdalaInstance A reference to the correct gamygdala instance that contains the decayFunction property to be used )(so you could use different gamygdala instances to manage different groups of  agents)
	'''
	def decay(self, gamygdalaInstance):
		for i in range(len(self.internalState)):
			newIntensity=gamygdalaInstance.decayFunction(self.internalState[i].intensity)
			if newIntensity < 0:
				self.internalState.pop(i)
			else:
				self.internalState[i].intensity = newIntensity
		for i in range(len(self.currentRelations)):
			self.currentRelations[i].decay(gamygdalaInstance)