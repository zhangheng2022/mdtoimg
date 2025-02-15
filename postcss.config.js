import pxtorpx from 'postcss-pxtorpx-pro';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

const config = {
  plugins: [
    tailwindcss(),
    autoprefixer(),
    {
      postcssPlugin: 'postcss-import-css-to-wxss',
      AtRule: {
        import: (atRule) => {
          atRule.params = atRule.params.replace('.css', '.wxss');
        },
      },
    },
    pxtorpx({ transform: (x) => x }),
  ],
};

export default config;
