
# Change Log
All notable changes to this project will be documented in this file.
 
The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).
 
## [1.5.0] - UNPUBLISHED
 
### Added
  
- Added ```t2lib.Utils.sha256()``` function to calculate sha256 hash of given data.
- Added 'target' member to certificates. it's the ID of the account whose data are getting certified.

## [1.4.7] - 2021-10-21
 
### Changed
  
- Changed library used for sha256 generation in certificates. Certificates created with previous versions cannot be verified successfully by this version and vice versa.