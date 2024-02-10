# Visual Studio Code - Demo Stack

This docker compose starts a browser-based VS Code with included ExplorViz VS code extension and the frontend-demo stack.

## Getting started

To update all stack-related images:

```sh
docker compose pull
```

To start the stack:

```sh
docker compose up -d
```

To stop the stack:

```sh
docker compose down -v
```

--

Open VS Code in Browser:

http://localhost:3001/?folder=/home/workspace/projects/spring-petclinic-microservices

### VS Code instructions

## Add a project to the workspace

Copy the project in the projects-directory:

```sh
cp -pr <project> projects/
```

## Find project in VSCode

Open Folder -> Project
