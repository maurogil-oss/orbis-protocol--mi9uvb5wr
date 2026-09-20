import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * ScrollToTop - Garante que ao navegar entre rotas a página inicialize
 * posicionada no topo (logo abaixo do cabeçalho fixo), evitando que o
 * React Router preserve o scrollY da rota anterior.
 *
 * Caso haja hash na URL (#secao), realiza scrollIntoView respeitando
 * o scroll-margin-top / scroll-padding-top configurado.
 */
export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      // Pequeno timeout para garantir que o DOM de destino já foi renderizado
      const id = decodeURIComponent(hash.replace('#', ''))
      const element = document.getElementById(id)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    })
  }, [pathname, search, hash])

  return null
}
