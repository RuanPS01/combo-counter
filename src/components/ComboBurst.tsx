import type { CSSProperties } from 'react'

const SPARKS = 18

/**
 * Explosao de combo: ondas de choque saindo do centro do anel mais um leque de
 * faiscas. Renderizado com `key` novo a cada combo para reiniciar a animacao.
 */
export function ComboBurst() {
  return (
    <div className="burst" aria-hidden="true">
      <span className="burst__wave" />
      <span className="burst__wave burst__wave--2" />
      <span className="burst__wave burst__wave--3" />
      <span className="burst__core" />
      {Array.from({ length: SPARKS }, (_, index) => (
        <span
          key={index}
          className="burst__spark"
          style={
            {
              '--angle': `${(index * 360) / SPARKS}deg`,
              '--delay': `${(index % 3) * 40}ms`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
