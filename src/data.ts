import bouvetLogo from './assets/logos/bouvet.svg?raw'
import equinorMark from './assets/logos/equinor-mark.svg?raw'
import horizon56Mark from './assets/logos/horizon56-mark.svg?raw'
import uisLogo from './assets/logos/uis.svg?raw'
import uisSubseaLogo from './assets/logos/uis-subsea.svg?raw'

export type LinkIcon = 'linkedin' | 'github' | 'mail' | 'phone' | 'cv'

export interface Link {
  label: string
  href: string
  icon?: LinkIcon
}

export interface Entry {
  title: string
  org: string
  location?: string
  period: string
  points?: string[]
  logo?: Logo
}

export interface Logo {
  svg: string
  height: string
  color?: string
  emblem?: boolean
  badge?: { background: string; color: string }
}

export interface ProjectImage {
  src: string
  alt: string
  caption?: string
  thumb?: string
  width?: number
  height?: number
}

export interface Project {
  slug: string
  title: string
  subtitle: string
  period: string
  summary: string
  description: string[]
  role?: string[]
  highlights?: string[]
  tags: string[]
  links?: Link[]
  cover?: string
  video?: string
  coverOnPage?: boolean
  images?: ProjectImage[]
  hue: number
  logos?: Logo[]
}

const horizon56Brand: Logo = {
  svg: horizon56Mark,
  height: '3.5rem',
  emblem: true,
  badge: { background: '#ffffff', color: '#000000' },
}
const bouvetBrand: Logo = {
  svg: bouvetLogo,
  height: '3.5rem',
  emblem: true,
  badge: { background: '#11133c', color: '#f4f1e9' },
}
const equinorBrand: Logo = {
  svg: equinorMark,
  height: '3.5rem',
  emblem: true,
  badge: { background: '#ffffff', color: '#ff1243' },
}
const uisSubseaBrand: Logo = { svg: uisSubseaLogo, height: '3.5rem', emblem: true }

export const profile = {
  name: 'Åse Sagebakken',
  role: 'Frontend-utvikler',
  location: 'Stavanger',
  email: 'aase.sagebakken@hotmail.com',
  phone: '+47 95 87 80 60',
  summary:
    'Frontend-utvikler med erfaring fra konsulentbransjen og produktutvikling innen energisektoren.',
  links: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/asesagebakken', icon: 'linkedin' },
    { label: 'GitHub', href: 'https://github.com/Asejs', icon: 'github' },
    { label: 'CV', href: '/Ase-Sagebakken-CV.pdf', icon: 'cv' },
  ] satisfies Link[],
}

export const projects: Project[] = [
  {
    slug: 'horizon56',
    title: 'Horizon56',
    subtitle: 'Frontend-utvikler · Horizon56 · Stavanger',
    period: '2025 – nå',
    summary: 'Digitale arbeidsflyter for sikre og effektive brønnoperasjoner.',
    description: [
      'Digital plattform for planlegging (RigBridge) og utførelse (RigFlow) av brønnoperasjoner, brukt på riggoperasjoner verden over.',
    ],
    role: [
      'Frontend-utvikler i produktteam fra juni 2025, fra oppgave til produksjon. Vue 3 og TypeScript, med enkelte backend-oppgaver i C#/.NET og GraphQL.',
    ],
    highlights: [
      'Utvikler nye funksjoner i operasjonslogg, rapportering fra riggen og godkjenningsflyt',
      'Optimaliserer ytelsen i visninger med mye data',
      'Bygger gjenbrukbare komponenter i felles komponentbibliotek, dokumentert i Storybook',
      'Tar UX- og designavgjørelser i teamet',
      'Gjennomgår kode på tvers av teamene',
      'Retter feil og bedrer stabiliteten på tvers av kundeinstallasjoner',
    ],
    tags: ['Vue 3', 'TypeScript', 'GraphQL', 'Storybook', 'C# / .NET'],
    links: [{ label: 'horizon56.io', href: 'https://horizon56.io/' }],
    cover: '/projects/horizon56/cover.jpg',
    coverOnPage: false,
    hue: 200,
    logos: [horizon56Brand],
  },
  {
    slug: 'echo',
    title: 'Equinor Echo',
    subtitle: 'Konsulent · Bouvet Stavanger',
    period: '2022 – 2025',
    summary: 'Visuell digital tvilling for drift av Equinors plattformer.',
    description: [
      'Visuell digital tvilling av Equinors plattformer for søk og navigering i drifts- og prosjektdata, på desktop, nettbrett og mobil.',
    ],
    role: [
      'Konsulent i Equinors Echo-team fra august 2022 til mai 2025. React og TypeScript, i tett samarbeid med UX og backend.',
    ],
    highlights: [
      'Utviklet første versjon av Global Selection, der brukeren samler tags og arbeidsordrer i én liste',
      'Utviklet responsivt design og Progressive Web App for bruk i felt',
      'Bygde gjenbrukbare komponenter etter Equinor Design System (EDS)',
      'Hadde ansvar for release av Echo-CLI og integrering av teammoduler',
      'Hadde ansvar for sikkerhetsoppdateringer med Snyk i CI/CD',
      'Skrev enhetstester med Jest',
    ],
    tags: ['React', 'TypeScript', 'NX', 'Zustand', 'TanStack Query', 'AG Grid', 'Jest', 'Storybook'],
    links: [
      {
        label: 'New on deck-artikkel fra Innseiling',
        href: 'https://www.bouvet.no/bouvet-deler/innseiling/new-on-deck/ase',
      },
    ],
    cover: '/projects/echo/cover.jpg',
    coverOnPage: false,
    hue: 350,
    logos: [equinorBrand, bouvetBrand],
  },
  {
    slug: 'uis-subsea',
    title: 'UiS Subsea',
    subtitle: 'Bacheloroppgave · Universitetet i Stavanger',
    period: '2022',
    summary: 'Brukergrensesnitt og kommunikasjon for fjernstyrt undervannsfartøy.',
    description: [
      'Operatørgrensesnitt og toppside-kommunikasjon for UiS Subsea sin ROV, brukt i MATE ROV World Championship.',
    ],
    role: [
      'Bacheloroppgave med en medstudent, i et tverrfaglig team på 18 studenter fra data, elektro og maskin.',
    ],
    highlights: [
      'Utviklet operatørgrensesnitt i PyQt med sensordata og sanntidsvideo',
      'Satte opp kontroller for styring av ROV-en',
      'Implementerte TCP-kommunikasjon mellom toppside og ROV, med sensordata i JSON',
    ],
    tags: ['Python', 'PyQt', 'TCP', 'MJPEG'],
    links: [
      { label: 'uissubsea.no', href: 'https://www.uissubsea.no/' },
      { label: 'Kildekode på GitHub', href: 'https://github.com/VebjornRiiser/uis-subsea' },
      { label: 'Tidlig prototype', href: 'https://github.com/Asejs/UiS-Subsea-GUI' },
    ],
    video: '/projects/uis-subsea/video.mp4',
    coverOnPage: false,
    images: [
      {
        src: '/projects/uis-subsea/gui.jpg',
        alt: 'Operatørgrensesnittet for ROV-en på en bærbar PC ved bassengkanten under testing',
        caption: 'Operatørgrensesnittet i bruk under test i bassenget',
      },
    ],
    hue: 180,
    logos: [uisSubseaBrand],
  },
]

export const experience: Entry[] = [
  {
    title: 'Frontend-utvikler',
    org: 'Horizon56',
    location: 'Stavanger',
    period: '2025 – nå',
    points: [
      'Utvikler RigBridge og RigFlow i produktteam, fra oppgave til produksjon',
      'Tar UX- og designavgjørelser i teamet',
      'Gjennomgår kode på tvers av teamene',
      'Bruker Claude Code daglig, med tester og kodegjennomgang før merge',
    ],
    logo: horizon56Brand,
  },
  {
    title: 'Konsulent',
    org: 'Bouvet',
    location: 'Stavanger',
    period: '2022 – 2025',
    points: [
      'Jobbet som frontend-utvikler for Equinor i Echo-teamet',
      'Samarbeidet med UX og backend om estimering og planlegging i Scrum',
      'Gjennomgikk kode og skrev teknisk dokumentasjon',
    ],
    logo: bouvetBrand,
  },
]

export const skills = {
  daily: ['Vue.js', 'TypeScript', 'JavaScript', 'GraphQL', 'HTML / CSS / SCSS', 'Vite', 'Vitest', 'Storybook', 'Git', 'Azure DevOps'],
  used: ['React', 'Zustand', 'TanStack Query', 'Jest', 'C# / .NET'],
}

export const education: Entry[] = [
  {
    title: 'Bachelor i datateknologi',
    org: 'Universitetet i Stavanger',
    period: '2019 – 2022',
    logo: {
      svg: uisLogo,
      height: '3.5rem',
      emblem: true,
      badge: { background: '#083ba0', color: '#ffffff' },
    },
  },
]

export const roles: Entry[] = [
  {
    title: 'Arrangementansvarlig',
    org: 'Bouvet Stavanger',
    period: '2024',
    logo: bouvetBrand,
  },
  {
    title: 'Markedsføringsansvarlig',
    org: 'UiS Subsea',
    location: 'Universitetet i Stavanger',
    period: '2022',
    logo: uisSubseaBrand,
  },
]

export type InterestIcon = 'camera' | 'brush' | 'plane' | 'mountain' | 'footprints' | 'yoga' | 'dumbbell'

export interface Interest {
  slug: string
  title: string
  description?: string
  icon: InterestIcon
  galleryTitle?: string
  galleryDescription?: string
  images?: ProjectImage[]
}

export const interests: Interest[] = [
  {
    slug: 'fotografering',
    title: 'Fotografering',
    icon: 'camera',
    galleryTitle: 'Fotogalleri',
    images: [
      {
        src: '/interests/fotografering/17-lovinne-unger-lek.jpg',
        width: 1000,
        height: 1500,
        thumb: '/interests/fotografering/17-lovinne-unger-lek-thumb.jpg',
        alt: 'Løvinne som strekker seg mens ungene leker rundt henne',
        caption: 'Masai Mara, Kenya',
      },
      {
        src: '/interests/fotografering/05-akasie-solnedgang.jpg',
        width: 1199,
        height: 1800,
        thumb: '/interests/fotografering/05-akasie-solnedgang-thumb.jpg',
        alt: 'Akasietre i silhuett mot oransje solnedgang',
        caption: 'Masai Mara, Kenya',
      },
      {
        src: '/interests/fotografering/01-varanasi-soloppgang.jpg',
        width: 1201,
        height: 1800,
        thumb: '/interests/fotografering/01-varanasi-soloppgang-thumb.jpg',
        alt: 'Soloppgang over Ganges, sett fra ghatene med båter og bjeller',
        caption: 'Varanasi, India',
      },
      {
        src: '/interests/fotografering/03-fiskeorn.jpg',
        width: 1031,
        height: 1800,
        thumb: '/interests/fotografering/03-fiskeorn-thumb.jpg',
        alt: 'Afrikansk fiskeørn i flukt rett over vannflaten',
        caption: 'Lake Naivasha, Kenya',
      },
      {
        src: '/interests/fotografering/04-jente.jpg',
        width: 1440,
        height: 1800,
        thumb: '/interests/fotografering/04-jente-thumb.jpg',
        alt: 'Portrett av en jente i rød kjole foran en turkis vegg',
        caption: 'Bandhavgarh, India',
      },
      {
        src: '/interests/fotografering/06-marked-varanasi.jpg',
        width: 1500,
        height: 1127,
        thumb: '/interests/fotografering/06-marked-varanasi-thumb.jpg',
        alt: 'Bod med perlekjeder og messing, og en sadhu som går forbi',
        caption: 'Varanasi, India',
      },
      {
        src: '/interests/fotografering/07-elefanter.jpg',
        width: 1800,
        height: 1199,
        thumb: '/interests/fotografering/07-elefanter-thumb.jpg',
        alt: 'To elefanter i motlys på savannen',
        caption: 'Masai Mara, Kenya',
      },
      {
        src: '/interests/fotografering/08-barn.jpg',
        width: 1199,
        height: 1800,
        thumb: '/interests/fotografering/08-barn-thumb.jpg',
        alt: 'En gruppe barn som smiler og tuller foran en oransje vegg',
        caption: 'Bandhavgarh, India',
      },
      {
        src: '/interests/fotografering/09-gate-varanasi.jpg',
        width: 1500,
        height: 1202,
        thumb: '/interests/fotografering/09-gate-varanasi-thumb.jpg',
        alt: 'Ku som krysser gaten i morgenlyset',
        caption: 'Varanasi, India',
      },
      {
        src: '/interests/fotografering/10-lovinne-lek.jpg',
        width: 1800,
        height: 1199,
        thumb: '/interests/fotografering/10-lovinne-lek-thumb.jpg',
        alt: 'Løvinne som leker med en unge',
        caption: 'Masai Mara, Kenya',
      },
      {
        src: '/interests/fotografering/11-mor-og-barn.jpg',
        width: 1199,
        height: 1800,
        thumb: '/interests/fotografering/11-mor-og-barn-thumb.jpg',
        alt: 'Kvinne som klemmer et barn foran en turkis vegg',
        caption: 'Bandhavgarh, India',
      },
      {
        src: '/interests/fotografering/13-tiger.jpg',
        width: 1275,
        height: 1670,
        thumb: '/interests/fotografering/13-tiger-thumb.jpg',
        alt: 'Tiger som hviler på en skogsvei dekket av tørre blader',
        caption: 'Kanha, India',
      },
      {
        src: '/interests/fotografering/14-esel.jpg',
        width: 1800,
        height: 1200,
        thumb: '/interests/fotografering/14-esel-thumb.jpg',
        alt: 'Hvitt esel med fargerik sal foran ørkenåsene',
        caption: 'Judean Desert',
      },
    ],
  },
  { slug: 'maling', title: 'Maling', description: 'Olje og akryl', icon: 'brush' },
  { slug: 'reise', title: 'Reise', icon: 'plane' },
  { slug: 'friluftsliv', title: 'Friluftsliv', description: 'Tur og natur', icon: 'mountain' },
  { slug: 'trening', title: 'Trening', description: 'Styrke og jogging', icon: 'dumbbell' },
  { slug: 'yoga', title: 'Yoga', icon: 'yoga' },
]
