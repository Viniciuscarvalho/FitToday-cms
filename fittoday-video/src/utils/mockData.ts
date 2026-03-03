// Dados mock em Portugues (BR) para todas as cenas

export const trainerProfile = {
  name: "Carlos Silva",
  plan: "Pro" as const,
  specialties: ["Musculacao", "Funcional", "HIIT"],
  activeStudents: 24,
  totalStudents: 30,
  monthlyRevenue: 8750,
  rating: 4.8,
  bio: "Personal trainer com 8 anos de experiencia em musculacao e treinamento funcional",
  city: "Sao Paulo",
  state: "SP",
  instagram: "@carlossilvapt",
};

export const mockStudents = [
  {
    name: "Maria Silva",
    email: "maria@email.com",
    program: "Forca Total",
    status: "active" as const,
    progress: 73,
    joinDate: "15 Jan 2026",
    phone: "(11) 99123-4567",
  },
  {
    name: "Joao Santos",
    email: "joao@email.com",
    program: "HIIT Avancado",
    status: "active" as const,
    progress: 45,
    joinDate: "03 Fev 2026",
    phone: "(11) 98765-4321",
  },
  {
    name: "Ana Costa",
    email: "ana@email.com",
    program: "Funcional 360",
    status: "active" as const,
    progress: 88,
    joinDate: "20 Dez 2025",
    phone: "(21) 97654-3210",
  },
  {
    name: "Pedro Oliveira",
    email: "pedro@email.com",
    program: "Forca Total",
    status: "past_due" as const,
    progress: 32,
    joinDate: "10 Nov 2025",
    phone: "(31) 96543-2109",
  },
  {
    name: "Carla Souza",
    email: "carla@email.com",
    program: "Yoga Flex",
    status: "active" as const,
    progress: 61,
    joinDate: "05 Jan 2026",
    phone: "(11) 95432-1098",
  },
];

export const mockPrograms = [
  {
    title: "Forca Total",
    status: "published" as const,
    weeks: 8,
    daysPerWeek: 4,
    students: 12,
    price: 149.9,
    rating: 4.8,
    category: "Musculacao",
    difficulty: "Intermediario",
  },
  {
    title: "HIIT Avancado",
    status: "published" as const,
    weeks: 6,
    daysPerWeek: 3,
    students: 8,
    price: 119.9,
    rating: 4.6,
    category: "HIIT",
    difficulty: "Avancado",
  },
  {
    title: "Funcional 360",
    status: "draft" as const,
    weeks: 12,
    daysPerWeek: 5,
    students: 0,
    price: 179.9,
    rating: 0,
    category: "Funcional",
    difficulty: "Intermediario",
  },
  {
    title: "Yoga Flex",
    status: "published" as const,
    weeks: 4,
    daysPerWeek: 3,
    students: 5,
    price: 89.9,
    rating: 4.9,
    category: "Yoga",
    difficulty: "Iniciante",
  },
  {
    title: "Cardio Intenso",
    status: "published" as const,
    weeks: 8,
    daysPerWeek: 4,
    students: 15,
    price: 129.9,
    rating: 4.5,
    category: "Cardio",
    difficulty: "Intermediario",
  },
  {
    title: "Emagrecimento",
    status: "archived" as const,
    weeks: 10,
    daysPerWeek: 5,
    students: 3,
    price: 199.9,
    rating: 4.2,
    category: "Emagrecimento",
    difficulty: "Iniciante",
  },
];

export const mockRevenueByMonth = [
  { month: "Set", revenue: 3200 },
  { month: "Out", revenue: 4100 },
  { month: "Nov", revenue: 5800 },
  { month: "Dez", revenue: 4900 },
  { month: "Jan", revenue: 6200 },
  { month: "Fev", revenue: 8750 },
];

export const mockStudentEvolution = [
  { month: "Set", novos: 3, cancelados: 1 },
  { month: "Out", novos: 5, cancelados: 0 },
  { month: "Nov", novos: 4, cancelados: 2 },
  { month: "Dez", novos: 6, cancelados: 1 },
  { month: "Jan", novos: 8, cancelados: 1 },
  { month: "Fev", novos: 7, cancelados: 2 },
];

export const mockMessages = [
  {
    sender: "student" as const,
    name: "Maria Silva",
    content: "Oi professor, fiz o treino de hoje!",
    time: "14:32",
  },
  {
    sender: "trainer" as const,
    name: "Carlos Silva",
    content:
      "Otimo trabalho Maria! Amanha vamos aumentar a carga no supino.",
    time: "14:35",
  },
  {
    sender: "student" as const,
    name: "Maria Silva",
    content: "Combinado! Estou sentindo que ja aguento mais peso mesmo",
    time: "14:36",
  },
];

export const mockConversations = [
  {
    name: "Maria Silva",
    lastMessage: "Combinado!",
    time: "14:36",
    unread: 0,
    pinned: true,
  },
  {
    name: "Joao Santos",
    lastMessage: "Posso trocar o treino de quarta?",
    time: "13:20",
    unread: 1,
    pinned: false,
  },
  {
    name: "Ana Costa",
    lastMessage: "Mandei as fotos do check-in",
    time: "11:45",
    unread: 2,
    pinned: false,
  },
  {
    name: "Carla Souza",
    lastMessage: "Obrigada professor!",
    time: "Ontem",
    unread: 0,
    pinned: false,
  },
];

export const mockTransactions = [
  {
    type: "sale" as const,
    description: "Assinatura Forca Total",
    student: "Maria Silva",
    amount: 149.9,
    status: "completed" as const,
    date: "28 Fev",
  },
  {
    type: "sale" as const,
    description: "Assinatura HIIT Avancado",
    student: "Joao Santos",
    amount: 119.9,
    status: "completed" as const,
    date: "27 Fev",
  },
  {
    type: "payout" as const,
    description: "Saque automatico",
    student: "",
    amount: 2850.0,
    status: "completed" as const,
    date: "25 Fev",
  },
  {
    type: "sale" as const,
    description: "Assinatura Funcional 360",
    student: "Ana Costa",
    amount: 179.9,
    status: "pending" as const,
    date: "24 Fev",
  },
  {
    type: "refund" as const,
    description: "Reembolso parcial",
    student: "Pedro Oliveira",
    amount: -74.95,
    status: "completed" as const,
    date: "20 Fev",
  },
];

export const mockTopPrograms = [
  {
    rank: 1,
    name: "Cardio Intenso",
    students: 15,
    revenue: 1948.5,
    rating: 4.5,
  },
  {
    rank: 2,
    name: "Forca Total",
    students: 12,
    revenue: 1798.8,
    rating: 4.8,
  },
  {
    rank: 3,
    name: "HIIT Avancado",
    students: 8,
    revenue: 959.2,
    rating: 4.6,
  },
  {
    rank: 4,
    name: "Yoga Flex",
    students: 5,
    revenue: 449.5,
    rating: 4.9,
  },
  {
    rank: 5,
    name: "Emagrecimento",
    students: 3,
    revenue: 599.7,
    rating: 4.2,
  },
];

export const mockDashboardStats = {
  activeStudents: { value: 24, total: 30 },
  activePrograms: { value: 8 },
  monthlyRevenue: { value: 4850, change: 12.5 },
  averageRating: { value: 4.8 },
};

export const mockRecentActivity = [
  {
    icon: "dollar" as const,
    text: "Maria Silva - pagamento confirmado",
    detail: "R$ 149,90",
    time: "2 min atras",
  },
  {
    icon: "check" as const,
    text: "Joao Santos completou o Treino A",
    detail: "Semana 3 - Dia 2",
    time: "15 min atras",
  },
  {
    icon: "star" as const,
    text: "Ana Costa - nova avaliacao registrada",
    detail: "4.9 estrelas",
    time: "1 hora atras",
  },
];

// Exercicios para o wizard de treinos
export const mockExercises = [
  { name: "Supino Reto", sets: 4, reps: 12, rest: "90s" },
  { name: "Desenvolvimento", sets: 3, reps: 10, rest: "60s" },
  { name: "Remada Curvada", sets: 4, reps: 10, rest: "90s" },
  { name: "Rosca Direta", sets: 3, reps: 12, rest: "60s" },
  { name: "Triceps Corda", sets: 3, reps: 15, rest: "45s" },
];

// Planos para a cena de pricing
export const plans = [
  {
    name: "Starter",
    price: "Gratis",
    features: [
      "Ate 5 alunos",
      "Ate 3 programas",
      "Analytics basico",
      "10% comissao",
    ],
    highlighted: false,
  },
  {
    name: "Pro",
    price: "R$ 97/mes",
    features: [
      "Alunos ilimitados",
      "Programas ilimitados",
      "Analytics avancado",
      "5% comissao",
    ],
    highlighted: true,
  },
  {
    name: "Elite",
    price: "R$ 197/mes",
    features: [
      "Tudo do Pro",
      "Chat em tempo real",
      "White-label",
      "0% comissao",
      "Suporte prioritario",
    ],
    highlighted: false,
  },
];

// Especialidades para settings
export const specialties = [
  "Musculacao",
  "Crossfit",
  "Funcional",
  "Pilates",
  "Yoga",
  "Cardio",
  "HIIT",
  "Reabilitacao",
  "Emagrecimento",
  "Hipertrofia",
  "Powerlifting",
  "Calistenia",
];

// Itens do sidebar
export const sidebarItems = [
  { label: "Dashboard", icon: "home" },
  { label: "Treinos", icon: "dumbbell" },
  { label: "Alunos", icon: "users" },
  { label: "Mensagens", icon: "message", elite: true },
  { label: "Analytics", icon: "chart" },
  { label: "Financeiro", icon: "wallet" },
  { label: "Configuracoes", icon: "settings" },
] as const;

// Formatacao de moeda BRL
export const formatBRL = (value: number): string => {
  return `R$ ${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};
