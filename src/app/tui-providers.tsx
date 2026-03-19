import type React from 'react';
import { ConfigProvider } from '../tui/providers/ConfigProvider/index.js';
import { SyncProvider } from '../tui/providers/SyncProvider/index.js';
import { UIStateProvider } from '../tui/providers/UIStateProvider/index.js';

export type AppProvidersProps = {
	configPath?: string;
	children: React.ReactNode;
};

export const AppProviders: React.FC<AppProvidersProps> = ({ configPath, children }) => {
	return (
		<ConfigProvider configPath={configPath}>
			<SyncProvider>
				<UIStateProvider>{children}</UIStateProvider>
			</SyncProvider>
		</ConfigProvider>
	);
};
