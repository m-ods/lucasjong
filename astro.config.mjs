// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://lucasjong.com',
  image: {
    remotePatterns: [{ protocol: 'https' }],
  },
  devToolbar: { enabled: false },
});
