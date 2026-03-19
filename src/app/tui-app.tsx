import { Box, Text } from 'ink';
import { useApp } from 'ink';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { TUILayout } from '@yaos-git/toolkit/tui/components';
import { COMMANDS, CommandsProvider } from '../tui/commands/index.js';
import type { MeshSyncDeps } from '../tui/commands/types.js';
import { SyncView } from '../tui/components/SyncView/index.js';
import { useConfig } from '../tui/providers/ConfigProvider/index.js';
import { useSyncContext } from '../tui/providers/SyncProvider/index.js';
import { useUIStateContext } from '../tui/providers/UIStateProvider/index.js';
import { theme } from '../theme.js';

const HELP_SECTION_COLORS: Record<string, string> = {
	Navigation: theme.info,
	Actions: theme.success,
	Edit: theme.brand,
	General: 'white',
};

export const AppContent: React.FC = () => {
	const { exit } = useApp();
	const ui = useUIStateContext();
	const { config } = useConfig();
	const { isWatching } = useSyncContext();

	const onQuit = useCallback(() => exit(), [exit]);

	const deps: MeshSyncDeps = useMemo(
		() => ({ ui, onQuit, isWatching }),
		[ui, onQuit, isWatching],
	);

	if (!config) {
		return (
			<Box padding={1}>
				<Text color={theme.error}>No mesh.json found. Run &quot;mesh-sync init&quot; first.</Text>
			</Box>
		);
	}

	const header = (
		<Box width="100%" borderStyle="round" borderColor="gray" paddingX={1} justifyContent="space-between">
			<Text wrap="truncate">
				<Text bold color={theme.brand}>mesh-sync</Text>
				{isWatching ? <Text color={theme.success}> (watching)</Text> : null}
			</Text>
			<Text dimColor>
				{config.syncs.length} sync{config.syncs.length !== 1 ? 's' : ''}
			</Text>
		</Box>
	);

	return (
		<CommandsProvider deps={deps}>
			<TUILayout
				brand="mesh"
				theme={theme}
				commands={COMMANDS}
				deps={deps}
				helpTitle="mesh-sync — Keyboard Shortcuts"
				helpSectionColors={HELP_SECTION_COLORS}
				header={header}
			>
				<SyncView />
			</TUILayout>
		</CommandsProvider>
	);
};
