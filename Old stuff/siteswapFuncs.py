import string
from fractions import gcd

#tests whether formatting is valid
def siteswapTranslator(site):
    siteStr = str(site.replace(' ', '')) #remove spaces
    siteArr = []
    multiplex = False
    sync = False
    valid = True
    #this thing numbers the lowercase letters, but puts them into a dictionary with letters before numbers
    letters = {y:x for x,y in dict(enumerate(string.ascii_lowercase[:22])).items()}

    #"i" is index in str array
    if siteStr[0] == '(': #sync
        corrChar = 0 #0 is (, 1 is num, 2 is comma, 3 is sec num, 4 is )
        corrChars = {0:'(', 2:',', 4:')'}
        
        for i in range(0, len(siteStr)):
            if siteStr[i] in corrChars.values() or siteStr[i] % 2:
                valid = False
                break
            if siteStr[i] == 'x':
                if i == 0:
                    valid = False
                    break
                if siteStr[i - 1].isdigit() or siteStr[i - 1] in letters:
                    siteStr[i - 1] += 1
        sync = True
        i = 0
        while i < len(siteStr):
            char = siteStr[i]
            if corrChar == 0 or corrChar == 2 or corrChar == 4:
                if char == corrChars[corrChar]: #checks when i is standard sync char
                    corrChar = (corrChar + 1) % 5 #goes to what next sync char should be
                elif char == 'x':
                    i += 1
                    continue
                else:
                    valid = False
                    break
            
            else: #when it is an actual throw
                if char.isdigit():
                    siteArr += [int(char)]
                elif char in letters:
                    siteArr += [10 + letters[char]]
                elif char == '[': #this is a multiplex
                    multiplex = True
                    if i >= len(siteStr) - 1 or siteStr[i + 1] == ']': #if its empty, not legit
                        valid = False
                        break
                    siteArr.append([])
                    i += 1
                    while i < len(siteStr): #goes through multiplex
                        if siteStr[i] == ']': #end multiplex
                            break
                        if siteStr[i].isdigit(): #check for proper value in multiplex
                            siteArr[len(siteArr) - 1] += [int(siteStr[i])]
                        elif siteStr[i] in letters:
                            siteArr[len(siteArr) - 1] += [10 + letters[siteStr[i]]]
                        else:
                            valid = False
                            break
                        i += 1
                    else:
                        valid = False #if no end bracket, bad
                        break
                elif char == 'x':
                    i += 1
                    continue
                else:
                    valid = False
                    break
                corrChar += 1
            i += 1
        if not corrChar == 0: #makes sure last char is )
            valid = False
            
    else: #async
        arrIndex = 0
        i = 0
        while i < len(siteStr):
            char = siteStr[i]
            if char.isdigit():
                siteArr += [int(char)]
            elif char in letters:
                siteArr += [10 + letters[char]]
            elif char == '[':
                multiplex = True
                if i >= len(siteStr) - 1 or siteStr[i + 1] == ']': #if its empty, not legit
                    valid = False
                    break
                siteArr.append([])
                i += 1
                while i < len(siteStr):
                    if siteStr[i] == ']':
                        break
                    if siteStr[i].isdigit(): #check for proper value in multiplex
                        siteArr[len(siteArr) - 1] += [int(siteStr[i])]
                    elif siteStr[i] in letters:
                        siteArr[len(siteArr) - 1] += [10 + letters[siteStr[i]]]
                    else:
                        valid = False
                        break
                    i += 1
                else:
                    valid = False
                    break 
            else:
                valid = False
            i += 1
    return siteArr, multiplex, sync, valid

#tests whether throws are valid
def test(site, multiplex):
    siteLen = len(site)
    valid = True
    #array that records how many throws land in the index
    corrCatches = [0] * siteLen #how many should land in each index
    actualCatches = [0] * siteLen #how many actually land in each index
    for i in range(0, siteLen):
        if isinstance(site[i], list): 
            corrCatches[i] = len(site[i]) #amt of lands = amt of throws
        else:
            corrCatches[i] = 1 #this is even for 0 case since "throw" lands in same spot
    for i in range(0, siteLen): 
        #add a 1 to index where the ball thrown lands
        if isinstance(site[i], list):
            for j in range(0, len(site[i])):
                actualCatches[(i + site[i][j]) % siteLen] += 1
        else:
            actualCatches[(i + site[i]) % siteLen] += 1
    for i in range(1, siteLen):
        if valid:
            valid = corrCatches[i] == actualCatches[i]
            
    return valid

#finds loops
def loopFinder(site):
    siteLen = len(site)
    #array of loops
    loops = [[]]
    #where to put the next loop
    loopNum = 0
    #array to indicate whether type of throw was listed yet
    tested = [0] * siteLen
    for i in range(0, siteLen):
        if not tested[i] and site[i]:
            curTest = i
            looping = True
            while looping:
                if tested[curTest]:
                    loopNum += 1
                    loops.append([])
                    break
                else:
                    #add num to the loop
                    loops[loopNum].append(site[curTest])
                    tested[curTest] = 1
                    curTest = (curTest + site[curTest]) % siteLen
                
    return loops[:len(loops) - 1]

#find how long the pattern takes to repeat
def loopTime(loops):
    loopTimes = []
    for loop in loops:
        singleLoopTime = 0
        for throw in loop:
            singleLoopTime += throw
        if singleLoopTime % 2:
            singleLoopTime *= 2
        loopTimes += [singleLoopTime]
    lcm = loopTimes[0]
    for i in loopTimes:
        lcm = lcm * i / gcd(lcm, i)
    return int(lcm)
