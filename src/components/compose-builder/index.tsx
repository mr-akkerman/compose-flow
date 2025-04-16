'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Connection,
  Edge,
  Node,
  NodeMouseHandler,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { ServiceNode, PortNode, VolumeNode, NetworkNode } from './nodes';
import { Toolbar } from './toolbar';
import { NodeEditor } from './node-editor';
import { ComposeGenerator } from './compose-generator';
import { ComposeImporter } from './compose-importer';
import { ActiveNode, CONNECTION_RULES, NodeType } from './types';

const nodeTypes = {
  service: ServiceNode,
  port: PortNode,
  volume: VolumeNode,
  network: NetworkNode,
};

// Настройки для форматирования соединений
const defaultEdgeOptions = {
  style: { stroke: '#ffffff20', strokeWidth: 2 },
  animated: true,
  type: 'smoothstep',
};

export function ComposeBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [activeNode, setActiveNode] = useState<ActiveNode | null>(null);
  const [showComposeGenerator, setShowComposeGenerator] = useState(false);
  const [showComposeImporter, setShowComposeImporter] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Обработчик для подключения узлов с проверкой правил подключения
  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = nodes.find(node => node.id === params.source);
      const targetNode = nodes.find(node => node.id === params.target);
      
      if (!sourceNode || !targetNode) return;
      
      const sourceType = sourceNode.type as NodeType;
      const targetType = targetNode.type as NodeType;
      
      // Специальная обработка для соединений между сервисами
      if (sourceType === 'service' && targetType === 'service') {
        // Разрешаем соединения только от нижнего порта (source) к верхнему порту (target)
        if (params.sourceHandle === 'bottom' && params.targetHandle === 'top') {
          setEdges((eds) => addEdge(params, eds));
        }
        return;
      }
      
      // Специальная обработка для соединения порта/тома/сети с сервисом
      if (['port', 'volume', 'network'].includes(sourceType) && targetType === 'service') {
        // Разрешаем соединения только от правого порта компонента к левому порту сервиса
        if (params.sourceHandle === 'right' && params.targetHandle === 'left') {
          setEdges((eds) => addEdge(params, eds));
        }
        return;
      }
      
      // Проверяем, может ли исходный узел подключаться к целевому
      if (CONNECTION_RULES[sourceType].connectsTo.includes(targetType)) {
        setEdges((eds) => addEdge(params, eds));
      }
      // Проверяем, может ли целевой узел принимать соединения от исходного
      else if (CONNECTION_RULES[targetType].accepts.includes(sourceType)) {
        setEdges((eds) => addEdge(params, eds));
      }
    },
    [nodes, setEdges]
  );

  // Обработчик для редактирования узла при клике
  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      setActiveNode({
        id: node.id,
        type: node.type as NodeType,
        data: node.data,
      });
    },
    []
  );

  // Обработчик для сохранения изменений узла
  const handleSaveNodeChanges = useCallback(
    (id: string, data: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === id) {
            return {
              ...node,
              data,
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  // Инициализация инстанса ReactFlow и центрирование вида
  const onInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
    
    // Задержка для корректной инициализации
    setTimeout(() => {
      instance.fitView({ padding: 0.2 });
      instance.zoomTo(0.6); // Уменьшаем начальный масштаб с 0.8 до 0.6
    }, 50);
  }, []);

  // Автоматическое центрирование вида при изменении нод
  useEffect(() => {
    if (reactFlowInstance && nodes.length > 0) {
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2, includeHiddenNodes: false });
      }, 50);
    }
  }, [nodes.length, reactFlowInstance]);

  // Закрытие окна редактирования
  const handleCloseEditor = useCallback(() => {
    setActiveNode(null);
  }, []);

  // Открытие генератора Docker Compose
  const handleOpenComposeGenerator = useCallback(() => {
    setShowComposeGenerator(true);
  }, []);

  // Закрытие генератора Docker Compose
  const handleCloseComposeGenerator = useCallback(() => {
    setShowComposeGenerator(false);
  }, []);

  // Функция для удаления узла и всех его соединений
  const handleDeleteNode = useCallback((nodeId: string) => {
    // Удаляем связи, связанные с этим узлом
    setEdges((eds) => eds.filter(edge => 
      edge.source !== nodeId && edge.target !== nodeId
    ));
    
    // Удаляем узел
    setNodes((nds) => nds.filter(node => node.id !== nodeId));
    
    // Если это активный узел, закрываем панель редактирования
    if (activeNode && activeNode.id === nodeId) {
      setActiveNode(null);
    }
  }, [activeNode, setEdges, setNodes]);

  // Функция для удаления связи
  const handleDeleteEdge = useCallback((edgeId: string) => {
    setEdges((eds) => eds.filter(edge => edge.id !== edgeId));
  }, [setEdges]);

  // Слушаем события удаления узлов из компонентов узлов
  useEffect(() => {
    const nodeDeleteListener = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.id) {
        handleDeleteNode(customEvent.detail.id);
      }
    };
    
    document.addEventListener('node-delete', nodeDeleteListener);
    
    return () => {
      document.removeEventListener('node-delete', nodeDeleteListener);
    };
  }, [handleDeleteNode]);

  // Обработчик для ребер - добавляем возможность удаления по клику
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    // Предотвращаем распространение события клика
    event.stopPropagation();
    
    // Добавляем диалог подтверждения для удаления связи
    if (window.confirm('Вы уверены, что хотите удалить это соединение?')) {
      handleDeleteEdge(edge.id);
    }
  }, [handleDeleteEdge]);

  // Функция для импорта данных из Docker Compose
  const handleImportCompose = useCallback((importedNodes: Node[], importedEdges: Edge[]) => {
    // Заменяем текущие ноды и ребра импортированными
    setNodes(importedNodes);
    setEdges(importedEdges);
    
    // После импорта центрируем вид
    setTimeout(() => {
      if (reactFlowInstance) {
        reactFlowInstance.fitView({ padding: 0.3 });
      }
    }, 100);
  }, [reactFlowInstance, setNodes, setEdges]);

  // Открытие импортера Docker Compose
  const handleOpenComposeImporter = useCallback(() => {
    setShowComposeImporter(true);
  }, []);

  // Закрытие импортера Docker Compose
  const handleCloseComposeImporter = useCallback(() => {
    setShowComposeImporter(false);
  }, []);

  return (
    <div className="bg-black/20 border border-white/10 backdrop-blur-sm rounded-xl shadow-xl h-[calc(100vh-32px)] flex flex-col">
      <Toolbar 
        setNodes={setNodes} 
        onGenerateCompose={handleOpenComposeGenerator} 
        onImportCompose={handleOpenComposeImporter}
      />
      <div className="reactflow-wrapper flex-1" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          onInit={onInit}
          minZoom={0.2}
          maxZoom={1.5}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          attributionPosition="bottom-left"
          proOptions={{ hideAttribution: true }}
          nodesDraggable={true}
          nodesConnectable={true}
          snapToGrid={true}
          snapGrid={[10, 10]}
          className="h-full"
        >
          <Background
            color="#ffffff20"
            gap={24}
            size={1}
          />
          <Controls className="bg-black/30 border border-white/10 rounded-lg p-1" />
        </ReactFlow>
      </div>
      
      {activeNode && (
        <NodeEditor
          activeNode={activeNode}
          onClose={handleCloseEditor}
          onSave={handleSaveNodeChanges}
          onDelete={handleDeleteNode}
        />
      )}
      
      {showComposeGenerator && (
        <ComposeGenerator
          nodes={nodes}
          edges={edges}
          onClose={handleCloseComposeGenerator}
        />
      )}
      
      {showComposeImporter && (
        <ComposeImporter
          onClose={handleCloseComposeImporter}
          onImport={handleImportCompose}
        />
      )}
    </div>
  );
} 