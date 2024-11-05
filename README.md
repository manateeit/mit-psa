# MSP Professional Services Automation (PSA) Tool

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

<!-- docker network connect sebastian_app-network server -->

## Getting Started

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## Prerequisits

Docker compose v2

Alternatively, you can use the Makefile to run all services or individual ones. This approach allows you to build and manage a production-like development infrastructure more easily:

# Makefile

### Run Sebastian in Production Mode
This command runs the Docker Compose file for Sebastian in detached mode.

```
make sebastian-docker-run
```

### Run Sebastian in Development Mode
This command runs the Docker Compose file for Sebastian in watch mode for development.
```
make sebastian-docker-dev
```

## Hocuspocus Commands

### Run Hocuspocus in Production Mode
This command runs the Hocuspocus Docker Compose file in detached mode without network.
```
make hocuspocus-docker-run
```

### Run Hocuspocus in Development Mode
This command runs the development mode for Hocuspocus using its own Makefile.
```
make hocuspocus-dev
```

## Server Commands

### Run Server in Production Mode
This command runs the Server Docker Compose file in detached mode without network.
```
make server-docker-run
```

### Run Server in Development Mode
This command runs the development mode for the server using its own Makefile.
```
make server-dev
```

## Setup Command

### Run Setup
This command runs the Setup Docker Compose file in detached mode without network.
```
make setup-docker-run
```

## USE SEBASTIAN

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Project Structure

This is our initial structure

```sh
sebastian/
│
├──docker-compose.ymal
│
├── helm/
│
├── hocuspocus/
│
├── servcer/
    │
    ├── public/
    │   └── images/
    │
    ├── src/
    │   ├── app/
    │   │   ├── api/
    │   │   │   └── route.ts
    │   │   ├── layout.tsx
    │   │   └── page.tsx
    │   │
    │   ├── components/
    │   │   ├── ui/
    │   │   ├── layout/
    │   │   └── features/
    │   │
    │   ├── lib/
    │   │
    │   ├── hooks/
    │   │
    │   ├── context/
    │   │
    │   ├── utils/
    │   │
    │   ├── types/
    │   │
    │   └── interfaces/
    │
    ├── __tests__/
    │   ├── components/
    │   ├── hooks/
    │   └── utils/
    │
    ├── .gitignore
    ├── next.config.js
    ├── tsconfig.json
    └── package.json
```

## New Features

### Billing Cycles

We've introduced a new billing cycle feature that allows for flexible billing periods for each company. This enhancement enables the system to generate invoices based on custom billing frequencies, such as weekly, bi-weekly, monthly, quarterly, semi-annually, or annually.

Key features include:
- Custom billing cycles per company
- Proration based on billing cycles
- Approval-based time entry billing
- Rollover of unapproved time entries

For detailed information on how to use and implement billing cycles, please refer to the [Billing Cycles Documentation](docs/billing_cycles.md).


## Features

- Client Management
- Service Catalog
- Time Entry
- Billing and Invoicing
- Reporting and Analytics
- International Tax Support (New!)


## International Tax Support

Our MSP PSA tool now includes robust international tax support, allowing for handling complex tax scenarios across different jurisdictions. This feature allows for:

- Composite taxes (taxes composed of multiple components)
- Threshold-based tax rates
- Tax holidays
- Reverse charge mechanisms

For detailed information on how to use and implement international tax support, please refer to the [International Tax Support Documentation](docs/international_tax_support.md).

## Testing

We use Vitest for unit testing and integration testing. To run the tests, use the following command:

```bash
npm run test
```

This will run all tests, including the new tests for the TaxService that cover the international tax support features.

To run tests for a specific file or directory, you can use:

```bash
npm run test -- path/to/test/file.test.ts
```

For example, to run only the TaxService tests:

```bash
npm run test -- src/test/services/taxService.test.ts
```

Make sure to run the tests after making any changes to the tax calculation logic or related components to ensure everything is working as expected.

## Documentation

For more information on specific features and implementations, please check the following documentation:

- [Billing Cycles](docs/billing_cycles.md)
- [Getting Started](docs/getting-started.md)
- [Billing](docs/billing.md)
- [Why Not Prorate Bucket Hours](docs/why_not_prorate_bucket_hours.md)
- [International Tax Support](docs/international_tax_support.md)
