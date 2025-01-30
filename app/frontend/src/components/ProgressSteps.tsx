import React from 'react';
import { Check } from 'lucide-react';

interface ProgressStepsProps {
  currentStep: number;
  steps: string[];
}

export function ProgressSteps({ currentStep, steps }: ProgressStepsProps) {
  return (
    <div className="flex justify-between items-center w-full mb-8">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center flex-1 last:flex-none">
          <div className="relative">
            <div
              className={`w-10 h-10 flex items-center justify-center rounded-full border-2 transition-all duration-500 ease-in-out
                ${
                  index < currentStep
                    ? 'bg-green-500 border-green-500 text-white'
                    : index === currentStep
                    ? 'border-blue-500 text-blue-500'
                    : 'border-gray-300 text-gray-300'
                }`}
            >
              {index < currentStep ? (
                <Check className="w-5 h-5 animate-scale-check" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-sm text-gray-600 whitespace-nowrap">
              {step}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className="flex-1 mx-4 h-0.5 relative">
              <div className="absolute inset-0 bg-gray-300" />
              <div
                className="absolute inset-0 bg-green-500 transition-all duration-500 ease-in-out origin-left"
                style={{
                  transform: `scaleX(${index < currentStep ? 1 : 0})`
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}