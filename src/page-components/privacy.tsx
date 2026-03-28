"use client";

import Link from "@/components/tenant-link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/seo";
import { useGetSiteSettingsQuery } from "@/store/api";
import type { SiteSettings } from "@shared/schema";

export default function PrivacyPolicy() {
  const { data: siteSettings } = useGetSiteSettingsQuery();

  const platformName = siteSettings?.platformName || "MumblesVibe";

  // Show custom content only if useDefaultPrivacy is false and custom content exists
  if (!siteSettings?.useDefaultPrivacy && siteSettings?.privacyPolicy) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <SEO 
          title="Privacy Policy"
          description={`Learn how ${platformName} collects, uses, and protects your personal information. UK GDPR compliant privacy policy.`}
          canonicalUrl="/privacy"
        />
        <Link href="/">
          <Button variant="ghost" className="mb-6" data-testid="button-back-home">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <div 
          className="prose prose-neutral dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: siteSettings.privacyPolicy }}
        />
      </div>
    );
  }

  // Otherwise show the default template

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <SEO 
        title="Privacy Policy"
        description="Learn how MumblesVibe collects, uses, and protects your personal information. UK GDPR compliant privacy policy."
        canonicalUrl="/privacy"
      />
      <Link href="/">
        <Button variant="ghost" className="mb-6" data-testid="button-back-home">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </Link>

      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
          <p className="text-muted-foreground mb-4">
            MumblesVibe ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, 
            use, disclose, and safeguard your information when you visit our website mumblesvibe.com (the "Site").
          </p>
          <p className="text-muted-foreground">
            This policy complies with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">2. Information We Collect</h2>
          <h3 className="font-medium mb-2">Personal Information</h3>
          <p className="text-muted-foreground mb-4">
            We may collect personal information that you voluntarily provide when you:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
            <li>Subscribe to our newsletter (email address)</li>
            <li>Contact us via our website</li>
            <li>Submit content or enquiries</li>
          </ul>
          
          <h3 className="font-medium mb-2">Automatically Collected Information</h3>
          <p className="text-muted-foreground">
            When you visit our Site, we may automatically collect certain information including your IP address, 
            browser type, device information, pages visited, and referring website. This information is collected 
            using cookies and similar technologies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p className="text-muted-foreground mb-4">We use the information we collect to:</p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>Provide and maintain our Site</li>
            <li>Send you our newsletter (if subscribed)</li>
            <li>Respond to your enquiries</li>
            <li>Improve our Site and services</li>
            <li>Analyse usage patterns and trends</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">4. Legal Basis for Processing</h2>
          <p className="text-muted-foreground mb-4">Under UK GDPR, we process your personal data based on:</p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li><strong>Consent:</strong> Where you have given clear consent for us to process your personal data</li>
            <li><strong>Legitimate Interests:</strong> Where processing is necessary for our legitimate business interests</li>
            <li><strong>Legal Obligation:</strong> Where processing is necessary to comply with UK law</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">5. Cookies</h2>
          <p className="text-muted-foreground mb-4">
            Our Site uses cookies to enhance your browsing experience. Cookies are small text files stored on your device.
          </p>
          <p className="text-muted-foreground mb-4">We use the following types of cookies:</p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li><strong>Essential Cookies:</strong> Required for the Site to function properly</li>
            <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our Site</li>
            <li><strong>Preference Cookies:</strong> Remember your settings and preferences (e.g., dark mode)</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            You can manage your cookie preferences through your browser settings or our cookie consent banner.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">6. Third-Party Services</h2>
          <p className="text-muted-foreground mb-4">
            Our Site may contain links to third-party websites and services. 
            We are not responsible for the privacy practices of these third parties. We encourage you to read their privacy policies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">7. Your Rights</h2>
          <p className="text-muted-foreground mb-4">Under UK GDPR, you have the following rights:</p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li><strong>Right of Access:</strong> Request a copy of your personal data</li>
            <li><strong>Right to Rectification:</strong> Request correction of inaccurate data</li>
            <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
            <li><strong>Right to Restrict Processing:</strong> Request limitation of processing</li>
            <li><strong>Right to Data Portability:</strong> Request transfer of your data</li>
            <li><strong>Right to Object:</strong> Object to processing based on legitimate interests</li>
            <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            To exercise these rights, please contact us at privacy@mumblesvibe.com.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">8. Data Retention</h2>
          <p className="text-muted-foreground">
            We retain your personal data only for as long as necessary to fulfil the purposes for which it was collected, 
            or as required by law. Newsletter subscriptions are retained until you unsubscribe.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">9. Data Security</h2>
          <p className="text-muted-foreground">
            We implement appropriate technical and organisational measures to protect your personal data against 
            unauthorised access, alteration, disclosure, or destruction.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">10. Contact Us</h2>
          <p className="text-muted-foreground mb-4">
            If you have any questions about this Privacy Policy or our data practices, please contact us:
          </p>
          <p className="text-muted-foreground">
            Email: privacy@mumblesvibe.com<br />
            MumblesVibe<br />
            Mumbles, Swansea, Wales, UK
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">11. Complaints</h2>
          <p className="text-muted-foreground">
            If you are not satisfied with our response to your enquiry, you have the right to lodge a complaint with 
            the Information Commissioner's Office (ICO), the UK's supervisory authority for data protection issues. 
            Visit <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">ico.org.uk</a> for more information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">12. Changes to This Policy</h2>
          <p className="text-muted-foreground">
            We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated revision date. 
            We encourage you to review this policy periodically.
          </p>
        </section>
      </div>
    </div>
  );
}
