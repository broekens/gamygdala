from gamygdala import  concepts, agent

goal = concepts.Goal('G', 1.0)
agent = agent.Agent('EmoCha')
agent.setGain(20.0)

agent.addGoal(goal)
assert agent.getGoalByName('G').name == 'G', 'Error: agent.getGoalByName is incorrect'

agent.removeGoal(goal.name)
assert len(agent.goals)  == 0, 'Error: agent.removeGoal is incorrect'
agent.setGain(20)
agent.addGoal(goal)
print(agent.getPADState(True))

