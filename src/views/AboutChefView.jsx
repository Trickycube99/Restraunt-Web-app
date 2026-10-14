import React, { useState } from 'react';
import {
  ShieldCheck,
  Award,
  CheckCircle2,
  FileCheck2,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Heart,
  QrCode,
  UtensilsCrossed,
  Info
} from 'lucide-react';
import { playTapSound, playSuccessChime } from '../utils/audio';

export default function AboutChefView({ chef, menu, onAddToCart, onGoToMenu }) {
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);
  const [verifiedCount, setVerifiedCount] = useState(2450);
  const [hasEndorsed, setHasEndorsed] = useState(false);

  // Find chef's signature items
  const signatureItems = menu.filter((item) => item.tags.includes("Chef's Pick") || item.tags.includes("Signature Special"));

  const handleEndorse = () => {
    playTapSound();
    if (!hasEndorsed) {
      setVerifiedCount((prev) => prev + 1);
      setHasEndorsed(true);
      playSuccessChime();
    }
  };

  return (
    <div style={{ padding: '16px', overflowY: 'auto', flex: 1, paddingBottom: 90 }}>
      {/* Header section with screen title and subtitle */}
      <div style={{ marginBottom: 16 }}>
        <div className="screen-title">About the Chef</div>
        <div className="screen-subtitle">
          Transparent culinary craftsmanship & verified Indian accreditation.
        </div>
      </div>

      {/* Main Chef Verified Profile Card */}
      <div className="ios-card active-gradient" style={{ marginBottom: 18, paddingTop: 20 }}>
        {/* Top Badges */}
        <div className="card-top-row">
          <div className="status-pill done">
            <ShieldCheck size={13} />
            <span>Officially Verified Master Chef</span>
          </div>
          <span className="card-meta-text">Lic: {chef.verificationId}</span>
        </div>

        {/* Chef Portrait & Core Title */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 8, marginBottom: 14 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img
              src={chef.portrait}
              alt={chef.name}
              style={{
                width: 86,
                height: 86,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid #007AFF',
                boxShadow: '0 4px 14px rgba(0, 122, 255, 0.25)'
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                background: '#007AFF',
                color: '#FFFFFF',
                borderRadius: '50%',
                width: 22,
                height: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #FFFFFF'
              }}
            >
              <CheckCircle2 size={13} strokeWidth={3} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-heading" style={{ fontSize: 19 }}>
              {chef.name}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, marginTop: 2 }}>
              {chef.title}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              📍 {chef.businessName} • {chef.experienceYears}+ Yrs Mastery
            </div>
          </div>
        </div>

        {/* Key Verification Metrics */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            background: 'rgba(255, 255, 255, 0.85)',
            border: '1px solid #E5E7EB',
            borderRadius: 14,
            padding: '10px 8px',
            marginBottom: 14,
            textAlign: 'center'
          }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#16A34A' }}>{chef.hygieneScore}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>FSSAI Hygiene</div>
          </div>
          <div style={{ borderLeft: '1px solid #E5E7EB', borderRight: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary-blue)' }}>5-Star A+</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>Clean Dining</div>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#9333EA' }}>{chef.certifications.length} Credentials</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>Govt. Audited</div>
          </div>
        </div>

        {/* Verification Action Button */}
        <button
          className="btn-primary-pill full-width"
          style={{ padding: '10px 16px', fontSize: 14 }}
          onClick={() => {
            playTapSound();
            setShowVerifyModal(true);
          }}
        >
          <FileCheck2 size={16} />
          <span>Verify Official FSSAI License & Audit Hash</span>
        </button>

        {/* Bottom Card Progress Bar */}
        <div className="card-bottom-progress">
          <div className="card-bottom-progress-fill progress" style={{ width: '100%' }} />
        </div>
      </div>

      {/* Chef's Story & Philosophy Card */}
      <div className="ios-card" style={{ marginBottom: 16 }}>
        <div className="card-top-row">
          <div className="card-title-group">
            <span className="card-heading">Culinary Story & Philosophy</span>
            <span className="card-meta-text">Ancient spice alchemy to your dining table</span>
          </div>
          <Sparkles size={18} color="#007AFF" />
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
          "{chef.philosophy}"
        </p>

        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 12 }}>
          {chef.bio}
        </p>

        {/* Bullet points adhering to design system */}
        <ul className="body-subtask">
          {chef.careerHighlights.map((hl, idx) => (
            <li key={idx}>{hl}</li>
          ))}
        </ul>

        <div className="card-badges-row">
          <span className="status-pill tag">IHM Pusa Gold Medalist</span>
          <span className="status-pill tag">ITC Bukhara Brigade</span>
          <span className="status-pill done">A2 Gir Cow Ghee</span>
        </div>
      </div>

      {/* Official Culinary Certifications Section */}
      <div className="ios-card" style={{ marginBottom: 16 }}>
        <div className="card-top-row">
          <div className="card-title-group">
            <span className="card-heading">Accredited Diplomas & Audits</span>
            <span className="card-meta-text">Government of India & ICF verified credentials</span>
          </div>
          <Award size={18} color="#D97706" />
        </div>

        <div className="certifications-grid">
          {chef.certifications.map((cert) => (
            <div
              key={cert.id}
              onClick={() => {
                playTapSound();
                setSelectedCert(cert);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: 14,
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: '#FEF3C7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#D97706'
                  }}
                >
                  <Award size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {cert.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {cert.issuer} • {cert.year}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="status-pill done" style={{ fontSize: 10, padding: '2px 6px' }}>
                  {cert.badge}
                </span>
                <ChevronRight size={14} color="#9CA3AF" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hygiene & Sourcing Pledge Card */}
      <div className="ios-card completed-gradient" style={{ marginBottom: 16 }}>
        <div className="card-top-row">
          <div className="card-title-group">
            <span className="card-heading">FSSAI Hygiene & Organic Sourcing</span>
            <span className="card-meta-text">Uncompromising food safety & farm transparency</span>
          </div>
          <ShieldCheck size={20} color="#16A34A" />
        </div>

        <ul className="body-subtask">
          {chef.hygieneAndQualityPledge.map((pledge, idx) => (
            <li key={idx}>{pledge}</li>
          ))}
        </ul>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Diners Verified: <strong>{verifiedCount}</strong>
          </div>
          <button
            className={`btn-secondary-pill`}
            onClick={handleEndorse}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              background: hasEndorsed ? '#DCFCE7' : '#F3F4F6',
              color: hasEndorsed ? '#16A34A' : '#111827'
            }}
          >
            <Heart size={13} fill={hasEndorsed ? '#16A34A' : 'none'} color={hasEndorsed ? '#16A34A' : 'currentColor'} />
            <span>{hasEndorsed ? 'Verified & Endorsed' : 'Endorse Chef Standard'}</span>
          </button>
        </div>

        <div className="card-bottom-progress">
          <div className="card-bottom-progress-fill done" style={{ width: '100%' }} />
        </div>
      </div>

      {/* Signature Dishes Spotlight */}
      <div className="ios-card" style={{ marginBottom: 16 }}>
        <div className="card-top-row">
          <div className="card-title-group">
            <span className="card-heading">Chef's Verified Signatures</span>
            <span className="card-meta-text">Crafted exclusively by Chef {chef.name}</span>
          </div>
          <UtensilsCrossed size={18} color="#007AFF" />
        </div>

        <div className="chef-signatures-grid">
          {signatureItems.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                padding: '8px',
                background: '#F9FAFB',
                borderRadius: 14,
                border: '1px solid #E5E7EB'
              }}
            >
              <img
                src={item.image}
                alt={item.name}
                style={{ width: 68, height: 68, borderRadius: 12, objectFit: 'cover' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary-blue)', marginTop: 2 }}>
                  ₹{item.price.toFixed(0)}
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                  {item.tags.map((tag, i) => (
                    <span key={i} className="status-pill tag" style={{ fontSize: 9, padding: '1px 6px' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <button
                className="btn-primary-pill"
                style={{ padding: '6px 12px', fontSize: 12 }}
                onClick={() => {
                  playTapSound();
                  onAddToCart(item);
                }}
              >
                + Add
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Back to Menu CTA */}
      <button
        className="btn-secondary-pill full-width"
        onClick={() => {
          playTapSound();
          onGoToMenu();
        }}
      >
        <span>Return to Full Menu & Order</span>
      </button>

      {/* Official Verification Certificate Inspection Modal */}
      {showVerifyModal && (
        <div className="modal-overlay" onClick={() => setShowVerifyModal(false)}>
          <div className="modal-content-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-drag-pill" />

            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: '50%',
                  background: '#DCFCE7',
                  color: '#16A34A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px'
                }}
              >
                <ShieldCheck size={30} />
              </div>
              <div className="card-heading" style={{ fontSize: 20 }}>FSSAI Verification Registry</div>
              <div className="card-meta-text">Govt. of India Food Safety & Standards Authority Record</div>
            </div>

            <div
              style={{
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: 16,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                marginBottom: 16
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Certified Master Chef</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{chef.name}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>FSSAI License No.</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-blue)' }}>{chef.verificationId}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ICF Registry No.</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{chef.guildRegistryNumber}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cryptographic Verification Hash</div>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 11,
                    background: '#E5E7EB',
                    padding: '6px 8px',
                    borderRadius: 8,
                    wordBreak: 'break-all',
                    marginTop: 2
                  }}
                >
                  0x8f9c9a41b2e88701cdfe4b12aa3190fc55b7194a
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Accreditation Status</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span className="status-pill done">ACTIVE & 5-STAR VERIFIED</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Audit Oct 2026</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Regulatory Authority Stamp</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {chef.authorityName}
                </div>
              </div>
            </div>

            <button
              className="btn-primary-pill full-width"
              onClick={() => {
                playTapSound();
                setShowVerifyModal(false);
              }}
            >
              <span>Close Verification Record</span>
            </button>
          </div>
        </div>
      )}

      {/* Certificate Detail Modal */}
      {selectedCert && (
        <div className="modal-overlay" onClick={() => setSelectedCert(null)}>
          <div className="modal-content-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-drag-pill" />

            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: '#FEF3C7',
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px'
                }}
              >
                <Award size={26} />
              </div>
              <div className="card-heading" style={{ fontSize: 18 }}>{selectedCert.name}</div>
              <div className="card-meta-text">{selectedCert.issuer}</div>
            </div>

            <div style={{ background: '#F8F9FA', padding: 14, borderRadius: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Conferred Period</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedCert.year}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10, marginBottom: 4 }}>
                Award Level / Grade
              </div>
              <div className="status-pill done">{selectedCert.badge}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10, marginBottom: 4 }}>
                Verification Security Key
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-secondary)' }}>
                VERIF-CERT-KEY-{selectedCert.id.toUpperCase()}-2026-IN
              </div>
            </div>

            <button
              className="btn-secondary-pill full-width"
              onClick={() => {
                playTapSound();
                setSelectedCert(null);
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
