/**
 * SessionManager - Unified session and move history management
 * Requirements:
 * - Unified across manual and automatic modes.
 * - Records move notation, cube state before, cube state after, move index, timestamp.
 * - Undo / Redo with state restoration.
 * - Completed session review stored in localStorage.
 * - Start session / End session lifecycle with confirmation before discarding.
 */

export class SessionManager {
  constructor(logicalCube, options = {}) {
    this.logicalCube = logicalCube;
    this.options = Object.assign({
      onHistoryChanged: null,
      onSessionStateChanged: null
    }, options);

    this.sessions = this.loadSavedSessions();
    this.currentSession = null;
    this.historyPointer = -1; // Index in currentSession.moves
  }

  loadSavedSessions() {
    try {
      const data = localStorage.getItem('cubelab_sessions');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Could not load sessions from localStorage', e);
      return [];
    }
  }

  saveSessions() {
    try {
      localStorage.setItem('cubelab_sessions', JSON.stringify(this.sessions));
    } catch (e) {
      console.warn('Could not save sessions to localStorage', e);
    }
  }

  startSession(mode = 'manual') {
    if (this.currentSession && this.currentSession.isActive) {
      // Archive current session
      this.endSession();
    }

    const session = {
      id: 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      mode,
      startTime: Date.now(),
      endTime: null,
      isActive: true,
      moves: [] // Array of { move, beforeState, afterState, index, timestamp }
    };

    this.currentSession = session;
    this.historyPointer = -1;
    this.sessions.unshift(session);
    // Keep max 20 sessions in local storage
    if (this.sessions.length > 20) this.sessions.pop();
    this.saveSessions();

    this.notifySessionState();
    this.notifyHistory();
    return session;
  }

  endSession() {
    if (!this.currentSession) return;
    this.currentSession.isActive = false;
    this.currentSession.endTime = Date.now();
    this.saveSessions();
    this.notifySessionState();
  }

  hasActiveSession() {
    return !!(this.currentSession && this.currentSession.isActive);
  }

  recordMove(moveStr) {
    if (!this.currentSession) {
      this.startSession('auto');
    }

    // Capture state before
    const beforeState = this.logicalCube.getAsString();
    this.logicalCube.applyMove(moveStr);
    const afterState = this.logicalCube.getAsString();

    // If we had undone moves, truncate future moves
    if (this.historyPointer < this.currentSession.moves.length - 1) {
      this.currentSession.moves = this.currentSession.moves.slice(0, this.historyPointer + 1);
    }

    const moveIndex = this.currentSession.moves.length + 1;
    const record = {
      move: moveStr,
      beforeState,
      afterState,
      index: moveIndex,
      timestamp: Date.now()
    };

    this.currentSession.moves.push(record);
    this.historyPointer = this.currentSession.moves.length - 1;
    this.saveSessions();

    this.notifyHistory();
    return record;
  }

  canUndo() {
    return this.historyPointer >= 0;
  }

  canRedo() {
    if (!this.currentSession) return false;
    return this.historyPointer < this.currentSession.moves.length - 1;
  }

  undo() {
    if (!this.canUndo()) return null;
    const item = this.currentSession.moves[this.historyPointer];
    this.historyPointer--;
    this.saveSessions();
    this.notifyHistory();
    return item;
  }

  redo() {
    if (!this.canRedo()) return null;
    this.historyPointer++;
    const item = this.currentSession.moves[this.historyPointer];
    this.saveSessions();
    this.notifyHistory();
    return item;
  }

  getLatestMove() {
    if (!this.currentSession || this.historyPointer < 0) return null;
    return this.currentSession.moves[this.historyPointer];
  }

  getHistory() {
    return this.currentSession ? this.currentSession.moves : [];
  }

  getPastSessions() {
    return this.sessions;
  }

  notifyHistory() {
    if (typeof this.options.onHistoryChanged === 'function') {
      try {
        this.options.onHistoryChanged({
          history: this.getHistory(),
          pointer: this.historyPointer,
          latestMove: this.getLatestMove(),
          canUndo: this.canUndo(),
          canRedo: this.canRedo()
        });
      } catch (err) {
        console.warn('SessionManager: Error in onHistoryChanged callback:', err);
      }
    }
  }

  notifySessionState() {
    if (typeof this.options.onSessionStateChanged === 'function') {
      try {
        this.options.onSessionStateChanged(this.currentSession);
      } catch (err) {
        console.warn('SessionManager: Error in onSessionStateChanged callback:', err);
      }
    }
  }
}
