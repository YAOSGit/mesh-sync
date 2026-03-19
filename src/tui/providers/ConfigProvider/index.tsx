import fs from 'node:fs';
import path from 'node:path';
import type React from 'react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Config } from '../../../types/Config/index.js';
import { loadConfig } from '../../../utils/Config/index.js';
import type { ConfigContextValue, ConfigProviderProps } from './ConfigProvider.types.js';

const ConfigContext = createContext<ConfigContextValue | null>(null);

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ configPath: configPathProp, children }) => {
	const configPath = path.resolve(process.cwd(), configPathProp ?? 'mesh.json');
	const [config, setConfig] = useState<Config | null>(null);

	const load = useCallback(() => {
		try {
			const loaded = loadConfig(configPath);
			setConfig(loaded);
		} catch {
			setConfig(null);
		}
	}, [configPath]);

	useEffect(() => {
		load();
	}, [load]);

	const updateConfig = useCallback(
		(newConfig: Config) => {
			fs.writeFileSync(configPath, JSON.stringify(newConfig, null, '\t'));
			setConfig(newConfig);
		},
		[configPath],
	);

	const reload = useCallback(() => {
		load();
	}, [load]);

	return (
		<ConfigContext.Provider value={{ config, configPath, updateConfig, reload }}>
			{children}
		</ConfigContext.Provider>
	);
};

export const useConfig = (): ConfigContextValue => {
	const ctx = useContext(ConfigContext);
	if (!ctx) throw new Error('useConfig must be used within ConfigProvider');
	return ctx;
};
