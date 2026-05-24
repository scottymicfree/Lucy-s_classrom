import { useState, useEffect, useMemo } from 'react';
import { GPUStatus } from '../types';
import { useSettings } from './useSettings';

const generateInitialGPUData = (): GPUStatus[] => [
  { id: 'gpu-0', name: 'NVIDIA H100 80GB', utilization: 84, vramUsed: 62.4, vramTotal: 80, temp: 68, power: 342, fanSpeed: 45, status: 'Active', currentProject: 'Llama-3-FineTune' },
  { id: 'gpu-1', name: 'NVIDIA H100 80GB', utilization: 72, vramUsed: 42.1, vramTotal: 80, temp: 64, power: 280, fanSpeed: 40, status: 'Active', currentProject: 'Llama-3-FineTune' },
  { id: 'gpu-2', name: 'NVIDIA H100 80GB', utilization: 94, vramUsed: 78.2, vramTotal: 80, temp: 74, power: 395, fanSpeed: 60, status: 'Overload', currentProject: 'SDXL-v1.0' },
  { id: 'gpu-3', name: 'NVIDIA H100 80GB', utilization: 12, vramUsed: 2.4, vramTotal: 80, temp: 42, power: 85, fanSpeed: 20, status: 'Idle' },
  { id: 'gpu-4', name: 'NVIDIA RTX 4090', utilization: 45, vramUsed: 12.8, vramTotal: 24, temp: 58, power: 180, fanSpeed: 35, status: 'Active', currentProject: 'Inference-Agent-X' },
  { id: 'gpu-5', name: 'NVIDIA RTX 4090', utilization: 0, vramUsed: 0.5, vramTotal: 24, temp: 38, power: 45, fanSpeed: 15, status: 'Idle' },
  { id: 'gpu-6', name: 'NVIDIA RTX 4090', utilization: 88, vramUsed: 22.1, vramTotal: 24, temp: 72, power: 320, fanSpeed: 55, status: 'Active', currentProject: 'Vision-LLM' },
  { id: 'gpu-7', name: 'NVIDIA RTX 4090', utilization: 2, vramUsed: 1.1, vramTotal: 24, temp: 40, power: 65, fanSpeed: 20, status: 'Idle' },
];

export function useResourceMonitor() {
  const [gpus, setGpus] = useState<GPUStatus[]>(generateInitialGPUData());
  const [tokensPerSec, setTokensPerSec] = useState(142000);
  const { settings } = useSettings();

  useEffect(() => {
    const interval = setInterval(() => {
      setGpus(prev => prev.map(gpu => {
        // Apply thermal safety check from settings
        const isTooHot = gpu.temp > settings.monitoring.gpuTempThreshold;
        const autoPause = gpu.temp > settings.monitoring.autoPauseTemp;
        
        const jitter = (Math.random() - 0.5) * 4;
        const newUtil = autoPause ? 0 : Math.min(100, Math.max(0, gpu.utilization + jitter));
        
        return {
          ...gpu,
          utilization: newUtil,
          temp: Math.min(90, Math.max(30, gpu.temp + (Math.random() - 0.5))),
          power: Math.min(450, Math.max(20, gpu.power + jitter * 3)),
          status: autoPause ? 'Safe-Paused' : (isTooHot ? 'Thermal-Warn' : gpu.status)
        };
      }));

      setTokensPerSec(prev => Math.floor(prev + (Math.random() - 0.5) * 5000));
    }, settings.monitoring.refreshRate * 1000);

    return () => clearInterval(interval);
  }, [settings.monitoring.refreshRate, settings.monitoring.gpuTempThreshold, settings.monitoring.autoPauseTemp]);

  const stats = useMemo(() => {
    const totalGpus = gpus.length || 1;
    const avgUtilization = gpus.reduce((acc, curr) => acc + (curr.utilization || 0), 0) / totalGpus;
    const totalVramUsed = gpus.reduce((acc, curr) => acc + (curr.vramUsed || 0), 0);
    const totalVram = gpus.reduce((acc, curr) => acc + (curr.vramTotal || 0), 0);
    const totalPower = gpus.reduce((acc, curr) => acc + (curr.power || 0), 0);
    const onlineNodes = gpus.filter(g => g.status !== 'Idle' || (g.utilization || 0) > 5).length;

    return { 
      avgUtilization: isNaN(avgUtilization) ? 0 : avgUtilization, 
      totalVramUsed, 
      totalVram: totalVram || 1, 
      totalPower, 
      onlineNodes,
      tokensPerSec 
    };
  }, [gpus, tokensPerSec]);

  return { gpus, stats };
}
