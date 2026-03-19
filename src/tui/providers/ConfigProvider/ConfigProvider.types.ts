import type React from 'react';
import type { Config } from '../../../types/Config/index.js';

export type ConfigContextValue = {
	config: Config | null;
	configPath: string;
	updateConfig: (config: Config) => void;
	reload: () => void;
};

export type ConfigProviderProps = {
	configPath?: string;
	children: React.ReactNode;
};
