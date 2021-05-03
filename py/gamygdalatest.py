from gamygdala.engines import Gamygdala
import time

engine = Gamygdala()
engine.debug = True
agent1 = engine.createAgent("EmoCha")
assert agent1.name == "EmoCha", "Error: engine.createAgent fail!!!"

goal = engine.createGoalForAgent("EmoCha", "GetGold", 1.0, False)
assert goal is not None, "Error: engine.createGoalForAgent fail"
engine.startDecay(0.01)
#engine.createRelation(agent1.name, agent1.name, 1.0)
engine.appraiseBelief(0.5, "EmoCha", ["GetGold"], [1], False)
time.sleep(2)
engine.appraiseBelief(0.9, "EmoCha", ["GetGold"], [-1.0])
time.sleep(2)
engine.printAllEmotions()
print("end.")
