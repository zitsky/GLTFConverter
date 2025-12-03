import { defineConfig } from 'vite'

const stripCrossoriginAttribute = () => ({
  name: 'strip-crossorigin-attr',
  enforce: 'post',
  transformIndexHtml(html) {
    return html.replace(/\s+crossorigin(?:=(["']).*?\1)?/gi, '').replace(/\s+type(?:=(["']).*?\1)?/gi, '')
  }
})

export default defineConfig({
  base: './',
  server: {
    cors: false
  },
  preview: {
    cors: false
  },
  plugins: [stripCrossoriginAttribute()]
})

