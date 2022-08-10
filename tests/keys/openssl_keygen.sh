#!/usr/bin/env bash

##########################################################
# Paths can be absolute or relative to this script
PRIV_KEY_SEC1_DER_FILE="./priv_sec1.der"
PRIV_KEY_SEC1_PEM_FILE="./priv_sec1.pem"

PRIV_KEY_PKCS8_DER_FILE="./priv_pkcs8.der"

PUB_KEY_SPKI_DER_FILE="./pub_spki.der"
PUB_KEY_SPKI_PEM_FILE="./pub_spki.pem"
##########################################################
PWD=$(pwd)
CMD=$0
SWD=""
if [[ ${CMD:0:1} == "/" ]]
then
    SWD="${CMD%/*}"
else
    SWD="$PWD/${CMD%/*}"
fi
absolutize () {
    if [[ ${1:0:1} == "/" ]]
    then
        LAST_FUNC_RETURN=$1
    else
        LAST_FUNC_RETURN="$SWD/$1"
    fi
}

absolutize $PRIV_KEY_SEC1_DER_FILE
PRIV_KEY_SEC1_DER_FILE=$LAST_FUNC_RETURN
absolutize $PRIV_KEY_SEC1_PEM_FILE
PRIV_KEY_SEC1_PEM_FILE=$LAST_FUNC_RETURN
absolutize $PRIV_KEY_PKCS8_DER_FILE
PRIV_KEY_PKCS8_DER_FILE=$LAST_FUNC_RETURN
absolutize $PUB_KEY_SPKI_DER_FILE
PUB_KEY_SPKI_DER_FILE=$LAST_FUNC_RETURN
absolutize $PUB_KEY_SPKI_PEM_FILE
PUB_KEY_SPKI_PEM_FILE=$LAST_FUNC_RETURN
##########################################################

cd $SWD


### GENERATION
# Generate new key and save it as sec1.der
# openssl ecparam -name secp384r1 -genkey -outform DER -out $PRIV_KEY_SEC1_DER_FILE

# Extract public part from previously generated key and save it as spki.der, , which is format encoded in base58 string returned by 4RYA
# openssl ec -inform DER -in $PRIV_KEY_SEC1_DER_FILE -outform DER -out $PUB_KEY_SPKI_DER_FILE -pubout # public key in our format

# Convert sec1.der private key to pkcs8.der, which is format encoded in base58 string returned by 4RYA
# openssl pkcs8 -topk8 -nocrypt -inform DER -in $PRIV_KEY_SEC1_DER_FILE -outform DER -out $PRIV_KEY_PKCS8_DER_FILE # private key in our format



### CONVERSIONS
# takes a 

# Convert pkcs8.der private key back to sec1, but with PEM headers
openssl pkcs8 -nocrypt -inform DER -in $PRIV_KEY_PKCS8_DER_FILE -outform PEM -out $PRIV_KEY_SEC1_PEM_FILE

# Extract public part from private PEM key and save it also as PEM
openssl ec -inform PEM -in $PRIV_KEY_SEC1_PEM_FILE -outform pem -out $PUB_KEY_SPKI_PEM_FILE -pubout # public key in our format

# Direct public key conversion. Converts spki.der public key to spki.pem
# openssl ec -inform DER -in $PUB_KEY_SPKI_DER_FILE -outform PEM -out $PUB_KEY_SPKI_PEM_FILE -pubin

# Show key parameters
openssl ec -text -inform PEM -in $PRIV_KEY_SEC1_PEM_FILE

# Sign
# openssl dgst -sha384 -sign priv_sec1.pem -keyform PEM data.txt > signature.bin

# Verify
# openssl dgst -sha384 -verify pub_spki.pem -signature signature.bin data.tx