import './globals.css'

export const metadata = {
  title: 'AtlasAI — Location Intelligence for FnB',
  description: 'Analisis potensi lokasi bisnis FnB dengan AI',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
