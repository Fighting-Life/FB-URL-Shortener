import { NODE_ENV, ORIGIN } from '$env/static/private';
import type { LinkTag, MetaTag } from 'svelte-meta-tags';
import { defineBaseMetaTags } from 'svelte-meta-tags';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const { user, session, setting } = locals;

  const defaultOrigin = ORIGIN || setting?.site_url || "http://localhost:5000";
  let canonicalUrl = defaultOrigin;
  if (
    NODE_ENV &&
    NODE_ENV === 'production' &&
    canonicalUrl.startsWith('http://')
  ) {
    canonicalUrl = canonicalUrl.replace('http://', 'https://');
  }

  const baseTags = defineBaseMetaTags({
    title: setting?.site_meta_title || 'Bitfy - Shorten Long URLs',
    titleTemplate: `%s | ${setting?.site_name || 'Bitfy'}`,
    description:
      setting?.site_meta_description || 'Cloak and rotate links across multiple destinations, block unwanted traffic by IP, domain, or device, and control every redirect — free.',
    keywords: [
      setting?.site_name || 'Bitfy',
      'url shortener',
    ],
    canonical: canonicalUrl + url.pathname,
    additionalMetaTags: [
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1.0'
      },
      {
        property: 'dc:creator',
        content: setting?.site_name || 'Bitfy'
      },
      {
        name: 'application-name',
        content: setting?.site_name || 'Bitfy'
      },
      {
        httpEquiv: 'x-ua-compatible',
        content: 'IE=edge'
      },
      {
        name: 'description',
        content:
          setting?.site_meta_description || 'Cloak and rotate links across multiple destinations, block unwanted traffic by IP, domain, or device, and control every redirect — free.'
      },
      {
        name: 'mobile-web-app-capable',
        content: 'yes'
      },
      {
        name: 'mobile-web-app-status-bar-style',
        content: 'black-translucent'
      },
      {
        name: 'mobile-web-app-title',
        content: setting?.site_name || 'Bitfy'
      },
      {
        name: 'mobile-web-app-icon',
        content: setting?.site_favicon || '/favicon.ico'
      }
    ] as MetaTag[],
    additionalLinkTags: [
      {
        rel: 'canonical',
        href: canonicalUrl + url.pathname
      },
      {
        rel: 'alternate',
        hreflang: 'x-default',
        href: canonicalUrl + url.pathname
      },
      {
        rel: 'icon',
        type: 'image/x-icon',
        sizes: '96x96',
        href: setting?.site_logo || '/logo.png'
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: setting?.site_favicon || '/favicon-32x32.png'
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: setting?.site_favicon || '/favicon-16x16.png'
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '192x192',
        href: setting?.site_favicon || '/android-chrome-192x192.png'
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '512x512',
        href: setting?.site_favicon || '/android-chrome-512x512.png'
      },
      {
        rel: 'apple-touch-icon',
        type: 'image/png',
        sizes: '180x180',
        href: setting?.site_favicon || '/apple-touch-icon.png'
      }
    ] as LinkTag[],
    openGraph: {
      type: 'website',
      url: canonicalUrl + url.pathname,
      locale: 'en_IE',
      title: setting?.site_meta_title || 'Bitfy',
      description:
        setting?.site_meta_description || 'Cloak and rotate links across multiple destinations, block unwanted traffic by IP, domain, or device, and control every redirect — free.',
      siteName: setting?.site_name || 'Bitfy',
      images: [
        {
          url: setting?.site_logo || '/logo.png',
          width: 800,
          height: 600,
          alt: setting?.site_name || 'Bitfy Cover Image',
          type: 'image/png'
        },
        {
          url: setting?.site_logo || '/logo.png',
          width: 512,
          height: 512,
          alt: setting?.site_name || 'Bitfy Android Chrome Icon',
          type: 'image/x-icon'
        }
      ],
      profile: {
        firstName: setting?.site_name || 'Bitfy',
        lastName: setting?.site_name || 'Bitfy',
        username: setting?.site_name?.replaceAll(' ', '') || 'linkcloacking'
      }
    }
  });

  return {
    ...baseTags,
    user,
    session,
    setting
  };
};
