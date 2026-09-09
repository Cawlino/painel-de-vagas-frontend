import React from 'react';
import { ExternalLink, MapPin, Building2, Calendar, Sparkles } from 'lucide-react';

function getSourceBadge(source) {
  if (source === 'linkedin') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/20">
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        LinkedIn
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
      <MapPin className="w-3 h-3" />
      Catho
    </span>
  );
}

function getScoreBadge(score) {
  let color = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  let label = 'Match';
  
  if (score >= 70) {
    color = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    label = 'Excelente';
  } else if (score >= 40) {
    color = 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    label = 'Bom';
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${color}`}>
      <Sparkles className="w-3 h-3" />
      {score}% {label}
    </span>
  );
}

export default function JobCard({ job }) {
  const { title, company, location, link, date, source, compatibility } = job;

  const formattedDate = date
    ? (() => {
        try {
          const d = new Date(date);
          if (isNaN(d)) return date;
          return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        } catch {
          return date;
        }
      })()
    : '';

  return (
    <div className="group bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 hover:border-zinc-700/80 hover:bg-zinc-800/40 transition-all duration-300 relative overflow-hidden">
      {/* Glow effect on hover */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -mr-8 -mt-8 transition-all group-hover:bg-indigo-500/10" />
      
      <div className="relative z-10">
        {/* Header: Source badge + Score + Date */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {getSourceBadge(source)}
            {compatibility?.score > 0 && getScoreBadge(compatibility.score)}
          </div>
          {formattedDate && (
            <span className="text-[11px] text-zinc-500 font-mono flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formattedDate}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors mb-2 line-clamp-2 leading-snug">
          {title}
        </h3>

        {/* Company + Location */}
        <div className="flex flex-col gap-1.5 mb-4">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Building2 className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
            <span className="truncate">{company}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <MapPin className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
            <span className="truncate">{location}</span>
          </div>
        </div>

        {/* Matched Keywords (top 3) */}
        {compatibility?.matched?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {compatibility.matched.slice(0, 4).map((kw, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 text-[10px] rounded-md bg-zinc-800/80 text-zinc-400 border border-zinc-700/50"
              >
                {kw}
              </span>
            ))}
            {compatibility.matched.length > 4 && (
              <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-zinc-800/80 text-zinc-500">
                +{compatibility.matched.length - 4}
              </span>
            )}
          </div>
        )}

        {/* CTA */}
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors group/link"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Ver vaga
            <span className="opacity-0 group-hover/link:opacity-100 transition-opacity">→</span>
          </a>
        )}
      </div>
    </div>
  );
}
