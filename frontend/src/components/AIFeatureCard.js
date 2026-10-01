import React from 'react';
import {
  ArrowRight,
  Loader2,
} from 'lucide-react';

const AIFeatureCard = ({
  icon,
  title,
  description,
  buttonText = 'Analyze',
  onClick,
  loading = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="group rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-green-300 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
          {icon}
        </div>

        <ArrowRight className="h-5 w-5 text-gray-400 transition group-hover:translate-x-1 group-hover:text-green-600" />
      </div>

      <h3 className="mt-5 text-lg font-bold text-gray-900">
        {title}
      </h3>

      <p className="mt-2 min-h-[48px] text-sm leading-6 text-gray-500">
        {description}
      </p>

      <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-green-700">
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}

        {loading
          ? 'Analyzing...'
          : buttonText}
      </div>
    </button>
  );
};

export default AIFeatureCard;