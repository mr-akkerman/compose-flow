import { NodeProps } from 'reactflow';

export interface ServiceNodeData {
  name: string;
  image: string;
  environment: Record<string, string>;
}

export interface PortNodeData {
  hostPort: number;
  containerPort: number;
  protocol?: string;
}

export interface VolumeNodeData {
  source: string;
  target: string;
  mode?: 'rw' | 'ro';
}

export interface NetworkNodeData {
  name: string;
  driver?: string;
}

export type NodeType = 'service' | 'port' | 'volume' | 'network';

// Добавляем тип для активного узла, который редактируется
export interface ActiveNode {
  id: string;
  type: NodeType;
  data: ServiceNodeData | PortNodeData | VolumeNodeData | NetworkNodeData;
}

// Типы соединений для обеспечения правильных подключений
export const CONNECTION_RULES: Record<NodeType, { accepts: NodeType[], connectsTo: NodeType[] }> = {
  service: {
    // Сервис принимает зависимости от других сервисов через верхний коннектор,
    // а порты/тома/сети через левый коннектор
    accepts: ['service'], 
    connectsTo: ['service'],
  },
  port: {
    accepts: [],
    connectsTo: ['service'],
  },
  volume: {
    accepts: [],
    connectsTo: ['service'],
  },
  network: {
    accepts: [],
    connectsTo: ['service'],
  },
};

export type ServiceNodeProps = NodeProps<ServiceNodeData>;
export type PortNodeProps = NodeProps<PortNodeData>;
export type VolumeNodeProps = NodeProps<VolumeNodeData>;
export type NetworkNodeProps = NodeProps<NetworkNodeData>; 