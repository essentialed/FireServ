#!/bin/sh

if [ "debug" = "$1" ]; then
    VERSION=`date +"%Y.%m.%d.debug"`
else
    VERSION=`sed -ne '/em:version/{ s/.*>\(.*\)<.*/\1/; p}' install.rdf`
fi

XPI="fireserv-$VERSION.xpi"

echo "Creating build directory ..."
rm -rf build
mkdir build
echo "Copying files ..."
cp -r chrome.manifest chrome COPYING examples README.md defaults install.rdf LICENSE.gpl resources \
    build/

# Include custom resources
if [ -d "custom" ]; then
    if [ -d "custom/controllers" ]; then
        cp custom/controllers/*.js build/resources/controllers/
    fi
    if [ -d "custom/models" ]; then
        cp custom/models/*.js build/resources/models/
    fi
    if [ -d "custom/parsers" ]; then
        cp custom/parsers/*.js build/resources/parsers/
    fi
    if [ -d "custom/data" ]; then
        cp -r custom/data build/resources/
    fi
fi

cd build

if [ "debug" = "$1" ]; then
    echo "Patching install.rdf version ..."
    sed -e "s/<em:version>.*<\/em:version>/<em:version>$VERSION<\/em:version>/" \
      install.rdf > tmp
    cat tmp > install.rdf
    rm tmp
fi

echo "Building locales in chrome.manifest ..."
for entry in chrome/locale/*; do
    entry=`basename $entry`
    if [ "$entry" != "en-US" ]; then
        echo "locale fireserv $entry locale/$entry/" >> chrome.manifest
    fi
done

echo "Building chrome..."

if [ "debug" = "$1" ]; then
    sed \
        -e "s/^content  *\([^ ]*\)  *\([^ ]*\)/content \1 chrome\/\2/" \
        -e "s/^skin  *\([^ ]*\)  *\([^ ]*\)  *\([^ ]*\)/skin \1 \2 chrome\/\3/" \
        -e "s/^locale  *\([^ ]*\)  *\([^ ]*\)  *\([^ ]*\)/locale \1 \2 chrome\/\3/" \
        chrome.manifest > tmp
    cat tmp > chrome.manifest
    rm tmp
else
    sed \
        -e "s/^content  *\([^ ]*\)  *\([^ ]*\)/content \1 jar:chrome\/fireserv.jar!\/\2/" \
        -e "s/^skin  *\([^ ]*\)  *\([^ ]*\)  *\([^ ]*\)/skin \1 \2 jar:chrome\/fireserv.jar!\/\3/" \
        -e "s/^locale  *\([^ ]*\)  *\([^ ]*\)  *\([^ ]*\)/locale \1 \2 jar:chrome\/fireserv.jar!\/\3/" \
        chrome.manifest > tmp
    cat tmp > chrome.manifest
    rm tmp
    cd chrome
    find content skin locale | sort | \
      zip -r -0 -@ "fireserv.jar" > /dev/null
    rm -fr content/ skin/ locale/
    cd ..
fi

echo "Cleaning up ..."
find . -depth -name '*~' -exec rm -rf "{}" \;
find . -depth -name '#*' -exec rm -rf "{}" \;

echo "Creating $XPI ..."
if [ ! -d "../xpi" ]; then
    mkdir ../xpi
fi
if [ -f "../xpi/$XPI" ]; then
    rm ../xpi/$XPI
fi
zip -qr9X "../xpi/$XPI" *

echo "Cleaning up temporary files ..."
cd ..
rm -r build
