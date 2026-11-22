import { useHistoryMotion } from './useHistoryMotion';
import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { GitBranch, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { CODEBASE_LINEAGE } from '../../data/msfsHistory';

gsap.registerPlugin(ScrollTrigger);

export default function CodebaseLineageMap({ onJump }) {
  const ref = useRef(null);

  useHistoryMotion(() => {
    const ctx = gsap.context(() => {
      gsap.from('.lineage-animate', {
        y: 28,
        opacity: 0,
        duration: 0.65,
        stagger: 0.08,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 80%',
          once: true,
        },
      });
    }, ref);
    return () => ctx.revert();
  });

  return (
    <section id="lineage" tabIndex={-1} ref={ref} className="section-container">
      <div className="section-header">
        <div className="section-eyebrow">
          <GitBranch size={14} />
          <span>02 · Architectural Lineage (1975–2026)</span>
        </div>
        <h2 className="section-title">Five Eras &amp; The 2009 Structural Fracture</h2>
        <p className="section-subtitle">
          An initial 27-year linear progression from subLOGIC to ACES Game Studio, a 2009 shutdown
          that split the FSX codebase into enterprise training and licensed consumer spin-offs, and
          a cloud-native revival under Asobo Studio. Click any node to jump directly to its era.
        </p>
      </div>

      <div className="lineage-shell">
        <div className="lineage-trunk">
          {CODEBASE_LINEAGE.trunk.map((node, index) => (
            <React.Fragment key={node.id}>
              <button
                type="button"
                className="lineage-node lineage-animate"
                onClick={() => onJump(node.targetEra)}
              >
                <div>
                  <div className="lineage-year">{node.years}</div>
                  <div className="lineage-node-title">{node.label}</div>
                  <div className="lineage-node-sub">{node.detail}</div>
                </div>
                <ArrowUpRight size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              </button>
              {index < CODEBASE_LINEAGE.trunk.length - 1 && <div className="lineage-connector" />}
            </React.Fragment>
          ))}
        </div>

        <div className="lineage-fracture lineage-animate">
          <div className="lineage-fracture-tag">
            <AlertTriangle size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />
            {CODEBASE_LINEAGE.fracture.year}
          </div>
          <h3>{CODEBASE_LINEAGE.fracture.title}</h3>
          <p>{CODEBASE_LINEAGE.fracture.detail}</p>
        </div>

        <div className="lineage-branches">
          {CODEBASE_LINEAGE.branches.map((branch) => (
            <div
              key={branch.id}
              className="lineage-branch-col lineage-animate"
              style={{ '--branch-color': branch.color }}
            >
              <div className="lineage-branch-heading">{branch.category}</div>
              {branch.nodes.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  className="lineage-branch-item"
                  onClick={() => onJump(branch.targetEra)}
                >
                  <strong>{item.title}</strong>
                  <span>{item.sub}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
