import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface SafetyFeature {
  id: number;
  title: string;
  description: string;
  icon: string;
}

interface SafetySectionProps {
  safetyFeatures: SafetyFeature[];
  insuranceCoverage: string;
  emergencyContact: string;
}

const SafetySection = ({
  safetyFeatures,
  insuranceCoverage,
  emergencyContact,
}: SafetySectionProps) => {
  return (
    <div className="bg-card rounded-xl p-6 md:p-8 border border-border">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
          <Icon name="ShieldCheckIcon" size={28} className="text-success" />
        </div>
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Safety & Security</h2>
          <p className="text-sm text-text-secondary">Your safety is our priority</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {safetyFeatures.map((feature) => (
          <div key={feature.id} className="flex items-start space-x-4 p-4 bg-muted rounded-lg">
            <div className="flex-shrink-0 w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
              <Icon name={feature.icon} size={24} className="text-success" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-heading font-semibold text-foreground mb-1">
                {feature.title}
              </h3>
              <p className="text-sm text-text-secondary">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-primary/10 rounded-lg">
          <div className="flex items-start space-x-3">
            <Icon name="DocumentTextIcon" size={20} className="text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-heading font-semibold text-foreground mb-1">
                Insurance Coverage
              </h3>
              <p className="text-sm text-text-secondary">{insuranceCoverage}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-error/10 rounded-lg">
          <div className="flex items-start space-x-3">
            <Icon name="PhoneIcon" size={20} className="text-error flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-heading font-semibold text-foreground mb-1">
                24/7 Emergency Support
              </h3>
              <p className="text-sm text-text-secondary">
                Contact us anytime: <span className="font-semibold">{emergencyContact}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetySection;
