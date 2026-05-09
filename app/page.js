import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('./components/Map'), { ssr: false });

export default function Home() {
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <MapView />
    </div>
  );
}
