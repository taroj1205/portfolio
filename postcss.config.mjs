// Replaces the @stylex directive in globals.css with the compiled CSS.
import babel from "./babel.config.json" with { type: "json" };

export default {
  plugins: {
    "@stylexjs/postcss-plugin": {
      babelConfig: {
        babelrc: false,
        parserOpts: { plugins: ["typescript", "jsx"] },
        plugins: babel.plugins,
      },
      include: ["src/**/*.{ts,tsx}"],
      useCSSLayers: true,
    },
    autoprefixer: {},
  },
};
