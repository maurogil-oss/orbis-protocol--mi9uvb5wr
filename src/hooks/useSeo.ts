import { useEffect } from 'react'

interface SeoProps {
  title: string
  description: string
}

/**
 * Hook utilitário para atualizar title e meta description da página em pt-BR,
 * restaurando os valores padrão ao desmontar.
 */
export function useSeo({ title, description }: SeoProps) {
  useEffect(() => {
    const previousTitle = document.title
    document.title = title

    let metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    const previousDescription = metaDesc ? metaDesc.getAttribute('content') : ''

    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.name = 'description'
      document.head.appendChild(metaDesc)
    }
    metaDesc.setAttribute('content', description)

    return () => {
      document.title = previousTitle
      if (metaDesc && previousDescription !== null) {
        metaDesc.setAttribute('content', previousDescription || '')
      }
    }
  }, [title, description])
}
