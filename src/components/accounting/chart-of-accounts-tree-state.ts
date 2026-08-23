/**
 * Requirement 6: transient tree UI state (expanded nodes, selection, and which row to focus on
 * return) shared between ChartOfAccountsTreeComponent and the separately-routed add/edit account
 * page (ChartOfAccountsComponent / AddAccountComponent). Backed by sessionStorage rather than a
 * service since it only needs to survive one navigation away and back, not the app's lifetime.
 */
const TREE_STATE_KEY = 'chartOfAccountsTree.state';

export interface ChartOfAccountsTreeState {
  expandedRowKeys: number[];
  selectedRowKey: number | null;
  /** The row to select/scroll to and highlight once the tree reloads -- the parent an account was
   *  added under, or the account just edited/created. */
  focusRowKey?: number | null;
}

export function saveChartOfAccountsTreeState(state: ChartOfAccountsTreeState): void {
  try {
    sessionStorage.setItem(TREE_STATE_KEY, JSON.stringify(state));
  } catch {
    // Best-effort convenience only -- a full sessionStorage or a private-browsing quota block
    // should never stop navigation.
  }
}

export function readChartOfAccountsTreeState(): ChartOfAccountsTreeState | null {
  const raw = sessionStorage.getItem(TREE_STATE_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(TREE_STATE_KEY);
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Updates just the focusRowKey on the currently saved state (if any), used when the add/edit
 *  form finishes and wants to hand back which specific account the tree should highlight -- e.g.
 *  a newly created sub-account, distinct from the parent id saved before navigating there. */
export function setChartOfAccountsTreeFocus(accountId: number): void {
  try {
    const raw = sessionStorage.getItem(TREE_STATE_KEY);
    const state: ChartOfAccountsTreeState = raw ? JSON.parse(raw) : { expandedRowKeys: [], selectedRowKey: null };
    state.focusRowKey = accountId;
    sessionStorage.setItem(TREE_STATE_KEY, JSON.stringify(state));
  } catch {
    // Best-effort convenience only.
  }
}
