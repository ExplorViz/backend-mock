#!/usr/bin/env python3

import argparse, sys, subprocess
from typing import Optional




def init():
    """
    Creates and initializes a new kind cluster with name 'explorviz-dev' and configurations given in
    './kind-config.yaml'.
    """
    print('[*] Creating explorviz kind cluster\n')
    subprocess.run(
        ['kind', 'create', 'cluster', '--wait',  '3m',  '--name',  'explorviz-dev', '--config=kind-config.yaml']
    ).check_returncode()


    print('\n[*] setting kubectl context\n')
    subprocess.run(['kind', 'export', 'kubeconfig', '--name', 'explorviz-dev'])

    print('\n[*] adding bitnami helm repository')
    subprocess.run(['helm', 'repo', 'add', 'bitnami', 'https://charts.bitnami.com/bitnami'])

all_srvc = ['kafka', 'adapter', 'landscape', 'trace', 'user']

def setup(services):
    """
    Deploy software (stacks) into the cluster based on the services.
    """

    if 'all' in services:
        services = all_srvc

    if 'kafka' in services:
        print('[*] Installing Kafka\n')
        subprocess.run(['helm', 'install', '-f', 'kafka/values.yml', 'kafka', 'bitnami/kafka'])
        print('\n[*] Installing Schemaregistry\n')
        subprocess.run(['kubectl', 'create', '-f', 'registry/manifest.yml'])
        print('\n[*] Waiting for Kafka to become ready...\n')
        subprocess.run(['kubectl', 'wait', '--for=condition=Ready', '--timeout=360s', 'pod/kafka-0'])
        print('\n[*] Kafka is ready, creating topics...\n')
        subprocess.run(['./create_topics.sh'])

    if 'adapter' in services:
        print('[*] Installing OpenCensus Collector\n')
        subprocess.run(['kubectl', 'create', '-f', 'oc-collector/manifest.yml'])
        print('\n[*] Installing Redis (Token Cache)\n')
        subprocess.run(['helm', 'install', '-f', 'redis-adapter/values.yml', 'redis-adapter', 'bitnami/redis'])

    if 'landscape' in services:
        print('[*] Installing Cassandra (Landscape Structure)\n')
        subprocess.run(['helm', 'install', '-f', 'cassandra-structure/values.yml', 'cassandra-structure', 'bitnami/cassandra'])

    if 'trace' in services:
        print('[*] Installing Cassandra (Traces)\n')
        subprocess.run(['helm', 'install', '-f', 'cassandra-traces/values.yml', 'cassandra-traces', 'bitnami/cassandra'])

    if 'user' in services:
        print('[*] Installing MongoDB (Token) \n')
        subprocess.run(['helm', 'install', '-f', 'mongodb-token/values.yml', 'mongo-token', 'bitnami/mongodb'])


def parser():
    parser = argparse.ArgumentParser(prog="kind.py", description='ExplorViz cluster setup')
    parser.set_defaults(command = None)
    subparsers = parser.add_subparsers()

    init_parser = subparsers.add_parser('init', help='Create and initialize a clean kind cluster, without deploying any applications')
    init_parser.set_defaults(command = 'init')

    setup_parser = subparsers.add_parser('setup', help='Deploy software to the cluster to run specific ExplorViz services')
    setup_parser.set_defaults(command = 'setup')
    setup_parser.add_argument('services', nargs='+', choices=all_srvc+['all'], help='The service to setup')

    return parser



if __name__ == '__main__':
    ns = parser().parse_args(sys.argv[1:])
    if ns.command == 'init':
        init()
    elif ns.command == 'setup':
        setup(ns.services)
    else:
        parser().print_help()
