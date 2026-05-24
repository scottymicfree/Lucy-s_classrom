import { useState, useEffect } from 'react';

export interface Settings {
  general: {
    theme: 'Dark' | 'Light' | 'GeForce High Contrast';
    language: string;
    autoSaveInterval: number;
    defaultProjectPath: string;
    startupBehavior: 'Last Project' | 'Mini-AGI Demo' | 'Projects Hub';
  };
  ai: {
    defaultBaseModel: string;
    preferredProvider: 'Local' | 'Groq' | 'OpenAI' | 'Together.ai';
    temperature: number;
    maxTokens: number;
    topP: number;
    personality: 'Helper' | 'Teacher' | 'Senior Engineer' | 'AGI Tutor';
    ghostText: boolean;
  };
  training: {
    precision: 'bf16' | 'fp16' | 'fp8';
    vramMargin: number;
    defaultLoraPreset: 'Light' | 'Balanced' | 'Deep' | 'Experimental';
    batchSize: number;
    gradientCheckpointing: boolean;
    flashAttention: boolean;
    torchCompile: boolean;
    multiGpuStrategy: 'DDP' | 'FSDP' | 'DeepSpeed';
    autoOptimizeLevel: number;
  };
  monitoring: {
    refreshRate: number;
    gpuTempThreshold: number;
    autoPauseTemp: number;
    loggingVerbosity: 'Quiet' | 'Normal' | 'Verbose' | 'Debug';
    showLiveTokens: boolean;
  };
  editor: {
    fontSize: number;
    fontFamily: string;
    minimap: boolean;
    lineNumbers: boolean;
    bracketPairs: boolean;
    sidebarAutoHide: boolean;
    sidebarWidth: number;
  };
  projects: {
    autoImport: boolean;
    defaultTemplate: string;
    backupEnabled: boolean;
    experimentTracker: 'None' | 'W&B' | 'MLFlow' | 'Local';
  };
  voice: {
    enabled: boolean;
    volume: number;
    speed: number;
    pitch: number;
    autoSend: boolean;
    maleVoiceOnly: boolean;
    wakeWordEnabled: boolean;
  };
  advanced: {
    localBackend: boolean;
    apiKeys: Record<string, string>;
    debugMode: boolean;
  };
}

const DEFAULT_SETTINGS: Settings = {
  general: {
    theme: 'Dark',
    language: 'English (US)',
    autoSaveInterval: 30,
    defaultProjectPath: '~/helix-projects',
    startupBehavior: 'Projects Hub',
  },
  ai: {
    defaultBaseModel: 'Llama-3-8B-Base',
    preferredProvider: 'Local',
    temperature: 0.7,
    maxTokens: 2048,
    topP: 0.9,
    personality: 'Senior Engineer',
    ghostText: true,
  },
  training: {
    precision: 'bf16',
    vramMargin: 2,
    defaultLoraPreset: 'Balanced',
    batchSize: 4,
    gradientCheckpointing: true,
    flashAttention: true,
    torchCompile: false,
    multiGpuStrategy: 'FSDP',
    autoOptimizeLevel: 2,
  },
  monitoring: {
    refreshRate: 1,
    gpuTempThreshold: 85,
    autoPauseTemp: 90,
    loggingVerbosity: 'Normal',
    showLiveTokens: true,
  },
  editor: {
    fontSize: 13,
    fontFamily: 'JetBrains Mono',
    minimap: false,
    lineNumbers: true,
    bracketPairs: true,
    sidebarAutoHide: false,
    sidebarWidth: 260,
  },
  projects: {
    autoImport: true,
    defaultTemplate: 'Mini-AGI',
    backupEnabled: true,
    experimentTracker: 'Local',
  },
  voice: {
    enabled: false,
    volume: 1.0,
    speed: 1.0,
    pitch: 1.0,
    autoSend: true,
    maleVoiceOnly: true,
    wakeWordEnabled: false,
  },
  advanced: {
    localBackend: true,
    apiKeys: {},
    debugMode: false,
  },
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('af_settings_v1');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('af_settings_v1', JSON.stringify(updated));
      return updated;
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem('af_settings_v1', JSON.stringify(DEFAULT_SETTINGS));
  };

  return { settings, updateSettings, resetSettings };
}
