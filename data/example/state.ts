import type {
  HostState,
  PrimaryServiceState,
  ServiceState,
  StorageState,
} from "@/types/system-map";

export const serviceState: Record<string, ServiceState> = {
  client: {
    status: "online",
    metrics: [
      { label: "Requests", value: "30/min" },
      { label: "Protocol", value: "HTTPS" },
    ],
  },
  api: {
    status: "online",
    metrics: [
      { label: "Latency", value: "18 ms" },
      { label: "Accepted", value: "99.8%" },
    ],
  },
  worker: {
    status: "online",
    metrics: [
      { label: "Active", value: "3" },
      { label: "Queue", value: "12" },
    ],
  },
};

export const hostState: Record<string, HostState> = {
  "host-edge": {
    status: "online",
    stats: [
      { label: "Region", value: "example-1", detail: "fictional" },
      { label: "Services", value: "1", detail: "public API" },
    ],
    ports: [
      { port: "443", service: "https" },
      { port: "8443", service: "health" },
    ],
  },
};

export const primaryState: PrimaryServiceState = {
  status: "online",
  metrics: [
    { label: "Throughput", value: "28/min" },
    { label: "Retries", value: "2" },
    { label: "Success", value: "99.6%" },
  ],
  rows: [
    { group: "States", name: "Queued", value: "12" },
    { group: "States", name: "Running", value: "3" },
    { group: "Outcomes", name: "Completed", value: "84%" },
    { group: "Outcomes", name: "Failed", value: "4%" },
  ],
  footer: "fictional snapshot",
};

export const storageState: Record<string, StorageState> = {
  archive: {
    status: "online",
    metrics: [
      { label: "Objects", value: "1,240" },
      { label: "Writes", value: "28/min" },
    ],
    used: "42 GB",
    total: "100 GB",
    fill: 0.42,
  },
};
