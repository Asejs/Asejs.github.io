import { nextTick, ref } from 'vue'

type Theme = 'light' | 'dark'

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme() {
  const theme = ref<Theme>((document.documentElement.dataset.theme as Theme) || systemTheme())

  function apply() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = theme.value
    try {
      localStorage.setItem('theme', theme.value)
    } catch {
    }
  }

  async function toggle(event: MouseEvent) {
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return apply()

    const box = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const x = event.detail ? event.clientX : box.left + box.width / 2
    const y = event.detail ? event.clientY : box.top + box.height / 2
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
    const transition = document.startViewTransition(async () => {
      apply()
      await nextTick()
    })
    await transition.ready
    const size = radius * 4
    document.documentElement.animate(
      {
        maskSize: ['0px 0px', `${size}px ${size}px`],
        maskPosition: [`${x}px ${y}px`, `${x - size / 2}px ${y - size / 2}px`],
      },
      {
        duration: 1100,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'forwards',
        pseudoElement: '::view-transition-new(root)',
      },
    )
  }

  return { theme, toggle }
}
