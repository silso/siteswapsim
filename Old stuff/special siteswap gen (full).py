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

def generate(n, a):
    if n == 1:
        global count
        #prints progress every 10000 counts
        if not count % 10000:
            print(count / TOTAL)
        count += 1
        #tests each generated perm with N appended, then doubled up
        test((a + [N]) + (a + [N]))
        return a
    else:
        for i in range(0, n):
            generate(n - 1, a)
            if n % 2 == 0:
                a[i], a[n - 1] = a[n - 1], a[i]
            else:
                a[0], a[n - 1] = a[n - 1], a[0]

def test(b):
    n = len(b)
    #will be true when a subsequence of a divides into n + 1
    bad = False
    #array that records how many throws land in the index
    arrayOfGoodness = [0] * n
    for i in range(0, N):
        #add a 1 to index where the ball thrown lands
        arrayOfGoodness[(i + b[i]) % (N)] += 1
        
    for i in range(1, N):
        if arrayOfGoodness[i] == 0:
            bad = bool(b[i])
        elif arrayOfGoodness[i] > 1:
            bad = True
        if bad:
            break
    
    if not bad:
        for i in range(0, n):
            if b[i] == 1:
                #append half of siteswap to array, starting at the 1 throw
                validSiteswaps.append(b[i:(N + i)])
                loopTest(b[i:])
                break
            
def loopTest(b):
    n = len(b)
    #array of loops
    loopNums = [[]]
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
                    loopNums.append([])
                    break
                else:
                    #add num to the loop
                    loopNums[loopNum].append(b[curTest])
                    tested[curTest] = 1
                    curTest = (curTest + b[curTest]) % N
                
    SiteswapLoops.append(loopNums)

while True:
    N = int(input('n='))
    if N % 2:
        count = 0
        #number of perms
        TOTAL = math.factorial(N - 1)
        #will have valid loops
        validSiteswaps = []
        SiteswapLoops = []
        #generates perms of length N - 2
        generate(N - 1, list(range(1, N)))
        #finished checking
        print(1.0)
        #turns loops into siteswaps
        siteswaps = validSiteswaps
        print('\n', end='')
        print(len(siteswaps), 'siteswaps:')
        letters = dict(enumerate(string.ascii_lowercase))
        for i, r in enumerate(siteswaps):
            for num in r:
                if num > 9:
                    print(letters[num - 10], end='')
                else:
                    print(num, end='')
            print('\n', end='')
            print('    ', end='')
            for loop in range(0, len(SiteswapLoops[i]) - 1):
                for num in SiteswapLoops[i][loop]:
                    print(num, end='')
                if not loop == len(SiteswapLoops[i]) - 2:
                    print(', ', end='')
            print('\n', end='')
            
    else:
        print('n isn\'t odd')
