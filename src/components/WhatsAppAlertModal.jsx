import React, { useState } from 'react';
import { MessageSquare, X, CheckCheck } from 'lucide-react';
import { playTapSound, playSuccessChime } from '../utils/audio';

export default function WhatsAppAlertModal({ order, theme, chef, onClose }) {
  const [activeTab, setActiveTab] = useState('customer'); // 'customer' | 'owner'
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'Advait Verified Kitchen',
      time: 'Just now',
      text: `*Namaste ${order?.customerName || 'Diner'}!* 🙏\n\nYour order *#${order?.id || 'ORD-8821'}* from *${theme.restaurantName}* has been received by Executive Chef ${chef.name}'s kitchen brigade.\n\n🍽️ *Table:* ${order?.table || 'Table 04'}\n💰 *Total:* ₹${order?.total || 546}\n⚡ *Status:* In Kitchen Preparation\n\nTrack your order in real-time or verify Chef credentials: https://advait.menu/t/4`,
      status: 'read'
    }
  ]);

  const handleSendUpdate = (statusText) => {
    playTapSound();
    const newMsg = {
      id: Date.now(),
      sender: 'Advait Verified Kitchen',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `*Order Update #${order?.id}* 🔔\n\n${statusText}\n\nPrepared with 100% A2 Organic Ghee under FSSAI 5-Star Clean Dining Standards. Thank you!`,
      status: 'read'
    };
    setMessages((prev) => [...prev, newMsg]);
    playSuccessChime();
  };

  const handleSendOwnerSummary = () => {
    playTapSound();
    const ownerMsg = {
      id: Date.now(),
      sender: 'Advait POS Bot',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `📊 *Advait Daily EOD Closing Report*\n\n📅 Date: ${new Date().toLocaleDateString('en-IN')}\n\n💰 *Total Sales:* ₹24,850\n💳 *Cash:* ₹8,400\n⚡ *UPI:* ₹11,250\n💳 *Card POS:* ₹5,200\n\n📉 *Logged Expenses:* ₹13,050\n📈 *Estimated Net Profit:* ₹11,800\n\n⚠️ *Pending Zomato/Swiggy:* ₹28,500 due on Monday.`,
      status: 'read'
    };
    setMessages((prev) => [...prev, ownerMsg]);
    playSuccessChime();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 440, background: '#ECE5DD', padding: 0, overflow: 'hidden' }}
      >
        {/* WhatsApp Top Header Bar */}
        <div style={{ background: '#075E54', color: '#FFFFFF', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              <MessageSquare size={18} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Advait Verified WhatsApp Bot</div>
              <div style={{ fontSize: 10, color: '#D1E7DD' }}>Official Business Account • Online</div>
            </div>
          </div>
          <button style={{ border: 'none', background: 'transparent', color: '#FFFFFF', cursor: 'pointer' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher: Diner Alert vs Owner Summary */}
        <div style={{ display: 'flex', background: '#128C7E', padding: '4px 10px' }}>
          <button
            type="button"
            className="capsule-tab"
            style={{
              flex: 1,
              background: activeTab === 'customer' ? 'rgba(255,255,255,0.2)' : 'transparent',
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: 600
            }}
            onClick={() => setActiveTab('customer')}
          >
            Diner Order Alerts
          </button>
          <button
            type="button"
            className="capsule-tab"
            style={{
              flex: 1,
              background: activeTab === 'owner' ? 'rgba(255,255,255,0.2)' : 'transparent',
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: 600
            }}
            onClick={() => setActiveTab('owner')}
          >
            Owner EOD Summary
          </button>
        </div>

        {/* Chat Message Bubble Area */}
        <div style={{ padding: '16px 14px', minHeight: 300, maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                alignSelf: 'flex-start',
                background: '#FFFFFF',
                borderRadius: '8px 8px 8px 0',
                padding: '10px 12px',
                maxWidth: '90%',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                fontSize: 12,
                lineHeight: 1.5,
                color: '#111827',
                whiteSpace: 'pre-line'
              }}
            >
              <div>{msg.text}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 10, color: '#6B7280' }}>
                <span>{msg.time}</span>
                <CheckCheck size={14} color="#34B7F1" />
              </div>
            </div>
          ))}
        </div>

        {/* Quick Send Action Buttons */}
        <div style={{ background: '#F0F2F5', padding: '12px 14px', borderTop: '1px solid #D1D5DB' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#4B5563', marginBottom: 6 }}>
            {activeTab === 'customer' ? 'Trigger Live Customer Notification:' : 'Trigger Owner Daily Briefing:'}
          </div>

          {activeTab === 'customer' ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="btn-secondary-pill"
                style={{ flex: 1, padding: '7px 8px', fontSize: 11, background: '#FFFFFF' }}
                onClick={() => handleSendUpdate('Your hot fresh food is Ready to Serve at Table 04!')}
              >
                Send "Order Ready"
              </button>
              <button
                className="btn-secondary-pill"
                style={{ flex: 1, padding: '7px 8px', fontSize: 11, background: '#FFFFFF' }}
                onClick={() => handleSendUpdate('Thank you for dining at Advait! Please rate Chef Rakesh Sharma.')}
              >
                Send Feedback Prompt
              </button>
            </div>
          ) : (
            <button
              className="btn-primary-pill full-width"
              style={{ background: '#128C7E', fontSize: 12, padding: '8px 12px' }}
              onClick={handleSendOwnerSummary}
            >
              Send EOD Sales & P&L Summary to Owner WhatsApp
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
