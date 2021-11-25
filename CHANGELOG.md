
# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/).
and this project adheres to [Semantic Versioning](http://semver.org/).

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