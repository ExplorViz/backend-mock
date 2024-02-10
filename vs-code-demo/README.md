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

1. In VS Code, open up a file, e.g., `spring-petclinic-customers-service/org/springframework/samples/petclinic/customers/model/Owner.java`.
2. Press the `ExplorViz button` (globe symbol) in the left side navbar.
3. Press `Open Visualization` button and select the `Distributed Petclinic Sample` visualization.
4. Not all classes and packages are included in the visualization. However, the owner class, for example, shows how the interaction between VS Code and the visualization works.

## Add a project to the workspace

Copy the project in the projects-directory:

```sh
cp -pr <project> projects/
```

## Find project in VSCode

Open Folder -> Project
