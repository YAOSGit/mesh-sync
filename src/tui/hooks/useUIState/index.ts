import { useCallback, useMemo, useState } from 'react';
import type { OverlayState, PendingConfirmation } from '@yaos-git/toolkit/types';

export type MeshSyncOverlay = 'help';
export type ViewMode = 'browse' | 'detail';

type UIState = {
	overlay: MeshSyncOverlay | 'none';
	confirmation: PendingConfirmation | null;
	inputActive: boolean;
	viewMode: ViewMode;
};

export type UseUIStateReturn = OverlayState & {
	cycleFocus: () => void;
	inputActive: boolean;
	setInputActive: (active: boolean) => void;
	viewMode: ViewMode;
	setViewMode: (mode: ViewMode) => void;
};

export function useUIState(): UseUIStateReturn {
	const [state, setState] = useState<UIState>({
		overlay: 'none',
		confirmation: null,
		inputActive: false,
		viewMode: 'browse',
	});

	const setActiveOverlay = useCallback((overlay: string) => {
		setState((s) => ({ ...s, overlay: overlay as MeshSyncOverlay | 'none' }));
	}, []);

	const requestConfirmation = useCallback((message: string, onConfirm: () => void) => {
		setState((s) => ({ ...s, confirmation: { message, onConfirm } }));
	}, []);

	const clearConfirmation = useCallback(() => {
		setState((s) => ({ ...s, confirmation: null }));
	}, []);

	const cycleFocus = useCallback(() => {}, []);

	const setInputActive = useCallback((active: boolean) => {
		setState((s) => ({ ...s, inputActive: active }));
	}, []);

	const setViewMode = useCallback((viewMode: ViewMode) => {
		setState((s) => ({ ...s, viewMode }));
	}, []);

	return useMemo(
		() => ({
			activeOverlay: state.overlay,
			setActiveOverlay,
			confirmation: state.confirmation,
			requestConfirmation,
			clearConfirmation,
			cycleFocus,
			inputActive: state.inputActive,
			setInputActive,
			viewMode: state.viewMode,
			setViewMode,
		}),
		[state, setActiveOverlay, requestConfirmation, clearConfirmation, cycleFocus, setInputActive, setViewMode],
	);
}
