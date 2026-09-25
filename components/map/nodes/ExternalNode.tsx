"use client";

import { memo } from "react";
import type { Node, NodeProps } from "@xyflow/react";

import type { ExternalNodeData } from "@/types/system-map";
import { Card, CardBody, CardHead, HostLine, Metrics } from "./primitives";

/**
 * 200px with a description, 116px where the card only has to name a thing and
 * say where it answers; a provider ladder can contain many
 * of those, and prose on each would be sixteen restatements of its own name.
 */
function ExternalNodeComponent({ data }: NodeProps<Node<ExternalNodeData>>) {
  return (
    <Card height={data.compact ? 116 : 200} variant="dashed">
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
      {!data.compact && <HostLine>{data.note ?? "outside the host"}</HostLine>}
    </Card>
  );
}

export const ExternalNode = memo(ExternalNodeComponent);
