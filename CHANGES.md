2015-10-15, Version 8.1.0
=========================

 * make InstanceActions ephemeral (Ryan Graham)

 * Use strongloop conventions for licensing (Sam Roberts)

 * Report debugger version in status output (Miroslav Bajtoš)

 * Add debugger status (Miroslav Bajtoš)

 * Add debugger control commands (Miroslav Bajtoš)

 * finish support for overriding the ssh port (Ryan Graham)

 * add missing contribution guidelines (Ryan Graham)

 * set ssh port when use http+ssh deploy via env (SemonCat)

 * test: update to tap@1.3.4 (Ryan Graham)

 * fix regression in process hooks (Ryan Graham)

 * meshctl: order status list by service ID (Sam Roberts)

 * Use numeric IDs for gateway (Krishna Raman)

 * Add gateway support (Krishna Raman)


2015-07-21, Version 8.0.0
=========================

 * Api: add serverName to api info (Sam Roberts)

 * Ensure that missing info doesnt cause crash (Krishna Raman)

 * Add executor destroy hooks (Krishna Raman)

 * meshctl: report server name in info output (Sam Roberts)

 * meshadm: default command is exec-list (Sam Roberts)

 * Undoc SCALE option for service create (Krishna Raman)

 * Update sl-meshctl.txt (Rand McKinney)

 * Use updateAttributes instead of saving whole model (Krishna Raman)

 * Inject db configuration instead of datasource (Krishna Raman)

 * Dont change commit-info if not in notification (Krishna Raman)

 * Allow specification of memory db filepath (Krishna Raman)

 * Add option to mesh-models to use external db (Krishna Raman)

 * Fix process lookup for recording smart profile data (Krishna Raman)

 * meshctl: preserve = in env var values (Ryan Graham)

 * meshadm: don't quote token in exec-create output (Sam Roberts)

 * meshadm: cleanup and test executor commands (Sam Roberts)

 * Fix URL parsing in express-metrics and reenable test (Krishna Raman)

 * test: refactor exec-meshctl to use with meshadm (Sam Roberts)

 * meshadm: support executor-shutdown command (Sam Roberts)

 * profile-data: support delete of ProfileData (Sam Roberts)

 * server: expose ProfileData at top-level of API (Sam Roberts)

 * test: meshctl-helper using better callback name (Sam Roberts)

 * test: fix test-instance-profiling (Sam Roberts)

 * test: remove meshctl-helper duplicate t.end() (Sam Roberts)

 * Trace api updated to use instanceId as hostname (Krishna Raman)

 * Catch missing model with LB find..() and relations (Krishna Raman)

 * Fix model hooks: use correct instance data fields (Krishna Raman)

 * Add auth option for MeshServer (Krishna Raman)

 * Remove getPack endpoint (nothing is using it) (Krishna Raman)

 * Add Capabilities API Support (Joseph Tary)

 * Update process model to use wid for worker id (Krishna Raman)

 * Update instance to use new notification fields (Krishna Raman)

 * Use only HTTP for control, not local sockets (Sam Roberts)

 * meshctl: make set-size persistent (Sam Roberts)

 * meshctl: print a success response for set-size (Sam Roberts)

 * service-manager: document getApiVersionInfo (Sam Roberts)

 * test: fix debug module name in exec-meshctl (Sam Roberts)

 * Add mesh-admin CLI (Krishna Raman)

 * Model updates for sl-central (Krishna Raman)

 * Add common auth code and pmctl socket for central (Krishna Raman)


2015-06-03, Version 7.0.0
=========================

 * Update instance appName based on status:wd msgs (Krishna Raman)

 * report driver metadata for each instance (Ryan Graham)

 * fix race condition in process update processing (Ryan Graham)

 * instance-action: support profiling via actions (Sam Roberts)

 * server-service: fix error in debug message format (Sam Roberts)

 * fix over aggressive assert (Ryan Graham)

 * meshctl: assert instance is well-formed (Sam Roberts)

 * Use SVC.EXEC when starting/stopping tracing on CLI (Krishna Raman)

 * Fix column order for tracing in status output (Krishna Raman)

 * Distinguish REST API and js API version (Sam Roberts)

 * trace-object: records are stringified now (Ben Noordhuis)

 * instance-action: receive profile data via message (Sam Roberts)

 * Ignore .strong-pm (Sam Roberts)

 * Rename enableTracing field on instance model (Krishna Raman)

 * Enabled tracing to be enabled/disabled via API (Krishna Raman)

 * Move Minkelite dependency to PM (Krishna Raman)

 * tests: upgrade to tap@1 (Ryan Graham)

 * allow exited processes to be resumed if matched (Ryan Graham)

 * Support automatic stallout of cpu profiler (Sam Roberts)

 * profiling: create profile data object at start (Sam Roberts)

 * server-service: 404 if profile data not found (Sam Roberts)

 * meshctl: debug log the cpu prof response (Sam Roberts)

 * package: exclude .strong-pm from jscs coverage (Sam Roberts)

 * meshctl: debug as strong-mesh-models, not -client (Sam Roberts)


2015-05-08, Version 6.1.0
=========================

 * models: correct typos in description properties (Sam Roberts)

 * ctl: mention URL in all error messages (Ryan Graham)

 * meshctl: ls should be listed as global (Sam Roberts)

 * use process start time for real process upsert (Ryan Graham)

 * meshctl: clarify usage message (Sam Roberts)

 * meshctl: check remote API version (Sam Roberts)

 * client: implement checkRemoteApiSemver() (Sam Roberts)

 * .gitignore test patch.file output (Sam Roberts)

 * meshctl: fix message splitting (Sam Roberts)

 * fix null listening addresses in meshctl status (Ryan Graham)

 * server: persist instance.cpus to trigger resize (Sam Roberts)

 * lint: make lint run as pretest (Ryan Graham)

 * server: debug log instance.setClusterSize (Sam Roberts)

 * list listening ports in status report (Ryan Graham)


2015-04-30, Version 6.0.0
=========================

 * Update over Express metrics aggregation APIs (Krishna Raman)

 * package: remove strong-scheduler from README (Sam Roberts)

 * Skip failing tests (Sam Roberts)

 * Add server pid to API model (Krishna Raman)

 * Add server port to API model (Krishna Raman)

 * Update instance started status based on notifications (Krishna Raman)

 * Add info command to print server/api/driver info (Krishna Raman)

 * Update instance setSize based on status notification (Krishna Raman)

 * meshctl: ignore stopped procs in get-process-count (Sam Roberts)

 * Fix Api model dataSource error message (Krishna Raman)

 * meshctl: implement get-process-count SVC for tests (Sam Roberts)

 * meshctl: status not silent with no services (Sam Roberts)

 * client/server-service: check that instance exists (Sam Roberts)

 * test: remove config property from meshctl-status (Sam Roberts)

 * meshctl: use SVC in usage, not SVC_ID (Sam Roberts)

 * meshctl: quote service name (Sam Roberts)

 * Comment on recordInstanceInfo (Sam Roberts)

 * Fix where clause in LB hooks (Sam Roberts)

 * Fix tests (Krishna Raman)

 * sl-meshctl: don't call a service ID a "name" (Sam Roberts)

 * sl-meshctl: quote the command name in error message (Sam Roberts)

 * meshctl: fix usage, create's scale has a default (Sam Roberts)

 * service-manager: rename apiRequest to onApiRequest (Sam Roberts)

 * sl-meshctl: log server response to shutdown (Sam Roberts)

 * server: assert if error, not throw (Sam Roberts)

 * package: install sl-meshctl when linked (Sam Roberts)

 * server-service: lack of error doesn't mean success (Sam Roberts)

 * Add service find-or-create support (Krishna Raman)

 * lint: update eslint to 0.18 (Sam Roberts)

 * .gitignore: ignore minkelite test output (Sam Roberts)

 * service-manager: rename ctlRequest to onCtlRequest (Sam Roberts)

 * server-service: deploy() needs raw request (Sam Roberts)

 * test: fix typo in deploy-endpoints test name (Sam Roberts)

 * server: don't report status:wd as "unknown" (Sam Roberts)

 * server: assume err is already an Error (Sam Roberts)

 * create/list/destroy service (Krishna Raman)

 * Add method to locate service or target process Collect service summary from models Add verbose option Move commands into appropriate models (Krishna Raman)

 * Fix debug statement (Krishna Raman)

 * Add loopback metrics to express metrics api (Krishna Raman)

 * Remove redundant host/pid info from trace data (Krishna Raman)

 * Return decompressed traces (Krishna Raman)


2015-04-15, Version 5.0.3
=========================



2015-04-01, Version 5.0.2
=========================

 * meshctl: report pm versions in status (Sam Roberts)

 * Add patch command (Krishna Raman)

 * Add optional app ID for broserified loopback-boot (Krishna Raman)

 * Disable tracing by default. Have option to enable. (Krishna Raman)

 * Update minkelite option defaults and add jsdoc (Krishna Raman)

 * Add methods to retrieve trace data from minkelite (Krishna Raman)

 * Fix style errors (Krishna Raman)

 * implement TraceObject mesh model (Setogit)


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
