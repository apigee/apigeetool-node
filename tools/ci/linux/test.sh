#!/bin/sh

npm -v
node -v


BUILDROOT=${BUILDROOT:-github/apigeetool-node}
CREDENTIAL_FILE="$KOKORO_KEYSTORE_DIR/72809_apigeetool_ci_testconfig"

if [ -f $CREDENTIAL_FILE ]; then
    cp $CREDENTIAL_FILE $BUILDROOT/remotetests/testconfig.js
fi

ls -l $BUILDROOT/remotetests

(cd $BUILDROOT; npm install && npm test && npm run remotetest)
testStatus=$?

if [ -d ./sponge-logs ]
then
  rm -rf ./sponge-logs
fi
mkdir ./sponge-logs

for n in ${BUILDROOT}/*/target/surefire-reports/TEST-*.xml
do
  bn=`basename $n .xml`
  mv $n ./sponge-logs/${bn}_sponge_log.xml
done

exit ${testStatus}
