import { AppProviders } from './tui-providers.js';
import { AppContent } from './tui-app.js';

export type AppProps = { configPath?: string };

export default function App({ configPath }: AppProps) {
	return (
		<AppProviders configPath={configPath}>
			<AppContent />
		</AppProviders>
	);
}
