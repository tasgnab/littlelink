/**
 * Next.js instrumentation hook
 * This file is called once when the server starts
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  console.log("===========================================");
  console.log("Instrumentation register() called");
  console.log(`NEXT_RUNTIME: ${process.env.NEXT_RUNTIME}`);
  console.log("===========================================");

  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("Loading geolocation service...");
    // Dynamically import geolocation service to avoid loading Node.js modules in Edge Runtime
    const { initializeGeoIP } = await import("@/lib/services/geolocation");
    await initializeGeoIP();
  } else {
    console.log("Skipping geolocation initialization (not in Node.js runtime)");
  }
}
