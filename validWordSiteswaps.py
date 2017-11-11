from siteswapClass import siteswap
import nltk
from nltk.corpus import words
##nltk.download()
for i in range(0, 10000):
    if siteswap(words.words()[i]).isValid():
        print(words.words()[i])
