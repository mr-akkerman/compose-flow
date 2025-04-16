import { useState, useRef } from 'react';
import { Node, Edge, XYPosition } from 'reactflow';
import YAML from 'yaml';
import { ServiceNodeData, PortNodeData, VolumeNodeData, NetworkNodeData } from './types';

interface ComposeImporterProps {
  onClose: () => void;
  onImport: (nodes: Node[], edges: Edge[]) => void;
}

export function ComposeImporter({ onClose, onImport }: ComposeImporterProps) {
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const composeConfig = YAML.parse(content);
        
        if (!composeConfig || typeof composeConfig !== 'object') {
          setError('Неверный формат YAML файла');
          return;
        }
        
        if (!composeConfig.services || typeof composeConfig.services !== 'object') {
          setError('Файл не содержит секцию services');
          return;
        }
        
        // Парсим конфигурацию и создаем ноды
        const { nodes, edges } = parseComposeConfig(composeConfig);
        onImport(nodes, edges);
        onClose();
      } catch (err) {
        setError(`Ошибка при обработке файла: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    
    reader.onerror = () => {
      setError('Ошибка при чтении файла');
    };
    
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (fileInputRef.current) {
        fileInputRef.current.files = e.dataTransfer.files;
        handleFileUpload({ target: { files: e.dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black/30 p-6 rounded-xl border border-primary-500/50 w-full max-w-lg shadow-xl backdrop-blur-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-medium text-white">Импорт Docker Compose</h2>
          <button 
            className="text-gray-400 hover:text-white transition-colors"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        
        <div className="mb-6">
          <div 
            className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              accept=".yml,.yaml" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            
            {fileName ? (
              <div>
                <p className="text-white mb-2">Выбран файл: <span className="text-primary-400">{fileName}</span></p>
                <button 
                  className="text-sm text-gray-400 hover:text-white underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFileName(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  Выбрать другой файл
                </button>
              </div>
            ) : (
              <>
                <svg className="w-12 h-12 mx-auto mb-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                <p className="text-lg text-white mb-1">Перетащите файл сюда или нажмите для выбора</p>
                <p className="text-sm text-gray-400">Поддерживаются файлы .yml и .yaml</p>
              </>
            )}
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-white">
              <p className="font-medium">Ошибка</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-3">
          <button 
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
            onClick={onClose}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

// Функция для парсинга Docker Compose файла
function parseComposeConfig(config: Record<string, unknown>): { nodes: Node[], edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  // Базовая позиция для сервисов
  const serviceX = 150;
  const serviceY = 100;
  
  // Создаем узлы для сервисов
  if (config.services) {
    Object.entries(config.services as Record<string, Record<string, unknown>>).forEach(([serviceName, serviceConfig], index) => {
      // Создаем смещение для каждого нового сервиса
      const servicePosition: XYPosition = {
        x: serviceX + index * 300,
        y: serviceY
      };
      
      // Создаем узел сервиса
      const serviceId = `service-${index + 1}`;
      nodes.push({
        id: serviceId,
        type: 'service',
        position: servicePosition,
        data: {
          name: serviceName,
          image: serviceConfig.image || 'latest',
          environment: parseEnvironment(serviceConfig.environment || {})
        } as ServiceNodeData,
        style: {
          width: 200,
          height: 'auto',
        },
      });
      
      // Обрабатываем порты
      if (serviceConfig.ports && Array.isArray(serviceConfig.ports)) {
        serviceConfig.ports.forEach((port: string | { published: number, target: number, protocol?: string }, portIndex: number) => {
          let hostPort: number, containerPort: number, protocol: string | undefined;
          
          if (typeof port === 'string') {
            // Парсим строку вида "80:8080/tcp"
            const portParts = port.split(':');
            const protocolParts = (portParts[portParts.length - 1] || '').split('/');
            
            hostPort = parseInt(portParts[0], 10);
            containerPort = parseInt(protocolParts[0], 10);
            protocol = protocolParts[1];
            
            if (portParts.length > 1) {
              hostPort = parseInt(portParts[0], 10);
              containerPort = parseInt(protocolParts[0], 10);
            } else {
              // Если указан только один порт, то он одинаковый и для хоста, и для контейнера
              containerPort = hostPort;
            }
          } else {
            // Используем объект с полями
            hostPort = port.published;
            containerPort = port.target;
            protocol = port.protocol;
          }
          
          // Позиция узла порта слева от сервиса
          const portPosition: XYPosition = {
            x: servicePosition.x - 250,
            y: servicePosition.y + portIndex * 120
          };
          
          // Создаем узел порта
          const portId = `port-${index + 1}-${portIndex + 1}`;
          nodes.push({
            id: portId,
            type: 'port',
            position: portPosition,
            data: {
              hostPort,
              containerPort,
              protocol
            } as PortNodeData,
            style: {
              width: 150,
              height: 'auto',
            },
          });
          
          // Создаем связь между портом и сервисом
          edges.push({
            id: `edge-${portId}-${serviceId}`,
            source: portId,
            target: serviceId,
            sourceHandle: 'right',
            targetHandle: 'left',
          });
        });
      }
      
      // Обрабатываем тома
      if (serviceConfig.volumes && Array.isArray(serviceConfig.volumes)) {
        serviceConfig.volumes.forEach((volume: string | { source: string, target: string, type?: string }, volumeIndex: number) => {
          let source: string, target: string, mode: 'rw' | 'ro' | undefined;
          
          if (typeof volume === 'string') {
            // Парсим строку вида "./data:/var/data:ro"
            const volumeParts = volume.split(':');
            source = volumeParts[0];
            target = volumeParts[1] || '';
            mode = volumeParts[2] === 'ro' ? 'ro' : 'rw';
          } else {
            // Используем объект с полями
            source = volume.source;
            target = volume.target;
            mode = volume.type === 'ro' ? 'ro' : 'rw';
          }
          
          // Проверяем, является ли источник именованным томом
          // Если источник не начинается с ./ или /, то это именованный том
          if (!source.startsWith('./') && !source.startsWith('/')) {
            // Обрабатываем именованные тома, их нужно подключить к сервису
            const volumePosition: XYPosition = {
              x: servicePosition.x - 250,
              y: servicePosition.y + 120 + (volumeIndex * 120)
            };
            
            const volumeId = `volume-${index + 1}-${volumeIndex + 1}`;
            nodes.push({
              id: volumeId,
              type: 'volume',
              position: volumePosition,
              data: {
                source,
                target,
                mode
              } as VolumeNodeData,
              style: {
                width: 150,
                height: 'auto',
              },
            });
            
            // Создаем связь между томом и сервисом
            edges.push({
              id: `edge-${volumeId}-${serviceId}`,
              source: volumeId,
              target: serviceId,
              sourceHandle: 'right',
              targetHandle: 'left',
            });
          }
        });
      }
      
      // Обрабатываем сети
      if (serviceConfig.networks) {
        const networks = Array.isArray(serviceConfig.networks) 
          ? serviceConfig.networks 
          : Object.keys(serviceConfig.networks);
          
        networks.forEach((networkName: string, networkIndex: number) => {
          // Проверяем, создана ли уже сеть с таким именем
          const existingNetwork = nodes.find(node => 
            node.type === 'network' && (node.data as NetworkNodeData).name === networkName
          );
          
          // Позиция узла сети слева от сервиса
          const networkPosition: XYPosition = {
            x: servicePosition.x - 250,
            y: servicePosition.y + 240 + (networkIndex * 120)
          };
          
          // Если сеть уже существует, используем её, иначе создаем новую
          let networkId: string;
          if (existingNetwork) {
            networkId = existingNetwork.id;
          } else {
            networkId = `network-${networkIndex + 1}`;
            
            // Создаем узел сети
            nodes.push({
              id: networkId,
              type: 'network',
              position: networkPosition,
              data: {
                name: networkName,
                driver: config.networks?.[networkName]?.driver
              } as NetworkNodeData,
              style: {
                width: 150,
                height: 'auto',
              },
            });
          }
          
          // Создаем связь между сетью и сервисом
          edges.push({
            id: `edge-${networkId}-${serviceId}`,
            source: networkId,
            target: serviceId,
            sourceHandle: 'right',
            targetHandle: 'left',
          });
        });
      }
      
      // Обрабатываем зависимости
      if (serviceConfig.depends_on) {
        const dependencies = Array.isArray(serviceConfig.depends_on) 
          ? serviceConfig.depends_on 
          : Object.keys(serviceConfig.depends_on);
          
        dependencies.forEach((dependencyName: string) => {
          // Находим сервис, от которого зависит текущий
          const dependencyNode = nodes.find(node => 
            node.type === 'service' && (node.data as ServiceNodeData).name === dependencyName
          );
          
          if (dependencyNode) {
            // Создаем связь зависимости между сервисами
            edges.push({
              id: `edge-dependency-${dependencyNode.id}-${serviceId}`,
              source: dependencyNode.id,
              target: serviceId,
              sourceHandle: 'bottom',
              targetHandle: 'top',
            });
          }
        });
      }
    });
  }
  
  return { nodes, edges };
}

// Парсим переменные окружения
function parseEnvironment(env: Record<string, string> | string[] | undefined): Record<string, string> {
  if (Array.isArray(env)) {
    // Если переменные заданы в виде массива строк "KEY=VALUE"
    const result: Record<string, string> = {};
    env.forEach(item => {
      const parts = item.split('=');
      if (parts.length >= 2) {
        const key = parts[0];
        const value = parts.slice(1).join('=');
        result[key] = value;
      }
    });
    return result;
  } else if (env && typeof env === 'object') {
    // Если переменные заданы в виде объекта { KEY: "VALUE" }
    return env as Record<string, string>;
  }
  
  return {};
} 