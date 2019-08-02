#!/bin/bash

#( printf '\n'; printf '%.0s-' {1..30}; printf ' Static Code Analysis '; printf '%.0s-' {1..30}; printf '\n\n' )

COMPONENT_NAME=$1
VERSION_NAME=$2
ART_URL=$3
ART_REPO_ID=$4
ART_REPO_USER=$5
ART_REPO_PASSWORD=$6
ART_REPO_ZIP_FOLDER=asoc
ART_REPO_ZIP_FILE=SAClientUtil_7.0.1313_linux.zip

# Download ASoC CLI
curl -Lk --noproxy $NO_PROXY --insecure -u $ART_REPO_USER:$ART_REPO_PASSWORD "$ART_URL/$ART_REPO_ID/$ART_REPO_ZIP_FOLDER/$ART_REPO_ZIP_FILE" -o SAClientUtil.zip

# Unzip ASoC CLI
unzip SAClientUtil.zip
rm -f SAClientUtil.zip
SAC_DIR=`ls -d SAClientUtil*`
mv $SAC_DIR SAClientUtil

# Compile Source
mvn compile dependency:copy-dependencies

# Check JAVA_HOME is set
echo "JAVA_HOME=$JAVA_HOME"

# Create appscan-config.xml
cat >> appscan-config.xml <<EOL
import groovy.xml.MarkupBuilder
import groovy.io.FileType

def filesDependecies = ""

def pathDependencies = new File("target/dependency")
pathDependencies.eachFileRecurse(FileType.FILES) {
    file ->
        filesDependecies = filesDependecies + ";" + file
}
filesDependecies = filesDependecies.replace("\\", "/")

File dir = new File("asoc");
if (!dir.exists()) dir.mkdirs();
def fileASoCConfig = new FileWriter("appscan-config.xml")
def xmlASoC = new MarkupBuilder(fileASoCConfig)

xmlASoC.mkp.xmlDeclaration(version: "1.0", encoding: "UTF-8", standalone: "no")
xmlASoC.Configuration {
    Targets {
        Target(path: "target/classes") {
            Exclude('*.jar')
            CustomBuildInfo(jdk_path: "$JAVA_HOME}", src_root: 'src/main/java;src/main/resources;src/test/java', additional_classpath: filesDependecies + ";" + "target/classes") {}
        }
    }

}
fileASoCConfig.close();
EOL

# Generate IRX file
SAClientUtil/bin/appscan.sh prepare -n $COMPONENT_NAME_$VERSION_NAME.irx

# Start Static Analyzer ASoC Scan
#ASOC_AppID=fab9f46c-0a5a-421d-8b6a-82130b2a3e61
#ASOC_LoginKeyID=cd758f0c-6319-2e0f-567a-36a0a3e4de93
#ASOC_LoginSecret=i0HEBAZ4AOK9ZXiXsD0GGiIClWVzsGDiVgLKR4dK0jM=

#scanId=line.split('scanId=')[1].split(' ,')[0];
ASOC_Scan_ID=xxx

# Download ASoC report
SAClientUtil/bin/appscan.sh get_result -d ASOC_Scan_Results_$COMPONENT_NAME_$VERSION_NAME.html -i $ASOC_Scan_ID

# Upload Scan Results
#ASOC_Scan_Results_$COMPONENT_NAME_$VERSION_NAME.html
