import { SplitPane } from '@yaos-git/toolkit/tui/components';
import { Box, Text, useInput } from 'ink';
import { existsSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import type React from 'react';
import { useCallback, useMemo, useState } from 'react';
import type { SyncEntry } from '../../../types/Sync/index.js';
import { theme } from '../../../theme.js';
import { useConfig } from '../../providers/ConfigProvider/index.js';
import { useSyncContext } from '../../providers/SyncProvider/index.js';
import { useUIStateContext } from '../../providers/UIStateProvider/index.js';
import { BUILTIN_IDS, SOURCE_TYPES, STRATEGY_OPTIONS } from './SyncView.consts.js';

// ── Helpers ──────────────────────────────────────────────────────────

const getStatusIcon = (status: string | undefined): { icon: string; color: string } => {
	switch (status) {
		case 'synced': return { icon: '\u25cf', color: theme.success };
		case 'syncing': return { icon: '\u25cb', color: theme.info };
		case 'error': return { icon: '\u2717', color: theme.error };
		default: return { icon: '\u25cb', color: 'gray' };
	}
};

const getChain = (entry: SyncEntry): string[] => {
	if (!entry.transformer) return [];
	return Array.isArray(entry.transformer) ? entry.transformer : [entry.transformer];
};

const getStrategyLabel = (entry: SyncEntry): string => {
	if (!entry.strategy) return 'manual';
	if ('watch' in entry.strategy) return 'watch';
	if ('poll' in entry.strategy) return `poll ${entry.strategy.poll}`;
	return 'manual';
};

const discoverLocalTransformers = (cwd: string): string[] => {
	const dirs = ['transformers', '.transformers', 'mesh-transformers'];
	const found: string[] = [];
	for (const dir of dirs) {
		const full = join(cwd, dir);
		if (!existsSync(full)) continue;
		try {
			for (const f of readdirSync(full)) {
				if (f.endsWith('.ts') || f.endsWith('.js')) {
					found.push(`./${relative(cwd, join(full, f))}`);
				}
			}
		} catch { /* skip */ }
	}
	return found;
};

/** Render a path as a mini file tree */
const truncateSegment = (name: string, max: number): string => {
	if (name.length <= max) return name;
	const dot = name.lastIndexOf('.');
	if (dot > 0 && dot < name.length - 1) {
		const ext = name.slice(dot);
		const stem = name.slice(0, max - ext.length - 3);
		return `${stem}...${ext}`;
	}
	return `${name.slice(0, max - 3)}...`;
};

const FileTree: React.FC<{ path: string; color?: string; maxWidth?: number }> = ({ path, color, maxWidth = 18 }) => {
	const clean = path.replace(/^\.\//, '');
	const parts = clean.split(/[/\\]/).filter(Boolean);
	if (parts.length === 0) return <Text dimColor>(none)</Text>;
	if (parts.length === 1) return <Text color={color}>{truncateSegment(parts[0], maxWidth)}</Text>;

	return (
		<Box flexDirection="column">
			{parts.reduce<{ nodes: React.ReactNode[]; path: string }>((acc, part, i) => {
				const cumulative = acc.path ? `${acc.path}/${part}` : part;
				const isLast = i === parts.length - 1;
				const prefix = i === 0
					? ''
					: '\u2502 '.repeat(i - 1) + (isLast ? '\u2514\u2500 ' : '\u251c\u2500 ');
				const available = Math.max(6, maxWidth - prefix.length);
				const display = truncateSegment(part, available);
				acc.nodes.push(
					<Text key={cumulative} color={isLast ? color : undefined} dimColor={!isLast && !color}>
						{prefix}{display}
					</Text>
				);
				return { nodes: acc.nodes, path: cumulative };
			}, { nodes: [], path: '' }).nodes}
		</Box>
	);
};

// ── Types ────────────────────────────────────────────────────────────

type DetailFocus = 'source' | 'chain' | 'target';

type Mode =
	| { type: 'browse' }
	| { type: 'detail'; focus: DetailFocus; chainCursor: number }
	| { type: 'edit-text'; field: 'source' | 'target'; value: string }
	| { type: 'pick-source-type'; cursor: number }
	| { type: 'pick-strategy'; cursor: number }
	| { type: 'pick-transformer'; cursor: number; filter: string; scrollOffset: number }
	| { type: 'adding'; step: 'id' | 'source' | 'target'; values: Record<string, string> };

const PICKER_PAGE_SIZE = 8;

// ── Component ────────────────────────────────────────────────────────

export const SyncView: React.FC = () => {
	const ui = useUIStateContext();
	const { config, updateConfig } = useConfig();
	const { results, syncOne, syncAll, isWatching, toggleWatch } = useSyncContext();
	const [cursor, setCursor] = useState(0);
	const [mode, setMode] = useState<Mode>({ type: 'browse' });

	const entries = config?.syncs ?? [];
	const selected = entries[cursor];
	const chain = useMemo(() => (selected ? getChain(selected) : []), [selected]);
	const selectedResult = selected ? results[selected.id] : undefined;

	const localTransformers = useMemo(() => discoverLocalTransformers(process.cwd()), []);
	const allTransformers = useMemo(() => [...BUILTIN_IDS, ...localTransformers], [localTransformers]);

	const exitMode = useCallback(() => {
		setMode({ type: 'browse' });
		ui.setInputActive(false);
		ui.setViewMode('browse');
	}, [ui]);

	const enterDetail = useCallback(() => {
		setMode({ type: 'detail', focus: 'chain', chainCursor: 0 });
		ui.setViewMode('detail');
	}, [ui]);

	const saveChain = useCallback((newChain: string[]) => {
		if (!config || !selected) return;
		const updated = { ...config, syncs: [...config.syncs] };
		updated.syncs[cursor] = {
			...updated.syncs[cursor],
			transformer: newChain.length === 0 ? undefined : newChain.length === 1 ? newChain[0] : newChain,
		};
		updateConfig(updated);
	}, [config, selected, cursor, updateConfig]);

	const saveField = useCallback((field: 'source' | 'target', value: string) => {
		if (!config || !selected) return;
		const updated = { ...config, syncs: [...config.syncs] };
		updated.syncs[cursor] = { ...updated.syncs[cursor], [field]: value };
		updateConfig(updated);
	}, [config, selected, cursor, updateConfig]);

	const saveStrategy = useCallback((strategy: SyncEntry['strategy']) => {
		if (!config || !selected) return;
		const updated = { ...config, syncs: [...config.syncs] };
		updated.syncs[cursor] = { ...updated.syncs[cursor], strategy };
		updateConfig(updated);
	}, [config, selected, cursor, updateConfig]);

	useInput((input, key) => {
		if (ui.confirmation) return;
		if (ui.activeOverlay !== 'none') return;

		// ── Text edit ──
		if (mode.type === 'edit-text') {
			if (key.return) { saveField(mode.field, mode.value); exitMode(); enterDetail(); return; }
			if (key.escape) { exitMode(); enterDetail(); return; }
			if (key.backspace || key.delete) { setMode({ ...mode, value: mode.value.slice(0, -1) }); return; }
			if (input && !key.ctrl && !key.meta) { setMode({ ...mode, value: mode.value + input }); }
			return;
		}

		// ── Source type picker ──
		if (mode.type === 'pick-source-type') {
			if (key.downArrow) { setMode({ ...mode, cursor: Math.min(mode.cursor + 1, SOURCE_TYPES.length - 1) }); return; }
			if (key.upArrow) { setMode({ ...mode, cursor: Math.max(mode.cursor - 1, 0) }); return; }
			if (key.return) {
				const src = SOURCE_TYPES[mode.cursor];
				if (src) setMode({ type: 'edit-text', field: 'source', value: src.prefix });
				return;
			}
			if (key.escape) { exitMode(); enterDetail(); return; }
			return;
		}

		// ── Strategy picker ──
		if (mode.type === 'pick-strategy') {
			if (key.downArrow) { setMode({ ...mode, cursor: Math.min(mode.cursor + 1, STRATEGY_OPTIONS.length - 1) }); return; }
			if (key.upArrow) { setMode({ ...mode, cursor: Math.max(mode.cursor - 1, 0) }); return; }
			if (key.return) {
				const opt = STRATEGY_OPTIONS[mode.cursor];
				if (opt) saveStrategy(opt.value);
				exitMode(); enterDetail();
				return;
			}
			if (key.escape) { exitMode(); enterDetail(); return; }
			return;
		}

		// ── Transformer picker (scrolling) ──
		if (mode.type === 'pick-transformer') {
			const filtered = allTransformers.filter((id) => !mode.filter || id.includes(mode.filter));
			if (key.downArrow) {
				const next = Math.min(mode.cursor + 1, filtered.length - 1);
				const offset = next >= mode.scrollOffset + PICKER_PAGE_SIZE
					? next - PICKER_PAGE_SIZE + 1
					: mode.scrollOffset;
				setMode({ ...mode, cursor: next, scrollOffset: offset });
				return;
			}
			if (key.upArrow) {
				const next = Math.max(mode.cursor - 1, 0);
				const offset = next < mode.scrollOffset ? next : mode.scrollOffset;
				setMode({ ...mode, cursor: next, scrollOffset: offset });
				return;
			}
			if (key.return && filtered[mode.cursor]) {
				saveChain([...chain, filtered[mode.cursor]]);
				exitMode(); enterDetail();
				return;
			}
			if (key.escape) { exitMode(); enterDetail(); return; }
			if (key.backspace || key.delete) { setMode({ ...mode, filter: mode.filter.slice(0, -1), cursor: 0, scrollOffset: 0 }); return; }
			if (input && !key.ctrl && !key.meta) { setMode({ ...mode, filter: mode.filter + input, cursor: 0, scrollOffset: 0 }); }
			return;
		}

		// ── Add wizard ──
		if (mode.type === 'adding') {
			if (key.return) {
				const val = mode.values[mode.step]?.trim() ?? '';
				if (!val) return;
				const next = mode.step === 'id' ? 'source' as const : mode.step === 'source' ? 'target' as const : null;
				if (next) {
					setMode({ ...mode, step: next, values: { ...mode.values, [mode.step]: val } });
				} else {
					if (config) {
						const newEntry: SyncEntry = { id: mode.values.id ?? 'new', source: mode.values.source ?? '', target: val, strategy: { manual: true } };
						updateConfig({ ...config, syncs: [...config.syncs, newEntry] });
						setCursor(config.syncs.length);
					}
					exitMode();
				}
				return;
			}
			if (key.escape) { exitMode(); return; }
			if (key.backspace || key.delete) {
				const cur = mode.values[mode.step] ?? '';
				setMode({ ...mode, values: { ...mode.values, [mode.step]: cur.slice(0, -1) } });
				return;
			}
			if (input && !key.ctrl && !key.meta) {
				const cur = mode.values[mode.step] ?? '';
				setMode({ ...mode, values: { ...mode.values, [mode.step]: cur + input } });
			}
			return;
		}

		// ── Detail navigation ──
		if (mode.type === 'detail') {
			if (key.leftArrow) {
				if (mode.focus === 'chain') setMode({ ...mode, focus: 'source' });
				else if (mode.focus === 'target') setMode({ ...mode, focus: 'chain', chainCursor: Math.min(mode.chainCursor, Math.max(0, chain.length - 1)) });
				return;
			}
			if (key.rightArrow) {
				if (mode.focus === 'source') setMode({ ...mode, focus: 'chain', chainCursor: 0 });
				else if (mode.focus === 'chain') setMode({ ...mode, focus: 'target' });
				return;
			}
			if (mode.focus === 'chain' && key.downArrow) { setMode({ ...mode, chainCursor: Math.min(mode.chainCursor + 1, chain.length - 1) }); return; }
			if (mode.focus === 'chain' && key.upArrow) { setMode({ ...mode, chainCursor: Math.max(mode.chainCursor - 1, 0) }); return; }
			if (key.return) {
				if (mode.focus === 'source') { ui.setInputActive(true); setMode({ type: 'pick-source-type', cursor: 0 }); return; }
				if (mode.focus === 'target') { ui.setInputActive(true); setMode({ type: 'edit-text', field: 'target', value: selected?.target ?? '' }); return; }
				return;
			}
			if (mode.focus === 'chain' && input === 'j' && mode.chainCursor < chain.length - 1) {
				const c = [...chain]; [c[mode.chainCursor], c[mode.chainCursor + 1]] = [c[mode.chainCursor + 1], c[mode.chainCursor]];
				saveChain(c); setMode({ ...mode, chainCursor: mode.chainCursor + 1 }); return;
			}
			if (mode.focus === 'chain' && input === 'k' && mode.chainCursor > 0) {
				const c = [...chain]; [c[mode.chainCursor], c[mode.chainCursor - 1]] = [c[mode.chainCursor - 1], c[mode.chainCursor]];
				saveChain(c); setMode({ ...mode, chainCursor: mode.chainCursor - 1 }); return;
			}
			if (mode.focus === 'chain' && input === 'a') {
				ui.setInputActive(true); setMode({ type: 'pick-transformer', cursor: 0, filter: '', scrollOffset: 0 }); return;
			}
			if (mode.focus === 'chain' && input === 'd' && chain.length > 0 && chain[mode.chainCursor]) {
				ui.requestConfirmation(`Remove "${chain[mode.chainCursor]}"?`, () => {
					saveChain(chain.filter((_, i) => i !== mode.chainCursor));
					setMode({ type: 'detail', focus: 'chain', chainCursor: Math.max(0, mode.chainCursor - 1) });
				});
				return;
			}
			if (input === 't') {
				const cur = selected ? STRATEGY_OPTIONS.findIndex((o) => o.label.startsWith(getStrategyLabel(selected).split(' ')[0] ?? '')) : 0;
				ui.setInputActive(true); setMode({ type: 'pick-strategy', cursor: Math.max(0, cur) }); return;
			}
			if (key.escape) { exitMode(); return; }
			return;
		}

		// ── Browse mode ──
		if (key.downArrow) setCursor((prev) => Math.min(prev + 1, entries.length - 1));
		else if (key.upArrow) setCursor((prev) => Math.max(prev - 1, 0));
		else if (key.return && selected) enterDetail();
		else if (input === 's' && selected) syncOne(selected.id);
		else if (input === 'S') syncAll();
		else if (input === 'w') toggleWatch();
		else if (input === 'n') { ui.setInputActive(true); setMode({ type: 'adding', step: 'id', values: {} }); }
		else if (input === 'd' && selected) {
			ui.requestConfirmation(`Delete "${selected.id}"?`, () => {
				if (!config) return;
				updateConfig({ ...config, syncs: config.syncs.filter((_, i) => i !== cursor) });
				setCursor((prev) => Math.max(0, prev - 1));
			});
		}
	});

	if (entries.length === 0 && mode.type === 'browse') {
		return (
			<Box flexDirection="column" flexGrow={1} justifyContent="center" alignItems="center">
				<Text dimColor>No sync entries configured.</Text>
				<Text dimColor>Press <Text bold>n</Text> to add one.</Text>
			</Box>
		);
	}

	const inDetail = mode.type !== 'browse' && mode.type !== 'adding';

	// ── Top pane: entry list ──
	const listPane = (
		<Box flexDirection="column" flexGrow={1}>
			{entries.map((entry, i) => {
				const isSel = i === cursor;
				const result = results[entry.id];
				const { icon, color } = getStatusIcon(result?.status);
				return (
					<Text key={entry.id}>
						{isSel ? <Text color={theme.brand}>{'\u25b8 '}</Text> : <Text>{'  '}</Text>}
						<Text color={color}>{icon} </Text>
						<Text bold={isSel} color={isSel ? theme.brand : undefined}>{entry.id}</Text>
						<Text dimColor> {getStrategyLabel(entry)}</Text>
						{result?.lastSyncedAt ? <Text dimColor> ({new Date(result.lastSyncedAt).toLocaleTimeString()})</Text> : null}
					</Text>
				);
			})}
			{mode.type === 'adding' ? (
				<Box flexDirection="column" marginTop={1} borderStyle="single" borderColor={theme.brand} paddingX={1}>
					<Text bold color={theme.brand}>New Sync Entry</Text>
					{(['id', 'source', 'target'] as const).map((step) => (
						<Box key={step}>
							<Text bold>{step}: </Text>
							{mode.step === step
								? <Text color={theme.info}>{mode.values[step] ?? ''}<Text dimColor>|</Text></Text>
								: <Text dimColor>{mode.values[step] || '...'}</Text>}
						</Box>
					))}
				</Box>
			) : null}
		</Box>
	);

	const hasPicker = mode.type === 'pick-source-type' || mode.type === 'pick-strategy' || mode.type === 'pick-transformer';

	// ── Bottom pane: 3-column detail OR picker ──
	const detailPane = selected ? (
		<Box flexDirection="column" flexGrow={1} paddingX={1}>
			{/* Status bar — always visible */}
			<Box justifyContent="space-between" marginBottom={1}>
				<Text bold color={theme.brand}>{selected.id}</Text>
				<Box gap={2}>
					{selectedResult?.error
						? <Text color={theme.error}>{'\u2717'} error</Text>
						: selectedResult?.status === 'synced'
							? <Text color={theme.success}>{'\u25cf'} synced</Text>
							: <Text dimColor>{'\u25cb'} pending</Text>}
					{isWatching ? <Text color={theme.success}>watching</Text> : null}
					<Text dimColor>{getStrategyLabel(selected)}</Text>
				</Box>
			</Box>

			{/* Show columns when no picker is active */}
			{!hasPicker ? (
				<>
					<Box gap={2} flexGrow={1}>
						{/* Source */}
						<Box flexDirection="column" width={22} flexShrink={0}>
							<Text bold color={mode.type === 'detail' && mode.focus === 'source' ? theme.brand : undefined} dimColor={!(mode.type === 'detail' && mode.focus === 'source')}>SOURCE</Text>
							{mode.type === 'edit-text' && mode.field === 'source'
								? <Text color={theme.info}>{mode.value}<Text dimColor>|</Text></Text>
								: <FileTree path={selected.source} color={mode.type === 'detail' && mode.focus === 'source' ? theme.brand : undefined} />}
						</Box>

						{/* Chain */}
						<Box flexDirection="column" flexGrow={1}>
							<Text bold color={mode.type === 'detail' && mode.focus === 'chain' ? theme.brand : undefined} dimColor={!(mode.type === 'detail' && mode.focus === 'chain')}>TRANSFORMERS</Text>
							{chain.length === 0 ? (
								<Text dimColor>  (passthrough)</Text>
							) : (
								chain.reduce<{ nodes: React.ReactNode[]; seen: Record<string, number> }>((acc, t, i) => {
									const count = (acc.seen[t] ?? 0) + 1;
									acc.seen[t] = count;
									const stableKey = `${t}::${count}`;
									const focused = mode.type === 'detail' && mode.focus === 'chain' && mode.chainCursor === i;
									acc.nodes.push(
										<Text key={stableKey}>
											{focused ? <Text color={theme.brand}>{'\u25b8 '}</Text> : <Text>{'  '}</Text>}
											<Text bold={focused} color={focused ? theme.brand : undefined} wrap="truncate">{i + 1}. {t}</Text>
										</Text>
									);
									return acc;
								}, { nodes: [], seen: {} }).nodes
							)}
						</Box>

						{/* Target */}
						<Box flexDirection="column" width={22} flexShrink={0}>
							<Text bold color={mode.type === 'detail' && mode.focus === 'target' ? theme.brand : undefined} dimColor={!(mode.type === 'detail' && mode.focus === 'target')}>TARGET</Text>
							{mode.type === 'edit-text' && mode.field === 'target'
								? <Text color={theme.info}>{mode.value}<Text dimColor>|</Text></Text>
								: <FileTree path={selected.target} color={mode.type === 'detail' && mode.focus === 'target' ? theme.brand : undefined} />}
						</Box>
					</Box>

					{selectedResult?.error ? (
						<Box marginTop={1}>
							<Text color={theme.error}>{selectedResult.error}</Text>
						</Box>
					) : null}
				</>
			) : null}

			{/* ── Pickers (replace columns when active) ── */}

			{mode.type === 'pick-source-type' ? (
				<Box flexDirection="column" flexGrow={1}>
					<Text bold color={theme.brand}>Source Type</Text>
					<Box flexDirection="column" marginTop={1}>
						{SOURCE_TYPES.map((src, i) => (
							<Text key={src.label}>
								{i === mode.cursor ? <Text color={theme.brand}>{'\u25b8 '}</Text> : <Text>{'  '}</Text>}
								<Text bold={i === mode.cursor} color={i === mode.cursor ? theme.brand : undefined}>{src.label}</Text>
								<Text dimColor>  {src.hint}</Text>
							</Text>
						))}
					</Box>
				</Box>
			) : null}

			{mode.type === 'pick-strategy' ? (
				<Box flexDirection="column" flexGrow={1}>
					<Text bold color={theme.brand}>Strategy</Text>
					<Box flexDirection="column" marginTop={1}>
						{STRATEGY_OPTIONS.map((opt, i) => (
							<Text key={opt.label}>
								{i === mode.cursor ? <Text color={theme.brand}>{'\u25b8 '}</Text> : <Text>{'  '}</Text>}
								<Text bold={i === mode.cursor} color={i === mode.cursor ? theme.brand : undefined}>{opt.label}</Text>
							</Text>
						))}
					</Box>
				</Box>
			) : null}

			{mode.type === 'pick-transformer' ? (
				<Box flexDirection="column" flexGrow={1}>
					<Text bold color={theme.brand}>Add Transformer</Text>
					{mode.filter ? <Text dimColor>filter: {mode.filter}</Text> : null}
					{(() => {
						const filtered = allTransformers.filter((id) => !mode.filter || id.includes(mode.filter));
						const visible = filtered.slice(mode.scrollOffset, mode.scrollOffset + PICKER_PAGE_SIZE);
						const above = mode.scrollOffset;
						const below = Math.max(0, filtered.length - mode.scrollOffset - PICKER_PAGE_SIZE);
						const parts: string[] = [];
						if (above > 0) parts.push(`\u25b2 ${above}`);
						if (below > 0) parts.push(`\u25bc ${below}`);
						parts.push(`${filtered.length} total`);
						if (localTransformers.length > 0) parts.push(`${localTransformers.length} local`);
						return (
							<Box flexDirection="column" marginTop={1}>
								{visible.map((id, vi) => {
									const absIdx = mode.scrollOffset + vi;
									const focused = absIdx === mode.cursor;
									const inChain = chain.includes(id);
									return (
										<Text key={id}>
											{focused ? <Text color={theme.brand}>{'\u25b8 '}</Text> : <Text>{'  '}</Text>}
											<Text bold={focused} color={focused ? theme.brand : inChain ? theme.success : undefined} dimColor={inChain && !focused} wrap="truncate">
												{id}{inChain ? ' (in chain)' : ''}
											</Text>
										</Text>
									);
								})}
								<Text dimColor>  {parts.join(' \u00b7 ')}</Text>
							</Box>
						);
					})()}
				</Box>
			) : null}
		</Box>
	) : (
		<Box flexDirection="column" flexGrow={1} justifyContent="center" alignItems="center">
			<Text dimColor>Select an entry above</Text>
		</Box>
	);

	return (
		<SplitPane direction="vertical" ratio={[35, 65]} focusedIndex={inDetail ? 1 : 0} theme={theme} borders={[true, true]}>
			{listPane}
			{detailPane}
		</SplitPane>
	);
};
