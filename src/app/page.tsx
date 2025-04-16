import { Metadata } from 'next';
import { ComposeBuilder } from '@/components/compose-builder';

export const metadata: Metadata = {
  title: 'Docker Compose Flow Builder',
  description: 'Визуальный конструктор docker-compose файлов',
};

export default function Home() {
  return (
    <main className="h-screen overflow-hidden p-4 pt-2 flex flex-col">
      <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
        Docker Compose Flow Builder
      </h1>
      <div className="flex-1">
        <ComposeBuilder />
      </div>
    </main>
  );
}
