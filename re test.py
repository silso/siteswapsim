import re

TOSS = '(\d|[a-w])'
MULTIPLEX = '\[((\d|[a-w])x?)+\]'
SYNC = '\((('+TOSS+'x?)|'+MULTIPLEX+'),(('+TOSS+'x?)|'+MULTIPLEX+')\)'
BEAT = re.compile('(^('+TOSS+'|'+MULTIPLEX+')+$)|(^('+SYNC+')+$)')

while True:
    s = input('site?:')
    if s == '':
        continue
    if s[-1] == '*':
        BEAT = re.compile('(('+SYNC+')+$)')
        valid = bool(BEAT.match(s[:-1]))
    else:
        BEAT = re.compile('(('+TOSS+'|'+MULTIPLEX+')+$)|(('+SYNC+')+$)')
        valid = bool(BEAT.match(s))
    print(valid)
