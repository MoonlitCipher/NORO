# Noro customer app

Responsive customer frontend for Noro, a parcel delivery management platform. The current build is an interactive UI prototype backed by local mock data.

## Included flows

- Customer sign-in and registration
- Four-step booking flow: route, package, vehicle, and payment
- Fare review and booking confirmation
- Live-tracking presentation and delivery timeline
- Order history, order details, invoices, and ratings
- Notifications, saved addresses, profile preferences, and support tickets
- Shared customer shell, navigation, headers, cards, and state

## Run locally

```bash
npm install
npm run dev
```

Production validation:

```bash
npm run lint
npm run build
```

The UI currently uses frontend state and representative data. API, payment-gateway, authentication, maps, and WebSocket integration points remain to be connected to the backend contracts in the SRS.
