import bouvetLogo from './assets/logos/bouvet.svg?raw'
import equinorMark from './assets/logos/equinor-mark.svg?raw'
import horizon56Mark from './assets/logos/horizon56-mark.svg?raw'
import uisLogo from './assets/logos/uis.svg?raw'
import uisSubseaLogo from './assets/logos/uis-subsea.svg?raw'

export type LinkIcon = 'linkedin' | 'github' | 'mail' | 'phone' | 'cv' | 'location'

export interface LinkVariant {
  label: string
  href: string
  ariaLabel: string
}

export interface Link {
  label: string
  href: string
  icon?: LinkIcon
  variants?: LinkVariant[]
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
  video?: string
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
  banner?: string
  video?: string
  model?: string
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
    'Har over fire års erfaring med produktutvikling i energisektoren, både som konsulent for Equinor og i produktteam hos Horizon56.',
  motivation:
    'Motivert av å lage brukervennlige løsninger som gjør en forskjell i arbeidshverdagen. Kombinerer AI-verktøy, som Claude Code, med godt øye for detaljer og kvalitet.',
  links: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/asesagebakken', icon: 'linkedin' },
    { label: 'GitHub', href: 'https://github.com/Asejs', icon: 'github' },
    {
      label: 'CV',
      href: '/Ase-Sagebakken-CV.pdf',
      icon: 'cv',
      variants: [
        { label: 'NO', href: '/Ase-Sagebakken-CV.pdf', ariaLabel: 'CV på norsk (PDF)' },
        { label: 'EN', href: '/Ase-Sagebakken-CV-en.pdf', ariaLabel: 'CV in English (PDF)' },
      ],
    },
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
      'Digital plattform for planlegging (RigBridge) og utførelse (RigFlow) av brønnoperasjoner, som erstatter papirbaserte arbeidsprosesser. Brukes på over 70 riggoperasjoner verden over.',
    ],
    role: [
      'Frontend-utvikler i produktteam, i Vue 3 og TypeScript, med enkelte backend-oppgaver i C#/.NET og GraphQL. Leverer funksjoner helt til produksjon, med fokus på brukeropplevelse og kvalitet.',
    ],
    highlights: [
      'Utvikler report-backs og actual values på tvers av RigFlow og RigBridge, og ROV log',
      'Optimaliserer ytelsen i visninger med mye data',
      'Forbedrer tilgjengelighet og tar UX-avgjørelser i teamet',
      'Bygger gjenbrukbare komponenter i felles komponentbibliotek, dokumentert i Storybook',
      'Gjennomgår kode på tvers av teamene og løser supportsaker',
    ],
    tags: ['Vue 3', 'TypeScript', 'GraphQL', 'Storybook', 'C# / .NET'],
    links: [{ label: 'horizon56.io', href: 'https://horizon56.io/' }],
    cover: '/projects/horizon56/cover.webp',
    banner: '/projects/horizon56/banner.webp',
    coverOnPage: false,
    hue: 200,
    logos: [horizon56Brand],
  },
  {
    slug: 'echo',
    title: 'Equinor Echo',
    subtitle: 'Konsulent, systemutvikler · Bouvet Stavanger',
    period: '2022 – 2025',
    summary: 'Visuell digital tvilling for drift av Equinors plattformer.',
    description: [
      'Visuell digital tvilling av Equinors plattformer for søk og navigering i drifts- og prosjektdata. Brukt på over 50 anlegg onshore og offshore, på desktop, nettbrett og mobil.',
    ],
    role: [
      'Konsulent i Equinors Echo-team, i React og TypeScript. Jobbet tett med UX og backend.',
    ],
    highlights: [
      'Utviklet MVP-en av Global Selection, der brukeren samler tags og arbeidsordrer i én liste, integrert med plattformens 3D-modell',
      'Utviklet responsivt design og PWA for bruk i felt',
      'Bygde gjenbrukbare komponenter etter Equinor Design System (EDS)',
      'Hadde ansvar for release av Echo-CLI og integrering av teammoduler',
      'Hadde ansvar for sikkerhetsoppdateringer med Snyk i CI/CD, og skrev enhetstester med Jest',
    ],
    tags: ['React', 'TypeScript', 'NX', 'Zustand', 'TanStack Query', 'AG Grid', 'Jest', 'Storybook'],
    links: [
      {
        label: 'Intervju i Bouvet: New on deck',
        href: 'https://www.bouvet.no/bouvet-deler/innseiling/new-on-deck/ase',
      },
    ],
    cover: '/projects/echo/cover.webp',
    coverOnPage: false,
    images: [
      {
        src: '/projects/echo/bouvet-kontor.webp',
        alt: 'Åse smiler ved pulten på Bouvet-kontoret, med en bærbar PC og en skjerm med kode',
        caption: 'Fra intervjuet i Bouvet: New on deck',
      },
    ],
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
      { label: 'Bacheloroppgaven (PDF)', href: '/projects/uis-subsea/bacheloroppgave.pdf' },
      {
        label: 'Resultater fra MATE ROV 2022',
        href: 'https://20693798.fs1.hubspotusercontent-na1.net/hubfs/20693798/2022/2022_World_master_scoresheet_FINAL_EXPLORER.pdf',
      },
      { label: 'Kildekode på GitHub', href: 'https://github.com/VebjornRiiser/uis-subsea' },
    ],
    video: '/projects/uis-subsea/video.mp4',
    model: '/projects/uis-subsea/fenris.glb',
    coverOnPage: false,
    images: [
      {
        src: '/projects/uis-subsea/gui.webp',
        alt: 'Operatørgrensesnittet for ROV-en på en bærbar PC ved bassengkanten under testing',
        caption: 'Operatørgrensesnittet i bruk under test i bassenget',
      },
      {
        src: '/projects/uis-subsea/team.webp',
        alt: 'UiS Subsea-teamet i marineblå t-skjorter samlet rundt ROV-en Fenris og flyteren Frøya på en gressplen',
        caption: 'UiS Subsea-teamet med Fenris og flyteren Frøya under MATE ROV World Championship 2022',
      },
      {
        src: '/projects/uis-subsea/runde-to.webp',
        video: '/projects/uis-subsea/runde-to.mp4',
        alt: 'Video av Fenris under vann i konkurransebassenget og intervjuer med teamet',
        caption: 'Runde to i MATE ROV 2022, der et brudd i fiberkabelen kuttet kontakten med Fenris. Video: UiS Subsea',
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
      'Utvikler RigBridge og RigFlow i produktteam og leverer funksjoner helt til produksjon',
      'Tar UX-avgjørelser i teamet og samarbeider tett med UX, QA og produkteier',
      'Gjennomgår kode på tvers av teamene og løser supportsaker',
      'Bruker Claude Code aktivt og sikrer kvalitet med tester og kodegjennomgang',
    ],
    logo: horizon56Brand,
  },
  {
    title: 'Konsulent, systemutvikler',
    org: 'Bouvet',
    location: 'Stavanger',
    period: '2022 – 2025',
    points: [
      'Jobbet som frontend-utvikler for Equinor i Echo-teamet, i React og TypeScript',
      'Utviklet MVP-en av Global Selection og responsivt design for bruk i felt',
      'Hadde ansvar for release av Echo-CLI og sikkerhetsoppdateringer med Snyk',
      'Samarbeidet tett med UX og backend og deltok i estimering og planlegging i Scrum',
      'Gjennomgikk kode og bidro til teknisk dokumentasjon i README og på GitHub Pages',
    ],
    logo: bouvetBrand,
  },
]

export const skills = {
  daily: ['Vue.js', 'TypeScript', 'JavaScript', 'GraphQL', 'HTML / CSS / SCSS', 'Vite', 'Vitest', 'Storybook', 'Git', 'Azure DevOps', 'CI/CD', 'Claude Code'],
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
        src: '/interests/fotografering/17-lovinne-unger-lek.webp',
        width: 1000,
        height: 1500,
        thumb: '/interests/fotografering/17-lovinne-unger-lek-thumb.webp',
        alt: 'Løvinne som strekker seg mens ungene leker rundt henne',
        caption: 'Masai Mara, Kenya',
      },
      {
        src: '/interests/fotografering/05-akasie-solnedgang.webp',
        width: 1199,
        height: 1800,
        thumb: '/interests/fotografering/05-akasie-solnedgang-thumb.webp',
        alt: 'Akasietre i silhuett mot oransje solnedgang',
        caption: 'Masai Mara, Kenya',
      },
      {
        src: '/interests/fotografering/01-varanasi-soloppgang.webp',
        width: 1201,
        height: 1800,
        thumb: '/interests/fotografering/01-varanasi-soloppgang-thumb.webp',
        alt: 'Soloppgang over Ganges, sett fra ghatene med båter og bjeller',
        caption: 'Varanasi, India',
      },
      {
        src: '/interests/fotografering/fotograf-varanasi.webp',
        width: 1600,
        height: 1067,
        thumb: '/interests/fotografering/fotograf-varanasi-thumb.webp',
        alt: 'Åse fotograferer fra en båt på Ganges i Varanasi i skumringen',
        caption: 'Varanasi, India',
      },
      {
        src: '/interests/fotografering/03-fiskeorn.webp',
        width: 1031,
        height: 1800,
        thumb: '/interests/fotografering/03-fiskeorn-thumb.webp',
        alt: 'Afrikansk fiskeørn i flukt rett over vannflaten',
        caption: 'Lake Naivasha, Kenya',
      },
      {
        src: '/interests/fotografering/04-jente.webp',
        width: 1440,
        height: 1800,
        thumb: '/interests/fotografering/04-jente-thumb.webp',
        alt: 'Portrett av en jente i rød kjole foran en turkis vegg',
        caption: 'Bandhavgarh, India',
      },
      {
        src: '/interests/fotografering/06-marked-varanasi.webp',
        width: 1500,
        height: 1127,
        thumb: '/interests/fotografering/06-marked-varanasi-thumb.webp',
        alt: 'Bod med perlekjeder og messing, og en sadhu som går forbi',
        caption: 'Varanasi, India',
      },
      {
        src: '/interests/fotografering/07-elefanter.webp',
        width: 1800,
        height: 1199,
        thumb: '/interests/fotografering/07-elefanter-thumb.webp',
        alt: 'To elefanter i motlys på savannen',
        caption: 'Masai Mara, Kenya',
      },
      {
        src: '/interests/fotografering/08-barn.webp',
        width: 1199,
        height: 1800,
        thumb: '/interests/fotografering/08-barn-thumb.webp',
        alt: 'En gruppe barn som smiler og tuller foran en oransje vegg',
        caption: 'Bandhavgarh, India',
      },
      {
        src: '/interests/fotografering/09-gate-varanasi.webp',
        width: 1500,
        height: 1202,
        thumb: '/interests/fotografering/09-gate-varanasi-thumb.webp',
        alt: 'Ku som krysser gaten i morgenlyset',
        caption: 'Varanasi, India',
      },
      {
        src: '/interests/fotografering/10-lovinne-lek.webp',
        width: 1800,
        height: 1199,
        thumb: '/interests/fotografering/10-lovinne-lek-thumb.webp',
        alt: 'Løvinne som leker med en unge',
        caption: 'Masai Mara, Kenya',
      },
      {
        src: '/interests/fotografering/11-mor-og-barn.webp',
        width: 1199,
        height: 1800,
        thumb: '/interests/fotografering/11-mor-og-barn-thumb.webp',
        alt: 'Kvinne som klemmer et barn foran en turkis vegg',
        caption: 'Bandhavgarh, India',
      },
      {
        src: '/interests/fotografering/13-tiger.webp',
        width: 1275,
        height: 1670,
        thumb: '/interests/fotografering/13-tiger-thumb.webp',
        alt: 'Tiger som hviler på en skogsvei dekket av tørre blader',
        caption: 'Kanha, India',
      },
      {
        src: '/interests/fotografering/14-esel.webp',
        width: 1800,
        height: 1200,
        thumb: '/interests/fotografering/14-esel-thumb.webp',
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
