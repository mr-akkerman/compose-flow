import { Dispatch, SetStateAction } from 'react';
import { Node } from 'reactflow';
import { ServiceNodeData, PortNodeData, VolumeNodeData, NetworkNodeData } from './types';

interface ToolbarProps {
  setNodes: Dispatch<SetStateAction<Node[]>>;
  onGenerateCompose: () => void;
  onImportCompose: () => void;
}

export function Toolbar({ setNodes, onGenerateCompose, onImportCompose }: ToolbarProps) {
  const addNode = (type: string) => {
    setNodes((nds) => {
      // Получаем координаты для нового узла
      const position = getNewNodePosition(nds, type);
      
      // Создаем новый узел с улучшенными параметрами
      const newNode = {
        id: `${type}-${nds.length + 1}`,
        type,
        position,
        data: getInitialData(type),
        // Настраиваем стиль узла для лучшего отображения
        style: {
          width: getNodeWidth(type),
          height: 'auto',
        },
      };
      
      return [...nds, newNode];
    });
  };

  // Функция для определения оптимальной ширины разных типов узлов
  const getNodeWidth = (type: string) => {
    switch (type) {
      case 'service': return 200; // Немного меньше для сервисов
      default: return 150; // Еще компактнее для портов, томов и сетей
    }
  };

  // Функция для расчета позиции нового узла
  const getNewNodePosition = (nodes: Node[], type: string) => {
    // Базовые координаты
    const baseX = 150;
    const baseY = 150;
    
    // Отступы для разных типов узлов
    const offsetMap = {
      'service': { x: 0, y: 0 },
      'port': { x: -200, y: 0 },
      'volume': { x: -200, y: 100 },
      'network': { x: -200, y: 200 },
    };
    
    // Получаем смещение для данного типа
    const offset = offsetMap[type as keyof typeof offsetMap] || { x: 0, y: 0 };
    
    // Считаем узлы каждого типа для каскадного размещения
    const typeCount = nodes.filter(node => node.type === type).length;
    
    // Возвращаем позицию с учетом смещения и количества узлов данного типа
    return { 
      x: baseX + offset.x + typeCount * 15, 
      y: baseY + offset.y + typeCount * 15 
    };
  };

  return (
    <div className="flex flex-wrap gap-2 p-2 rounded-t-xl border-b border-white/10 bg-black/30 backdrop-blur-sm">
      <div className="flex gap-2">
        <button
          className="px-3 py-1.5 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium"
          onClick={() => addNode('service')}
        >
          + Сервис
        </button>
        <button
          className="px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors font-medium"
          onClick={() => addNode('port')}
        >
          + Порт
        </button>
        <button
          className="px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors font-medium"
          onClick={() => addNode('volume')}
        >
          + Том
        </button>
        <button
          className="px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors font-medium"
          onClick={() => addNode('network')}
        >
          + Сеть
        </button>
      </div>
      
      <div className="ml-auto flex gap-2">
        <button
          className="px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors font-medium shadow border border-white/10"
          onClick={onImportCompose}
        >
          Импортировать
        </button>
        <button
          className="px-3 py-1.5 text-sm bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-500 hover:to-primary-600 transition-all font-medium shadow-lg"
          onClick={onGenerateCompose}
        >
          Сгенерировать Docker Compose
        </button>
      </div>
    </div>
  );
}

function getInitialData(type: string) {
  switch (type) {
    case 'service':
      return {
        name: 'Новый сервис',
        image: 'nginx:latest',
        environment: {},
      } as ServiceNodeData;
    case 'port':
      return {
        hostPort: 80,
        containerPort: 80,
      } as PortNodeData;
    case 'volume':
      return {
        source: './data',
        target: '/data',
      } as VolumeNodeData;
    case 'network':
      return {
        name: 'new-network',
      } as NetworkNodeData;
    default:
      return {};
  }
} 