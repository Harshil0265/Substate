import React, { useState } from 'react';
import { Search, Database, TrendingUp, FileText, CheckCircle, AlertCircle, RefreshCw, BarChart3 } from 'lucide-react';
import axios from 'axios';

const AuthenticArticleGenerator = ({ onArticleGenerated, campaignId }) => {
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState('BLOG');
  const [requirements, setRequirements] = useState({
    targetLength: 2000,
    researchDepth: 'comprehensive',
    includeStatistics: true,
    includeCitations: true
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(null);
  const [researchQuality, setResearchQuality] = useState(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!title.trim()) {
      setError('Please enter a title for your article');
      return;
    }

    setIsGenerating(true);
    setError('');
    setGenerationProgress({ stage: 'research', message: 'Conducting research from reliable sources...' });

    try {
      // Simulate progress updates
      const progressStages = [
        { stage: 'research', message: 'Gathering data from government and academic sources...' },
        { stage: 'verification', message: 'Verifying statistics and cross-referencing data...' },
        { stage: 'analysis', message: 'Analyzing trends and extracting insights...' },
        { stage: 'writing', message: 'Creating data-driven content...' },
        { stage: 'citations', message: 'Adding citations and sources...' }
      ];

      // Update progress every 2 seconds
      let currentStage = 0;
      const progressInterval = setInterval(() => {
        if (currentStage < progressStages.length - 1) {
          currentStage++;
          setGenerationProgress(progressStages[currentStage]);
        }
      }, 2000);

      const response = await axios.post('/api/articles/generate-authentic', {
        title: title.trim(),
        campaignId,
        contentType,
        requirements
      });

      clearInterval(progressInterval);

      if (response.data.success) {
        setResearchQuality(response.data.researchQuality);
        setGenerationProgress({ stage: 'complete', message: 'Article generated successfully!' });
        
        // Call parent callback
        if (onArticleGenerated) {
          onArticleGenerated(response.data.article);
        }

        // Reset form
        setTitle('');
        
        setTimeout(() => {
          setGenerationProgress(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Error generating authentic article:', error);
      setError(error.response?.data?.message || 'Failed to generate article');
      setGenerationProgress(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const getProgressIcon = (stage) => {
    switch (stage) {
      case 'research': return <Search className="w-5 h-5" />;
      case 'verification': return <CheckCircle className="w-5 h-5" />;
      case 'analysis': return <TrendingUp className="w-5 h-5" />;
      case 'writing': return <FileText className="w-5 h-5" />;
      case 'citations': return <Database className="w-5 h-5" />;
      case 'complete': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <RefreshCw className="w-5 h-5 animate-spin" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Database className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Authentic Content Generator</h3>
          <p className="text-sm text-gray-600">Generate articles with real data, statistics, and verified sources</p>
        </div>
      </div>

      {/* Title Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Article Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter your article title (e.g., 'Tesla Stock Performance 2024', 'COVID-19 Economic Impact Analysis')"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isGenerating}
        />
      </div>

      {/* Content Type */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Content Type
        </label>
        <select
          value={contentType}
          onChange={(e) => setContentType(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isGenerating}
        >
          <option value="BLOG">Blog Article</option>
          <option value="NEWSLETTER">Newsletter</option>
          <option value="WHITEPAPER">Whitepaper</option>
          <option value="SOCIAL_POST">Social Media Post</option>
        </select>
      </div>

      {/* Requirements */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Content Requirements
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Target Length</label>
            <select
              value={requirements.targetLength}
              onChange={(e) => setRequirements(prev => ({ ...prev, targetLength: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              disabled={isGenerating}
            >
              <option value={1000}>1,000 words</option>
              <option value={1500}>1,500 words</option>
              <option value={2000}>2,000 words</option>
              <option value={3000}>3,000 words</option>
              <option value={5000}>5,000 words</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Research Depth</label>
            <select
              value={requirements.researchDepth}
              onChange={(e) => setRequirements(prev => ({ ...prev, researchDepth: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              disabled={isGenerating}
            >
              <option value="basic">Basic Research</option>
              <option value="comprehensive">Comprehensive</option>
              <option value="extensive">Extensive Research</option>
            </select>
          </div>
        </div>
        
        <div className="mt-3 space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={requirements.includeStatistics}
              onChange={(e) => setRequirements(prev => ({ ...prev, includeStatistics: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              disabled={isGenerating}
            />
            <span className="ml-2 text-sm text-gray-700">Include real statistics and data</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={requirements.includeCitations}
              onChange={(e) => setRequirements(prev => ({ ...prev, includeCitations: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              disabled={isGenerating}
            />
            <span className="ml-2 text-sm text-gray-700">Include citations and sources</span>
          </label>
        </div>
      </div>

      {/* Generation Progress */}
      {generationProgress && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3">
            {getProgressIcon(generationProgress.stage)}
            <div>
              <p className="text-sm font-medium text-blue-900">
                {generationProgress.message}
              </p>
              {generationProgress.stage !== 'complete' && (
                <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Research Quality Display */}
      {researchQuality && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5 text-green-600" />
            <h4 className="font-medium text-green-900">Research Quality Report</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{researchQuality.sourcesUsed}</div>
              <div className="text-green-700">Sources Used</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{researchQuality.dataPoints}</div>
              <div className="text-green-700">Data Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{researchQuality.researchDepth?.overall || 0}%</div>
              <div className="text-green-700">Research Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 capitalize">{researchQuality.authenticity}</div>
              <div className="text-green-700">Authenticity</div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !title.trim()}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          isGenerating || !title.trim()
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isGenerating ? (
          <div className="flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Generating Authentic Content...
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <Database className="w-5 h-5" />
            Generate Authentic Article
          </div>
        )}
      </button>

      {/* Features List */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">What makes this authentic:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Real-time data from government sources
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Academic research integration
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Industry reports and market data
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Verified statistics and citations
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            No generic "experience" language
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Current, factual information only
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthenticArticleGenerator;