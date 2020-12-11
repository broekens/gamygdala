from gamygdala.engines import Gamygdala

engine = Gamygdala()
engine.debug = True
agent1 = engine.createAgent("EmoCha")
assert agent1.name == "EmoCha", "Error: engine.createAgent fail!!!"

goal = engine.createGoalForAgent("EmoCha", "GetGold", 1.0, False)
assert goal is not None, "Error: engine.createGoalForAgent fail"
engine.createRelation(agent1.name, agent1.name, 1.0)
engine.appraiseBelief(1.0, agent1.name, ["GetGold"], [1])
engine.startDecay(0.09)
engine.printAllEmotions()
print("end.")