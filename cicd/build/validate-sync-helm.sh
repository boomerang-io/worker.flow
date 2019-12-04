#!/bin/bash

# Reference / Similar code can be found here: https://github.ibm.com/IBMPrivateCloud/content-tools/blob/master/travis-tools/github/bin/package.sh

HELM_REPO_URL=$1
ART_URL=$2
ART_REPO_USER=$3
ART_REPO_PASSWORD=$4

chartStableDir=/data/charts/stable
chartCurrentDir=/data/charts/current
mkdir -p $chartCurrentDir
ls -ltr /data/charts

# Validate charts have correct version
for chartPackage in `ls -1 $chartStableDir/*tgz | rev | cut -f1 -d/ | rev`
do
    echo "Found: $chartPackage"
    
    # Attempt to pull down chart package from Artifactory
    chartName=`echo $chartPackage | sed 's/\(.*\)-.*/\1/'`
    chartVersion=`echo $chartPackage | rev | sed '/\..*\./s/^[^.]*\.//' | cut -d '-' -f 1 | rev`
    
    helm fetch --version $chartVersion --destination $chartCurrentDir boomerang-charts/$chartName
    
    if [ -f $chartStableDir/$chartPackage ]; then
        # If there is an existing file, a check will be made to see if the content of the old tar and new tar are the exact same. 
        # The digest and sha of the tar are not trustworthy when containing tgz files. 
        # The code below will sort the list of files in the tgz, then decompress each file to stdout, passing the content thru sha1sum. 
        # This will produce an order sha sum of the tgz content.
        # Note: on mac replace sha1sum with shasum
        
        ls -al $chartStableDir/$chartPackage
        ls -al $chartCurrentDir/$chartPackage
        
        if [[ `tar tvf $chartStableDir/$chartPackage | rev | cut -f1 -d' ' | rev | sort -k1 | xargs -i tar -xOf $chartStableDir/$chartPackage {} | sha1sum | cut -f1 -d' '` = \
      		      `tar tvf $chartCurrentDir/$chartPackage | rev | cut -f1 -d' ' | rev | sort -k1 | xargs -i tar -xOf $chartCurrentDir/$chartPackage {} | sha1sum | cut -f1 -d' '` ]] ; then
  	        # These files are the same, and can be shipped
			echo "  Previously shipped file."
			rm -f $chartCurrentDir/$chartPackage
        elif [[ `tar tvf $chartStableDir/$chartPackage | rev | cut -f1 -d' ' | rev | sort -k1 | grep -Ev '/charts/|requirements.lock' | xargs -i tar -xOf $chartStableDir/$chartPackage {} | sha1sum | cut -f1 -d' '` = \
      		      `tar tvf $chartCurrentDir/$chartPackage | rev | cut -f1 -d' ' | rev | sort -k1 | grep -Ev '/charts/|requirements.lock' | xargs -i tar -xOf $chartCurrentDir/$chartPackage {} | sha1sum | cut -f1 -d' '` ]] ; then
            echo "  Previously shipped version, with acceptable source change due to subchart version difference."
            rm -f $chartCurrentDir/$chartPackage
        else
            # These files differ, but do not have a version number update
            echo "  ERROR: Same version but different content"
            exit 1
        fi
    else
        echo "  New chart version validated."
        cp $chartStableDir/$chartPackage $chartCurrentDir
    fi
done

# Sync Charts to Artifactory
cd $chartCurrentDir
for filename in *.tgz
do
    if [ -f $filename ]
    then
        echo "Pushing chart package: $filename to $HELM_REPO_URL/$filename"
        curl --insecure -u $ART_REPO_USER:$ART_REPO_PASSWORD -T $filename "$HELM_REPO_URL/$filename"
    fi
done

# Index Charts in Artifactory
HELM_REPO_ID=`echo $HELM_REPO_URL | rev | cut -f1 -d'/' | rev`
curl -u $ART_REPO_USER:$ART_REPO_PASSWORD -X POST "$ART_URL/api/helm/$HELM_REPO_ID-local/reindex"