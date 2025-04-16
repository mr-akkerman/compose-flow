import { Handle, NodeProps, Position } from 'reactflow';
import { ServiceNodeProps } from '../types';

export function ServiceNode({ data, selected, id }: ServiceNodeProps) {
  // Функция для удаления узла
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const event = new CustomEvent('node-delete', { detail: { id } });
    document.dispatchEvent(event);
  };

  // Ограничиваем количество отображаемых переменных окружения
  const envEntries = Object.entries(data.environment);
  const maxVisibleEnvVars = 3;
  const visibleEnvVars = envEntries.slice(0, maxVisibleEnvVars);
  const hiddenEnvVarsCount = Math.max(0, envEntries.length - maxVisibleEnvVars);

  return (
    <div className={`p-3 rounded-xl border ${selected ? 'border-primary-500' : 'border-white/10'} bg-black/20 backdrop-blur-sm shadow-xl relative`}>
      <div className="absolute -top-6 left-0 right-0 flex justify-center pointer-events-none">
        <div className="bg-black/40 px-2.5 py-0.5 text-2xs text-primary-400 rounded-full border border-primary-500/20 font-medium shadow-sm whitespace-nowrap">
          Зависит от других сервисов
        </div>
      </div>
      
      <Handle
        type="target"
        position={Position.Top}
        id="top"
      />
      
      <div className="flex flex-col gap-1.5 max-w-full">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary-500" />
          <h3 className="text-sm font-medium text-white leading-tight truncate">{data.name}</h3>
        </div>
        <div className="text-2xs text-gray-300 w-full">
          <p className="mb-1 truncate">Image: <span className="text-primary-400">{data.image}</span></p>
          {envEntries.length > 0 && (
            <div className="mt-1">
              <p className="text-2xs text-gray-400 mb-0.5">Environment:</p>
              <ul className="space-y-0.5 max-h-[60px] overflow-y-auto pr-1 scrollbar-thin">
                {visibleEnvVars.map(([key, value]) => (
                  <li key={key} className="px-1.5 py-0.5 bg-black/20 rounded border border-white/5 text-2xs">
                    <span className="text-primary-400 truncate inline-block max-w-[70px]">{key}</span>
                    =
                    <span className="text-gray-300 truncate inline-block max-w-[70px]">{value}</span>
                  </li>
                ))}
                {hiddenEnvVarsCount > 0 && (
                  <li className="px-1.5 py-0.5 bg-black/20 rounded border border-white/5 text-2xs">
                    <span className="text-gray-400">+{hiddenEnvVarsCount} more...</span>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      <Handle
        type="target"
        position={Position.Left}
        id="left"
      />
      
      <div className="absolute -bottom-6 left-0 right-0 flex justify-center pointer-events-none">
        <div className="bg-black/40 px-2.5 py-0.5 text-2xs text-primary-400 rounded-full border border-primary-500/20 font-medium shadow-sm whitespace-nowrap">
          Подключается к: Сервис
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
      />
      
      <button 
        className="absolute -right-1.5 -bottom-1.5 bg-black/50 hover:bg-red-600/80 w-4 h-4 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all border border-white/10 text-2xs cursor-pointer z-10"
        onClick={handleDelete}
        title="Удалить узел"
      >
        ×
      </button>
    </div>
  );
} 