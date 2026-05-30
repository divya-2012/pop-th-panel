import { useEffect, useState } from 'react';
import { Loader2, Monitor, CheckSquare, Printer, Square } from 'lucide-react';
import api from '../api';
import DashboardLayout from '../layouts/DashboardLayout';
import { getUser } from '../store/authStore';

interface Seat { id: string; seatCode: string; rowLabel: string; seatNumber: string; isDisabled: boolean; }
interface Screen { id: string; name: string; layoutConfig?: any; }

export default function SeatsQr() {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedScreen, setSelectedScreen] = useState('');
  const [loading, setLoading] = useState(false);
  const user = getUser();
  const theatreId = user?.theatreId;
  
  // Layout specific state parsed from seats
  const [rows, setRows] = useState<{label: string, count: number}[]>([]);
  const [aisles, setAisles] = useState<number[]>([]);
  const [rowGaps, setRowGaps] = useState<string[]>([]);
  const [maxColumns, setMaxColumns] = useState(0);

  // Selection state
  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<string>>(new Set());

  const fetchScreens = async () => {
    try {
      const { data } = await api.get(`/screens?theatreId=${theatreId}`);
      if (data.success) {
        setScreens(data.data);
        if (data.data.length > 0 && !selectedScreen) setSelectedScreen(data.data[0].id);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { if (theatreId) fetchScreens(); }, [theatreId]);

  const fetchSeats = async () => {
    if (!selectedScreen) { setSeats([]); return; }
    setLoading(true);
    try {
      const { data } = await api.get(`/seats?screenId=${selectedScreen}`);
      if (data.success) {
        setSeats(data.data);
        if (data.data.length > 0) {
          const rowsMap = new Map();
          let maxCol = 0;
          data.data.forEach((s: Seat) => {
            const num = parseInt(s.seatNumber);
            rowsMap.set(s.rowLabel, Math.max(rowsMap.get(s.rowLabel) || 0, num));
            maxCol = Math.max(maxCol, num);
          });
          const existingRows = Array.from(rowsMap.entries())
            .map(([label, count]) => ({label, count}))
            .sort((a,b) => a.label.localeCompare(b.label));
          setRows(existingRows);
          setMaxColumns(maxCol);
        } else {
          setRows([]);
          setMaxColumns(0);
        }
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); setSelectedSeatIds(new Set()); }
  };

  useEffect(() => {
    fetchSeats();
    const screen = screens.find(s => s.id === selectedScreen);
    if (screen?.layoutConfig) {
      setAisles(screen.layoutConfig.aisles || []);
      setRowGaps(screen.layoutConfig.rowGaps || []);
    } else {
      setAisles([]); setRowGaps([]);
    }
  }, [selectedScreen, screens]);

  const toggleSeat = (id: string) => {
    const newSet = new Set(selectedSeatIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedSeatIds(newSet);
  };

  const toggleRow = (rowLabel: string) => {
    const rowSeats = seats.filter(s => s.rowLabel === rowLabel && !s.isDisabled);
    const allSelected = rowSeats.every(s => selectedSeatIds.has(s.id));
    const newSet = new Set(selectedSeatIds);
    rowSeats.forEach(s => {
      if (allSelected) newSet.delete(s.id);
      else newSet.add(s.id);
    });
    setSelectedSeatIds(newSet);
  };

  const toggleColumn = (colNumber: string) => {
    const colSeats = seats.filter(s => s.seatNumber === colNumber && !s.isDisabled);
    const allSelected = colSeats.every(s => selectedSeatIds.has(s.id));
    const newSet = new Set(selectedSeatIds);
    colSeats.forEach(s => {
      if (allSelected) newSet.delete(s.id);
      else newSet.add(s.id);
    });
    setSelectedSeatIds(newSet);
  };

  const toggleAll = () => {
    const validSeats = seats.filter(s => !s.isDisabled);
    if (selectedSeatIds.size === validSeats.length) {
      setSelectedSeatIds(new Set());
    } else {
      setSelectedSeatIds(new Set(validSeats.map(s => s.id)));
    }
  };

  const handleGenerateQRs = () => {
    if (selectedSeatIds.size === 0) return alert('Select at least one seat');
    const ids = Array.from(selectedSeatIds).join(',');
    const url = `/print-qr?seatIds=${ids}&screenId=${selectedScreen}`;
    window.open(url, '_blank');
  };

  const renderSeatingChart = () => {
    return (
      <div className="flex flex-col items-center min-w-max pb-20 mt-8">
        <div className="w-96 max-w-full h-3 bg-gradient-to-b from-gray-300 to-gray-200 rounded-[50%] mb-12 shadow-[0_10px_20px_rgba(0,0,0,0.1)] border border-gray-300" style={{ transform: 'perspective(100px) rotateX(10deg)' }} />
        
        {/* Column Headers */}
        <div className="flex items-center gap-8 mb-4">
          <span className="w-8 text-sm font-bold text-transparent">#</span>
          <div className="flex gap-2">
            {Array.from({ length: maxColumns }).map((_, i) => {
              const seatNum = i + 1;
              return (
                <div key={seatNum} className="flex gap-2 group">
                  <div 
                    onClick={() => toggleColumn(seatNum.toString())}
                    className="w-10 h-6 flex items-center justify-center text-[10px] font-bold text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer transition-colors"
                  >
                    Col {seatNum}
                  </div>
                  {aisles.includes(seatNum) && <div className="w-16" />}
                </div>
              );
            })}
          </div>
          <span className="w-8"></span>
        </div>

        <div className="flex flex-col gap-4">
          {rows.map(rowConfig => {
            const rowLabel = rowConfig.label;
            const maxSeat = maxColumns;

            return (
              <div key={rowLabel}>
                <div className="flex items-center gap-8">
                  <span onClick={() => toggleRow(rowLabel)} className="w-8 text-sm font-bold text-gray-400 hover:text-blue-600 cursor-pointer text-center py-1 rounded hover:bg-blue-50 transition-colors">
                    {rowLabel}
                  </span>
                  <div className="flex gap-2">
                    {Array.from({ length: maxSeat }).map((_, i) => {
                      const seatNum = i + 1;
                      const seat = seats.find(s => s.rowLabel === rowLabel && parseInt(s.seatNumber) === seatNum);
                      
                      if (!seat) {
                        return (
                          <div key={seatNum} className="flex gap-2">
                            <div className="w-10 h-10 opacity-0" />
                            {aisles.includes(seatNum) && <div className="w-16" />}
                          </div>
                        );
                      }

                      const isSelected = selectedSeatIds.has(seat.id);

                      return (
                        <div key={seatNum} className="flex gap-2 group">
                          <div 
                            onClick={() => !seat.isDisabled && toggleSeat(seat.id)}
                            className={`w-10 h-10 rounded-t-xl rounded-b flex items-center justify-center text-[10px] font-bold border-2 transition-all duration-200 shadow-sm ${
                              seat.isDisabled ? 'bg-red-50 border-red-200 text-red-500 opacity-50 cursor-not-allowed' 
                              : isSelected ? 'bg-blue-600 border-blue-700 text-white shadow-blue-500/30 scale-105'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 cursor-pointer'
                            }`}
                            title={seat.seatCode}
                          >
                            {seat.seatNumber}
                          </div>
                          {aisles.includes(seatNum) && <div className="w-16" />}
                        </div>
                      );
                    })}
                  </div>
                  <span onClick={() => toggleRow(rowLabel)} className="w-8 text-sm font-bold text-gray-400 hover:text-blue-600 cursor-pointer text-center py-1 rounded hover:bg-blue-50 transition-colors">
                    {rowLabel}
                  </span>
                </div>
                {rowGaps.includes(rowLabel) && <div className="h-16 flex items-center justify-center"><span className="text-[10px] uppercase tracking-widest text-gray-300 font-bold border-b border-gray-200 w-full text-center pb-1">Walking Area</span></div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">QR Management</h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Select seats to print QR codes</p>
        </div>
      </div>

      <div className="h-[calc(100vh-170px)] flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Top Action Bar */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-gray-500" />
              <select value={selectedScreen} onChange={e => setSelectedScreen(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                {screens.length === 0 && <option value="">No screens found</option>}
                {screens.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            
            <div className="h-6 w-px bg-gray-300" />

            <button onClick={toggleAll} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors">
              {selectedSeatIds.size === seats.filter(s => !s.isDisabled).length && seats.length > 0 ? (
                <CheckSquare className="h-4 w-4 text-blue-600" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              Select All
            </button>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-gray-500">
              {selectedSeatIds.size} <span className="font-medium text-gray-400">seats selected</span>
            </span>
            <button 
              onClick={handleGenerateQRs}
              disabled={selectedSeatIds.size === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:bg-gray-400 transition-all shadow-md"
            >
              <Printer className="h-4 w-4" /> Print QRs
            </button>
          </div>
        </div>

        {/* Grid Canvas */}
        <div className="flex-1 bg-gray-50/50 overflow-auto relative p-8 shadow-inner">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 gap-2"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : !selectedScreen ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 font-medium">Please select a screen first.</div>
          ) : seats.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 font-medium">No layout defined for this screen. Ask your Admin to configure Seats.</div>
          ) : (
            renderSeatingChart()
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
