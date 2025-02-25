import React from 'react';
import { Check } from 'lucide-react';

interface ProgressStepsProps {
  currentStep: number;
  steps: string[];
}

export function ProgressSteps({ currentStep, steps }: ProgressStepsProps) {
  return (
    <div className="flex justify-between items-center w-full mb-8 bg-[#111111] p-6 rounded-lg border border-[#222222]">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center flex-1 last:flex-none">
          <div className="relative">
            <div
              className={`w-10 h-10 flex items-center justify-center rounded-full border-2 transition-all duration-500 ease-in-out
                ${
                  index < currentStep
                    ? 'bg-green-500 border-green-500 text-black dark:bg-green-600 dark:border-green-600'
                    : index === currentStep
                    ? 'border-green-500 text-green-500'
                    : 'border-[#333333] text-[#333333]'
                }`}
            >
              {index < currentStep ? (
                <Check className="w-5 h-5 animate-scale-check" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-sm text-gray-200 whitespace-nowrap">
              {step}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className="flex-1 mx-4 h-0.5 relative">
              <div className="absolute inset-0 bg-[#333333]" />
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