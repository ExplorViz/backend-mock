# ExplorViz Deployment Repo

This repo contains different

- A [Docker-Compose stack](https://github.com/ExplorViz/deployment/tree/master/docker) to start ExplorViz with all its components.
- A [backend and application substitute](https://github.com/ExplorViz/deployment/tree/master/demo-supplier), convenient for frontend development (demo-supplier).
- A [frontend-demo](https://github.com/ExplorViz/deployment/tree/master/frontend-demo) Docker-Compose stack to start the ExplorViz frontend with the backend substitute and application substitute.
- A [vs-code-demo](https://github.com/ExplorViz/deployment/tree/master/vs-code-demo) Docker-Compose stack to start a browser-based VS Code with the ExplorViz VS code extension and the frontend-demo stack.
- [Sample applications](https://github.com/ExplorViz/deployment/tree/master/example-applications) with instrumentation and Docker-Compose files.

## Pre-Commit Validation

The CI pipeline for this repository uses pre-commit with different hooks to validate if changes to files follow well-defined rules.

You can locally validate all files, therefore simulate the CI pipeline, with

`docker run --rm -ti -v $(pwd):/pre-commit explorviz/pre-commit`

The resulting container will run the defined [pre-commit hooks](https://github.com/ExplorViz/deployment/tree/master/.pre-commit-config.yaml) and **also** modify files if necessary. You might need to run this command multiple times.
