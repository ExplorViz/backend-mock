/*
@formatter:off
 */

CREATE KEYSPACE IF NOT EXISTS explorviz WITH replication = {'class':'SimpleStrategy', 'replication_factor':1};

// Find spans in a specific time range (used to find aggregate call counts)
CREATE TABLE IF NOT EXISTS explorviz.span_by_time
(
    landscape_token uuid,
    start_time_s    int,
    start_time_ns   int,
    method_hash     bigint,
    span_id         bigint,
    trace_id        bigint, // to be able to select full trace from span_by_traceid?
    PRIMARY KEY ((landscape_token, start_time_s), start_time_ns, method_hash, span_id)
);

// SELECT trace_id FROM traceid_by_time WHERE landscape_token = X AND start_time_s = X;

// Get complete traces by their trace id
CREATE TABLE IF NOT EXISTS explorviz.span_by_traceid
(
    landscape_token uuid,
    trace_id        bigint,
    span_id         bigint,
    parent_span_id  bigint,
    start_time_s    int,
    start_time_ns   int,
    end_time_s      int,
    end_time_ns     int,
    method_hash     bigint,
    PRIMARY KEY ((landscape_token, trace_id), span_id) // parent_span_id as first clustering key to find parent=0 quickly?
);

// Find traces that contain a span with a certain method_hash
CREATE TABLE IF NOT EXISTS explorviz.trace_by_hash
(
    landscape_token uuid,
    method_hash     bigint,
    time_bucket     int,
    trace_id        bigint,
    PRIMARY KEY ((landscape_token, method_hash, time_bucket), trace_id)
);

//SELECT trace_id FROM trace_by_hash WHERE landscape_token = X AND method_hash = X AND time_bucket = TODAY();

// Find traces by time
CREATE TABLE IF NOT EXISTS explorviz.trace_by_time
(
    landscape_token uuid,
    start_time_s    int,
    start_time_ns   int,
    end_time_s      int,
    end_time_ns     int,
    trace_id        bigint,
    PRIMARY KEY ((landscape_token, start_time_s), start_time_ns, trace_id)
);

//SELECT * FROM span_by_traceid WHERE landscape_token = X AND trace_id IN (previous result);

// Map method_hash to metadata
CREATE TABLE IF NOT EXISTS explorviz.span_structure
(
    landscape_token      uuid,
    method_hash          bigint,
    node_ip_address      text,
    application_name     text,
    application_language text,
    application_instance int,
    method_fqn           text,
    time_seen            bigint,
    PRIMARY KEY ((landscape_token), method_hash)
);
