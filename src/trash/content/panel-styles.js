export const PANEL_STYLES = `
  :host { all: initial; }
  .wrap {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 2147483647;
    font-family: Manrope, "Segoe UI", sans-serif;
    color: #171717;
  }
  button, select { font: inherit; }
  .trigger {
    position: fixed;
    pointer-events: auto;
    border: 0;
    border-radius: 7px;
    background: #4f46e5;
    color: #fff;
    width: 30px;
    height: 30px;
    padding: 0;
    overflow: visible;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  }
  .trigger:hover { background: #4338ca; }
  .trigger svg {
    display: block;
    width: 32px;
    height: 32px;
    margin: -1px;
  }
  .panel {
    position: fixed;
    box-sizing: border-box;
    max-width: calc(100vw - 16px);
    max-height: calc(100vh - 16px);
    border: 1px solid #d7d7d7;
    background: #fff;
    pointer-events: auto;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
    overflow: hidden;
  }
  .panel-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    height: 26px;
    padding: 0 8px;
    border-bottom: 1px solid #ededed;
    background: #fafafa;
    cursor: grab;
    user-select: none;
  }
  .panel-bar:active { cursor: grabbing; }
  .panel-title { font-size: 11px; color: #8b8b8b; }
  .panel-close {
    border: 0;
    background: transparent;
    color: #8b8b8b;
    font-size: 14px;
    line-height: 1;
    padding: 0;
    cursor: pointer;
  }
  .panel-close:hover { color: #4b4b4b; }
  .panel-actions { display: flex; align-items: center; gap: 8px; }
  .panel-pin {
    font-weight: 900;
    border: 0;
    background: transparent;
    color: #8b8b8b;
    font-size: 12px;
    line-height: 1;
    padding: 0;
    cursor: pointer;
  }
  .panel-pin:hover { color: #4b4b4b; }
  .panel-pin.active {
    color: #4f46e5;
    background: #eef2ff;
    border-radius: 4px;
  }
  .panel-body {
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: calc(100% - 27px);
  }
  .hidden { display: none !important; }
  .section {
    padding: 10px 12px;
    border-bottom: 1px solid #ededed;
    min-height: 0;
  }
  .section:last-child { border-bottom: 0; }
  .section-text {
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .section-controls { flex: 0 0 auto; }
  .source, .result {
    flex: 1 1 auto;
    min-height: 0;
    font-size: 13px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
    overflow: auto;
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .select {
    flex: 1;
    min-width: 0;
    border: 1px solid #d7d7d7;
    background: #fff;
    color: #171717;
    padding: 6px 8px;
    font-size: 12px;
  }
  .target { font-size: 11px; color: #8b8b8b; white-space: nowrap; }
  .status { font-size: 11px; color: #8b8b8b; margin-top: 6px; }
  .status.error { color: #b42318; }
  .resize-handle {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 16px;
    height: 16px;
    z-index: 2;
    cursor: nwse-resize;
    pointer-events: auto;
  }
  .resize-handle::before {
    content: "";
    position: absolute;
    right: 3px;
    bottom: 3px;
    width: 7px;
    height: 7px;
    border-right: 1px solid #9a9a9a;
    border-bottom: 1px solid #9a9a9a;
  }
`
