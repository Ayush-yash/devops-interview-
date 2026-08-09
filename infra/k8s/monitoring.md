# Kubernetes Monitoring with Prometheus & Grafana

This document guides you through deploying Prometheus and Grafana stack to collect telemetry metrics from the AI DevOps Interview Platform.

---

## 1. Deploy Prometheus & Grafana Stack

The easiest and most production-ready way to install Prometheus and Grafana in a Kubernetes cluster is using the official [kube-prometheus-stack Helm Chart](https://github.com/prometheus-community/helm-charts/tree/main/charts/kube-prometheus-stack).

### Steps:
1. **Add Helm Repo**:
   ```bash
   helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
   helm repo update
   ```
2. **Install Chart**:
   Create a dedicated `monitoring` namespace and deploy the stack:
   ```bash
   helm install prometheus-stack prometheus-community/kube-prometheus-stack \
     --namespace monitoring \
     --create-namespace
   ```

---

## 2. Configure Service Scraping (`ServiceMonitor`)

Prometheus Operator uses custom resource definitions (CRD) called `ServiceMonitor` to discover targets. We need to create a `ServiceMonitor` targeting our backend service.

Apply this manifest to configure target scraping on the `/api/metrics` endpoint:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: backend-monitor
  namespace: devops-platform
  labels:
    release: prometheus-stack # Must match the label release of your Prometheus install
spec:
  selector:
    matchLabels:
      app: backend
  endpoints:
    - port: http
      path: /api/metrics
      interval: 15s
      scrapeTimeout: 10s
```

---

## 3. Visualizing Metrics in Grafana

1. **Access Grafana Dashboard**:
   Forward the Grafana port locally:
   ```bash
   kubectl port-forward deployment/prometheus-stack-grafana 3000:3000 -n monitoring
   ```
   Open `http://localhost:3000` (default login credentials: `admin` / `prom-operator`).

2. **Add Custom Dashboard**:
   Import or create panel graphs querying the metrics exposed by the backend `/api/metrics` endpoint. Reference PromQL queries are documented in the root `README.md` file.
