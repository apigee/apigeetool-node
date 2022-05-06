
#!/bin/sh

printf "Starting CI presubmit\n"

(docker build -t apigeetool-test .)
testStatus=$?

# printf "npm version %s\n" $(npm -v)
# printf "node version %s\n" $(node -v)
# 
# BUILDROOT=${BUILDROOT:-github/apigeetool-node}
# 
# (cd $BUILDROOT; npm install && npm test)
# testStatus=$?

exit ${testStatus}
