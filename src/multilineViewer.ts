import * as vscode from 'vscode';

export class MultilineViewer {
    private static panel: vscode.WebviewPanel | undefined;
    private static fontSize: number = 14;
    private static wordWrap: boolean = true;

    public static show(content: string) {
        if (this.panel) {
            this.panel.reveal();
        } else {
            this.panel = vscode.window.createWebviewPanel(
                'multilineViewer',
                'Multiline Content Viewer',
                vscode.ViewColumn.Beside,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            this.panel.onDidDispose(() => {
                this.panel = undefined;
            });

            // 处理来自 webview 的消息
            const messageDisposable = this.panel.webview.onDidReceiveMessage(
                message => {
                    switch (message.command) {
                        case 'increaseFontSize':
                            this.fontSize = Math.min(32, this.fontSize + 2);
                            this.updateContent(content);
                            break;
                        case 'decreaseFontSize':
                            this.fontSize = Math.max(8, this.fontSize - 2);
                            this.updateContent(content);
                            break;
                        case 'toggleWordWrap':
                            this.wordWrap = !this.wordWrap;
                            this.updateContent(content);
                            break;
                    }
                }
            );

            this.panel.onDidDispose(() => {
                messageDisposable.dispose();
                this.panel = undefined;
            });
        }

        this.updateContent(content);
    }

    private static updateContent(content: string) {
        if (!this.panel) {
            return;
        }

        // 转义HTML特殊字符
        const escapedContent = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        // 处理换行和制表符
        const formattedContent = escapedContent
            .replace(/\\n/g, '<br>')
            .replace(/\\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
            .replace(/\\"/g, '"')
            .replace(/\\'/g, "'")
            .replace(/\\/g, '\\\\');

        this.panel.webview.html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        padding: 20px;
                        font-family: var(--vscode-font-family);
                        color: var(--vscode-editor-foreground);
                        background-color: var(--vscode-editor-background);
                        white-space: pre-wrap;
                        word-wrap: break-word;
                    }
                    pre {
                        margin: 0;
                        padding: 0;
                        background: transparent;
                        font-size: ${this.fontSize}px;
                        white-space: ${this.wordWrap ? 'pre-wrap' : 'pre'};
                    }
                    .controls {
                        position: fixed;
                        top: 10px;
                        right: 10px;
                        display: flex;
                        gap: 10px;
                        background: var(--vscode-editor-background);
                        padding: 5px;
                        border-radius: 4px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    }
                    button {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 4px 8px;
                        border-radius: 2px;
                        cursor: pointer;
                    }
                    button:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                </style>
            </head>
            <body>
                <div class="controls">
                    <button onclick="decreaseFontSize()">A-</button>
                    <button onclick="increaseFontSize()">A+</button>
                    <button onclick="toggleWordWrap()">${this.wordWrap ? 'No Wrap' : 'Wrap'}</button>
                </div>
                <pre>${formattedContent}</pre>
                <script>
                    const vscode = acquireVsCodeApi();
                    function increaseFontSize() {
                        vscode.postMessage({ command: 'increaseFontSize' });
                    }
                    function decreaseFontSize() {
                        vscode.postMessage({ command: 'decreaseFontSize' });
                    }
                    function toggleWordWrap() {
                        vscode.postMessage({ command: 'toggleWordWrap' });
                    }
                </script>
            </body>
            </html>
        `;
    }
}