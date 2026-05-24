import React from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Cpu, Database, Zap, Settings2, Pause, ArrowRight, LayoutDashboard, Terminal } from 'lucide-react';
import { cn } from '../lib/utils';
import { AgiOsController } from './AgiOsController';

const tokensData = [
  { time: '14:00', tokens: 42000, latency: 120 },
  { time: '14:05', tokens: 45000, latency: 140 },
  { time: '14:10', tokens: 68000, latency: 210 },
  { time: '14:15', tokens: 75000, latency: 250 },
  { time: '14:20', tokens: 41000, latency: 110 },
  { time: '14:25', tokens: 82000, latency: 290 },
  { time: '14:30', tokens: 95000, latency: 310 },
];

const workloads = [
  { id: 'job-192a', name: 'Llama-3-70b-Instruct', type: 'Fine-tune', progress: 68, eta: '2h 14m', bg: 'bg-[#00FF9F]', status: 'Running', costPerHour: 18.20 },
  { id: 'job-192b', name: 'Helix-Proto-WASM', type: 'WASM Instance', progress: 100, eta: '-', bg: 'bg-blue-500', status: 'Active', costPerHour: 0.12 },
  { id: 'job-192c', name: 'Mistral-8x7b Evaluation', type: 'Eval Sweep', progress: 32, eta: '45m', bg: 'bg-gradient-to-r from-purple-500 to-indigo-500', status: 'Running', costPerHour: 12.80 },
];

export function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-3">
            <LayoutDashboard className="w-6 h-6 text-[#00FF9F]" />
            Control Plane
          </h1>
          <p className="text-xs text-zinc-500 mt-1 font-mono uppercase tracking-[0.2em]">AGI-OS Unified Interface | Node: Helix-Alpha-Z</p>
        </div>
      </div>

      {/* NEW: REAL AGI-OS FOUNDATION */}
      <AgiOsController />

      {/* Top Gauges/Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#00FF9F]/10 rounded-full blur-xl group-hover:bg-[#00FF9F]/20 transition-all"></div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Cpu className="w-4 h-4 text-zinc-500" />
              <h3 className="text-zinc-500 text-[10px] font-mono font-bold uppercase tracking-widest">Aggregate Compute Load</h3>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-bold tracking-tight text-white shadow-[0_0_15px_rgba(0,255,159,0.2)]">86.2</span>
              <span className="text-[#00FF9F] font-mono text-sm">%</span>
            </div>
          </div>
          <div className="mt-6">
            <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden">
              <div className="bg-[#00FF9F] h-full shadow-[0_0_10px_#00FF9F]" style={{ width: '86%' }}></div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all"></div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-4 h-4 text-zinc-500" />
              <h3 className="text-zinc-400 text-[10px] font-mono font-bold uppercase tracking-widest">Memory Pool Allocation</h3>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-bold tracking-tight text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]">4.2</span>
              <span className="text-blue-400 font-mono text-sm">TB</span>
            </div>
          </div>
          <div className="mt-6">
            <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-zinc-800">
              <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400" style={{ width: '74%' }}></div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all"></div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Terminal className="w-4 h-4 text-zinc-500" />
              <h3 className="text-zinc-400 text-[10px] font-mono font-bold uppercase tracking-widest">Structural Coherence</h3>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-bold tracking-tight text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]">0.992</span>
              <span className="text-purple-400 font-mono text-sm">σ</span>
            </div>
          </div>
          <div className="mt-6 flex items-end gap-2 h-8">
            <div className="flex-1 flex items-end gap-[2px] h-full justify-between">
              {[40, 50, 45, 60, 75, 80, 85, 90, 85, 95].map((val, i) => (
                <div key={i} className="w-1.5 bg-zinc-800 rounded-t-sm" style={{ height: '100%' }}>
                  <div className={cn("w-full rounded-t-sm", val > 80 ? "bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.5)]" : "bg-purple-500/50")} style={{ height: `${val}%` }}></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Historical Throughput */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Global Pattern Throughput</h3>
            <p className="text-[10px] text-zinc-500 font-mono mt-1 uppercase tracking-widest">Tokens/sec & Inference Latency</p>
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
              <span className="w-3 h-1 rounded-sm bg-[#00FF9F] mr-2 shadow-[0_0_5px_#00FF9F]"></span>Throughput
            </span>
            <span className="flex items-center text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
              <span className="w-3 h-px border-t border-dashed border-zinc-600 mr-2"></span>Latency
            </span>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={tokensData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00FF9F" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#00FF9F" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" strokeOpacity={0.5} />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a', fontFamily: 'monospace' }} dy={10} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a', fontFamily: 'monospace' }} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a', fontFamily: 'monospace' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', borderRadius: '12px', border: '1px solid #27272a', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)' }}
                itemStyle={{ fontSize: '10px', fontFamily: 'monospace', color: '#e4e4e7', textTransform: 'uppercase' }}
                labelStyle={{ fontSize: '10px', color: '#a1a1aa', fontFamily: 'monospace', marginBottom: '8px', borderBottom: '1px solid #27272a', paddingBottom: '4px' }}
              />
              <Area yAxisId="left" type="monotone" dataKey="tokens" stroke="#00FF9F" strokeWidth={3} fillOpacity={1} fill="url(#colorTokens)" name="t/s" />
              <Area yAxisId="right" type="step" dataKey="latency" stroke="#52525b" strokeWidth={2} fill="transparent" name="ms" strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
