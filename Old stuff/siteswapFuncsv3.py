#Alexander Roelofs
#2017/11/9

import string
from fractions import gcd
import re

##SITESWAP TRANSLATOR
def siteswapTranslator(site):
    siteStr = str(site.replace(' ', '')) #remove spaces
    siteArr = []
    multiplex = False
    sync = False
    valid = True


    ##SYNTAX CHECKER
    ##Stolen from gunswap.co
    TOSS = '(\d|[a-w])'
    MULTIPLEX = '\[((\d|[a-w])x?)+\]'
    SYNC = '\((('+TOSS+'x?)|'+MULTIPLEX+'),(('+TOSS+'x?)|'+MULTIPLEX+')\)'
    BEAT = re.compile('(^('+TOSS+'|'+MULTIPLEX+')+$)|(^('+SYNC+')+$)')

    if site[-1] == '*':
        valid = bool(BEAT.match(site[:-1]))
    else:
        valid = bool(BEAT.match(site))
    if not valid:
        return siteArr, multiplex, sync, valid


    #this thing numbers the lowercase letters, but puts them into a dictionary with letters before numbers
    letters = {y:x for x,y in dict(enumerate(string.ascii_lowercase[:22])).items()}

    if siteStr[0] == '(':
        sync = True

    ##TRANSLATOR
    i = 0 #index in str array
    while i < len(siteStr):
        ##STAR GET-RID-OF'R
        if siteStr[-1] == '*':
            newStr = siteStr[:-1]
            j = 0
            #loop copies the leftsides and puts them on the right
            while j < len(siteStr) - 1:
                j += 1 #skip '('
                newStr += '('
                leftSide = ''
                while not siteStr[j] == ',':
                    leftSide += siteStr[j]
                    j += 1
                j += 1 #skip ','
                while not siteStr[j] == ')':
                    newStr += siteStr[j]
                    j += 1
                newStr += ','
                newStr += leftSide
                newStr += ')'
                j += 1 #skip ')'
            siteStr = newStr

        
        char = siteStr[i]
        if char == '(' or char == ',' or char == ')': #skips sync stuff
            i += 1
            continue

        #check for crossing throws
        if sync and siteStr[i + 1] == 'x': #when crossing, num is made odd
            if siteStr[i - 1] == '(':
                add = 1
            else:
                add = -1
        else:
            add = 0
        
        if char.isdigit():
            siteArr += [int(char) + add]
        elif siteStr[i] in letters:
            siteArr += [10 + letters[char] + add]

        ##MULTIPLEX
        elif char == '[':
            multiplex = True
            siteArr.append([])

            multiplexStart = i #only used for sync 'x's
            add = 0 #this makes the num with the x odd to cross to other hand

            i += 1
            while i < len(siteStr): #goes through multiplex
                char = siteStr[i]
                if char == ']': #end multiplex
                    break
                
                if sync and siteStr[i + 1] == 'x': #when crossing, num is made odd
                    if siteStr[multiplexStart - 1] == '(':
                        add = 1
                    else:
                        add = -1
                else:
                    add = 0
                
                if char.isdigit():
                    siteArr[len(siteArr) - 1] += [int(char) + add]
                elif siteStr[i] in letters:
                    siteArr[len(siteArr) - 1] += [10 + letters[char] + add]
                i += 1
        elif char == '*':
            pass
        
        i += 1
        
    return siteArr, multiplex, sync, valid

#tests whether throws are valid
def siteswapTest(site, multiplex):
    siteLen = len(site)
    valid = True
    #array that records how many throws land in the index
    corrCatches = [0] * siteLen #how many should land in each index
    actualCatches = [0] * siteLen #how many actually land in each index
    for i in range(0, siteLen): #this loop builds corrCatches array
        if isinstance(site[i], list): 
            corrCatches[i] = len(site[i]) #amt of lands = amt of throws
        else:
            corrCatches[i] = 1 #this is even for 0 case since "throw" lands in same spot
    for i in range(0, siteLen): #this loop builds actualCatches array
        #add a 1 to index where the ball thrown lands
        if isinstance(site[i], list):
            for j in range(0, len(site[i])):
                actualCatches[(i + site[i][j]) % siteLen] += 1
        else:
            actualCatches[(i + site[i]) % siteLen] += 1
    for i in range(1, siteLen): #this loop compares corrCatches and actualCatches
        if valid:
            valid = corrCatches[i] == actualCatches[i]
            
    return valid

#finds loops
def loopFinder(site):
    siteLen = len(site)
    loops = [[]] #array of loops
    loopNum = 0 #index where next loop goes in loops
    for i in range(0, siteLen): #build array of 0's that matches site
        if isinstance(site[i], list): 
            tested[i] = [0] * len(site[i]) #multiplex throw
        else:
            tested[i] = 0 #vanilla throw

    print(timesToTest)
    print(site)
    i = 0
    while i < siteLen:
        print("i = ", i)
        if isinstance(site[i], list):
##            for j in range(0,len(site[i])):
                if not tested[i][j] and site[i][j]:
                    curTest = (i,j)
                    while True:
                        if tested[curTest[0]][curTest[1]]:
                            print("innere")
                            loopNum += 1
                            loops.append([])
                            #i -= 1 #this makes sure we stay at the same spot
                            break
                        else:
                            #add num to the loop
                            if isinstance(site[i], list):
                                loops[loopNum].append(site[curTest[0]][curTest[1]])
                                tested[curTest[0]][curTest[1]] = 1
                                curTest[0] = (curTest[0] + site[curTest[0]][curTest[1]]) % siteLen
                                if isinstance(site[curTest[0]], list):
                                    for k in range(0,len(site[curTest[0]])):
                                        if not tested[0][k]:
                                            curTest[j] = k
                                else:
                                    curTest[j] = 0
                            else:
                                loops[loopNum].append(site[curTest])
                                timesTested[curTest] += 1
                                curTest = (curTest + site[curTest]) % siteLen
                        print(timesTested)
                        print(loops)
        i += 1
                
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
