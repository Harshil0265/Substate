import React, { useState } from 'react';
import { Shield, CheckCircle, XCircle, AlertTriangle, TrendingUp, Database, FileText, RefreshCw } from 'lucide-react';
import axios from 'axios';

const ContentAuthenticityValidator = ({ content, title, onValidationComplete }) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [error, setError] = useState('');

  const validateContent = async () => {
    if (!content || !title) {
      setError('Content and title are required for validation');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      const response = await axios.post('/api/articles/validate-authenticity', {
        content,
        title
      });

      if (response.data.success) {
        setValidationResult(response.data.authenticity);
        if (onValidationComplete) {
          onValidationComplete(response.data.authenticity);
        }
      }
    } catch (error) {
      console.error('Error validating content:', error);
      setError(error.response?.data?.message || 'Failed to validate content authenticity');
    } finally {
      setIsValidating(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score) => {
    if (score >= 80) return 'bg-green-100 border-green-200';
    if (score >= 60) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return <CheckCircle className="w-6 h-6 text-green-600" />;
    if (score >= 60) return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
    return <XCircle className="w-6 h-6 text-red-600" />;
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Highly Authentic';
    if (score >= 60) return 'Moderately Authentic';
    return 'Low Authenticity';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Shield className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Content Authenticity Validator</h3>
          <p className="text-sm text-gray-600">Analyze content for real data, statistics, and authentic information</p>
        </div>
      </div>

      {/* Validate Button */}
      <button
        onClick={validateContent}
        disabled={isValidating || !content || !title}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors mb-6 ${
          isValidating || !content || !title
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-purple-600 text-white hover:bg-purple-700'
        }`}
      >
        {isValidating ? (
          <div className="flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Validating Content...
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <Shield className="w-5 h-5" />
            Validate Authenticity
          </div>
        )}
      </button>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Validation Results */}
      {validationResult && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className={`p-6 rounded-lg border-2 ${getScoreBackground(validationResult.score)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {getScoreIcon(validationResult.score)}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {getScoreLabel(validationResult.score)}
                  </h4>
                  <p className="text-sm text-gray-600">Overall authenticity assessment</p>
                </div>
              </div>
              <div className={`text-3xl font-bold ${getScoreColor(validationResult.score)}`}>
                {validationResult.score}%
              </div>
            </div>
            
            {/* Score Breakdown */}
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  validationResult.score >= 80 ? 'bg-green-500' :
                  validationResult.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${validationResult.score}%` }}
              ></div>
            </div>
          </div>

          {/* Analysis Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Content Analysis */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Content Analysis
              </h5>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Real Data</span>
                  {validationResult.analysis.hasRealData ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span>Statistics</span>
                  {validationResult.analysis.hasStatistics ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span>Citations</span>
                  {validationResult.analysis.hasCitations ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span>Specific Numbers</span>
                  {validationResult.analysis.hasSpecificNumbers ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
            </div>

            {/* Data Analysis */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Database className="w-5 h-5" />
                Data Analysis
              </h5>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Statistics Count</span>
                  <span className="font-medium">{validationResult.dataAnalysis.statisticsCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Citations Count</span>
                  <span className="font-medium">{validationResult.dataAnalysis.citationsCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Numbers Count</span>
                  <span className="font-medium">{validationResult.dataAnalysis.numbersCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Date References</span>
                  <span className="font-medium">{validationResult.dataAnalysis.dateReferences}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quality Issues */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Quality Issues
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                {validationResult.analysis.hasGenericLanguage ? (
                  <XCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                <span>Generic Language</span>
              </div>
              <div className="flex items-center gap-2">
                {validationResult.analysis.hasPersonalLanguage ? (
                  <XCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                <span>Personal Language</span>
              </div>
            </div>
          </div>

          {/* Source Types */}
          {validationResult.dataAnalysis.sourceTypes.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Source Types
              </h5>
              <div className="flex flex-wrap gap-2">
                {[...new Set(validationResult.dataAnalysis.sourceTypes)].map((type, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      type === 'government' ? 'bg-blue-100 text-blue-800' :
                      type === 'academic' ? 'bg-green-100 text-green-800' :
                      type === 'news' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {validationResult.recommendations && validationResult.recommendations.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h5 className="font-medium text-blue-900 mb-3">Recommendations for Improvement</h5>
              <ul className="space-y-2 text-sm text-blue-800">
                {validationResult.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      {!validationResult && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">What we check for:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Real statistics and data points
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Authoritative source citations
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              Generic "experience" language
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              Personal pronouns and opinions
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Specific numbers and percentages
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Current dates and timeframes
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentAuthenticityValidator;