# ExplorViz Deployment Repo

This repo contains different

- [Docker-Compose stacks](https://git.se.informatik.uni-kiel.de/ExplorViz/code/deployment/-/tree/master/docker) to start ExplorViz
- [Sample applications](https://git.se.informatik.uni-kiel.de/ExplorViz/code/deployment/-/tree/master/example-applications) with instrumentation and Docker-Compose files
- [A backend and application substitute](https://git.se.informatik.uni-kiel.de/ExplorViz/code/deployment/-/tree/master/demo-supplier), convenient for frontend development (demo-supplier)

## Pre-Commit Validation

The CI pipeline for this repository uses pre-commit with different hooks to validate if changes to files follow well-defined rules.

You can locally validate all files, therefore simulate the CI pipeline, with

`docker run --rm -ti -v $(pwd):/pre-commit explorviz/pre-commit`

The resulting container will run the defined [pre-commit hooks](https://git.se.informatik.uni-kiel.de/ExplorViz/code/deployment/-/blob/master/.pre-commit-config.yaml) and **also** modify files if necessary. You might need to run this command multiple times.
