import React, { useState, useRef } from 'react';
import { 
  X, Folder, Github, Database, Globe, Terminal, 
  Search, ArrowRight, Check, AlertCircle, Info,
  Zap, Brain, MessageSquare, Library, BarChart3,
  Monitor, Layout, Settings
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ConnectionType, ProjectCategory } from '../types';

interface ConnectProjectModalProps {
  onClose: () => void;
  onConnect: (projectData: any) => void;
}

const steps = ['Source', 'Discovery', 'Confirm'];

export function ConnectProjectModal({ onClose, onConnect }: ConnectProjectModalProps) {
  const [step, setStep] = useState(0);
  const [sourceType, setSourceType] = useState<ConnectionType | null>(null);
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSourceSelect = (type: ConnectionType) => {
    setSourceType(type);
    if (type === 'Local' && fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      setStep(1);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const folderName = files[0].webkitRelativePath?.split('/')[0] || files[0].name;
      setUrl(folderName);
      setStep(1);
      setTimeout(() => {
        startScan();
      }, 600);
    }
  };

  const startScan = () => {
    setIsScanning(true);
    // Simulate multi-stage discovery
    setTimeout(() => {
      setScanResult({
        name: url.split('/').pop()?.replace('.git', '') || 'Discovered-AI-Project',
        category: 'Fine-Tuning',
        model: 'Llama-3-8B',
        files: 24,
        tokens: '1.4M',
        env: 'conda (helix)',
        entrypoints: ['train.py', 'inference.py'],
        confidence: 94
      });
      setIsScanning(false);
      setStep(2);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-[#151619] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden shadow-[#00FF9F]/5">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-[#00FF9F]/10 rounded-lg">
              <Zap className="w-4 h-4 text-[#00FF9F]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-tight">Connect AI Project</h3>
              <div className="flex items-center gap-2 mt-0.5">
                {steps.map((s, i) => (
                  <React.Fragment key={s}>
                    <span className={cn(
                      "text-[9px] font-bold uppercase",
                      i === step ? "text-[#00FF9F]" : "text-zinc-600"
                    )}>{s}</span>
                    {i < steps.length - 1 && <ArrowRight className="w-2.5 h-2.5 text-zinc-700" />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8">
          {step === 0 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h4 className="text-lg font-bold text-zinc-100 italic">"Where is your AI build living?"</h4>
                <p className="text-sm text-zinc-500 mt-1">Select a source to begin automatic discovery and connection.</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <SourceCard 
                  title="Local Folder" 
                  icon={Folder} 
                  desc="Select folder or drag & drop repo" 
                  onClick={() => handleSourceSelect('Local')} 
                />
                <SourceCard 
                  title="HuggingFace" 
                  icon={Database} 
                  desc="Connect via model or dataset URL" 
                  onClick={() => handleSourceSelect('HuggingFace')} 
                />
                <SourceCard 
                  title="Git Repository" 
                  icon={Github} 
                  desc="GitHub, GitLab, or custom Git" 
                  onClick={() => handleSourceSelect('Git')} 
                />
                <SourceCard 
                  title="Active Endpoint" 
                  icon={Globe} 
                  desc="Monitor running API or server" 
                  onClick={() => handleSourceSelect('Endpoint')} 
                />
                <SourceCard 
                  title="Notebook" 
                  icon={Terminal} 
                  desc="Connect to active Jupyter/Colab" 
                  onClick={() => handleSourceSelect('Notebook')} 
                />
                <div className="p-4 border border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center text-center opacity-40 grayscale pointer-events-none">
                  <Monitor className="w-6 h-6 text-zinc-500 mb-2" />
                  <span className="text-[10px] font-bold text-zinc-600 uppercase">Docker coming soon</span>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-8 py-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">
                  ENTER {sourceType?.toUpperCase()} REFERENCE
                </label>
                <div className="relative group">
                  <input 
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    webkitdirectory=""
                    directory=""
                    onChange={handleFileChange}
                  />
                  <input 
                    autoFocus
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder={sourceType === 'Git' ? 'https://github.com/helixstudio/helix-project.git' : 'Enter target path or identifier...'}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-5 py-4 text-sm text-zinc-200 outline-none focus:border-[#00FF9F]/50 focus:ring-1 focus:ring-[#00FF9F]/20 transition-all font-mono pl-12"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    {sourceType === 'Local' ? (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-[#00FF9F] transition-colors"
                        title="Browse File System"
                      >
                        <Folder className="w-5 h-5" />
                      </button>
                    ) : sourceType === 'Git' ? (
                      <Github className="w-5 h-5 text-zinc-600" />
                    ) : (
                      <Search className="w-5 h-5 text-zinc-600" />
                    )}
                  </div>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button 
                      onClick={startScan}
                      disabled={!url || isScanning}
                      className="px-4 py-1.5 bg-[#00FF9F] text-zinc-950 text-xs font-bold rounded-lg hover:bg-[#88d400] disabled:opacity-50 transition-all shadow-lg shadow-[#00FF9F]/10"
                    >
                      {isScanning ? 'SCANNING...' : 'DISCOVER'}
                    </button>
                  </div>
                </div>
              </div>

              {isScanning && (
                <div className="bg-black/30 rounded-xl border border-zinc-800/50 p-6 flex flex-col items-center animate-pulse">
                  <div className="w-12 h-12 rounded-full border-2 border-[#00FF9F] border-t-transparent animate-spin mb-4"></div>
                  <p className="text-sm font-bold text-zinc-200">Analyzing Project DNA...</p>
                  <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">Scanning files • detecting arch • identifying weights</p>
                </div>
              )}

              {!isScanning && (
                <div className="p-4 bg-[#00FF9F]/5 border border-[#00FF9F]/20 rounded-xl flex gap-4">
                   <Info className="w-5 h-5 text-[#00FF9F] shrink-0 translate-y-0.5" />
                   <p className="text-xs text-zinc-400 leading-relaxed">
                     HelixStudio will automatically scan for <span className="text-[#00FF9F]">training_config.yaml</span>, <span className="text-[#00FF9F]">requirements.txt</span>, and well-known entrypoints. Ensure your project follows standard AI repo structures for the best experience.
                   </p>
                </div>
              )}
            </div>
          )}

          {step === 2 && scanResult && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-400">
               <div className="grid grid-cols-2 gap-6">
                 <div>
                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Project Blueprint</h4>
                    <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-4">
                       <div>
                         <span className="text-[9px] text-zinc-600 block uppercase">Project Name</span>
                         <span className="text-sm font-bold text-zinc-100">{scanResult.name}</span>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[9px] text-zinc-600 block uppercase">Category</span>
                            <span className="text-xs text-[#00FF9F] font-bold">{scanResult.category}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-zinc-600 block uppercase">Detected Env</span>
                            <span className="text-xs text-zinc-300 font-mono">{scanResult.env}</span>
                          </div>
                       </div>
                    </div>
                 </div>
                 <div>
                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Discovery Stats</h4>
                    <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-4">
                       <div className="flex justify-between items-center">
                          <span className="text-[9px] text-zinc-600 uppercase">Detection Confidence</span>
                          <span className="text-xs text-[#00FF9F] font-mono">{scanResult.confidence}%</span>
                       </div>
                       <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                          <div className="h-full bg-[#00FF9F]" style={{ width: `${scanResult.confidence}%` }}></div>
                       </div>
                       <div className="flex gap-2">
                          <div className="px-2 py-1 bg-zinc-900 rounded text-[9px] text-zinc-400 border border-zinc-800">{scanResult.files} Files</div>
                          <div className="px-2 py-1 bg-zinc-900 rounded text-[9px] text-zinc-400 border border-zinc-800">{scanResult.tokens} Tokens</div>
                       </div>
                    </div>
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Primary Entrypoint</label>
                 <select className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-300 outline-none focus:border-[#00FF9F]/50 text-left">
                    {scanResult?.entrypoints?.map((e: string) => (
                      <option key={e}>{e}</option>
                    ))}
                 </select>
               </div>

               <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl flex gap-3">
                 <AlertCircle className="w-5 h-5 text-blue-400 shrink-0" />
                 <div>
                   <p className="text-[11px] text-zinc-200 font-bold">Suggested Adapter: Llama-Factory</p>
                   <p className="text-[10px] text-zinc-500 mt-0.5">We detected a LoRA configuration. Using the Llama-Factory adapter will enable advanced visual monitoring.</p>
                 </div>
               </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-zinc-900/50 border-t border-zinc-800/50 flex justify-between items-center">
           <button 
             onClick={() => step > 0 ? setStep(step - 1) : onClose()}
             className="px-6 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-200 transition-colors uppercase tracking-widest"
           >
             {step === 0 ? 'CANCEL' : 'BACK'}
           </button>
           {step === 2 && (
             <button 
               onClick={() => onConnect({ ...scanResult, id: Math.random().toString(36).substr(2, 9), status: 'Stopped', connectionType: sourceType, created: new Date().toISOString().split('T')[0] })}
               className="px-8 py-2.5 bg-[#00FF9F] text-zinc-950 rounded-xl font-bold text-sm hover:bg-[#88d400] transition-all shadow-xl shadow-[#00FF9F]/20 active:scale-95 flex items-center gap-2"
             >
               FINALIZE CONNECTION
               <Check className="w-4 h-4" />
             </button>
           )}
        </div>
      </div>
    </div>
  );
}

function SourceCard({ title, icon: Icon, desc, onClick }: { title: string, icon: any, desc: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="p-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col items-center text-center group hover:border-[#00FF9F]/40 hover:bg-[#00FF9F]/5 transition-all duration-300"
    >
      <div className="w-12 h-12 rounded-xl bg-zinc-950 flex items-center justify-center text-zinc-600 group-hover:text-[#00FF9F] group-hover:scale-110 transition-all border border-zinc-800 shadow-inner group-hover:shadow-[#00FF9F]/10">
        <Icon className="w-6 h-6" />
      </div>
      <h5 className="text-xs font-bold text-zinc-300 mt-4 group-hover:text-zinc-100 uppercase tracking-tight">{title}</h5>
      <p className="text-[10px] text-zinc-600 mt-1 leading-tight group-hover:text-zinc-500">{desc}</p>
    </button>
  );
}
