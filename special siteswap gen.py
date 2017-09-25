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
        #tests each generated perm with N - 1 appended, then doubled up
        test(N, (a + [N - 1]) + (a + [N - 1]))
        return a
    else:
        for i in range(0, n):
            generate(n - 1, a)
            if n % 2 == 0:
                a[i], a[n - 1] = a[n - 1], a[i]
            else:
                a[0], a[n - 1] = a[n - 1], a[0]

def test(loopLength, b):
    n = len(b)
    #will be true when a subsequence of a divides into n + 1
    bad = False
    #goes from the start to the penultimate
    for i in range(0, n - 2):
        #goes from second to one after end
        for j in range(i + 2, n):
            #i and j encompass all 2+ long subsequences of b
            if sum(b[i:j]) % (loopLength) == 0:
                #ignores subsequences of length 0 and greater than the "generate" sequence length
                if 0 < j - i < loopLength - 1:
                    #print('bad: b[', i, ':', j, '] = ', b[i:j], ', sum = ', sum(b[i:j]), ', j-i = ', j - i, sep='')
                    bad = True
    if not bad:
        validLoops.append(b)

def siteswap(d):
    result = []
    for s in d:
        #siteswap
        ss = []
        #create empty lists of length N
        for i in range(1, N + 1):
            ss.append(0)
        #places each number of the valid loop in it's appropriate position in siteswap
        for i, num in enumerate(s):
            pos = sum(s[0:i]) % N
            ss[pos] = num
        #places N in the last spot where a 0 is
        ss[ss.index(0)] = N
        #puts the 1 first
        ss = ss[ss.index(1):] + ss[:ss.index(1)]
        result.append(ss)
    return result

while True:
    N = int(input('n='))
    if N % 2:
        count = 0
        #number of perms
        TOTAL = math.factorial(N - 2)
        #will have valid loops
        validLoops = []
        #generates perms of length N - 2
        generate(N - 2, list(range(1, N - 1)))
        #finished checking
        print(1.0)
        #turns loops into siteswaps
        siteswaps = siteswap(validLoops)
        print('\n', end='')
        print(len(siteswaps), 'siteswaps:')
##        letters = dict(enumerate(string.ascii_lowercase))
##        for r in siteswaps:
##            for num in r:
##                if num > 9:
##                    print(letters[num - 10], end='')
##                else:
##                    print(num, end='')
##            print('\n', end='')
    else:
        print('n isn\'t odd')
