# Comanda Virtual - Frontend

Sistema de comanda virtual para a Luderia, desenvolvido em Angular 18.

## Sobre o Projeto

O Comanda Virtual é um sistema que permite aos clientes fazerem pedidos através de um aplicativo web, eliminando a necessidade de atendimento presencial. O sistema possui duas interfaces:

- **Interface Pública**: Para clientes fazerem pedidos
- **Interface Admin**: Para gestão de comandas e produtos

## Integração com API

O frontend está integrado com a API REST Comanda Virtual. Para mais detalhes sobre a integração, consulte [INTEGRACAO_API.md](./INTEGRACAO_API.md).

### URLs da API:
- **Desenvolvimento**: `https://localhost:7000/api`  
- **Produção**: `https://comanda-virtual-api.azurewebsites.net/api`

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
