import React, { useState } from 'react';
import { CyberCard } from '../components/ui/CyberCard';
import { CyberButton } from '../components/ui/CyberButton';
import { Terminal, Play, Trash2 } from 'lucide-react';
import { mcpApi } from '../lib/api';

type CommandType = 'remember' | 'search' | 'inject';

interface CommandResult {
  id: string;
  command: string;
  output: any;
  status: 'success' | 'error';
  timestamp: Date;
}

const Console: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CommandType>('remember');
  const [commandInput, setCommandInput] = useState('');
  const [results, setResults] = useState<CommandResult[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  const commandTemplates: Record<CommandType, string> = {
    remember: JSON.stringify({ text: "Your memory content here", conversation_id: "conv-123", tags: ["tag1"] }, null, 2),
    search: JSON.stringify({ query: "your search query", top_k: 5 }, null, 2),
    inject: JSON.stringify({ conversation_id: "conv-123", max_memories: 10 }, null, 2),
  };

  const handleTabChange = (tab: CommandType) => {
    setActiveTab(tab);
    setCommandInput(commandTemplates[tab]);
  };

  const executeCommand = async () => {
    if (!commandInput.trim()) return;
    setIsExecuting(true);

    let output: any;
    let status: 'success' | 'error' = 'success';

    try {
      const params = JSON.parse(commandInput);
      const startTime = Date.now();

      switch (activeTab) {
        case 'remember':
          if (!params.text || !params.conversation_id) {
            throw new Error('remember() requires "text" and "conversation_id" fields');
          }
          output = await mcpApi.remember(params);
          break;
        case 'search':
          if (!params.query) {
            throw new Error('search() requires "query" field');
          }
          output = await mcpApi.search(params);
          break;
        case 'inject':
          if (!params.conversation_id) {
            throw new Error('inject() requires "conversation_id" field');
          }
          output = await mcpApi.inject(params);
          break;
      }

      output = { ...output, executionTime: `${Date.now() - startTime}ms` };
    } catch (error) {
      status = 'error';
      output = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    setResults(prev => [{
      id: `result-${Date.now()}`,
      command: `${activeTab}(${commandInput.substring(0, 50)}...)`,
      output,
      status,
      timestamp: new Date(),
    }, ...prev]);
    setIsExecuting(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) executeCommand();
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Terminal className="w-8 h-8 text-neon-green" />
            <h1 className="text-4xl font-cyber font-bold text-neon-green uppercase tracking-wider">Developer Console</h1>
          </div>
          <p className="text-gray-400 text-lg">Execute MCP commands and interact with the memory substrate</p>
        </div>

        <div className="mb-6 flex gap-2">
          {(['remember', 'search', 'inject'] as CommandType[]).map(tab => (
            <button key={tab} onClick={() => handleTabChange(tab)}
              className={`px-6 py-3 font-mono text-sm uppercase tracking-wider border-2 transition-all angular-frame ${activeTab === tab ? 'border-neon-green bg-neon-green/10 text-neon-green shadow-neon' : 'border-deep-teal text-gray-400 hover:border-neon-green hover:text-neon-green'}`}>
              {tab}()
            </button>
          ))}
        </div>

        <CyberCard title="Command Input (JSON)" glowBorder cornerAccents className="mb-6">
          <div className="space-y-4">
            <textarea value={commandInput} onChange={(e) => setCommandInput(e.target.value)} onKeyDown={handleKeyPress}
              placeholder="Enter JSON parameters..."
              className="w-full h-40 bg-black border-2 border-deep-teal text-neon-green font-mono text-sm p-4 focus:border-neon-green focus:outline-none resize-none angular-frame" />
            <div className="flex gap-2">
              <CyberButton variant="primary" onClick={executeCommand} disabled={isExecuting || !commandInput.trim()} glow>
                <Play className="w-4 h-4 mr-2" />{isExecuting ? 'Executing...' : 'Execute'}
              </CyberButton>
              <CyberButton variant="secondary" onClick={() => setResults([])} disabled={results.length === 0}>
                <Trash2 className="w-4 h-4 mr-2" />Clear
              </CyberButton>
            </div>
          </div>
        </CyberCard>

        <CyberCard title="Results" subtitle={`${results.length} executed`} cornerAccents>
          <div className="space-y-4">
            {results.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Terminal className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-mono text-sm">No commands executed yet</p>
              </div>
            ) : results.map(r => (
              <div key={r.id} className={`border-2 p-4 angular-frame ${r.status === 'success' ? 'border-neon-green bg-neon-green/5' : 'border-error-red bg-error-red/5'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold uppercase ${r.status === 'success' ? 'text-neon-green' : 'text-error-red'}`}>{r.status}</span>
                  <span className="text-xs text-gray-500">{r.timestamp.toLocaleTimeString()}</span>
                </div>
                <pre className="text-xs font-mono text-neon-green bg-black p-3 rounded overflow-auto max-h-48">{JSON.stringify(r.output, null, 2)}</pre>
              </div>
            ))}
          </div>
        </CyberCard>

        <CyberCard cornerAccents className="mt-8 bg-deep-teal/20">
          <div className="flex items-start gap-4">
            <Terminal className="w-6 h-6 text-neon-green mt-1" />
            <div className="text-sm text-gray-400 space-y-2">
              <h3 className="text-neon-green font-bold">MCP Command Reference</h3>
              <p><code className="text-neon-green">remember()</code>: {`{ "text": "...", "conversation_id": "...", "tags": [] }`}</p>
              <p><code className="text-neon-green">search()</code>: {`{ "query": "...", "top_k": 5 }`}</p>
              <p><code className="text-neon-green">inject()</code>: {`{ "conversation_id": "...", "max_memories": 10 }`}</p>
            </div>
          </div>
        </CyberCard>
      </div>
    </div>
  );
};

export default Console;
