import random
import string
import math

#3      1
#5      2
#7      14
#9      78
#11     838
#13     14416


count = 0

class siteswap:
    def __init__(self, site):
        self.site = site

        def test(b):
            siteswap = b + b
            n = len(siteswap)
            valid = True
            #array that records how many throws land in the index
            arrayOfGoodness = [0] * n
            for i in range(0, N):
                #add a 1 to index where the ball thrown lands
                arrayOfGoodness[(i + siteswap[i]) % (N)] += 1
                
            for i in range(1, N):
                if arrayOfGoodness[i] == 0:
                    valid = not bool(siteswap[i])
                elif arrayOfGoodness[i] > 1:
                    valid = False
                    
            return valid

        def loopFinder(b):
            n = len(b)
            #array of loops
            loops = [[]]
            #where to put the next loop
            loopNum = 0
            #array to indicate whether type of throw was listed yet
            tested = [0] * n
            for i in range(0, N):
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
                            loops[loopNum].append(b[curTest])
                            tested[curTest] = 1
                            curTest = (curTest + b[curTest]) % N
                        
            return loops[:len(loops) - 1]

        self.valid = test(site)
        if self.valid:
            self.loops = loopFinder(site) #array of loops (which are arrays)
            self.numOfLoops = len(self.loops)
        else:
            self.loops = None
            self.numOfLoops = None

    def print(self):
        letters = dict(enumerate(string.ascii_lowercase))
        for num in self.site:
            if num > 9:
                print(letters[num - 10], end='')
            else:
                print(num, end='')
        print('\n', end='')

    def printLoops(self):
        for loop in range(0, self.numOfLoops):
            for num in self.loops[loop]:
                print(num, end='')
            if loop < self.numOfLoops - 1:
                print(', ', end='')
        print('\n', end='')
        

def generate(n, a):
    if n == 1:
        global count
        #prints progress every 10000 counts
        if not count % 10000:
            print(count / TOTAL)
        count += 1

        #create siteswap class
        b = siteswap(a + [N])
        if b.valid:
            validSiteswaps.append(b)
        return a
    else:
        for i in range(0, n):
            generate(n - 1, a)
            if n % 2 == 0:
                a[i], a[n - 1] = a[n - 1], a[i]
            else:
                a[0], a[n - 1] = a[n - 1], a[0]

while True:
    N = int(input('n='))
    if N % 2:
        count = 0
        #number of perms
        TOTAL = math.factorial(N - 1)
        #will have valid loops
        validSiteswaps = []
        #generates perms of length N
        generate(N - 1, list(range(1, N)))
        #finished checking
        print(1.0)
        print('\n', end='')
        print(len(validSiteswaps), 'siteswaps:')
        letters = dict(enumerate(string.ascii_lowercase))
        for i in range(0, len(validSiteswaps)):
            validSiteswaps[i].print()
            print('    ', end='')
            print(validSiteswaps[i].numOfLoops, ' loops: ', end='')
            validSiteswaps[i].printLoops()
            
    else:
        print('n isn\'t odd')
