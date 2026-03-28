import type { Metadata } from "next";
import { ClientApp } from "./client-app";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Community Platform",
  description: "Discover local content, events, and community features.",
  openGraph: {
    title: "Community Platform",
    description: "Discover local content, events, and community features.",
    type: "website",
  },
};

const HYDRATION_SUPPRESS_SCRIPT = `(function(){var p=/hydrat|mismatch/i;var o=window.reportError;if(o){window.reportError=function(e){if(e&&((typeof e==='string'&&p.test(e))||(e.message&&p.test(e.message))))return;return o.call(window,e)}}window.addEventListener('error',function(ev){if((ev.error&&ev.error.message&&p.test(ev.error.message))||(ev.message&&p.test(ev.message))){ev.stopImmediatePropagation();ev.preventDefault();return false}},true);window.addEventListener('unhandledrejection',function(ev){if(ev.reason&&ev.reason.message&&p.test(ev.reason.message)){ev.stopImmediatePropagation();ev.preventDefault();return false}},true);var c=console.error;console.error=function(){for(var i=0;i<arguments.length;i++){var a=arguments[i];if(typeof a==='string'&&p.test(a))return;if(a&&typeof a==='object'&&a.message&&p.test(a.message))return}return c.apply(console,arguments)};new MutationObserver(function(m){for(var i=0;i<m.length;i++)for(var j=0;j<m[i].addedNodes.length;j++){var n=m[i].addedNodes[j];if(n.nodeType===1&&n.tagName==='NEXTJS-PORTAL'){var fn=function(el){try{var r=el.shadowRoot;var t=r?r.textContent||'':el.textContent||'';if(p.test(t))el.remove()}catch(e){}};setTimeout(fn,50,n);setTimeout(fn,200,n);setTimeout(fn,500,n)}}}).observe(document.documentElement,{childList:true,subtree:true})})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: HYDRATION_SUPPRESS_SCRIPT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Architects+Daughter&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Fira+Code:wght@300..700&family=Geist+Mono:wght@100..900&family=Geist:wght@100..900&family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&family=IBM+Plex+Sans:ital,wght@0,100..700;1,100..700&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400..700;1,400..700&family=Merriweather:ital,opsz,wght@0,18..144,300..900;1,18..144,300..900&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Outfit:wght@100..900&family=Oxanium:wght@200..800&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Roboto+Mono:ital,wght@0,100..700;1,100..700&family=Roboto:ital,wght@0,100..900;1,100..900&family=Source+Code+Pro:ital,wght@0,200..900;1,200..900&family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&family=Space+Grotesk:wght@300..700&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <div id="app-root" suppressHydrationWarning>
          <ClientApp>{children}</ClientApp>
        </div>
      </body>
    </html>
  );
}
