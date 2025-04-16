import { useState, useEffect } from 'react';
import { ActiveNode, ServiceNodeData, PortNodeData, VolumeNodeData, NetworkNodeData } from './types';

interface NodeEditorProps {
  activeNode: ActiveNode | null;
  onClose: () => void;
  onSave: (id: string, data: Record<string, unknown>) => void;
  onDelete?: (id: string) => void;
}

export function NodeEditor({ activeNode, onClose, onSave, onDelete }: NodeEditorProps) {
  const [formData, setFormData] = useState<Record<string, unknown> | null>(null);

  // Инициализируем данные формы при изменении активного узла
  useEffect(() => {
    if (activeNode) {
      setFormData({ ...activeNode.data });
    } else {
      setFormData(null);
    }
  }, [activeNode]);

  if (!activeNode || !formData) {
    return null;
  }

  const handleChange = (key: string, value: unknown) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleEnvironmentChange = (key: string, value: string) => {
    const newEnv = { ...(formData.environment as Record<string, string> || {}), [key]: value };
    setFormData({ ...formData, environment: newEnv });
  };

  const handleDelete = () => {
    if (onDelete && window.confirm(`Вы уверены, что хотите удалить этот элемент?`)) {
      onDelete(activeNode.id);
      onClose();
    }
  };

  const renderServiceEditor = () => {
    const data = formData as unknown as ServiceNodeData;
    return (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Название сервиса</label>
          <input 
            type="text" 
            className="w-full px-4 py-2 bg-black/20 text-white border border-white/10 rounded-lg focus:outline-none focus:border-primary-500"
            value={data.name} 
            onChange={(e) => handleChange('name', e.target.value)} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Образ (image)</label>
          <input 
            type="text" 
            className="w-full px-4 py-2 bg-black/20 text-white border border-white/10 rounded-lg focus:outline-none focus:border-primary-500"
            value={data.image} 
            onChange={(e) => handleChange('image', e.target.value)} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Переменные окружения</label>
          {Object.entries(data.environment).map(([key, value]) => (
            <div key={key} className="flex mb-3">
              <input 
                type="text" 
                className="w-1/2 px-4 py-2 bg-black/20 text-primary-400 border border-white/10 rounded-l-lg focus:outline-none focus:border-primary-500"
                value={key} 
                readOnly 
              />
              <input 
                type="text" 
                className="w-1/2 px-4 py-2 bg-black/20 text-white border-l-0 border border-white/10 rounded-r-lg focus:outline-none focus:border-primary-500"
                value={value} 
                onChange={(e) => handleEnvironmentChange(key, e.target.value)} 
              />
            </div>
          ))}
          <div className="flex mt-4">
            <input 
              type="text" 
              id="new-env-key" 
              placeholder="Ключ" 
              className="w-1/2 px-4 py-2 bg-black/20 text-white border border-white/10 rounded-l-lg focus:outline-none focus:border-primary-500"
            />
            <input 
              type="text" 
              id="new-env-value" 
              placeholder="Значение" 
              className="w-1/2 px-4 py-2 bg-black/20 text-white border-l-0 border border-white/10 rounded-r-lg focus:outline-none focus:border-primary-500"
            />
            <button 
              className="ml-2 px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
              onClick={() => {
                const key = (document.getElementById('new-env-key') as HTMLInputElement).value;
                const value = (document.getElementById('new-env-value') as HTMLInputElement).value;
                if (key) {
                  handleEnvironmentChange(key, value);
                  (document.getElementById('new-env-key') as HTMLInputElement).value = '';
                  (document.getElementById('new-env-value') as HTMLInputElement).value = '';
                }
              }}
            >
              +
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPortEditor = () => {
    const data = formData as unknown as PortNodeData;
    return (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Порт хоста</label>
          <input 
            type="number" 
            className="w-full px-4 py-2 bg-black/20 text-white border border-white/10 rounded-lg focus:outline-none focus:border-green-400"
            value={data.hostPort} 
            onChange={(e) => handleChange('hostPort', parseInt(e.target.value) || 0)} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Порт контейнера</label>
          <input 
            type="number" 
            className="w-full px-4 py-2 bg-black/20 text-white border border-white/10 rounded-lg focus:outline-none focus:border-green-400"
            value={data.containerPort} 
            onChange={(e) => handleChange('containerPort', parseInt(e.target.value) || 0)} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Протокол (необязательно)</label>
          <select 
            className="w-full px-4 py-2 bg-black/20 text-white border border-white/10 rounded-lg focus:outline-none focus:border-green-400"
            value={data.protocol || ''} 
            onChange={(e) => handleChange('protocol', e.target.value)}
          >
            <option value="">По умолчанию (TCP)</option>
            <option value="tcp">TCP</option>
            <option value="udp">UDP</option>
          </select>
        </div>
      </div>
    );
  };

  const renderVolumeEditor = () => {
    const data = formData as unknown as VolumeNodeData;
    return (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Исходный путь</label>
          <input 
            type="text" 
            className="w-full px-4 py-2 bg-black/20 text-white border border-white/10 rounded-lg focus:outline-none focus:border-yellow-400"
            value={data.source} 
            onChange={(e) => handleChange('source', e.target.value)} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Целевой путь</label>
          <input 
            type="text" 
            className="w-full px-4 py-2 bg-black/20 text-white border border-white/10 rounded-lg focus:outline-none focus:border-yellow-400"
            value={data.target} 
            onChange={(e) => handleChange('target', e.target.value)} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Режим</label>
          <select 
            className="w-full px-4 py-2 bg-black/20 text-white border border-white/10 rounded-lg focus:outline-none focus:border-yellow-400"
            value={data.mode || 'rw'} 
            onChange={(e) => handleChange('mode', e.target.value)}
          >
            <option value="rw">Чтение/Запись (rw)</option>
            <option value="ro">Только чтение (ro)</option>
          </select>
        </div>
      </div>
    );
  };

  const renderNetworkEditor = () => {
    const data = formData as unknown as NetworkNodeData;
    return (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Название сети</label>
          <input 
            type="text" 
            className="w-full px-4 py-2 bg-black/20 text-white border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500"
            value={data.name} 
            onChange={(e) => handleChange('name', e.target.value)} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">Драйвер (необязательно)</label>
          <select 
            className="w-full px-4 py-2 bg-black/20 text-white border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500"
            value={data.driver || ''} 
            onChange={(e) => handleChange('driver', e.target.value)}
          >
            <option value="">По умолчанию (bridge)</option>
            <option value="bridge">bridge</option>
            <option value="host">host</option>
            <option value="overlay">overlay</option>
            <option value="macvlan">macvlan</option>
            <option value="none">none</option>
          </select>
        </div>
      </div>
    );
  };

  const renderEditorContent = () => {
    switch (activeNode.type) {
      case 'service':
        return renderServiceEditor();
      case 'port':
        return renderPortEditor();
      case 'volume':
        return renderVolumeEditor();
      case 'network':
        return renderNetworkEditor();
      default:
        return <p className="text-white">Неизвестный тип узла</p>;
    }
  };

  const getBorderColor = () => {
    switch (activeNode.type) {
      case 'service': return 'border-primary-500';
      case 'port': return 'border-green-400';
      case 'volume': return 'border-yellow-400';
      case 'network': return 'border-indigo-500';
      default: return 'border-white/10';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-black/30 p-6 rounded-xl border ${getBorderColor()} w-full max-w-lg shadow-xl backdrop-blur-sm max-h-[90vh] flex flex-col`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-medium text-white">
            {activeNode.type === 'service' ? 'Редактирование сервиса' :
             activeNode.type === 'port' ? 'Редактирование порта' :
             activeNode.type === 'volume' ? 'Редактирование тома' :
             activeNode.type === 'network' ? 'Редактирование сети' : 'Редактирование узла'}
          </h2>
          <button 
            className="text-gray-400 hover:text-white transition-colors"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        
        <div className="mb-6 overflow-y-auto flex-1 pr-2 scrollbar-thin">
          {renderEditorContent()}
        </div>
        
        <div className="flex justify-between gap-3 pt-2 border-t border-white/10">
          <button 
            className="px-4 py-2 bg-red-600/70 hover:bg-red-600 text-white rounded-lg transition-colors shadow"
            onClick={handleDelete}
          >
            Удалить
          </button>
          
          <div className="flex gap-3">
            <button 
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
              onClick={onClose}
            >
              Отмена
            </button>
            <button 
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors shadow-lg"
              onClick={() => {
                onSave(activeNode.id, formData);
                onClose();
              }}
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 