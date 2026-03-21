# Micro Mart Kubernetes Manifests

Apply everything with:

```sh
kubectl apply -k k8s-manifests
```

Each component is created in its own namespace.

Directory layout:

```text
k8s-manifests/
  namespaces/
  postgres/
  mongo/
  redis/
  kafka/
  user-service/
  product-service/
  inventory-service/
  order-service/
  notification-service/
  reviews-service/
  payment-service/
  cart-service/
  frontend/
```

Each component directory contains its own `kustomization.yaml` and split resource files such as `deployment.yaml`, `service.yaml`, `configmap.yaml`, and `secret.yaml` where applicable.

Frontend access:

```sh
kubectl -n frontend-ns get svc frontend
```

The frontend Service is exposed as `NodePort` on port `30080`.

Notes:

- Non-sensitive environment variables are now stored in per-service `ConfigMap` resources.
- Sensitive values such as passwords, JWT secrets, OAuth keys, and Razorpay credentials stay in `Secret` resources.
- `payment-service` is exposed on port `4004` because that is the port the app actually listens on.
- `cart-service` is exposed on port `3007`.
- `reviews-service` uses the `ayushsoni7777/micro_mart:review-service` image because that is the image tag present in the project.
- Cross-namespace service calls use fully qualified cluster DNS names such as `service.namespace.svc.cluster.local`.
- The static Vite frontend image was likely built with its API URLs at image build time. If the browser still calls `localhost` endpoints after deployment, rebuild the frontend image with cluster-facing URLs or add an ingress/reverse-proxy layer.
