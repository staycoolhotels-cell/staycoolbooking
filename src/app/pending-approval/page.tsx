import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

export default function PendingApprovalPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 pt-32 pb-12">
            <div className="bg-card w-full max-w-2xl p-8 rounded-3xl shadow-brand-lg border border-border">
                <div className="text-center">
                    {/* Icon */}
                    <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                        <Icon name="ClockIcon" size={40} className="text-primary" />
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-heading font-bold text-foreground mb-4">
                        Application Under Review
                    </h1>

                    {/* Description */}
                    <p className="text-text-secondary text-lg mb-6">
                        Thank you for signing up as a host! Your application is currently being reviewed by our admin team.
                    </p>

                    {/* Info Box */}
                    <div className="bg-muted border border-border rounded-xl p-6 mb-8 text-left">
                        <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
                            <Icon name="InformationCircleIcon" size={20} className="text-primary" />
                            What happens next?
                        </h2>
                        <ul className="space-y-2 text-text-secondary">
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>Our admin team will review your application within 24-48 hours</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>You'll receive an email notification once your account is approved</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>After approval, you can login and start listing your properties</span>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
                        <p className="text-sm text-text-secondary">
                            <strong className="text-foreground">Need help?</strong> Contact our support team at{' '}
                            <a href="mailto:staycoolhotels@gmail.com" className="text-primary font-bold hover:underline">
                                staycoolhotels@gmail.com
                            </a>
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            href="/"
                            className="px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-brand-md hover:opacity-90 transition-all"
                        >
                            Go to Homepage
                        </Link>
                        <Link
                            href="/auth"
                            className="px-6 py-3 bg-muted text-foreground rounded-xl font-bold border border-border hover:bg-muted/80 transition-all"
                        >
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
