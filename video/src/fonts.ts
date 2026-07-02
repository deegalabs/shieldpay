import { loadFont } from "@remotion/google-fonts/Inter";

// Load Inter once. Blocks render until ready.
export const { fontFamily: inter } = loadFont("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});
