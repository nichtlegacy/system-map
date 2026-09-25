"use client";

import { memo } from "react";
import type { Node, NodeProps } from "@xyflow/react";

import type { ServiceNodeData } from "@/types/system-map";
import { Card, CardBody, CardHead, HostLine, Metrics } from "./primitives";

/** 176px with a description, 120px for satellites inside a cluster. */
function ServiceNodeComponent({ data }: NodeProps<Node<ServiceNodeData>>) {
  return (
    <Card height={data.compact ? 116 : 200}>
      <CardHead
        icon={data.icon}
        logo={data.logo}
        logoLight={data.logoLight}
        name={data.name}
        category={data.category}
        status={data.status}
        compact={data.compact}
      />
      {!data.compact && <CardBody>{data.description}</CardBody>}
      <Metrics items={data.metrics} rows={data.compact ? 2 : 3} />
      {!data.compact && <HostLine>{data.host}</HostLine>}
    </Card>
  );
}

export const ServiceNode = memo(ServiceNodeComponent);
