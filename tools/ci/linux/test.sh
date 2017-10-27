#!/bin/sh

BUILDROOT=${BUILDROOT:-github/apigeetool-node}

(cd $BUILDROOT; npm test)
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
