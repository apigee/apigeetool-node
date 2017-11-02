
#!/bin/sh

echo "Starting"

npm -v
node -v

BUILDROOT=${BUILDROOT:-github/apigeetool-node}

(cd $BUILDROOT; npm install && npm test)
testStatus=$?

exit ${testStatus}
