
# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/).
and this project adheres to [Semantic Versioning](http://semver.org/).

## [2.0.1] - 2022-01-19

### Changed

- Added maxFuel parameter to ```prepareUnsignedTx()```, ```prepareTx()``` and ```prepareAndSubmitTx()``` client methods, which should've been done in ```2.0.0```.

## [2.0.0] - 2022-01-18

### Changed

- event data member name changed from ```event_data``` to ```eventData``` inside receipt's events to respect project's casing rules.
- Transaction's accessors have now been moved to transaction's data member, which now is a separate class. So to access transaction's data members you need to use ```tx.data.accountId()``` instead of ```tx.accountId()```.
- Old ```Transaction``` class is now called UnitaryTransaction. Use specific transaction classes (Bulk, BulkNode, BulkRoot, Unitary) to create transaction of the desired type. Generic ```Transaction``` class can be used to parse/verify avery other transaction type.

### Added

- added ```Transaction.getTicket()``` method, which computes transaction ticket without submitting it to the blockchain.
- added ```client.waitForBulkTicket()``` and ```client.bulkTxReceipt()``` methods. However bulk transactions can be managed with old
    ```client.waitForTicket()``` and ```client.txReceipt()``` methods.
- added ```client.getBlockchainSettings()``` method which can get some settings (not yet network name).
- added ```Bulk Root```, ```Bulk Node```, and ```Bulk``` transactions classes.
- added ```schema``` field to signable (and, therefore, to transactions, certificates and delegations).

### Removed

- removed client.registeredAssetsList() method as it cannot be used anymore.

## [1.6.4] - 2021-12-02

### Added

- List of events fired by smart contract added to transaction receipt.

## [1.6.3] - 2021-11-25

### Changed

- License changed.

### Added

- License, changelog and readme files added to npm package.

## [1.6.2] - 2021-11-23

### Changed

- Nothing. 1.6.0 was published again on NPM as 1.6.1 by mistake. Now to publish the new code on NPM we need to increment the version again, even if nothing has actually changed.

## [1.6.1] - 2021-11-23

### Added

- Added ecdsa_secp256r1 keys default parameters (```t2lib.CryptoDefaults.ECDSAP256R1KeyPairParams```)

## [1.6.0] - 2021-11-08

### Changed

- ```schema``` and ```maxFuel``` fields added to transactions (not compatible with core versions prior to 0.2.3-rc1).
- ```burnedFuel``` field added to trancsaction receipt (not compatible with core versions prior to 0.2.3-rc1).

## [1.5.1] - 2021-11-03

### Fixed
- Certificate.multiProof setter fixed.
- Fixed multiproof getting added even if certificate.create() is being called with no args or all the fields

## [1.5.0] - 2021-10-29

### Added

- Added ```t2lib.Utils.sha256()``` function to calculate sha256 hash of given data.
- Added 'target' member to certificates. it's the ID of the account whose data are getting certified.
- Added delegations.
- client.accountData() now also accepts a list of data keys.

### Fixed

- Fixed issue where subsequent calls to account.generate() didn't properly clear the previous value therefore didn't produce a valid signature.

## [1.4.7] - 2021-10-21

### Changed

- Changed library used for sha256 generation in certificates. Certificates created with previous versions cannot be verified successfully by this version and vice versa.