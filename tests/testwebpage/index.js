/* eslint-disable */

getTxData = (ticket, outputElemId) => {
    const outputElem = document.getElementById(outputElemId);
    outputElem.innerHTML = '';
    if (!window.trinciClient) {
        outputElem.innerHTML = 'Connection error.';
        return;
    }
    window.trinciClient.txData(ticket)
        .then((tx) => {
            tx.toObject()
                .then((txObj) => {
                    outputElem.innerHTML = `<pre>${JSON.stringify(txObj, null, 4)}</pre>`;
                })
                .catch((error) => {
                    console.error(error);
                    outputElem.innerHTML = error.message;
                });
        })
        .catch((error) => {
            console.error(error);
            outputElem.innerHTML = error.message;
        });
}

getTxReceipt = (ticket, outputElemId) => {
    const outputElem = document.getElementById(outputElemId);
    outputElem.innerHTML = '';
    if (!window.trinciClient) {
        outputElem.innerHTML = 'Connection error.';
        return;
    }
    window.trinciClient.txReceipt(ticket)
        .then((txReceipt) => {
            outputElem.innerHTML = `<pre>${JSON.stringify(txReceipt, null, 4)}</pre>`;
        })
        .catch((error) => {
            console.error(error);
            outputElem.innerHTML = error.message;
        });
}

getBlockInfo = (index, txlist, outputElemId) => {
    const outputElem = document.getElementById(outputElemId);
    outputElem.innerHTML = '';
    if (!window.trinciClient) {
        outputElem.innerHTML = 'Connection error.';
        return;
    }
    window.trinciClient.blockData((index * 1), txlist)
        .then((result) => {
            const tempObj = {
                idx: result.info.idx,
                txCount: result.info.txCount,
                txsRoot: result.info.txsRoot,
                receiptsRoot: result.info.receiptsRoot,
                prevHash: result.info.prevHash,
                accountsRoot: result.info.accountsRoot,
                signerNode: null,
                tickets: result.tickets,
            };

            const outputToElem = (tempObj) => {
                // ============

                let finalElemInnerHtml = `<span class="valueLabel fullLine">Info on block ${index}:</span><hr>`;
                finalElemInnerHtml += '<div class="valuesList">';
                const keys = Object.keys(tempObj);
                for (const key of keys) {
                    if (key === 'tickets') continue;
                    const elemHtml = `<div class="stringValue"><span class="valueLabel">${key}: </span><span class="stringValueValue">${JSON.stringify(tempObj[key])}</span></div>`;
                    finalElemInnerHtml += elemHtml;
                }
                if (tempObj.tickets.length) {
                    finalElemInnerHtml += '<span class="valueLabel fullLine">tickets:</span><hr>';
                    finalElemInnerHtml += '<div class="valuesList">';
                    for (const ticket of tempObj.tickets) {
                        const elemHtml = `<div class="stringValue"><span class="stringValueValue">${JSON.stringify(ticket)}</span><button class="inlineInfoButton" onclick="document.getElementById('txTabControlPanelTicketInputField').value = '${ticket}'; getTxData('${ticket}', 'txTabOutputField'); switchTab('txTabBtn', 'txTab');">DATA</button><button class="inlineInfoButton" onclick="document.getElementById('txTabControlPanelTicketInputField').value = '${ticket}'; getTxReceipt('${ticket}', 'txTabOutputField'); switchTab('txTabBtn', 'txTab');">REC</button></div>`;
                        finalElemInnerHtml += elemHtml;
                    }
                    finalElemInnerHtml += '</div>';
                }
                finalElemInnerHtml += '</div>';
                outputElem.innerHTML = finalElemInnerHtml;

                // ============
            };

            // if this key is empty (genesis block), the params id string will have a zero length
            // no need to decode key/signature in this case
            if (!result.info.signer.keyParams.paramsId.length) {
                outputToElem(tempObj);
            } else {
                result.info.signer.getSPKI()
                    .then((blockSignerPubKeySPKI) => {
                        const bytes = new Uint8Array(4 + blockSignerPubKeySPKI.byteLength);
                        bytes.set([0x08, 0x03, 0x12, blockSignerPubKeySPKI.byteLength], 0);
                        bytes.set(blockSignerPubKeySPKI, 4);
                        const sha256 = t2lib.Utils.sha256(bytes);
                        const multiHash = new Uint8Array(2 + sha256.byteLength);
                        multiHash.set([0x12, 0x20], 0);
                        multiHash.set(sha256, 2);
                        const nodeId = t2lib.binConversions.arrayBufferToBase58(multiHash.buffer);
                        tempObj.signerNode = nodeId;
                        outputToElem(tempObj);
                    })
                    .catch((error) => {
                        console.error(error);
                        outputElem.innerHTML = error.message;
                    })
            }
        })
        .catch((error) => {
            console.error(error);
            outputElem.innerHTML = error.message;
        });
}

smartContractDl = (scHashHex, filename) => {
    if (!window.trinciClient) {
        outputElem.innerHTML = 'Connection error.';
        return;
    }
    window.trinciClient.accountData(window.trinciClient.serviceAccount, [`contracts:code:${scHashHex}`])
        .then((serviceAccData) => {
            if (!serviceAccData.requestedData[0]) {
                console.error('Smart contract not found.');
                return;
            }
            downloadBlob(serviceAccData.requestedData[0], filename);
        })
        .catch((error) => {
            console.error(error);
        });
}

downloadBlob = (data, fileName, mimeType = 'application/octet-stream') => {
    let blob, url;
    blob = new Blob([data], {
        endings: 'transparent',
        type: mimeType
    });
    url = window.URL.createObjectURL(blob);
    downloadURL(url, fileName);
    setTimeout(function() {
        return window.URL.revokeObjectURL(url);
    }, 1000);
};

downloadURL = function(data, fileName) {
    let a;
    a = document.createElement('a');
    a.href = data;
    a.download = fileName;
    document.body.appendChild(a);
    a.style = 'display: none';
    a.click();
    a.remove();
};

getNodeBootstrap = (outputElemId) => {
    const outputElem = document.getElementById(outputElemId);
    outputElem.innerHTML = '';
    if (!window.trinciClient) {
        outputElem.innerHTML = 'Connection error.';
        return;
    }
    window.trinciClient.getNodeBootstrap()
        .then((result) => {
            downloadBlob(result, 'bootstrap.bin');
        })
        .catch((error) => {
            console.error(error);
            outputElem.innerHTML = error.message;
        });
}

viewNodeInfo = (outputElemId) => {
    const outputElem = document.getElementById(outputElemId);
    outputElem.innerHTML = '';
    if (!window.trinciClient) {
        outputElem.innerHTML = 'Connection error.';
        return;
    }
    let finalElemInnerHtml = '<span class="valueLabel fullLine">TRINCI node visa:</span><hr>';
    window.trinciClient.getNodeInfo()
        .then((result) => {
            const parsedObj = JSON.parse(result);
            const keys = Object.keys(parsedObj);
            finalElemInnerHtml += '<div class="valuesList">';
            for (let i = 0; i < keys.length; i++) {
                const elemHtml = `<div class="stringValue"><span class="valueLabel">${keys[i]}: </span><span class="stringValueValue">${JSON.stringify(parsedObj[keys[i]])}</span></div>`;
                finalElemInnerHtml += elemHtml;
            }
            finalElemInnerHtml += '</div>';
            outputElem.innerHTML = finalElemInnerHtml;
        })
        .catch((error) => {
            console.error(error);
            outputElem.innerHTML = error.message;
        });
}

viewTrinciSettings = (outputElemId) => {
    const outputElem = document.getElementById(outputElemId);
    outputElem.innerHTML = '';
    if (!window.trinciClient) {
        outputElem.innerHTML = 'Connection error.';
        return;
    }
    let finalElemInnerHtml = '<span class="valueLabel fullLine">TRINCI blockchain settings:</span><hr>';
    window.trinciClient.accountData(window.trinciClient.serviceAccount, ['blockchain:settings'])
        .then((result) => {
            const settings = t2lib.Utils.bytesToObject(result.requestedData[0]);
            const keys = Object.keys(settings);
            finalElemInnerHtml += '<div class="valuesList">';
            for (let i = 0; i < keys.length; i++) {
                const elemHtml = `<div class="stringValue"><span class="valueLabel">${keys[i]}: </span><span class="stringValueValue">${JSON.stringify(settings[keys[i]])}</span></div>`;
                finalElemInnerHtml += elemHtml;
            }
            finalElemInnerHtml += '</div>';
            outputElem.innerHTML = finalElemInnerHtml;
        })
        .catch((error) => {
            console.error(error);
            outputElem.innerHTML = error.message;
        });
}

viewTrinciAdmins = (outputElemId) => {
    const outputElem = document.getElementById(outputElemId);
    outputElem.innerHTML = '';
    if (!window.trinciClient) {
        outputElem.innerHTML = 'Connection error.';
        return;
    }
    let finalElemInnerHtml = '<span class="valueLabel fullLine">TRINCI blockchain admins:</span><hr>';
    window.trinciClient.accountData(window.trinciClient.serviceAccount, ['blockchain:admins'])
        .then((result) => {
            const admins = t2lib.Utils.bytesToObject(result.requestedData[0]);
            for (const admin of admins) {
                const dataBtnOnClickCode = `document.getElementById('accDataPanelControlSectionAccIdField\').value = \'${admin}\'; document.getElementById('accDataPanelControlSectionAccKeysField').value = ''; getAccInfo('${admin}', '', 'accDataOutputFieldAccIdValue', 'accDataOutputFieldContractHashValue', 'accDataOutputFieldDataHashValue', 'accDataOutputFieldAssetsList', 'accDataOutputFieldRequestedDataList', document.querySelector('input[name=\\'accDataOutputFieldEncodingSelector\\']:checked').value); switchTab('accTabBtn', 'accTab');`;
                const elemHtml = `<div class="stringValue"><span class="stringValueValue">${JSON.stringify(admin)}</span><button class="inlineInfoButton" onclick="${dataBtnOnClickCode}">DATA</button></div>`;
                finalElemInnerHtml += elemHtml;
            }
            outputElem.innerHTML = finalElemInnerHtml;
        })
        .catch((error) => {
            console.error(error);
            outputElem.innerHTML = error.message;
        });
}

viewTrinciValidators = (outputElemId) => {
    const validatorMarker = 'blockchain:validators:';
    const outputElem = document.getElementById(outputElemId);
    outputElem.innerHTML = '';
    if (!window.trinciClient) {
        outputElem.innerHTML = 'Connection error.';
        return;
    }
    let finalElemInnerHtml = '<span class="valueLabel fullLine">TRINCI blockchain validators:</span><hr>';
    window.trinciClient.accountData(window.trinciClient.serviceAccount, ['*'])
        .then((result) => {
            const accKeysList = t2lib.Utils.bytesToObject(result.requestedData[0]);
            for (const key of accKeysList) {
                const validator = key.substring(validatorMarker.length);
                if (key.startsWith(validatorMarker)) {
                    const dataBtnOnClickCode = `document.getElementById('accDataPanelControlSectionAccIdField\').value = \'${validator}\'; document.getElementById('accDataPanelControlSectionAccKeysField').value = ''; getAccInfo('${validator}', '', 'accDataOutputFieldAccIdValue', 'accDataOutputFieldContractHashValue', 'accDataOutputFieldDataHashValue', 'accDataOutputFieldAssetsList', 'accDataOutputFieldRequestedDataList', document.querySelector('input[name=\\'accDataOutputFieldEncodingSelector\\']:checked').value); switchTab('accTabBtn', 'accTab');`;
                    const elemHtml = `<div class="stringValue"><span class="stringValueValue">${JSON.stringify(validator)}</span><button class="inlineInfoButton" onclick="${dataBtnOnClickCode}">DATA</button></div>`;
                    finalElemInnerHtml += elemHtml;
                }
            }
            outputElem.innerHTML = finalElemInnerHtml;
        })
        .catch((error) => {
            console.error(error);
            outputElem.innerHTML = error.message;
        });
}

viewTrinciContracts = (outputElemId) => {
    const outputElem = document.getElementById(outputElemId);
    outputElem.innerHTML = '';
    if (!window.trinciClient) {
        outputElem.innerHTML = 'Connection error.';
        return;
    }
    let finalElemInnerHtml = '<span class="valueLabel fullLine">TRINCI blockchain constracts:</span>';
    window.trinciClient.registeredContractsList()
        .then((result) => {
            const hashes = Object.keys(result);
            for (const hash of hashes) {
                const dlBtnOnClickCode = `smartContractDl('${hash}', '${result[hash]['name']}_${result[hash]['version']}.wasm');`;
                finalElemInnerHtml += '<hr><div class="valuesList">';
                finalElemInnerHtml += `<div class="stringValue"><span class="valueLabel">Hash: </span><span class="stringValueValue">${JSON.stringify(hash)}</span><button class="inlineInfoButton" onclick="${dlBtnOnClickCode}">DL</button></div>`;
                const dataKeys = Object.keys(result[hash]);
                for (const dataKey of dataKeys) {
                    const elemHtml = `<div class="stringValue"><span class="valueLabel">${dataKey}: </span><span class="stringValueValue">${JSON.stringify(result[hash][dataKey])}</span></div>`;
                    finalElemInnerHtml += elemHtml;
                }
                finalElemInnerHtml += '</div>';
            }
            outputElem.innerHTML = finalElemInnerHtml;
        })
        .catch((error) => {
            console.error(error);
            outputElem.innerHTML = error.message;
        });
}

updateImportedAccList = (listContainerId) => {
    const listContainer = document.getElementById(listContainerId);
    const idsList = Object.keys(window.importedAccountsList);
    let finalHtmlString = '';
    let test = 'document.querySelector(\'input[name=\\\'accTabPubKeyEncodingSelector\\\']:checked\').value,';
    for (const id of idsList) {
        let elemHtmlString = `<div><span class="accIdSpan" onclick="exportAccount('${id}', 'accTabAccIdField', 'accTabPubKeyField', document.querySelector(\'input[name=\\\'accTabPubKeyEncodingSelector\\\']:checked\').value, 'accTabPrivKeyField', document.querySelector(\'input[name=\\\'accTabPrivKeyEncodingSelector\\\']:checked\').value,)">${id}</span><button class="accDelBtn" onclick="delFromImportedAccList('${id}');updateImportedAccList('${listContainerId}');">DEL</button></div>`;
        finalHtmlString += elemHtmlString;
    }
    listContainer.innerHTML = finalHtmlString;
}
delFromImportedAccList = (id) => {
    if (Object.keys(window.importedAccountsList).indexOf(id) >= 0) {
        delete window.importedAccountsList[id];
    }
}
importAccount = (listContainerId, accIdFieldElemId, pubKeyFieldElemId, pubKeyEncoding, privKeyFieldElemId, privKeyEncoding) => {
    const accIdStr = document.getElementById(accIdFieldElemId).value;
    const pubKeyStr = document.getElementById(pubKeyFieldElemId).value;
    const privKeyStr = document.getElementById(privKeyFieldElemId).value;
    const pubKeyBytes = decodeBinData(pubKeyStr, pubKeyEncoding);
    const privKeyBytes = decodeBinData(privKeyStr, privKeyEncoding);
    // console.log(`puKey   : ${pubKeyStr}`);
    // console.log(`privKey : ${privKeyStr}`);
    const accountToImport = new t2lib.Account();
    accountToImport.accountId = accIdStr;
    const pubKey = new t2lib.ECDSAKey('public');
    const privKey = new t2lib.ECDSAKey('private');
    const keysPromises = [];
    keysPromises.push(pubKey.importBin(pubKeyBytes));
    keysPromises.push(privKey.importBin(privKeyBytes));
    Promise.allSettled(keysPromises)
        .then((results) => {
            const accountPromises = [];
            if (results[1].status === 'fulfilled' && results[1].value === true) {
                accountPromises.push(accountToImport.setPrivateKey(privKey));
            } else if (results[0].status === 'fulfilled' && results[0].value === true) {
                accountPromises.push(accountToImport.setPublicKey(pubKey));
            } else {
            }
            Promise.allSettled(accountPromises)
                .then((result) => {
                    window.importedAccountsList[accountToImport.accountId] = accountToImport;
                    updateImportedAccList(listContainerId);
                })
                .catch((error) => {
                    console.error(error);
                });
        })
        .catch((error) => {
            console.error('first error');
            console.error(error);
        });
}
exportAccount = (id, accIdFieldElemId, pubKeyFieldElemId, pubKeyEncoding, privKeyFieldElemId, privKeyEncoding) => {
    document.getElementById(accIdFieldElemId).value = '';
    document.getElementById(pubKeyFieldElemId).value = '';
    document.getElementById(privKeyFieldElemId).value = '';
    if (Object.keys(window.importedAccountsList).indexOf(id) < 0) {
        return;
    }
    const accToExport = window.importedAccountsList[id];
    const promises = [];
    promises.push(accToExport.keyPair.publicKey.getRaw());
    promises.push(accToExport.keyPair.privateKey.getPKCS8());
    Promise.allSettled(promises)
        .then((results) => {
            if (accToExport.accountId && accToExport.accountId.length) {
                document.getElementById(accIdFieldElemId).value = accToExport.accountId;
            } else {
                console.error('No account id.')
            }
            if (results[0].status === 'fulfilled') {
                document.getElementById(pubKeyFieldElemId).value = encodeBinData(results[0].value, pubKeyEncoding);
            } else {
                console.error('Public key export error: ', results[0].reason);
            }
            if (results[1].status === 'fulfilled') {
                document.getElementById(privKeyFieldElemId).value = encodeBinData(results[1].value, privKeyEncoding);
            } else {
                console.error('Private key export error: ', results[1].reason);
            }
        })
        .catch((error) => {
            console.error(error);
        });
}

encodeBinData = (binData, outputFormat) => {
    const ab = new Uint8Array(binData).buffer;
    switch (outputFormat) {
        case 'hex':
            try {
                return buf2hex(ab);
            } catch (error) {
                return null;
            }
        case 'b58':
            try {
                return t2lib.binConversions.arrayBufferToBase58(ab);
            } catch (error) {
                return null;
            }
        case 'b64':
            try {
                return t2lib.binConversions.arrayBufferToBase64(ab);
            } catch (error) {
                return null;
            }
        default:
            throw(new Error(`Unknown output format: ${outputFormat}`));
    }
}

function buf2hex(buffer) {
    return [...new Uint8Array(buffer)]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');
}

decodeBinData = (inputString, inputFormat) => {
    switch (inputFormat) {
        case 'hex':
            try {
                return Uint8Array.from(inputString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
            } catch (error) {
                return null;
            }
        case 'b58':
            try {
                return new Uint8Array(t2lib.binConversions.base58ToArrayBuffer(inputString));
            } catch (error) {
                return null;
            }
        case 'b64':
            try {
                return new Uint8Array(t2lib.binConversions.base64ToArrayBuffer(inputString));
            } catch (error) {
                return null;
            }
        default:
            throw(new Error(`Unknown input format: ${inputFormat}`));
    }
}
genNewAccount = (listContainerId) => {
    const newAcc = new t2lib.Account();
    newAcc.generate()
        .then(() => {
            window.importedAccountsList[newAcc.accountId] = newAcc;
            updateImportedAccList(listContainerId);
        })
        .catch((error) => {
            console.error(error);
        })
}

selectDefaultNode = (selectElemId, urlFieldElemId, networkFieldElemId) => {
    const defaultNodes = {
        'localhost': ['http://localhost:8000', ''],
        'testnet': ['http://testnet.trinci.net', 'QmcvHfPC6XYpgxvJSZQCVBd7QAMEHnLbbK1ytA4McWx5UY'],
        'mainnet': ['http://t27.trinci.net:8000', 'QmPSjKEWBHshyvCAkppsfKAxoxqRn3RyW1n222zT1UFupd'],
    };
    const nodesSelector = document.getElementById(selectElemId);
    const selectedNode = nodesSelector.options[nodesSelector.selectedIndex].value;

    const urlField = document.getElementById(urlFieldElemId);
    const networkField = document.getElementById(networkFieldElemId);
    urlField.value = '';
    networkField.value = '';

    if (defaultNodes[selectedNode]) {
        urlField.value = defaultNodes[selectedNode][0];
        networkField.value = defaultNodes[selectedNode][1];
    }
}

// window.trinciClient = new t2lib.Client('');
testConnection = (url, network, indicatorElem) => {
    window.trinciClient = null;
    var internalUrl = url;
    if (!internalUrl || !internalUrl.length) {
        internalUrl = 'http://localhost:8000';
    }
    var tempClient = new t2lib.Client(internalUrl, network);
    tempClient.accountData('TRINCI')
        .then((result) => {
            window.trinciClient = tempClient;
            indicatorElem.textContent = `Connected to "${internalUrl}".`;
            setElemClassList(indicatorElem, ['indicator', 'green']);
        })
        .catch((error) => {
            window.trinciClient = null;
            indicatorElem.textContent = `Error: ${error.message}`;
            setElemClassList(indicatorElem, ['indicator', 'red']);
            console.error(error);
        })
}

msgPackDecode = (encodedDataStr, encodingFormat, outputElemId) => {
    const jsonOutputElem = document.getElementById(outputElemId);
    jsonOutputElem.value = '';
    const binData = decodeBinData(encodedDataStr, encodingFormat);
    let decodeError;
    let jsonObj;
    try {
        jsonObj = t2lib.Utils.bytesToObject(binData);
    } catch (error) {
        decodeError = true;
        console.error(error);
        jsonOutputElem.value = error.message;
    }

    if (!decodeError) {
        jsonOutputElem.value = JSON.stringify(jsonObj, null, 4);
    }
}

msgPackEncode = (jsonStr, encodingFormat, outputElemId) => {
    const binDataOutputElem = document.getElementById(outputElemId);
    binDataOutputElem.value = '';

    let parsedObj;
    try {
        parsedObj = JSON.parse(jsonStr);
    } catch (error) {
        console.error(error);
        binDataOutputElem.value = error.message;
        return;
    }

    let msgPackBytes;
    try {
        msgPackBytes = t2lib.Utils.objectToBytes(parsedObj);
    } catch (error) {
        console.error(error);
        binDataOutputElem.value = error.message;
        return;
    }

    let encodedString;
    try {
        encodedString = encodeBinData(msgPackBytes, encodingFormat);
    } catch (error) {
        console.error(error);
        binDataOutputElem.value = error.message;
        return;
    }
    binDataOutputElem.value = encodedString;
}

getAccInfo = (
    accountId,
    keysStr,
    accIdOutputFieldElemId,
    constractHashOutputFieldElemId,
    dataHashOutputFieldElemId,
    assetsListOutputElemId,
    dataListOutputElemId,
    dataEncodingFormat,
) => {
    const accIdOutputElem = document.getElementById(accIdOutputFieldElemId);
    const constractHashOutputElem = document.getElementById(constractHashOutputFieldElemId);
    const dataHashOutputElem = document.getElementById(dataHashOutputFieldElemId);
    const assetsListOutputElem = document.getElementById(assetsListOutputElemId);
    const dataListOutputElem = document.getElementById(dataListOutputElemId);
    accIdOutputElem.innerHTML = '';
    constractHashOutputElem.innerHTML = '';
    dataHashOutputElem.innerHTML = '';
    assetsListOutputElem.innerHTML = '';
    dataListOutputElem.innerHTML = '';
    const keysArray = keysStr.split(';').filter((value) => { return value && value.length ? value : undefined; });
    if (!window.trinciClient) {
        accIdOutputElem.innerHTML = 'Connection error.';
        return;
    }
    window.trinciClient.accountData(accountId, keysArray)
        .then((result) => {
            accIdOutputElem.innerHTML = result.accountId;
            constractHashOutputElem.innerHTML = result.contractHash;
            dataHashOutputElem.innerHTML = result.dataHash;
            let finalHtmlString = '';
            for (let i = 0; i < keysArray.length; i++) {
                const elemId = `${accountId}_dataKeys_${keysArray[i]}`;
                const copyBtnOnClickCode = `copyTextToClipboard(document.getElementById('${elemId}').innerHTML);`
                const decBtnOnClickCode = `document.getElementById('msgPackTabBinDataField').value = document.getElementById('${elemId}').innerHTML; document.querySelector('input[name=\\'msgPackTabBinDataEncodingSelector\\'][value=\\'${dataEncodingFormat}\\']').checked = true; msgPackDecode(document.getElementById('${elemId}').innerHTML, '${dataEncodingFormat}', 'msgPackTabJsonField'); switchTab('msgPackTabBtn', 'msgPackTab');`;
                const elemHtmlString = `<div class="stringValue"><span class="valueLabel">${keysArray[i]}:</span><button class="inlineCopyButton" onclick="${copyBtnOnClickCode}">CPY</button><button class="inlineInfoButton" onclick="${decBtnOnClickCode}">UNPACK</button><span class="stringValueValue overflowHide" id="${elemId}">${encodeBinData(result.requestedData[i], dataEncodingFormat)}</span></div>`;
                finalHtmlString += elemHtmlString;
            }
            dataListOutputElem.innerHTML = finalHtmlString;

            const assetsList = Object.keys(result.assets);
            finalHtmlString = '';
            for (let i = 0; i < assetsList.length; i++) {
                const elemId = `${accountId}_assets_${assetsList[i]}`;
                const copyBtnOnClickCode = `copyTextToClipboard(document.getElementById('${elemId}').innerHTML);`
                const decBtnOnClickCode = `document.getElementById('msgPackTabBinDataField').value = document.getElementById('${elemId}').innerHTML; document.querySelector('input[name=\\'msgPackTabBinDataEncodingSelector\\'][value=\\'${dataEncodingFormat}\\']').checked = true; msgPackDecode(document.getElementById('${elemId}').innerHTML, '${dataEncodingFormat}', 'msgPackTabJsonField'); switchTab('msgPackTabBtn', 'msgPackTab');`;
                const elemHtmlString = `<div class="stringValue"><span class="valueLabel">${assetsList[i]}:</span><button class="inlineCopyButton" onclick="${copyBtnOnClickCode}">CPY</button><button class="inlineInfoButton" onclick="${decBtnOnClickCode}">UNPACK</button><span class="stringValueValue" id="${elemId}">${encodeBinData(result.assets[assetsList[i]], dataEncodingFormat)}</span></div>`;
                finalHtmlString += elemHtmlString;
            }
            assetsListOutputElem.innerHTML = finalHtmlString;
        })
        .catch((error) => {
            console.error(error);
            accIdOutputElem.innerHTML = JSON.stringify(error.message);
        });
}

switchTab = (buttonElemId, tabName) => {
    let i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabContent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tabButton");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    document.getElementById(buttonElemId).className += " active";
}

getElemClassList = (elem) => {
    return elem.className.split(' ');
}
setElemClassList = (elem, classList) => {
    elem.className = classList.join(' ');
}

function fallbackCopyTextToClipboard(text) {
    const tempTextArea = document.createElement("temptextarea");
    tempTextArea.value = text;

    // Avoid scrolling to bottom
    tempTextArea.style.top = "0";
    tempTextArea.style.left = "0";
    tempTextArea.style.position = "fixed";

    document.body.appendChild(tempTextArea);
    tempTextArea.focus();
    tempTextArea.select();

    try {
        const success = document.execCommand('copy');
        if (!success) {
            console.error(`Copy fallback: Copy command returned false.`);
        }
    } catch (err) {
        console.error('Copy fallback: Copy command error:', err);
    }

    document.body.removeChild(tempTextArea);
}

function copyTextToClipboard(text) {
    if (!navigator.clipboard) {
        fallbackCopyTextToClipboard(text);
        return;
    }
    navigator.clipboard.writeText(text)
        .then(() => {
        })
        .catch((err) => {
            console.error('Async: Could not copy text: ', err);
        });
}

function deepLog(obj) {
    let logMessage = util.inspect(obj, false, null, true);
    return logMessage;
}

// INITIALIZATION SCRIPTS
window.importedAccountsList = {};
updateImportedAccList('importedAccList');
