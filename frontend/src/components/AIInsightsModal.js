import React from 'react';
import {
  X,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';

const AIInsightsModal = ({
  open,
  onClose,
  title,
  icon,
  insights,
  loading,
  error,
}) => {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100">
              {icon || (
                <Sparkles className="h-6 w-6 text-green-700" />
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {title}
              </h2>

              <p className="text-sm text-gray-500">
                AI-powered insights from your FarmDirect data
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-90px)] overflow-y-auto px-6 py-6">
          {/* Loading */}
          {loading && (
            <div className="flex min-h-[300px] flex-col items-center justify-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <Loader2 className="h-7 w-7 animate-spin text-green-700" />
              </div>

              <h3 className="text-lg font-semibold text-gray-900">
                Analyzing your farm data...
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Please wait while FarmDirect AI prepares your insights.
              </p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />

                <div>
                  <h3 className="font-semibold text-red-800">
                    Unable to generate insights
                  </h3>

                  <p className="mt-1 text-sm text-red-700">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && !insights && (
            <div className="flex min-h-[250px] items-center justify-center text-center">
              <div>
                <Sparkles className="mx-auto h-10 w-10 text-green-600" />

                <h3 className="mt-3 font-semibold text-gray-900">
                  No insights available
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  There is not enough FarmDirect data for this analysis.
                </p>
              </div>
            </div>
          )}

          {/* Insights */}
          {!loading && !error && insights && (
            <div className="space-y-4">
              {insights
                .split('\n')
                .map((line, index) => {
                  const trimmed = line.trim();

                  if (!trimmed) {
                    return (
                      <div
                        key={index}
                        className="h-1"
                      />
                    );
                  }

                  // Markdown headings
                  if (
                    trimmed.startsWith('### ')
                  ) {
                    return (
                      <h3
                        key={index}
                        className="mt-6 border-b border-gray-100 pb-2 text-lg font-bold text-green-800 first:mt-0"
                      >
                        {trimmed.replace(
                          '### ',
                          ''
                        )}
                      </h3>
                    );
                  }

                  // Bullet points
                  if (
                    trimmed.startsWith('- ')
                  ) {
                    return (
                      <div
                        key={index}
                        className="flex gap-3 text-sm leading-7 text-gray-700"
                      >
                        <span className="mt-3 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-600" />

                        <p>
                          {formatInlineText(
                            trimmed.substring(2)
                          )}
                        </p>
                      </div>
                    );
                  }

                  // Numbered points
                  if (
                    /^\d+\.\s/.test(trimmed)
                  ) {
                    const match =
                      trimmed.match(
                        /^(\d+)\.\s(.*)$/
                      );

                    return (
                      <div
                        key={index}
                        className="flex gap-3 text-sm leading-7 text-gray-700"
                      >
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                          {match[1]}
                        </span>

                        <p>
                          {formatInlineText(
                            match[2]
                          )}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <p
                      key={index}
                      className="text-sm leading-7 text-gray-700"
                    >
                      {formatInlineText(
                        trimmed
                      )}
                    </p>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function formatInlineText(text) {
  const parts = text.split(
    /(\*\*.*?\*\*)/g
  );

  return parts.map((part, index) => {
    if (
      part.startsWith('**') &&
      part.endsWith('**')
    ) {
      return (
        <strong
          key={index}
          className="font-semibold text-gray-900"
        >
          {part.slice(2, -2)}
        </strong>
      );
    }

    return part;
  });
}

export default AIInsightsModal;