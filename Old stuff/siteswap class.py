import random
import string
import math

class siteswap:
    def __init__(self, site):
        self.__site = []
        self.__valid = True
        #self.__loops = [[]]
        #self.__numOfLoops = int
        
        #this thing numbers the lowercase letters, but puts them into a dictionary
            #with letters before numbers
        letters = {y:x for x,y in dict(enumerate(string.ascii_lowercase)).items()}
        for i in site:
            if i.isdigit():
                self.__site += [int(i)]
            elif i in letters:
                self.__site += [10 + letters[i]]
            else:
                self.__valid = False
        
        def test():
            #siteswap is doubled up so we can have throws land on the second loop
            siteswap = self.__site + self.__site
            siteLen = len(self.__site)
            valid = True
            #array that records how many throws land in the index
            arrayOfGoodness = [0] * len(siteswap)
            for i in range(0, siteLen):
                #add a 1 to index where the ball thrown lands
                arrayOfGoodness[(i + int(siteswap[i])) % siteLen] += 1
                
            for i in range(1, siteLen):
                if arrayOfGoodness[i] == 0:
                    valid = not bool(siteswap[i])
                elif arrayOfGoodness[i] > 1:
                    valid = False
                    
            return valid

        def loopFinder():
            siteLen = len(self.__site)
            #array of loops
            loops = [[]]
            #where to put the next loop
            loopNum = 0
            #array to indicate whether type of throw was listed yet
            tested = [0] * siteLen
            for i in range(0, siteLen):
                if not tested[i]:
                    curTest = i
                    looping = True
                    while looping:
                        if tested[curTest]:
                            loopNum += 1
                            loops.append([])
                            break
                        else:
                            #add num to the loop
                            loops[loopNum].append(self.__site[curTest])
                            tested[curTest] = 1
                            curTest = (curTest + int(self.__site[curTest])) % siteLen
                        
            return loops[:len(loops) - 1]

        if self.__valid:
            if test():
                self.__loops = loopFinder() #array of loops (which are arrays)
                self.__numOfLoops = len(self.__loops)
            else:
                self.__valid = False
                self.__loops = None
                self.__numOfLoops = None
        else:
            self.__loops = None
            self.__numOfLoops = None

    def print(self):
        letters = dict(enumerate(string.ascii_lowercase))
        for num in self.__site:
            if num > 9:
                print(letters[num - 10], end='')
            else:
                print(num, end='')
        print('\n', end='')

    def printLoops(self):
        if self.__valid:
            letters = dict(enumerate(string.ascii_lowercase))
            for loop in range(0, self.__numOfLoops):
                for num in self.__loops[loop]:
                    if num > 9:
                        print(letters[num - 10], end='')
                    else:
                        print(num, end='')
                if loop < self.__numOfLoops - 1:
                    print(', ', end='')
            print('\n', end='')
        else:
            print("Not a valid siteswap!")

    def isValid(self):
        return self.__valid

while True:
    swap = siteswap(input("siteswap?: "))
    print("Validity: ", swap.isValid())
    print("loops: ", end='')
    swap.printLoops()
