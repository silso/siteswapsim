#Alexander Roelofs
#2017/11/10

#Includes functions for class siteswap

import string
from fractions import gcd
import re
import math

##SITESWAP TRANSLATOR
def siteswapTranslator(site):
    """takes in siteswap in string form, returns siteswap in array form,
    along with the siteswaps multiplexity, syncronicity, and validity"""

    #vars
    siteStr = str(site.replace(' ', '')) #remove spaces
    siteArr = []
    multiplex = False
    sync = False
    valid = True

    ##SYNTAX CHECKER
    #Stolen from gunswap.co
    TOSS = '(\d|[a-w])'
    MULTIPLEX = '\[(\d|[a-w])+\]'
    SYNCMULTIPLEX = '\[((\d|[a-w])x?)+\]'
    SYNC = '\((('+TOSS+'x?)|'+SYNCMULTIPLEX+'),(('+TOSS+'x?)|'+SYNCMULTIPLEX+')\)'
    if site[-1] == '*': #'*' only allowed with sync patterns
        BEAT = re.compile('('+SYNC+')+$')
        valid = bool(BEAT.match(site[:-1]))
    else:
        BEAT = re.compile('(('+TOSS+'|'+MULTIPLEX+')+$)|(('+SYNC+')+$)')
        valid = bool(BEAT.match(site))
    if not valid:
        return siteArr, multiplex, sync, valid

    if siteStr[0] == '(':
        sync = True
    
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

    ##TRANSLATOR
    #this numbers lcase letters, putting them into dict with letters before nums
    letters = {y:x for x,y in dict(enumerate(string.ascii_lowercase[:23])).items()}
    i = 0 #index in str array
    while i < len(siteStr):
        char = siteStr[i]

        ##SYNC
        if char == '(' or char == ',' or char == ')': #skips formatting stuff
            i += 1
            continue
        if sync and siteStr[i + 1] == 'x': #check for crossing throws
            if siteStr[i - 1] == '(':
                add = 1 #when its the first num
            else:
                add = -1
        else:
            add = 0

        ##VANILLA
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

def repeatRemover(site):
    """takes in siteswap array, returns reduced siteswap array"""

    newSite = site
    for i in range(1, math.floor(len(site) / 2) + 1):
        sequence = site[0:i]
        
        k = i #index after sequence being checked
        while k < len(site) - i + 1: #loops until sequence cant fit
            if sequence == site[k:k + i]:
                k += i
                continue
            break
        else:
            newSite = site[0:i]
            break
        
    return newSite

def siteswapTest(site):
    """takes in siteswap array, returns the throw-based validity of the pattern"""
    
    siteLen = len(site)
    valid = True
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
    """takes in siteswap array, returns an array of the loops that balls follow"""

    if True: #make this section good
        #when you shift a multiplex pattern over, it should have the same loops
        siteLen = len(site)
        loops = [[]] #array of loops
        loopNum = 0 #index where next loop goes in loops
        timesToTest = [0] * siteLen #how many throws on this beat must be tested
        timesTested = [0] * siteLen #how many throws on this beat have already been tested

        for i in range(0, siteLen):
            if isinstance(site[i], list): 
                timesToTest[i] = len(site[i]) #multiplex throw
            else:
                timesToTest[i] = 1 #vanilla throw
                
        i = 0
        while i < siteLen:
            if not timesToTest[i] == timesTested[i] and site[i]:
                firstTime = True
                startLoc = -1
                curTest = i
                while True:
                    if timesTested[curTest] == timesToTest[curTest] or curTest == startLoc and not firstTime:
                        loopNum += 1
                        loops.append([])
                        i -= 1 #this makes sure we stay at the same spot
                        break
                    else:
                        #add num to the loop
                        if isinstance(site[curTest], list):
                            if firstTime:
                                startLoc = curTest
                                firstTime = False
                            loops[loopNum].append(site[curTest][timesTested[curTest]])
                            timesTested[curTest] += 1
                            curTest = (curTest + site[curTest][timesTested[curTest] - 1]) % siteLen
                        else:
                            loops[loopNum].append(site[curTest])
                            timesTested[curTest] += 1
                            curTest = (curTest + site[curTest]) % siteLen
            i += 1

    else: #bad but working method
        siteLen = len(site)
        loops = [[]] #array of loops
        loopNum = 0 #index where next loop goes in loops
        timesToTest = [0] * siteLen #how many throws on this beat must be tested
        timesTested = [0] * siteLen #how many throws on this beat have already been tested

        for i in range(0, siteLen):
            if isinstance(site[i], list): 
                timesToTest[i] = len(site[i]) #multiplex throw
            else:
                timesToTest[i] = 1 #vanilla throw
                
        i = 0
        while i < siteLen:
            if not timesToTest[i] == timesTested[i] and site[i]:
                curTest = i
                while True:
                    if timesTested[curTest] == timesToTest[curTest]:
                        loopNum += 1
                        loops.append([])
                        #i -= 1 #this makes sure we stay at the same spot
                        break
                    else:
                        #add num to the loop
                        if isinstance(site[i], list):
                            loops[loopNum].append(site[curTest][timesTested[curTest]])
                            timesTested[curTest] += 1
                            curTest = (curTest + site[curTest][timesTested[curTest] - 1]) % siteLen
                        else:
                            loops[loopNum].append(site[curTest])
                            timesTested[curTest] += 1
                            curTest = (curTest + site[curTest]) % siteLen
            i += 1
                

    return loops[:len(loops) - 1]

def loopTime(loops):
    """return how long the pattern takes to repeat"""
    
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
