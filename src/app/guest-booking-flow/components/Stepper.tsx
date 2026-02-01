'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface StepperProps {
  steps: string[];
  currentStep: number;
}

const Stepper = ({ steps, currentStep }: StepperProps) => {
  return (
    <div className="flex items-center justify-center">
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                currentStep > index + 1
                  ? 'bg-green-500 text-white'
                  : currentStep === index + 1
                    ? 'bg-primary text-white scale-110'
                    : 'bg-gray-200 text-gray-500'
              }`}
            >
              {currentStep > index + 1 ? (
                <Icon name="CheckIcon" size={24} />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <p
              className={`mt-2 text-sm font-semibold ${
                currentStep >= index + 1 ? 'text-primary' : 'text-gray-500'
              }`}
            >
              {step}
            </p>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`flex-1 h-1 mx-4 transition-all duration-300 ${
                currentStep > index + 1 ? 'bg-green-500' : 'bg-gray-200'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Stepper;
