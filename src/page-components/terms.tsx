"use client";

import Link from "@/components/tenant-link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/seo";
import { useGetSiteSettingsQuery } from "@/store/api";
import type { SiteSettings } from "@shared/schema";

export default function TermsOfService() {
  const { data: siteSettings } = useGetSiteSettingsQuery();

  const platformName = (siteSettings as SiteSettings)?.platformName || "MumblesVibe";

  if (!(siteSettings as SiteSettings)?.useDefaultTerms && (siteSettings as SiteSettings)?.termsOfService) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <SEO 
          title="Terms of Service"
          description={`Terms and conditions for using ${platformName}. Read our user agreement and guidelines for the community.`}
          canonicalUrl="/terms"
        />
        <Link href="/">
          <Button variant="ghost" className="mb-6" data-testid="button-back-home">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <div 
          className="prose prose-neutral dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: (siteSettings as SiteSettings).termsOfService! }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <SEO 
        title="Terms of Service"
        description="Terms and conditions for using MumblesVibe.com. Read our user agreement and guidelines for the community."
        canonicalUrl="/terms"
      />
      <Link href="/">
        <Button variant="ghost" className="mb-6" data-testid="button-back-home">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </Link>

      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">1. Agreement to Terms</h2>
          <p className="text-muted-foreground">
            By accessing and using MumblesVibe.com (the "Site"), you agree to be bound by these Terms of Service and all 
            applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or 
            accessing this Site. These terms are governed by the laws of England and Wales.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">2. Use of the Site</h2>
          <p className="text-muted-foreground mb-4">
            MumblesVibe is a community website providing information about the village of Mumbles, Swansea, including 
            local articles, events, and community features. You may use our Site for lawful purposes only.
          </p>
          <p className="text-muted-foreground">You agree not to:</p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
            <li>Use the Site in any way that violates any applicable local, national, or international law</li>
            <li>Attempt to gain unauthorised access to any portion of the Site</li>
            <li>Use the Site to transmit any advertising or promotional material without our prior consent</li>
            <li>Impersonate or attempt to impersonate MumblesVibe, its employees, or other users</li>
            <li>Engage in any conduct that restricts or inhibits anyone's use of the Site</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">3. Intellectual Property Rights</h2>
          <p className="text-muted-foreground mb-4">
            Unless otherwise stated, MumblesVibe and/or its licensors own the intellectual property rights for all material 
            on this Site. All intellectual property rights are reserved.
          </p>
          <p className="text-muted-foreground">
            You may view and/or print pages from the Site for your own personal use subject to restrictions set in these 
            terms. You must not republish, sell, rent, sub-license, reproduce, duplicate, or copy material from MumblesVibe 
            without our express written permission.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">4. User Content</h2>
          <p className="text-muted-foreground mb-4">
            If you submit content to our Site (such as comments or newsletter subscriptions), you grant MumblesVibe a 
            non-exclusive, royalty-free, perpetual licence to use, reproduce, edit, and authorise others to use your 
            content in any media.
          </p>
          <p className="text-muted-foreground">
            You warrant that any content you submit is accurate, does not infringe any third party's rights, and is not 
            defamatory, obscene, or otherwise unlawful.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">5. Third-Party Links and Services</h2>
          <p className="text-muted-foreground mb-4">
            Our Site contains links to third-party websites and services. 
            These links are provided for your convenience only.
          </p>
          <p className="text-muted-foreground">
            We have no control over the content, privacy policies, or practices of any third-party sites or services. 
            You acknowledge and agree that MumblesVibe shall not be responsible or liable for any damage or loss caused 
            by your use of any third-party websites or services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">6. Disclaimer of Warranties</h2>
          <p className="text-muted-foreground mb-4">
            The information on this Site is provided "as is" without any representations or warranties, express or implied. 
            MumblesVibe makes no representations or warranties in relation to this Site or the information and materials 
            provided herein.
          </p>
          <p className="text-muted-foreground">
            Without prejudice to the foregoing, MumblesVibe does not warrant that:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
            <li>The Site will be constantly available or available at all</li>
            <li>The information on this Site is complete, true, accurate, or non-misleading</li>
            <li>Event information or pricing is accurate or up to date</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">7. Limitation of Liability</h2>
          <p className="text-muted-foreground mb-4">
            To the maximum extent permitted by applicable law, MumblesVibe shall not be liable for any indirect, incidental, 
            special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or 
            indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>Your access to or use of or inability to access or use the Site</li>
            <li>Any conduct or content of any third party on the Site</li>
            <li>Any content obtained from the Site</li>
            <li>Unauthorised access, use, or alteration of your transmissions or content</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            Nothing in these terms shall limit or exclude our liability for death or personal injury resulting from our 
            negligence, fraud, or any other liability that cannot be excluded or limited by English law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">8. Indemnification</h2>
          <p className="text-muted-foreground">
            You agree to defend, indemnify, and hold harmless MumblesVibe and its officers, directors, employees, and agents 
            from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees arising 
            out of or relating to your violation of these Terms or your use of the Site.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">9. Governing Law</h2>
          <p className="text-muted-foreground">
            These Terms shall be governed by and construed in accordance with the laws of England and Wales. 
            Any disputes relating to these terms shall be subject to the exclusive jurisdiction of the courts of England and Wales.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">10. Changes to Terms</h2>
          <p className="text-muted-foreground">
            We reserve the right to modify or replace these Terms at any time at our sole discretion. If a revision is 
            material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a 
            material change will be determined at our sole discretion.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">11. Severability</h2>
          <p className="text-muted-foreground">
            If any provision of these Terms is held to be unenforceable or invalid, such provision will be changed and 
            interpreted to accomplish the objectives of such provision to the greatest extent possible under applicable law, 
            and the remaining provisions will continue in full force and effect.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">12. Contact Us</h2>
          <p className="text-muted-foreground mb-4">
            If you have any questions about these Terms, please contact us:
          </p>
          <p className="text-muted-foreground">
            Email: legal@mumblesvibe.com<br />
            MumblesVibe<br />
            Mumbles, Swansea, Wales, UK
          </p>
        </section>
      </div>
    </div>
  );
}
