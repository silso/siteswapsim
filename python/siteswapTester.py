from siteswapClass import siteswap

while True:
    swapString = input('siteswap?: ')
    if swapString == '':
        continue
    swap = siteswap(swapString)
    if swap.isValid():
        print('Valid siteswap: ', end='')
        if swap.isMultiplex():
            print('M', end='')
        if swap.isSync():
            print('S', end='')
        print()
        print('   loops: ', end='')
        swap.printLoops()
        print('   loop time: ', end='')
        swap.printLoopTime()
        print('   Siteswap array: ', end='')
        swap.printArray()
        swap.printSite()
    else:
        print('Invalid siteswap: ', end='')
        if swap.isMultiplex():
            print('M', end='')
        if swap.isSync():
            print('S', end='')
        print('\n   Siteswap array: ', end='')
        swap.printArray()
