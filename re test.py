import re

TOSS = "(\d|[a-w])"
MULTIPLEX = "\[((\d|[a-w])x?)+\]"
SYNC = "\((("+TOSS+"x?)|"+MULTIPLEX+"),(("+TOSS+"x?)|"+MULTIPLEX+")\)"
BEAT = re.compile("(^("+TOSS+"|"+MULTIPLEX+")+$)|(^("+SYNC+")+$)")

while True:
    s = input('site?:')
    print(bool(BEAT.match(s)))
