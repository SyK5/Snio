import { useEffect, useRef, useState, type ReactNode } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons'

interface Props {
  children: ReactNode
  className?: string
}

export function ScrollHints({ children, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [top, setTop] = useState(false)
  const [bottom, setBottom] = useState(false)

  useEffect(() => {
    const el = ref.current
    const inner = innerRef.current
    if (!el || !inner) return

    const update = () => {
      setTop(el.scrollTop > 5)
      setBottom(el.scrollTop + el.clientHeight < el.scrollHeight - 5)
    }

    update()
    el.addEventListener('scroll', update)
    const observer = new ResizeObserver(update)
    observer.observe(el)
    observer.observe(inner)

    return () => {
      el.removeEventListener('scroll', update)
      observer.disconnect()
    }
  }, [])

  const scrollTo = (y: number) => ref.current?.scrollTo({ top: y, behavior: 'smooth' })

  return (
    <>
      {top && (
        <div onClick={() => scrollTo(0)} className="group absolute inset-x-0 z-10 flex cursor-pointer justify-center bg-gradient-to-b from-surface to-transparent pt-2">
          <FontAwesomeIcon icon={faChevronUp} className="text-muted-foreground group-hover:animate-bounce" />
        </div>
      )}
      <div ref={ref} className={className}>
        <div ref={innerRef}>{children}</div>
      </div>
      {bottom && (
        <div
          onClick={() => scrollTo(ref.current?.scrollHeight ?? 0)}
          className="group absolute inset-x-0 bottom-0 z-10 flex cursor-pointer justify-center bg-gradient-to-t from-surface to-transparent pb-2"
        >
          <FontAwesomeIcon icon={faChevronDown} className="text-muted-foreground group-hover:animate-bounce" />
        </div>
      )}
    </>
  )
}
