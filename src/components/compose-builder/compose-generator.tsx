import { Node, Edge } from 'reactflow';
import { ServiceNodeData, PortNodeData, VolumeNodeData, NetworkNodeData } from './types';
import YAML from 'yaml';

interface ComposeGeneratorProps {
  nodes: Node[];
  edges: Edge[];
  onClose: () => void;
}

interface ComposeService {
  image: string;
  ports?: string[];
  volumes?: string[];
  networks?: string[];
  environment?: Record<string, string>;
  depends_on?: string[];
}

interface ComposeConfig {
  version: string;
  services: Record<string, ComposeService>;
  volumes?: Record<string, any>;
  networks?: Record<string, any>;
}

export function ComposeGenerator({ nodes, edges, onClose }: ComposeGeneratorProps) {
  // Функция для получения сервисов и их соединений
  const getServiceConnections = () => {
    const services: Record<string, ComposeService> = {};
    const volumeConfigs: Record<string, any> = {};
    const networkConfigs: Record<string, any> = {};
    
    // Получаем все сервисы
    nodes.filter(node => node.type === 'service').forEach(node => {
      const serviceData = node.data as ServiceNodeData;
      services[serviceData.name] = {
        image: serviceData.image,
        environment: Object.keys(serviceData.environment).length > 0 ? serviceData.environment : undefined
      };
    });
    
    // Находим соединения между сервисами и другими компонентами
    edges.forEach(edge => {
      const sourceNode = nodes.find(node => node.id === edge.source);
      const targetNode = nodes.find(node => node.id === edge.target);
      
      if (!sourceNode || !targetNode) return;
      
      // Специальная обработка для соединений компонентов с сервисом через боковые порты
      const isComponentToService = 
        ['port', 'volume', 'network'].includes(sourceNode.type as string) && 
        targetNode.type === 'service' &&
        edge.sourceHandle === 'right' && 
        edge.targetHandle === 'left';
      
      // Специальная обработка для соединений между сервисами (зависимости)
      const isServiceToService = 
        sourceNode.type === 'service' && 
        targetNode.type === 'service' &&
        edge.sourceHandle === 'bottom' && 
        edge.targetHandle === 'top';
      
      // Если соединение от порта к сервису (через боковой порт)
      if (sourceNode.type === 'port' && targetNode.type === 'service' && isComponentToService) {
        const portData = sourceNode.data as PortNodeData;
        const serviceName = (targetNode.data as ServiceNodeData).name;
        
        if (!services[serviceName].ports) {
          services[serviceName].ports = [];
        }
        
        const portMapping = `${portData.hostPort}:${portData.containerPort}${portData.protocol ? '/' + portData.protocol : ''}`;
        services[serviceName].ports!.push(portMapping);
      }
      
      // Если соединение от тома к сервису (через боковой порт)
      if (sourceNode.type === 'volume' && targetNode.type === 'service' && isComponentToService) {
        const volumeData = sourceNode.data as VolumeNodeData;
        const serviceName = (targetNode.data as ServiceNodeData).name;
        
        if (!services[serviceName].volumes) {
          services[serviceName].volumes = [];
        }
        
        // Создаем имя тома на основе его id
        const volumeName = `volume_${sourceNode.id.replace('volume-', '')}`;
        
        // Добавляем том к сервису
        const volumeMapping = `${volumeName}:${volumeData.target}${volumeData.mode ? ':' + volumeData.mode : ''}`;
        services[serviceName].volumes!.push(volumeMapping);
        
        // Добавляем конфигурацию тома
        volumeConfigs[volumeName] = {
          driver: 'local',
          driver_opts: {
            type: 'none',
            device: volumeData.source,
            o: 'bind'
          }
        };
      }
      
      // Если соединение от сети к сервису (через боковой порт)
      if (sourceNode.type === 'network' && targetNode.type === 'service' && isComponentToService) {
        const networkData = sourceNode.data as NetworkNodeData;
        const serviceName = (targetNode.data as ServiceNodeData).name;
        
        if (!services[serviceName].networks) {
          services[serviceName].networks = [];
        }
        
        // Добавляем сеть к сервису
        services[serviceName].networks!.push(networkData.name);
        
        // Добавляем конфигурацию сети
        networkConfigs[networkData.name] = {
          driver: networkData.driver || 'bridge'
        };
      }
      
      // Если соединение от сервиса к сервису (зависимость через верхний и нижний порты)
      if (isServiceToService) {
        const sourceServiceName = (sourceNode.data as ServiceNodeData).name;
        const targetServiceName = (targetNode.data as ServiceNodeData).name;
        
        // Целевой сервис зависит от исходного сервиса
        if (!services[targetServiceName].depends_on) {
          services[targetServiceName].depends_on = [];
        }
        
        services[targetServiceName].depends_on!.push(sourceServiceName);
      }
    });
    
    return {
      services,
      volumes: Object.keys(volumeConfigs).length > 0 ? volumeConfigs : undefined,
      networks: Object.keys(networkConfigs).length > 0 ? networkConfigs : undefined
    };
  };
  
  // Генерируем Docker Compose конфигурацию
  const generateComposeConfig = (): ComposeConfig => {
    const { services, volumes, networks } = getServiceConnections();
    
    return {
      version: '3',
      services,
      volumes,
      networks
    };
  };
  
  // Получаем YAML представление конфигурации
  const composeYaml = YAML.stringify(generateComposeConfig());
  
  const handleDownload = () => {
    const blob = new Blob([composeYaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'docker-compose.yml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black/30 p-6 rounded-xl border border-primary-500/50 w-full max-w-4xl shadow-2xl backdrop-blur-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-medium text-white">Docker Compose файл</h2>
          <button 
            className="text-gray-400 hover:text-white transition-colors"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        
        <div className="mb-6 bg-black/40 p-5 rounded-lg border border-white/10 overflow-auto h-96 text-gray-300 font-mono">
          <pre className="text-sm">{composeYaml}</pre>
        </div>
        
        <div className="flex justify-end gap-3">
          <button 
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors font-medium"
            onClick={onClose}
          >
            Закрыть
          </button>
          <button 
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-500 hover:to-green-600 transition-all font-medium shadow-lg"
            onClick={handleDownload}
          >
            Скачать docker-compose.yml
          </button>
        </div>
      </div>
    </div>
  );
} 