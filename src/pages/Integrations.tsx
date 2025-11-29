import React, { useState } from 'react';
import { useIntegrationStore } from '../stores/integrationStore';
import { CyberCard } from '../components/ui/CyberCard';
import { CyberButton } from '../components/ui/CyberButton';
import { CyberInput } from '../components/ui/CyberInput';
import { Brain, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

interface IntegrationPanelProps {
  provider: 'openai' | 'anthropic' | 'google' | 'deepseek';
  title: string;
  subtitle: string;
  brainRegion: string;
}

const IntegrationPanel: React.FC<IntegrationPanelProps> = ({
  provider,
  title,
  subtitle,
  brainRegion,
}) => {
  const {
    getIntegrationByProvider,
    saveApiKey,
    testConnection,
    disableIntegration,
  } = useIntegrationStore();

  const integration = getIntegrationByProvider(provider);
  const [apiKey, setApiKey] = useState(integration?.apiKey || '');
  const [isTesting, setIsTesting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    setHasUnsavedChanges(value !== (integration?.apiKey || ''));
  };

  const handleSave = () => {
    if (apiKey.trim()) {
      saveApiKey(provider, apiKey);
      setHasUnsavedChanges(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    await testConnection(provider);
    setIsTesting(false);
  };

  const handleDisable = () => {
    disableIntegration(provider);
    setApiKey('');
    setHasUnsavedChanges(false);
    setShowDeleteConfirm(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const getStatusIcon = () => {
    if (!integration) return <AlertCircle className="w-5 h-5 text-gray-500" />;
    
    switch (integration.status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-neon-green" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-error-red" />;
      case 'disconnected':
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    if (!integration) return 'Disconnected';
    
    switch (integration.status) {
      case 'connected':
        return 'Online';
      case 'error':
        return 'Error';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = () => {
    if (!integration) return 'text-gray-500';
    
    switch (integration.status) {
      case 'connected':
        return 'text-neon-green';
      case 'error':
        return 'text-error-red';
      case 'disconnected':
        return 'text-gray-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <CyberCard
      title={title}
      subtitle={subtitle}
      glowBorder={integration?.status === 'connected'}
      cornerAccents
      className="h-full"
    >
      <div className="space-y-4">
        {/* Brain Region */}
        <div className="flex items-center gap-2 text-sm">
          <Brain className="w-4 h-4 text-neon-green" />
          <span className="text-gray-400">Region:</span>
          <span className="text-neon-green font-mono">{brainRegion}</span>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className={`font-bold uppercase tracking-wider ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>

        {/* Error Message */}
        {integration?.errorMessage && (
          <div className="p-3 border border-error-red bg-error-red/10 angular-frame">
            <p className="text-error-red text-sm">{integration.errorMessage}</p>
          </div>
        )}

        {/* API Key Input */}
        <div>
          <label className="block text-neon-green text-sm font-medium mb-2">
            API Key
          </label>
          <CyberInput
            type="password"
            placeholder="Enter your API key"
            value={apiKey}
            onChange={handleApiKeyChange}
          />
        </div>

        {/* Last Tested */}
        {integration?.lastTested && (
          <div className="text-xs text-gray-500">
            Last tested: {integration.lastTested.toLocaleString()}
          </div>
        )}

        {/* Action Buttons */}
        {showDeleteConfirm ? (
          <div className="space-y-3">
            <div className="p-3 border border-error-red bg-error-red/10 angular-frame">
              <p className="text-error-red text-sm font-medium mb-2">
                Delete this integration?
              </p>
              <p className="text-gray-400 text-xs">
                This will remove the API key and disconnect all models from this provider.
              </p>
            </div>
            <div className="flex gap-2">
              <CyberButton
                variant="danger"
                size="sm"
                onClick={handleDisable}
                className="flex-1"
              >
                Yes, Delete
              </CyberButton>
              <CyberButton
                variant="secondary"
                size="sm"
                onClick={handleCancelDelete}
                className="flex-1"
              >
                Cancel
              </CyberButton>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <CyberButton
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={!hasUnsavedChanges || !apiKey.trim()}
            >
              Save Key
            </CyberButton>
            <CyberButton
              variant="secondary"
              size="sm"
              onClick={handleTest}
              disabled={!apiKey.trim() || isTesting}
            >
              {isTesting ? 'Testing...' : 'Test'}
            </CyberButton>
            {integration && integration.status !== 'disconnected' && (
              <CyberButton
                variant="danger"
                size="sm"
                onClick={handleDeleteClick}
              >
                Delete
              </CyberButton>
            )}
          </div>
        )}
      </div>
    </CyberCard>
  );
};

interface AddIntegrationModalProps {
  onClose: () => void;
}

const AddIntegrationModal: React.FC<AddIntegrationModalProps> = ({ onClose }) => {
  const { saveApiKey, loadIntegrations } = useIntegrationStore();
  const [provider, setProvider] = useState('');
  const [modelId, setModelId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Supported models grouped by provider
  const supportedModels: Record<string, { id: string; name: string }[]> = {
    openai: [
      { id: 'gpt-4', name: 'GPT-4' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    ],
    anthropic: [
      { id: 'claude-3-opus', name: 'Claude 3 Opus' },
      { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet' },
      { id: 'claude-3-haiku', name: 'Claude 3 Haiku' },
      { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
    ],
    google: [
      { id: 'gemini-pro', name: 'Gemini Pro' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
    ],
    deepseek: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat' },
      { id: 'deepseek-coder', name: 'DeepSeek Coder' },
    ],
    groq: [
      { id: 'llama-3-70b', name: 'Llama 3 70B' },
      { id: 'llama-3-8b', name: 'Llama 3 8B' },
      { id: 'mixtral-8x7b', name: 'Mixtral 8x7B' },
    ],
  };

  // Get available models based on selected provider
  const availableModels = provider ? supportedModels[provider] || [] : [];

  // Reset model selection when provider changes
  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    setModelId('');
  };

  const handleSubmit = async () => {
    if (!provider.trim()) {
      setError('Provider is required');
      return;
    }

    if (!modelId.trim()) {
      setError('Model ID is required');
      return;
    }

    if (!apiKey.trim()) {
      setError('API key is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await saveApiKey(provider as 'openai' | 'anthropic' | 'google' | 'deepseek', apiKey);
      await loadIntegrations();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add integration');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-deep-teal border-2 border-neon-green/30 rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-cyber text-neon-green">Add New LLM</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-neon-green text-sm font-medium mb-2">
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full bg-black border border-neon-green/30 text-white px-4 py-2 rounded focus:outline-none focus:border-neon-green"
            >
              <option value="">Select a provider</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="google">Google</option>
              <option value="deepseek">DeepSeek</option>
              <option value="groq">Groq</option>
            </select>
          </div>

          <div>
            <label className="block text-neon-green text-sm font-medium mb-2">
              Model ID
            </label>
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              disabled={!provider || availableModels.length === 0}
              className="w-full bg-black border border-neon-green/30 text-white px-4 py-2 rounded focus:outline-none focus:border-neon-green disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select a model</option>
              {availableModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
            {!provider && (
              <p className="text-xs text-gray-500 mt-1">
                Select a provider first
              </p>
            )}
          </div>

          <div>
            <label className="block text-neon-green text-sm font-medium mb-2">
              API Key
            </label>
            <CyberInput
              type="password"
              placeholder="Enter API key"
              value={apiKey}
              onChange={setApiKey}
            />
          </div>

          {error && (
            <div className="p-3 border border-error-red bg-error-red/10 angular-frame">
              <p className="text-error-red text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <CyberButton
              variant="primary"
              className="flex-1"
              onClick={handleSubmit}
              disabled={isSubmitting || !provider.trim() || !modelId.trim() || !apiKey.trim()}
            >
              {isSubmitting ? 'Adding...' : 'Add Integration'}
            </CyberButton>
            <CyberButton
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </CyberButton>
          </div>
        </div>
      </div>
    </div>
  );
};

const Integrations: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const { integrations, loadIntegrations } = useIntegrationStore();

  // Load integrations on mount
  React.useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  // Provider metadata
  const providerMetadata: Record<string, { title: string; subtitle: string; brainRegion: string }> = {
    openai: {
      title: 'GPT-4o',
      subtitle: 'OpenAI Language Model',
      brainRegion: 'Left Cortex',
    },
    anthropic: {
      title: 'Claude 3.5',
      subtitle: 'Anthropic Language Model',
      brainRegion: 'Right Cortex',
    },
    google: {
      title: 'Gemini 2.0',
      subtitle: 'Google Language Model',
      brainRegion: 'Occipital',
    },
    deepseek: {
      title: 'DeepSeek',
      subtitle: 'DeepSeek Language Model',
      brainRegion: 'Frontal Lobe',
    },
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-cyber text-neon-green mb-2">
              Cortex Keys
            </h1>
            <p className="text-gray-400">
              Manage API connections for the hive mind
            </p>
          </div>
          <CyberButton
            variant="primary"
            onClick={() => setShowAddModal(true)}
          >
            + Add New LLM
          </CyberButton>
        </div>

        {/* Integration Panels Grid */}
        {integrations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration) => {
              const metadata = providerMetadata[integration.provider] || {
                title: integration.provider.toUpperCase(),
                subtitle: 'Language Model',
                brainRegion: 'Unknown',
              };
              
              return (
                <IntegrationPanel
                  key={integration.id}
                  provider={integration.provider as 'openai' | 'anthropic' | 'google' | 'deepseek'}
                  title={metadata.title}
                  subtitle={metadata.subtitle}
                  brainRegion={metadata.brainRegion}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Brain className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl text-gray-400 mb-2">No Integrations Yet</h3>
            <p className="text-gray-500">
              Add your first LLM integration to start using the Chimera Protocol
            </p>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8">
          <CyberCard cornerAccents className="bg-deep-teal/20">
            <div className="flex items-start gap-4">
              <Brain className="w-6 h-6 text-neon-green flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-neon-green font-bold mb-2">Neural Integration Protocol</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Connect your AI model API keys to enable the Chimera Protocol's multi-model cognitive fusion.
                  Each model operates as a specialized cortex region, sharing a unified memory substrate while
                  maintaining distinct reasoning patterns. Test connections to verify neural pathways are active.
                </p>
              </div>
            </div>
          </CyberCard>
        </div>

        {/* Add New LLM Modal */}
        {showAddModal && <AddIntegrationModal onClose={() => setShowAddModal(false)} />}
      </div>
    </div>
  );
};

export default Integrations;
