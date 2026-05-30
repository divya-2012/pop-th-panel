import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import api from '../api';

export default function PrintQr() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const seatIds = searchParams.get('seatIds')?.split(',') || [];
  const screenId = searchParams.get('screenId');
  const [qrs, setQrs] = useState<{ id: string; seatCode: string; qrImageUrl: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!screenId || seatIds.length === 0) {
      setLoading(false);
      return;
    }

    api.get(`/qr/sheet/${screenId}`).then(({ data }) => {
      if (data.success) {
        const selectedQrs = data.data.filter((s: any) => seatIds.includes(s.id));
        setQrs(selectedQrs);
      }
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, [screenId]);

  useEffect(() => {
    if (!loading && qrs.length > 0) {
      // Give images a moment to load before triggering print
      setTimeout(() => {
        window.print();
      }, 1500);
    }
  }, [loading, qrs]);

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }

  if (qrs.length === 0) {
    return <div className="p-8 text-center text-gray-500">No QR codes found for the selected seats.</div>;
  }

  return (
    <div className="bg-white min-h-screen p-8 print:p-0">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 print:gap-4">
        {qrs.map(seat => (
          <div key={seat.id} className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center break-inside-avoid print:border-gray-400">
            <h2 className="text-2xl font-bold mb-3 text-gray-800">Seat {seat.seatCode}</h2>
            {seat.qrImageUrl ? (
              <img src={seat.qrImageUrl} alt={`QR for seat ${seat.seatCode}`} className="w-32 h-32 object-contain" />
            ) : (
              <div className="w-32 h-32 bg-gray-100 flex items-center justify-center text-sm text-gray-400">No QR</div>
            )}
            <p className="mt-3 text-xs text-gray-400 uppercase tracking-widest font-semibold">Scan to Order</p>
          </div>
        ))}
      </div>
    </div>
  );
}
