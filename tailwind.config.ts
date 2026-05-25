import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:      '#FAF8F4',
        bg1:     '#F4F0E8',
        bg2:     '#EDE8DE',
        bg3:     '#E4DDD0',
        rose:    '#C4607A',
        'rose-l':'#EDD5DA',
        'rose-xl':'#FAF0F2',
        sage:    '#7A9E8A',
        'sage-l':'#D8EAE0',
        text0:   '#2C2520',
        text1:   '#6B6058',
        text2:   '#A89E94',
        bd:      '#E4DDD0',
        bd2:     '#D4CBBC',
      },
      fontFamily: {
        sans: ['Nunito', 'Pretendard', 'sans-serif'],
      },
      borderRadius: {
        btn:  '10px',
        card: '14px',
        nav:  '9px',
      },
    },
  },
  plugins: [],
};

export default config;
