import React from 'react';
import Icon from '@/components/ui/AppIcon';

const TrustIndicators = () => {
  const indicators = [
    {
      icon: 'ShieldCheckIcon',
      title: 'Verified Properties',
      description:
        'Every property is meticulously verified by our team to ensure quality and safety.',
    },
    {
      icon: 'UserGroupIcon',
      title: '50,000+ Happy Guests',
      description:
        'Join a community of thousands of satisfied travelers who trust us with their stay.',
    },
    {
      icon: 'ClockIcon',
      title: '24/7 Support',
      description:
        'Our dedicated customer support team is available round-the-clock to assist you.',
    },
    {
      icon: 'CurrencyRupeeIcon',
      title: 'Best Price Guarantee',
      description:
        'We offer competitive rates with no hidden fees, ensuring you get the best value.',
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gradient-background-from to-gradient-background-to">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading text-4xl font-bold text-text-primary tracking-tight">
            Why Choose Us?
          </h2>
          <p className="font-sans mt-4 text-xl text-text-secondary max-w-3xl mx-auto">
            Experience peace of mind and unparalleled service with StayCool Booking.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {indicators.map((indicator, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-gradient-card-from to-gradient-card-to p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 text-center"
            >
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-gradient-primary-from/10 to-gradient-primary-to/10 mx-auto mb-6">
                <Icon name={indicator.icon} size={32} className="text-primary" />
              </div>
              <h3 className="font-heading text-xl font-bold text-text-primary">
                {indicator.title}
              </h3>
              <p className="font-sans mt-2 text-text-secondary text-sm">{indicator.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustIndicators;
