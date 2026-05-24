import { useState, useEffect, useMemo } from 'react';
import { 
  Gauge, Activity, Cpu, HardDrive, Zap, AlertTriangle, 
  ArrowUpRight, ArrowDownRight, RefreshCw, Maximize2, 
  MoreHorizontal, Play, Square, Share2, Terminal,
  TrendingUp, Thermometer, Wind, Bolt, Download,
  Layers, ShieldCheck, ZapOff, Brain
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { cn } from '../lib/utils';
import { GPUStatus, Project } from '../types';
import { useResourceMonitor } from '../hooks/useResourceMonitor';

interface GlobalResourceMonitorProps {
  projects: Project[];
}

export function GlobalResourceMonitor({ projects }: GlobalResourceMonitorProps) {
  const { gpus, stats: clusterStats } = useResourceMonitor();
  const [history, setHistory] = useState<any[]>([]);

  // Update history for charts
  useEffect(() => {
    setHistory(prev => {
      const newEntry = {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        utilization: clusterStats.avgUtilization,
        vram: (clusterStats.totalVramUsed / clusterStats.totalVram) * 100,
        tokens: clusterStats.tokensPerSec / 1000 // scaling for chart
      };
      const next = [...prev, newEntry];
      return next.length > 30 ? next.slice(1) : next;
    });
  }, [clusterStats]);

  const gaugeData = [
    { name: 'Used', value: clusterStats.avgUtilization },
    { name: 'Available', value: 100 - clusterStats.avgUtilization },
  ];

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 pb-12">
      {/* Overview Header with Large Gauge */}
      <div className="mb-10 grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
        <div className="lg:col-span-1 flex flex-col items-center justify-center p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-[#00FF9F]/5 opacity-0 group-hover:opacity-100 transition-opacity blur-2xl"></div>
          <div className="relative w-40 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gaugeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={70}
                  startAngle={225}
                  endAngle={-45}
                  paddingAngle={0}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill="#00FF9F" />
                  <Cell fill="#18181b" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-zinc-100 tracking-tighter">{clusterStats.avgUtilization.toFixed(0)}<span className="text-sm text-zinc-500">%</span></span>
              <span className="text-[10px] font-bold text-[#00FF9F] uppercase tracking-widest mt-1">Utilization</span>
            </div>
          </div>
          <div className="mt-2 text-center">
             <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase">
                <ShieldCheck className="w-3 h-3 text-[#00FF9F]" />
                Cluster Healthy
             </div>
          </div>
        </div>

        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4 h-full">
           <MetricBlock label="Active Compute" value={`${clusterStats.onlineNodes} / ${gpus.length}`} sub="GPU Nodes Online" icon={Cpu} color="text-[#00FF9F]" />
           <MetricBlock label="Throughput" value={`${(clusterStats.tokensPerSec / 1000).toFixed(1)}k`} sub="Tokens / Sec" icon={Zap} color="text-yellow-400" />
           <MetricBlock label="Aggregate VRAM" value={`${clusterStats.totalVramUsed.toFixed(0)} GB`} sub={`of ${clusterStats.totalVram} GB Total`} icon={HardDrive} color="text-blue-400" />
           <MetricBlock label="Est. Burn Rate" value={`$${(clusterStats.totalPower * 0.00012).toFixed(3)}`} sub="Per Hour (Simulated)" icon={Activity} color="text-red-400" />
        </div>
      </div>

      {/* Primary Actions Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
         <ActionButton icon={TrendingUp} label="Auto-Optimize Allocation" primary />
         <ActionButton icon={Layers} label="Free Unused VRAM Cache" />
         <ActionButton icon={Terminal} label="nvidia-smi" />
         <ActionButton icon={Download} label="Export Resource Report" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* GPU Breakdown */}
         <div className="lg:col-span-2 space-y-6">
            <SectionHeader icon={Cpu} title="Per-GPU Real-time Telemetry" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {gpus?.map(gpu => (
                 <div key={gpu.id}>
                    <GPUCard gpu={gpu} />
                 </div>
               ))}
            </div>
         </div>

         {/* Sidebar */}
         <div className="space-y-8">
            <SectionHeader icon={TrendingUp} title="Live Cluster Trends" />
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 relative group overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00FF9F]/40 to-transparent"></div>
               <div className="h-56 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history}>
                      <defs>
                        <linearGradient id="colorUtil" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00FF9F" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#00FF9F" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorTok" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#eab308" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} strokeOpacity={0.2} />
                      <XAxis dataKey="time" hide />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '10px' }}
                        itemStyle={{ padding: '2px 0' }}
                      />
                      <Area type="monotone" dataKey="utilization" stroke="#00FF9F" fillOpacity={1} fill="url(#colorUtil)" strokeWidth={2} name="Utilization %" />
                      <Area type="monotone" dataKey="tokens" stroke="#eab308" fillOpacity={1} fill="url(#colorTok)" strokeWidth={2} name="Tokens (k)" strokeDasharray="4 4" />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>
               <div className="flex flex-wrap justify-between items-center mt-6 gap-4 border-t border-zinc-800/50 pt-4">
                  <div className="flex gap-6">
                    <LegendItem color="bg-[#00FF9F]" label="Utilization" />
                    <LegendItem color="bg-yellow-500" label="Throughput" />
                  </div>
                  <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest hidden md:block">Real-time Stream: node.helix-studio-v1</span>
               </div>
            </div>

            {/* AI-Driven Resource Insights */}
            <div className="space-y-3">
               <SectionHeader icon={Brain} title="AI Helix Intelligence" />
               
               {/* Dynamic AI Insights */}
               {(() => {
                 const alerts = [];
                 
                 // 1. Check for overheating
                 const hotGpus = gpus.filter(g => g.temp > 75);
                 if (hotGpus.length > 0) {
                   alerts.push(
                     <InsightAlert 
                       key="thermal"
                       type="warning" 
                       title="Thermal Alert" 
                       desc={`${hotGpus.length} node(s) exceeding 75°C. Cooling system optimized, but reallocation to secondary cluster recommended if training continues for > 30 mins.`} 
                     />
                   );
                 }

                 // 2. Check for underutilization during active training
                 const activeProjects = projects.filter(p => p.status === 'Running');
                 const idleGpus = gpus.filter(g => g.status === 'Idle');
                 if (activeProjects.length > 0 && idleGpus.length >= 4) {
                   alerts.push(
                     <InsightAlert 
                       key="usage"
                       type="info" 
                       title="Provisioning Suggestion" 
                       desc={`${idleGpus.length} GPUs standby detected. For current workloads, you can reduce node allocation to save $4.20/hr or enable Auto-Scale to boost FP8 throughput.`} 
                     />
                   );
                 }

                 // 3. Bottleneck detection
                 const highUtilGpus = gpus.filter(g => g.utilization > 95);
                 if (highUtilGpus.length >= 2) {
                   alerts.push(
                     <InsightAlert 
                       key="bottleneck"
                       type="warning" 
                       title="Compute Bottleneck" 
                       desc="Multiple GPUs saturated. Training throughput limited by PCI-e bandwidth. Suggestions: Enable NVLink P2P or shard optimizer states with ZeRO-3." 
                     />
                   );
                 }

                 // Default healthy state if few alerts
                 if (alerts.length < 2) {
                    alerts.push(
                      <InsightAlert 
                        key="health"
                        type="info" 
                        title="Optimal Performance" 
                        desc="Advanced heuristic model reports 98.4% efficiency. Predictive maintenance scheduled for 24h from now." 
                      />
                    );
                 }

                 return alerts;
               })()}
            </div>

            {/* Project Quick View */}
            <div className="space-y-4 pt-4 border-t border-zinc-800">
               <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">Project Resource Loads</h3>
               {projects?.slice(0, 3).map(proj => (
                 <ProjectResourceCard key={proj.id} project={proj} stats={clusterStats} />
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}

function MetricBlock({ label, value, sub, icon: Icon, color }: any) {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 flex flex-col justify-center">
       <div className="flex items-center gap-2 mb-2">
          <Icon className={cn("w-3.5 h-3.5", color)} />
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{label}</span>
       </div>
       <div className="text-xl font-bold text-zinc-100 tracking-tight">{value}</div>
       <div className="text-[9px] font-medium text-zinc-600 uppercase mt-0.5">{sub}</div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: any) {
  return (
     <div className="flex items-center gap-3 mb-2">
        <div className="p-1 px-1.5 bg-zinc-900 border border-zinc-800 rounded">
           <Icon className="w-3.5 h-3.5 text-zinc-400" />
        </div>
        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.1em]">{title}</h3>
     </div>
  );
}

function ActionButton({ icon: Icon, label, primary }: any) {
  return (
    <button className={cn(
      "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border",
      primary 
        ? "bg-[#00FF9F] text-zinc-950 border-[#00FF9F] hover:bg-[#00d182] hover:shadow-[0_0_15px_rgba(0,255,159,0.3)]" 
        : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700"
    )}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

function ProjectResourceCard({ project, stats }: any) {
  return (
    <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-xl p-3 hover:border-[#00FF9F]/20 transition-all group">
       <div className="flex justify-between items-start mb-2">
          <div className="text-[11px] font-bold text-zinc-300 group-hover:text-[#00FF9F] transition-colors">{project.name}</div>
          <div className="flex items-center gap-1 text-[9px] font-mono text-[#00FF9F] font-bold">
             <Activity className="w-2.5 h-2.5 animate-pulse" />
             LIVE
          </div>
       </div>
       <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
             <div className="text-[8px] text-zinc-600 font-bold uppercase">Compute Load</div>
             <div className="h-1 bg-zinc-950 rounded-full overflow-hidden">
                <div className="h-full bg-[#00FF9F]" style={{ width: '64%' }}></div>
             </div>
          </div>
          <div className="space-y-1">
             <div className="text-[8px] text-zinc-600 font-bold uppercase">VRAM Usage</div>
             <div className="h-1 bg-zinc-950 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: '42%' }}></div>
             </div>
          </div>
       </div>
    </div>
  );
}

function InsightAlert({ type, title, desc }: any) {
  const isWarning = type === 'warning';
  return (
    <div className={cn(
      "p-3 rounded-xl border flex gap-3",
      isWarning ? "bg-red-500/5 border-red-500/20" : "bg-[#00FF9F]/5 border-[#00FF9F]/20"
    )}>
      <div className={cn("p-1.5 h-fit rounded-lg", isWarning ? "bg-red-500/10" : "bg-[#00FF9F]/10")}>
         {isWarning ? <ZapOff className="w-3.5 h-3.5 text-red-400" /> : <ShieldCheck className="w-3.5 h-3.5 text-[#00FF9F]" />}
      </div>
      <div className="space-y-1">
         <div className={cn("text-[10px] font-bold uppercase tracking-widest", isWarning ? "text-red-400" : "text-[#00FF9F]")}>{title}</div>
         <p className="text-[10px] text-zinc-500 leading-normal">{desc}</p>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: any) {
  return (
    <div className="flex items-center gap-2">
       <div className={cn("w-2 h-2 rounded-full", color)}></div>
       <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{label}</span>
    </div>
  );
}

function GPUCard({ gpu }: { gpu: GPUStatus }) {
  const isWarning = gpu.status === 'Overload' || gpu.utilization > 90;
  const isIdle = gpu.status === 'Idle';

  return (
    <div className={cn(
      "bg-zinc-950/40 border rounded-xl p-5 transition-all duration-300 relative group",
      isWarning ? "border-red-500/30 hover:border-red-500/50" : "border-zinc-800 hover:border-[#00FF9F]/40",
      isIdle && "opacity-60"
    )}>
      {isWarning && <div className="absolute inset-0 bg-red-500/5 blur-xl pointer-events-none"></div>}

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
           <div className="flex items-center gap-2 mb-1">
             <h4 className="text-sm font-bold text-zinc-200">{gpu.name}</h4>
             <span className="text-[10px] font-mono text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">{gpu.id.toUpperCase()}</span>
           </div>
           {gpu.currentProject ? (
             <span className="flex items-center gap-1.5 text-[9px] font-bold text-[#00FF9F] uppercase">
                <Play className="w-2.5 h-2.5" />
                {gpu.currentProject}
             </span>
           ) : (
             <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Standby</span>
           )}
        </div>
        <div className={cn(
          "px-2 py-0.5 rounded text-[8px] font-bold uppercase border",
          gpu.status === 'Active' ? "bg-[#00FF9F]/10 border-[#00FF9F]/30 text-[#00FF9F]" :
          gpu.status === 'Overload' ? "bg-red-500/10 border-red-500/30 text-red-400" :
          "bg-zinc-800 border-zinc-700 text-zinc-500"
        )}>
          {gpu.status}
        </div>
      </div>

      <div className="space-y-4 relative z-10">
         {/* Utilization */}
         <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold">
               <span className="text-zinc-500 font-bold uppercase tracking-tight">Utilization Load</span>
               <span className={cn(isWarning ? "text-red-400" : "text-zinc-300")}>{gpu.utilization.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800/50 shadow-inner">
               <div 
                 className={cn(
                   "h-full transition-all duration-700",
                   gpu.utilization > 90 ? "bg-red-500" : gpu.utilization > 70 ? "bg-yellow-400" : "bg-[#00FF9F]"
                 )} 
                 style={{ width: `${gpu.utilization}%` }}
               ></div>
            </div>
         </div>

         {/* VRAM */}
         <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold">
               <span className="text-zinc-500 font-bold uppercase tracking-tight">Dedicated VRAM</span>
               <span className="text-zinc-300">{gpu.vramUsed.toFixed(1)} / {gpu.vramTotal} GB</span>
            </div>
            <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800/50 shadow-inner">
               <div 
                 className="h-full bg-blue-500 transition-all duration-700" 
                 style={{ width: `${(gpu.vramUsed / gpu.vramTotal) * 100}%` }}
               ></div>
            </div>
         </div>

         {/* Tertiary Metrics */}
         <div className="grid grid-cols-3 gap-3 pt-2 border-t border-zinc-800/50">
            <Metric icon={Thermometer} label="TEMP" value={`${gpu.temp.toFixed(0)}°C`} color={gpu.temp > 75 ? "text-orange-400" : "text-zinc-400"} />
            <Metric icon={Bolt} label="POWER" value={`${gpu.power.toFixed(0)}W`} />
            <Metric icon={Wind} label="FAN" value={`${gpu.fanSpeed}%`} />
         </div>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, color = "text-zinc-400" }: any) {
  return (
    <div className="space-y-1 text-center">
      <div className="flex items-center justify-center gap-1.5 text-[8px] font-bold text-zinc-600 uppercase tracking-tighter">
        <Icon className="w-2.5 h-2.5" />
        {label}
      </div>
      <div className={cn("text-[10px] font-mono font-bold", color)}>{value}</div>
    </div>
  );
}
