
# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/).
and this project adheres to [Semantic Versioning](http://semver.org/).

## [3.0.2] - 2025-22-01

### Added

- block timestamp to block data

## [3.0.0] - 2024-12-03

### Changed

- moved all core features except clients to [`@affidaty/t2-lib-core`](https://www.npmjs.com/package/@affidaty/t2-lib-core) package.
- default client request timeout changed from 5000ms (5s) to 30000ms (30s)

## [2.3.2] - 2022-22-04

### Changed

- BridgeClient autoreconnect feature fixed. use BridgeClient.setAutoReconnect() method.

## [2.3.1] - 2022-18-04

### Changed

- BridgeClient can now subscribe separately to block_exec and block_created events

## [2.3.0] - 2022-01-31

### Added

- custom json parser.

## [2.2.2] - 2022-11-22

### Fixed

- fixed impossible to import keys generated using a secret;

## [2.2.1] - 2022-11-18

### Fixed

- some errors on Client.txReceipt() and Client.bulkTxReceipt();
- receipts decoding in T2 BC Tool (repo/misc/t2_bc_tool)

## [2.2.0] - 2022-11-17

### Added

- keypairs (and accounts) can now be generated from a secret.

### Changed

- "build" npm script now also updates .min.js inside `misc/t2_bc_tool` dir

### Fixed

- `misc` dir added to .eslintignore

## [2.1.0] - 2022-11-08

### Added

- Added support for AES password encryption
- Added bridge client to connect directly to Trinci node via socket and listed for events in real time. Not available in browsers as there's no support for direct socket connections.
- Added TransactionEvent message type.
- general usage data signature creation/verification functions added to main export.
- Transaction schema management
- T2 Blockchain Tool added to repository. (`/misc/t2_bc_tool`)
- Client.getNodeInfo() method (node version 0.2.8+)
- elliptic curve point compression/decompression is now supported (only secp384r1 for now)
- added IEEE P1363 => ASN.1 signature conversion function
- Added AbortController and timeout support to t2lib.Client
- generic Transaction class is now able to determine the exact verification logic based on transaction tag.
- bulk root transaction schema now automatically changed to empty bulk root schema when necessary
- added "Core" export to lib

### Changed

- base58 library used for conversions changed
- default client network is now '' (empty string)
- data requested from an account are now returned as Uint8Array
- block index can now be passed to Client.blockData() as a hex string to fix JS number limitations for big UInt64 numbers

### Fixed

- certificate verification bug fixed
- fixed fome unwanted overrides of the base class methods by child classes
- fixed bulk receipt format

## [2.0.6] - 2022-03-28

### Added

- AES key management.

## [2.0.5] - 2022-03-18

### Added

- Exported transactions import/export interfaces.

## [2.0.4] - 2022-02-02

### Added

- Reintroduced t2lib.Utils.getSaltAndIV(); method.

## [2.0.3] - 2022-01-31

### Changed

- Transaction schema members now contain actual schema hashes.

## [2.0.2] - 2022-01-31

### Changed

- ECDHKeyPair()/ECDSAKeyPair() constructors now accept custom parameters. If no params were provided, defaults are used.

### Added

- Schema files for various transaction types.

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