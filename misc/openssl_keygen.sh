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

# Generate SEC1.DER private key
openssl ecparam -name secp384r1 -genkey -outform DER -out $PRIV_KEY_SEC1_DER_FILE
# extract public key from SEC1.der and save it as SPKI.DER
openssl ec -inform DER -in $PRIV_KEY_SEC1_DER_FILE -outform DER -out $PUB_KEY_SPKI_DER_FILE -pubout
# convert SEC1.DER private key to PKCS8.DER
openssl pkcs8 -topk8 -nocrypt -inform DER -in $PRIV_KEY_SEC1_DER_FILE -outform DER -out $PRIV_KEY_PKCS8_DER_FILE

# ### GENERATION
# # New private key; SEC1.DER
# openssl ecparam -name secp384r1 -genkey -outform DER -out $PRIV_KEY_SEC1_DER_FILE

# ### CONVERSIONS


# # SEC1.DER->PKCS8.DER; private
# openssl pkcs8 -topk8 -nocrypt -inform DER -in $PRIV_KEY_SEC1_DER_FILE -outform DER -out $PRIV_KEY_PKCS8_DER_FILE

# # PKCS8.DER->SEC1.PEM; private
# openssl pkcs8 -nocrypt -inform DER -in $PRIV_KEY_PKCS8_DER_FILE -outform PEM -out $PRIV_KEY_SEC1_PEM_FILE


# ### EXTRACT PUBLIC KEYS
# # SPKI.DER from SEC1.DER
# openssl ec -inform DER -in $PRIV_KEY_SEC1_DER_FILE -outform DER -out $PUB_KEY_SPKI_DER_FILE -pubout

# # SPKI.PEM from SEC1.PEM
# openssl ec -inform PEM -in $PRIV_KEY_SEC1_PEM_FILE -outform pem -out $PUB_KEY_SPKI_PEM_FILE -pubout # public key in our format

# # SPKI.DER->SPKI.PEM
# openssl ec -inform DER -in $PUB_KEY_SPKI_DER_FILE -outform PEM -out $PUB_KEY_SPKI_PEM_FILE -pubin


# # Show key parameters
# openssl ec -text -inform PEM -in $PRIV_KEY_SEC1_PEM_FILE

# ### Signature
# # NOTE: TRINCI transactions contain signature in IEEE P1363 format, while OpenSSL
# # expects ASN.1/DER encoded signature
# # Sign
# openssl dgst -sha384 -sign priv_sec1.pem -keyform PEM data.txt > signature.bin

# # Verify
# openssl dgst -sha384 -verify pub_spki.pem -signature signature.bin data.tx