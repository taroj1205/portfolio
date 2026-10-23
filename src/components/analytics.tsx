import Script from "next/script";

export const Analytics = () => (
  <Script
    data-cf-beacon='{"token": "b07642c664f545aabfc2dfa623693686"}'
    src="https://static.cloudflareinsights.com/beacon.min.js"
    type="module"
  />
);
