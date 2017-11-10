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
        if siteStr[-1] == '*':
            newStr = siteStr[:-1]
            j = 0
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
        print(newStr)
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
