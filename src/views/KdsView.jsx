import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Coffee,
  RotateCcw,
  Volume2,
  Layers,
  Sparkles,
  Check,
  ChevronRight
} from 'lucide-react';
import { playTapSound, playSuccessChime, playAlertChime } from '../utils/audio';
import { broadcastSyncEvent, SYNC_EVENTS } from '../utils/sync';

export default function KdsView({ orders, setOrders, chef }) {
  const [selectedStation, setSelectedStation] = useState('all');
  const [bumpedHistory, setBumpedHistory] = useState([]);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update timer tick every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Station Filter Definitions
  const stations = [
    { id: 'all', label: 'All Kitchen Stations' },
    { id: 'tandoor', label: 'Tandoor & Wood-Fire' },
    { id: 'curry', label: 'Curry & Mains' },
    { id: 'bar', label: 'Beverage Bar' },
    { id: 'dessert', label: 'Dessert Pantry' }
  ];

  // Helper to determine item station
  const getItemStation = (itemName) => {
    const name = itemName.toLowerCase();
    if (name.includes('pizza') || name.includes('tandoor') || name.includes('slider') || name.includes('burger')) return 'tandoor';
    if (name.includes('shikanji') || name.includes('brew') || name.includes('cooler') || name.includes('coffee')) return 'bar';
    if (name.includes('shahi') || name.includes('pudding') || name.includes('lava') || name.includes('dessert')) return 'dessert';
    return 'curry';
  };

  // Filter orders that are in kitchen (not completed/rejected yet)
  const activeKdsOrders = orders.filter((o) => o.status !== 'done' && o.status !== 'served' && o.status !== 'rejected');

  // Filter tickets by station
  const filteredTickets = activeKdsOrders.filter((order) => {
    if (selectedStation === 'all') return true;
    return order.items.some((item) => getItemStation(item.name) === selectedStation);
  });

  // Calculate elapsed minutes
  const getElapsedMinutes = (createdAt) => {
    const elapsedMs = currentTime - new Date(createdAt).getTime();
    return Math.max(0, Math.floor(elapsedMs / 60000));
  };

  // Bump Ticket (Mark Ready or Served)
  const handleBumpTicket = (orderId) => {
    playTapSound();
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    setBumpedHistory((prev) => [targetOrder, ...prev.slice(0, 4)]);

    let bumpedOrder = null;
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const nextStatus = (o.status === 'cooking' || o.status === 'in-progress' || o.status === 'received') ? 'ready' : 'served';
          const nextLabel = nextStatus === 'ready' ? 'Ready to Serve' : 'Served to Table';
          bumpedOrder = { ...o, status: nextStatus, statusLabel: nextLabel, progressPercent: nextStatus === 'ready' ? 85 : 100 };
          return bumpedOrder;
        }
        return o;
      })
    );
    if (bumpedOrder) {
      broadcastSyncEvent(SYNC_EVENTS.ORDER_STATUS_UPDATED, bumpedOrder);
    }
    playSuccessChime();
  };

  // Recall bumped ticket
  const handleRecall = (orderId) => {
    playTapSound();
    let recalledOrder = null;
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          recalledOrder = { ...o, status: 'cooking', statusLabel: 'Cooking in Kitchen', progressPercent: 50 };
          return recalledOrder;
        }
        return o;
      })
    );
    if (recalledOrder) {
      broadcastSyncEvent(SYNC_EVENTS.ORDER_STATUS_UPDATED, recalledOrder);
    }
    setBumpedHistory((prev) => prev.filter((o) => o.id !== orderId));
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#0F172A', color: '#F8FAFC', paddingBottom: 85 }}>
      {/* KDS Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#38BDF8', letterSpacing: -0.5, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Advait Kitchen Display System (KDS)</span>
            <span style={{ fontSize: 11, background: '#1E293B', color: '#94A3B8', padding: '2px 8px', borderRadius: 12, border: '1px solid #334155' }}>
              Phase 2
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
            Head of Brigade: Chef {chef.name} • Live Station Routing
          </div>
        </div>

        {/* Recall Button */}
        {bumpedHistory.length > 0 && (
          <button
            className="btn-secondary-pill"
            style={{ background: '#1E293B', color: '#F8FAFC', border: '1px solid #475569', fontSize: 12 }}
            onClick={() => handleRecall(bumpedHistory[0].id)}
            title="Recall last bumped ticket"
          >
            <RotateCcw size={13} />
            <span>Recall #{bumpedHistory[0].id}</span>
          </button>
        )}
      </div>

      {/* Station Selector Bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {stations.map((st) => (
          <button
            key={st.id}
            className="capsule-tab"
            style={{
              fontSize: 12,
              padding: '6px 14px',
              background: selectedStation === st.id ? '#0284C7' : '#1E293B',
              color: selectedStation === st.id ? '#FFFFFF' : '#94A3B8',
              border: selectedStation === st.id ? '1px solid #38BDF8' : '1px solid #334155',
              fontWeight: 600
            }}
            onClick={() => {
              playTapSound();
              setSelectedStation(st.id);
            }}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Grid of Kitchen Tickets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {filteredTickets.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
            <CheckCircle2 size={40} style={{ margin: '0 auto 10px', color: '#10B981' }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: '#E2E8F0' }}>All Orders Cleared!</div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>The station queue is empty and ready for incoming tickets.</div>
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const elapsedMins = getElapsedMinutes(ticket.createdAt);
            const isLate = elapsedMins >= 15;
            const isWarning = elapsedMins >= 8 && elapsedMins < 15;

            // Timer color style
            let timerBg = '#065F46'; // Green
            let timerText = '#6EE7B7';
            if (isLate) {
              timerBg = '#991B1B'; // Red
              timerText = '#FCA5A5';
            } else if (isWarning) {
              timerBg = '#854D0E'; // Amber
              timerText = '#FDE047';
            }

            return (
              <div
                key={ticket.id}
                style={{
                  background: '#1E293B',
                  border: isLate ? '2px solid #EF4444' : '1px solid #334155',
                  borderRadius: 18,
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isLate ? '0 0 20px rgba(239, 68, 68, 0.25)' : '0 4px 14px rgba(0,0,0,0.3)',
                  position: 'relative'
                }}
              >
                {/* Ticket Header */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 800, color: '#F8FAFC' }}>
                        {ticket.id}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#38BDF8', marginTop: 1 }}>
                        {ticket.table.toUpperCase()}
                      </div>
                    </div>

                    {/* Timer Badge */}
                    <div
                      style={{
                        background: timerBg,
                        color: timerText,
                        padding: '4px 8px',
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <Clock size={13} />
                      <span>{elapsedMins}m ago</span>
                    </div>
                  </div>

                  {/* Customer / Server Metadata */}
                  <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 10, borderBottom: '1px solid #334155', paddingBottom: 6 }}>
                    Diner: {ticket.customerName} • {ticket.orderNote || 'No table notes'}
                  </div>

                  {/* Items List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                    {ticket.items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#0F172A',
                          border: '1px solid #334155',
                          borderRadius: 10,
                          padding: '8px 10px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9' }}>
                            <span style={{ color: '#38BDF8', marginRight: 6 }}>{item.quantity}x</span>
                            {item.name}
                          </span>
                          <span style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase' }}>
                            {getItemStation(item.name)}
                          </span>
                        </div>

                        {item.note && (
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: '#F59E0B',
                              background: 'rgba(245, 158, 11, 0.1)',
                              padding: '2px 6px',
                              borderRadius: 4,
                              marginTop: 4,
                              display: 'inline-block'
                            }}
                          >
                            ⚠️ {item.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bump Action Bar */}
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button
                    className="btn-primary-pill full-width"
                    style={{
                      background: ticket.status === 'in-progress' ? '#10B981' : '#0284C7',
                      fontSize: 13,
                      padding: '10px 14px'
                    }}
                    onClick={() => handleBumpTicket(ticket.id)}
                  >
                    <Check size={16} strokeWidth={3} />
                    <span>
                      {ticket.status === 'in-progress' ? 'BUMP (Ready to Serve)' : 'COMPLETE TICKET'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
