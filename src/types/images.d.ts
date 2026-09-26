declare module '*.PNG' {
  const metadata: import('astro').ImageMetadata;
  export default metadata;
}