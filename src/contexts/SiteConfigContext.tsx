import { createContext, useContext } from 'react';
import { DEFAULT_SITE_CONFIG, SiteConfig } from '../utils/siteConfig';

export const SiteConfigContext = createContext<SiteConfig>(DEFAULT_SITE_CONFIG);

export function useSiteConfig(): SiteConfig {
  return useContext(SiteConfigContext);
}
