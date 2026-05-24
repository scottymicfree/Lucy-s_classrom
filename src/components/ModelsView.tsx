import React, { useState, useEffect } from 'react';
import { Database, Play, SlidersHorizontal, HardDrive, Cpu, Zap, Search, Info, LineChart as ChartIcon, TrendingDown, Crosshair, ShieldCheck } from 'lucide-react';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '../lib/utils';

const availableModels = [
  { id: 'llama-3-8b', name: 'Llama-3-8B-Base', size: '16 GB', architecture: 'Transformer', contextWindow: '8k', parameters: '8.03B', license: 'Llama 3 License', defaultLR: '2e-5', defaultEpochs: '3', defaultBatchSize: '16', defaultPrecision: 'bf16' },
  { id: 'llama-3-70b', name: 'Llama-3-70B-Base', size: '140 GB', architecture: 'Transformer', contextWindow: '8k', parameters: '70.6B', license: 'Llama 3 License', defaultLR: '1e-5', defaultEpochs: '2', defaultBatchSize: '8', defaultPrecision: 'bf16' },
  { id: 'mixtral-8x7b', name: 'Mixtral 8x7B MoE', size: '96 GB', architecture: 'MoE', contextWindow: '32k', parameters: '46.7B', license: 'Apache 2.0', defaultLR: '5e-5', defaultEpochs: '3', defaultBatchSize: '16', defaultPrecision: 'bf16' },
  { id: 'sd-xl', name: 'Stable Diffusion XL', size: '14 GB', architecture: 'Diffusion', contextWindow: 'N/A', parameters: '3.5B', license: 'OpenRAIL++', defaultLR: '1e-4', defaultEpochs: '10', defaultBatchSize: '32', defaultPrecision: 'fp16' },
];

export function ModelsView() {
  const [selectedModel, setSelectedModel] = useState(availableModels[0].id);
  const [learningRate, setLearningRate] = useState('2e-5');
  const [epochs, setEpochs] = useState('3');
  const [batchSize, setBatchSize] = useState('16');
  const [precision, setPrecision] = useState('bf16');
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [trainingHistory, setTrainingHistory] = useState<{ step: number; loss: number; accuracy: number }[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const selectedModelData = availableModels.find(m => m.id === selectedModel) || availableModels[0];

  useEffect(() => {
    setLearningRate(selectedModelData.defaultLR);
    setEpochs(selectedModelData.defaultEpochs);
    setBatchSize(selectedModelData.defaultBatchSize);
    setPrecision(selectedModelData.defaultPrecision);
  }, [selectedModelData]);

  const handleStartTraining = () => {
    setIsTraining(true);
    setProgress(0);
    setTrainingHistory([]);
    
    let currentStep = 0;
    const interval = setInterval(() => {
      setProgress((prev) => {
        const nextProgress = prev + Math.random() * 5 + 2;
        
        // Simulating loss and accuracy
        currentStep += 10;
        const loss = Math.max(0.1, 2.5 * Math.exp(-currentStep / 200) + Math.random() * 0.05);
        const accuracy = Math.min(0.99, 0.4 + 0.55 * (1 - Math.exp(-currentStep / 150)) + Math.random() * 0.02);
        
        setTrainingHistory(prevHistory => [
          ...prevHistory, 
          { step: currentStep, loss, accuracy: accuracy * 100 }
        ].slice(-30)); // Keep last 30 points

        if (nextProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsTraining(false);
            setProgress(100);
            setIsFinished(true);
            setTimeout(() => setIsFinished(false), 5000);
          }, 300);
          return 100;
        }
        return nextProgress;
      });
    }, 150);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-[#00FF9F]" />
            Model Registry & Fine-Tuning
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-mono uppercase tracking-wider">Configure & Launch Training Jobs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Model Selection */}
        <div className="lg:col-span-1 bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 flex flex-col h-[calc(100vh-14rem)]">
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search base models..." 
              className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm text-zinc-300 focus:outline-none focus:border-[#00FF9F]/50 transition-all font-mono placeholder:font-sans"
            />
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {availableModels.map((model) => (
              <div 
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={cn(
                  "cursor-pointer p-4 rounded-lg border transition-all flex flex-col gap-2",
                  selectedModel === model.id 
                    ? "bg-[#00FF9F]/10 border-[#00FF9F]/50 shadow-[0_0_10px_rgba(118,185,0,0.1)]" 
                    : "bg-zinc-950/50 border-zinc-800/80 hover:border-zinc-700"
                )}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-zinc-200 text-sm">{model.name}</h3>
                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">{model.size}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono mt-1">
                  <span className="flex items-center gap-1">
                    <Cpu className="w-3 h-3" />
                    {model.architecture}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Training Configuration */}
        <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00FF9F]/30 to-transparent"></div>
          
          <div className="flex items-center gap-2 mb-6">
            <SlidersHorizontal className="w-4 h-4 text-zinc-400" />
            <h3 className="font-semibold text-zinc-200">Hyperparameter Tuning</h3>
          </div>

          {(isTraining || trainingHistory.length > 0) && (
            <div className="mb-8 p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl relative overflow-hidden group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <span className="w-2 h-2 rounded-full bg-[#00FF9F] shadow-[0_0_5px_#00FF9F]"></span>
                    <span className="text-zinc-300">Loss</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_5px_#3b82f6]"></span>
                    <span className="text-zinc-300">Accuracy</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-mono text-zinc-500 uppercase">Live Training Visualization</span>
                   <ChartIcon className="w-3 h-3 text-[#00FF9F]" />
                </div>
              </div>
              
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trainingHistory}>
                    <defs>
                      <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00FF9F" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#00FF9F" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                    <XAxis dataKey="step" hide />
                    <YAxis yAxisId="left" hide domain={[0, 'auto']} />
                    <YAxis yAxisId="right" hide domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid #27272a', fontSize: '10px' }}
                      itemStyle={{ padding: '0px' }}
                    />
                    <Area yAxisId="left" type="monotone" dataKey="loss" stroke="#00FF9F" fillOpacity={1} fill="url(#colorLoss)" strokeWidth={2} isAnimationActive={false} />
                    <Area yAxisId="right" type="monotone" dataKey="accuracy" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAcc)" strokeWidth={2} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/50 rounded-lg border border-zinc-800">
                  <TrendingDown className="w-4 h-4 text-[#00FF9F]" />
                  <div>
                    <p className="text-[10px] font-mono text-zinc-500 uppercase">Current Loss</p>
                    <p className="text-sm font-bold text-zinc-200">
                      {trainingHistory[trainingHistory.length - 1]?.loss.toFixed(4) || '0.0000'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/50 rounded-lg border border-zinc-800">
                  <Crosshair className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-[10px] font-mono text-zinc-500 uppercase">Top Accuracy</p>
                    <p className="text-sm font-bold text-zinc-200">
                      {trainingHistory[trainingHistory.length - 1]?.accuracy.toFixed(1) || '0.0'}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                <div className="relative group flex items-center">
                  <span className="border-b border-dashed border-zinc-600 cursor-help">Learning Rate</span>
                  <Info className="w-3 h-3 ml-1 text-zinc-500" />
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-zinc-800 text-zinc-200 text-[10px] p-2.5 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 font-sans normal-case leading-relaxed border border-zinc-700">
                    <span className="font-bold text-[#00FF9F] block mb-1">Impact: Stability & Time</span>
                    The step size at each iteration. High values risk model divergence and catastrophic forgetting. Low values ensure convergence stability but exponentially increase compute hours and total training cost.
                  </div>
                </div>
                <span className="text-[#00FF9F]">{learningRate}</span>
              </label>
              <input 
                type="text" 
                value={learningRate}
                onChange={(e) => setLearningRate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-200 font-mono focus:outline-none focus:border-[#00FF9F]/50 transition-colors"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                <div className="relative group flex items-center">
                  <span className="border-b border-dashed border-zinc-600 cursor-help">Epochs</span>
                  <Info className="w-3 h-3 ml-1 text-zinc-500" />
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-zinc-800 text-zinc-200 text-[10px] p-2.5 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 font-sans normal-case leading-relaxed border border-zinc-700">
                    <span className="font-bold text-[#00FF9F] block mb-1">Impact: Accuracy & Cost</span>
                    Total number of complete passes through the dataset. Increasing epochs improves feature learning but scales compute wall-clock time linearly and increases risk of model overfitting.
                  </div>
                </div>
                <span className="text-[#00FF9F]">{epochs}</span>
              </label>
              <input 
                type="number" 
                value={epochs}
                onChange={(e) => setEpochs(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-200 font-mono focus:outline-none focus:border-[#00FF9F]/50 transition-colors"
                min="1"
                max="100"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                <div className="relative group flex items-center">
                  <span className="border-b border-dashed border-zinc-600 cursor-help">Batch Size</span>
                  <Info className="w-3 h-3 ml-1 text-zinc-500" />
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-zinc-800 text-zinc-200 text-[10px] p-2.5 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 font-sans normal-case leading-relaxed border border-zinc-700">
                    <span className="font-bold text-[#00FF9F] block mb-1">Impact: VRAM & Speed</span>
                    Number of samples per device iteration. Larger batches maximize hardware TFLOPS utilization but increase VRAM allocation requirements. Essential for efficient multi-GPU scaling.
                  </div>
                </div>
                <span className="text-[#00FF9F]">{batchSize}</span>
              </label>
              <select 
                value={batchSize}
                onChange={(e) => setBatchSize(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-200 font-mono focus:outline-none focus:border-[#00FF9F]/50 transition-colors appearance-none"
              >
                <option value="4">4</option>
                <option value="8">8</option>
                <option value="16">16</option>
                <option value="32">32</option>
                <option value="64">64</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                <div className="relative group flex items-center">
                  <span className="border-b border-dashed border-zinc-600 cursor-help">Precision</span>
                  <Info className="w-3 h-3 ml-1 text-zinc-500" />
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-zinc-800 text-zinc-200 text-[10px] p-2.5 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 font-sans normal-case leading-relaxed border border-zinc-700">
                    <span className="font-bold text-[#00FF9F] block mb-1">Impact: Compute Efficiency</span>
                    Numerical bit-width for weights. bf16/fp16 (16-bit) significantly reduces VRAM footprint and enables Tensor Core acceleration, cutting costs by ~50% compared to fp32.
                  </div>
                </div>
                <span className="text-zinc-500">{precision}</span>
              </label>
              <select 
                value={precision}
                onChange={(e) => setPrecision(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-200 font-mono focus:outline-none focus:border-[#00FF9F]/50 transition-colors appearance-none"
              >
                <option>bf16</option>
                <option>fp16</option>
                <option>int8</option>
                <option>fp32</option>
              </select>
            </div>
          </div>

          <div className="border-t border-zinc-800/80 pt-6 mb-8 mt-4">
            <h4 className="text-sm font-semibold text-zinc-300 mb-4 pb-2 border-b border-zinc-800/50 inline-flex items-center gap-2">
              <Database className="w-4 h-4 text-zinc-400" />
              {selectedModelData.name} Details
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/50">
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-1">Architecture</p>
                <p className="text-sm text-zinc-200 font-medium">{selectedModelData.architecture}</p>
              </div>
              <div className="bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/50">
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-1">Parameters</p>
                <p className="text-sm text-zinc-200 font-medium">{selectedModelData.parameters}</p>
              </div>
              <div className="bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/50">
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-1">Context Window</p>
                <p className="text-sm text-zinc-200 font-medium">{selectedModelData.contextWindow}</p>
              </div>
              <div className="bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/50">
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-1">License</p>
                <p className="text-sm text-[#00FF9F] font-medium truncate" title={selectedModelData.license}>{selectedModelData.license}</p>
              </div>
            </div>
          </div>

          <div className="mt-auto bg-zinc-950/80 border border-zinc-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#00FF9F]/10 rounded-md border border-[#00FF9F]/30">
                <HardDrive className="w-5 h-5 text-[#00FF9F]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-200">Estimated Reqs</p>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">8x H100 (80GB) | ~4 hours</p>
              </div>
            </div>
            <button 
              onClick={handleStartTraining}
              disabled={isTraining}
              className={cn(
                "px-6 py-2.5 rounded-md font-semibold text-sm transition-all flex items-center justify-center gap-2 relative overflow-hidden",
                isTraining 
                  ? "bg-zinc-800 text-zinc-200 cursor-not-allowed" 
                  : "bg-[#00FF9F] hover:bg-[#88d400] text-zinc-950 shadow-[0_0_15px_rgba(118,185,0,0.3)] hover:shadow-[0_0_20px_rgba(118,185,0,0.5)]"
              )}
            >
              {isTraining && (
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-[#00FF9F]/30 z-0 transition-all duration-100 ease-linear"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              )}
              <div className="relative z-10 flex items-center gap-2">
                {isFinished ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-zinc-950" />
                    <span>Job Queued: HX-{Math.floor(Math.random() * 10000)}</span>
                  </>
                ) : isTraining ? (
                  <>
                    <Zap className="w-4 h-4 text-[#00FF9F] animate-pulse" /> 
                    <span>Init... {Math.round(progress)}%</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> Start Training
                  </>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
      {isFinished && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-right-10 duration-500">
           <div className="bg-[#00FF9F] text-zinc-950 px-6 py-3 rounded-xl font-bold shadow-[0_0_30px_rgba(0,255,159,0.4)] flex items-center gap-3 border border-white/20">
              <Zap className="w-5 h-5" />
              <div>
                 <p className="text-sm">Training Session Initialized</p>
                 <p className="text-[10px] uppercase opacity-70">Model pushed to decentralized compute grid</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
