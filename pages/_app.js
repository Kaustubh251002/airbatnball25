import '@/styles/globals.css'; // Ensure Tailwind styles are loaded
import Head from 'next/head';

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Air Bat N' Ball 2025</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}
