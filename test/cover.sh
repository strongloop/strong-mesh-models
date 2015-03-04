#!/bin/sh

set -x

for i in `ls test/test*.js`; do
    ./node_modules/.bin/istanbul cover --dir coverage/$i --print tap --timeout=300 $i
done
./node_modules/.bin/istanbul report
