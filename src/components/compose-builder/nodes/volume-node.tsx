import { Handle, Position } from 'reactflow';
import { VolumeNodeProps } from '../types';

export function VolumeNode({ data, selected, id }: VolumeNodeProps) {
  // Функция для удаления узла
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const event = new CustomEvent('node-delete', { detail: { id } });
    document.dispatchEvent(event);
  };

  return (
    <div className={`p-3 rounded-xl border ${selected ? 'border-yellow-400' : 'border-white/10'} bg-black/20 backdrop-blur-sm shadow-xl relative`}>
      <div className="absolute -top-6 left-0 right-0 flex justify-center pointer-events-none">
        <div className="bg-black/40 px-2.5 py-0.5 text-2xs text-gray-400 rounded-full border border-white/10 font-medium shadow-sm whitespace-nowrap">
          Не подключается
        </div>
      </div>
      
      <Handle
        type="target"
        position={Position.Top}
        id="top"
      />
      
      <div className="flex flex-col gap-1.5 max-w-full">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
          <h3 className="text-sm font-medium text-white leading-tight truncate">Том</h3>
        </div>
        <div className="text-2xs text-gray-300 mt-1 w-full">
          <div className="px-2 py-1 bg-black/30 rounded-lg border border-white/5 max-h-[65px] overflow-y-auto">
            <div className="truncate">
              <span className="text-yellow-400">Source:</span>
              <span className="text-gray-300 ml-1">{data.source}</span>
            </div>
            <div className="mt-0.5 truncate">
              <span className="text-yellow-400">Target:</span>
              <span className="text-gray-300 ml-1">{data.target}</span>
            </div>
            {data.mode && (
              <div className="mt-0.5 truncate">
                <span className="text-yellow-400">Mode:</span>
                <span className="text-gray-300 ml-1">{data.mode}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        id="right"
      />
      
      {/* Кнопка удаления узла */}
      <button 
        className="absolute -right-1.5 -bottom-1.5 bg-black/50 hover:bg-red-600/80 w-4 h-4 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all border border-white/10 text-2xs cursor-pointer z-10"
        onClick={handleDelete}
        title="Удалить том"
      >
        ×
      </button>
    </div>
  );
} 