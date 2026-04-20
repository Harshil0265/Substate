import { useEffect } from 'react'

export const useScrollAnimation = () => {
  useEffect(() => {
    // Create Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1'
            entry.target.style.transform = 'translateY(0)'
            entry.target.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out'
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    )

    // Observe all sections
    const sections = document.querySelectorAll('section')
    sections.forEach((section) => {
      observer.observe(section)
    })

    // Observe footer
    const footer = document.querySelector('footer')
    if (footer) {
      observer.observe(footer)
    }

    // Cleanup
    return () => {
      sections.forEach((section) => {
        observer.unobserve(section)
      })
      if (footer) {
        observer.unobserve(footer)
      }
    }
  }, [])
}

export default useScrollAnimation
