# Setup ExplorViz in a Local Kind Cluster

## Prerequisites

The following tools must be installed and in $PATH:

- A [kind](https://kind.sigs.k8s.io/docs/user/quick-start/) kubernetes cluster
- A `kubectl` installation configured to interact with the kind cluster (use `kind export kubeconfig` optionally with `--name` if not using the default cluster name)
- A [helm](https://helm.sh/) installation (version 3.0.0+)

## Create and Manage the Kind Cluster

Use the `kind.py` script to create a local kind cluster and deploy software to it to run ExplorViz services.

### Usage

```lang=txt
usage: kind.py [-h] {init,setup} ...

ExplorViz cluster setup

positional arguments:
  {init,setup}
    init        Create and initialize a clean kind cluster, without deploying any applications
    setup       Deploy software to the cluster to run specific ExplorViz services

optional arguments:
  -h, --help    show this help message and exit
```

Use `kind.py init` to create and initialize a clean cluster named 'explorviz-dev'. No kind cluster with such name must exist beforehand. The configurations given in `kind-config.yaml` are used.

### Deploying Software

```lang=txt
usage: kind.py setup [-h] {kafka,adapter,landscape,trace,user,all} [{kafka,adapter,landscape,trace,user,all} ...]

positional arguments:
  {kafka,adapter,landscape,trace,user,all}
                        The service to setup

optional arguments:
  -h, --help            show this help message and exit
```

Use `kind.py setup <services>` to deploy the software required software for all services given in `<services>`. Multiple services can be given at once, e.g., `kind.py setup kafka adapter landscape`. Apache Kafka and the schema registry are deployed separately from services, with `kind.py setup kafka`. Additionally, `kind.py setup all` can be used to deploy the complete software stack for all services.

Based on the services given, the following software is deployed

| Service   | Deployed Software                                                                            |
| --------- | -------------------------------------------------------------------------------------------- |
| kafka     | Apache Kafka with single broker, Confluent Schema Registry (additionally creates all topics) |
| adapter   | OpenCensus Collector, Redis (Token Cache)                                                    |
| landscape | Apache Cassandra (Landscape Structure)                                                       |
| trace     | Apache Cassandra (Traces)                                                                    |
| user      | MongoDB (Token)                                                                              |
| all       | All of the above                                                                             |

## Ports

The following ports are forwarded to the host system.

| Port  | Description                          |
| ----- | ------------------------------------ |
| 32680 | HTTP API of the Landscape-Service    |
| 32681 | HTTP API of the Trace-Service        |
| 32682 | HTTP API of the User-Service         |
| 31500 | Endpoint of the OpenCensus Collector |
