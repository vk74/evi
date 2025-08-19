# Changelog

All notable changes to the EV2 project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Version synchronization system across all components
- Centralized version management with scripts
- Database migration tracking tables

### Changed
- Unified version numbering across backend, frontend, and database
- Restructured database initialization scripts

## [0.5.0] - 2024-12-01

### Added
- Complete database schema for EV2 application
- User authentication and authorization system
- Group management functionality
- Catalog sections and services
- Product management system
- Admin panel with user and group management
- Frontend Vue.js application with Vuetify UI
- Backend Express.js API with TypeScript
- PostgreSQL database with proper schema design
- UUID standardization using PostgreSQL's gen_random_uuid()
- Database migration and version tracking system

### Changed
- Standardized UUID generation across all components
- Removed dependency on uuid-ossp extension
- Consolidated database initialization scripts

### Fixed
- Database constraint and function synchronization
- Missing UNIQUE constraints in initialization scripts
- System group deletion protection
- Expired token cleanup functionality

## [0.1.0] - Initial Development

### Added
- Initial project structure
- Basic backend and frontend setup
- Development environment configuration
