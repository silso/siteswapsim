import string
from siteswapFuncs import *

class siteswap:
    def __init__(self, site):

        self.__siteStr = site
        self.__site = []
        self.__valid = True
        self.__loops = None
        self.__numOfLoops = None
        self.__loopTime = None
        self.__multiplex = False
        self.__sync = False

        #convert siteswap string to an array, also tests formatting
        self.__site, self.__multiplex, self.__sync, self.__valid = \
        siteswapTranslator(site)

        #if pattern is redundant, reduce the pattern
        self.__site = repeatRemover(self.__site)

        if self.__valid:
            self.__valid = siteswapTest(self.__site) #will be false when throws are bad

        if self.__valid:
            #if not self.__multiplex and not self.__sync:
                self.__loops = loopFinder(self.__site) #array of loops (which are arrays)
                self.__numOfLoops = len(self.__loops)
                self.__loopTime = loopTime(self.__loops)

    def printSite(self):
        if not self.__valid:
            print('What you typed: ', self.__siteStr)
        else:
            letters = dict(enumerate(string.ascii_lowercase))
            if self.__sync: #print sync
                if len(self.__site) < 2:
                    tempSite = 2 * self.__site
                else:
                    tempSite = self.__site
                for i in range(0, len(tempSite)):
                    num = tempSite[i]
                    if not i % 2:
                        print('(', end='')
                    if isinstance(num, list):
                        print('[', end='')
                        for thisNum in num:
                            if thisNum > 9:
                                print(letters[thisNum - 10], end='')
                            else:
                                print(thisNum, end='')
                        print(']', end='')
                    else:
                        if num > 9:
                            print(letters[num - 10], end='')
                        else:
                            print(num, end='')
                    if not i % 2:
                        print(',', end='')
                    else:
                        print(')', end='')
            else: #print async
                for num in self.__site:
                    if isinstance(num, list):
                        print('[', end='')
                        for thisNum in num:
                            if thisNum > 9:
                                print(letters[thisNum - 10], end='')
                            else:
                                print(thisNum, end='')
                        print(']', end='')
                    else:
                        if num > 9:
                            print(letters[num - 10], end='')
                        else:
                            print(num, end='')
                print('\n', end='')

    def printLoops(self):
        if self.__valid:
            if self.__loops == None:
                print(None)
            else:
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
            print('Not a valid siteswap!')

    def printArray(self):
        print(self.__site)
    def printLoopTime(self):
        print(self.__loopTime)
    def isValid(self):
        return self.__valid
    def isMultiplex(self):
        return self.__multiplex
    def isSync(self):
        return self.__sync
