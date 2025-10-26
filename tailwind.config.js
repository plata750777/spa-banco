module.exports = {
  content: [
    "./*.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./index.html",
    "./admin.html",
    "./main.html"
  ],
  safelist: [
    'grid', 'p-6', 'text-2xl', 'rounded-xl', 'shadow-lg', 'mx-auto', 'container',
    'lg:grid-cols-12', 'text-gray-500', 'text-sm', 'font-medium', 'bg-white',
    'border', 'border-gray-200', 'text-gray-900', 'text-gray-600'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

