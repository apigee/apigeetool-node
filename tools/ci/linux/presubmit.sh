
#!/bin/sh

BUILDROOT=${BUILDROOT:-github/apigeetool-node}

(cd $BUILDROOT; npm test)
testStatus=$?

exit ${testStatus}
