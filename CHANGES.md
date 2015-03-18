2015-03-18, Version 5.0.1
=========================

 * Fix dependent package versions (Krishna Raman)


2015-03-18, Version 5.0.0
=========================

 * Add comment about load order of client model files (Krishna Raman)

 * Fix tests to match how PM send back messages (Krishna Raman)

 * Add usage information (Krishna Raman)

 * Add API url defaults and SSH tunnel support (Krishna Raman)

 * Add shutdown command (Krishna Raman)

 * Add log-dump command (Krishna Raman)

 * Add env commands (Krishna Raman)

 * Add npm-list command (Krishna Raman)

 * Add heap-snapshot command (Krishna Raman)

 * Add cpu-profiling commands. (Krishna Raman)

 * Add object-tracking command (Krishna Raman)

 * Add set-size command (Krishna Raman)

 * Add restart commands (Krishna Raman)

 * Add stop command (Krishna Raman)

 * Add start command (Krishna Raman)

 * Extract test service setup into helper (Krishna Raman)

 * Create meshctl script with status command (Krishna Raman)

 * Add meshctl version test (Krishna Raman)

 * Add help test (Krishna Raman)

 * Move instance related functionality into model (Krishna Raman)

 * Move deploy client functionality to service model (Krishna Raman)


2015-03-09, Version 4.0.0
=========================

 * deps: upgrade tap (Ryan Graham)

 * make service setEnv/unsetEnv return environment (Ryan Graham)

 * Fix recording of express metric timestamp (Krishna Raman)

 * test: listen on ephemeral port (Ryan Graham)

 * Bump major, model reorg was a breaking change (Ryan Graham)

 * Update .gitignore (Sam Roberts)

 * Fix deprecation of req.param(...) (Krishna Raman)

 * Refactor model update code out of PM (Krishna Raman)

 * Rename usage -> detail for express usage metrics (Krishna Raman)

 * Make timeStamp on express usage record consistent (Krishna Raman)

 * Expose API to allow set/unset of env vars (Ryan Graham)

 * Add legacyExplorer=false to fix LB warning (Krishna Raman)

 * Fix debug string names and other misc fixes (Krishna Raman)

 * Add more detailed code comments (Krishna Raman)

 * Seperate dev dependencies in package.json (Krishna Raman)

 * Fix handling of errors for profile downloads (Krishna Raman)

 * Remove error and 404 middleware (Krishna Raman)

 * Export service manager (Krishna Raman)

 * Add support for unix sockets (Krishna Raman)

 * Switch common models to use new LB hooks (Krishna Raman)

 * Switch server to return LB app instead of wrapper (Krishna Raman)

 * common: remove obsolete notes (Sam Roberts)

 * Simplify instance action and support multi service (Krishna Raman)

 * Add tests for deployment endpoints (Krishna Raman)

 * Add tests for snapshotting/profiling and downloads (Krishna Raman)

 * Add tests for basic REST APIs (Krishna Raman)

 * Add basic client (Krishna Raman)

 * Extract API from Instance model (Krishna Raman)

 * Update LB hook methods in ServiceInstance (Krishna Raman)

 * Configure datasource via STRONGLOOP_MESH_DB env (Krishna Raman)

 * Fix service instance relation in action model (Krishna Raman)

 * Enable server to be loaded as express middleware (Krishna Raman)

 * Extract code from strong-pm server (Krishna Raman)

 * Convert dir structure to LoopBack standard (Krishna Raman)

 * Add HTTP trace data model (Krishna Raman)

 * Dont break apart express usage record (Krishna Raman)

 * Add support for Express Usage records (Krishna Raman)


2015-01-12, Version 3.0.1
=========================

 * Add watchdog timeout value to process model (Krishna Raman)


2014-11-28, Version 3.0.0
=========================

 * Add instance.cpus field (Krishna Raman)

 * Add documentation describing the models (Krishna Raman)

 * Add capacity fields for executor (Krishna Raman)

 * Expose additional instance and process state (Krishna Raman)

 * package: models are no longer backwards compatible (Sam Roberts)

 * service-metric: add worker ID (Sam Roberts)

 * service-instance: has many processes, not embeds (Sam Roberts)

 * action: remove idInjection, it is the default (Sam Roberts)

 * fixup! metric notes (Sam Roberts)

 * service-metric: statsd-ish metrics for service (Sam Roberts)

 * server-process: belongs to a service-instance (Sam Roberts)

 * service-process: rename processId to pid (Sam Roberts)


2014-10-22, Version 2.0.0
=========================

 * First release!
