import type { Dictionary } from "./en";

const es: Dictionary = {
  // ─── Nav ───────────────────────────────────────
  nav: {
    home: "Inicio",
    services: "Servicios",
    pricing: "Precios",
    about: "Nosotros",
    news: "Noticias",
    contact: "Contacto",
    signIn: "Iniciar Sesi\u00f3n",
    getStarted: "Empezar",
  },

  // ─── Home ──────────────────────────────────────
  home: {
    heroTitle: "Personas reales. Apoyo real.",
    heroTitleHighlight: "Más tiempo para crecer.",
    heroDesc:
      "Creeda Virtual Assistants te da a tu negocio un asistente humano dedicado que se encarga del trabajo diario —correo, agenda, clientes y administración— para que tus horas se dediquen a lo que solo tú puedes hacer.",
    heroCtaPrimary: "Empezar",
    heroCtaSecondary: "Ver servicios",
    heroProof: ["100% humano", "Inglés y español", "Hecho a la medida de tu negocio"],
    heroSectorsLabel: "Hecho para equipos de",
    heroSectors:
      "Bienes raíces · Legal · Seguros · Comercio electrónico · Servicios profesionales",
    heroVisual: {
      windowLabel: "hoy.creedava.com",
      assistantName: "María",
      assistantRole: "Asistente Ejecutiva",
      status: "En línea",
      queueTitle: "Cola de hoy",
      tasks: [
        "Correo clasificado — 47 mensajes",
        "Agenda confirmada para el jueves",
        "Registros del CRM actualizados",
        "Resumen semanal listo para enviar",
      ],
      queueFooter: "12 tareas completadas esta semana",
      inboxTitle: "Correo",
      inboxValue: "0 sin leer",
      calendarMonth: "Marzo",
      calendarDate: "Jue · 2:30 PM",
      calendarDetail: "Consulta reservada",
    },
    stats: {
      flatFee: "Tarifa Mensual Fija",
      supportPlans: "Planes de Soporte",
      availability: "Soporte Bilingüe",
      onboardingDays: "Días de Incorporación",
    },
    statsEyebrow: "En cifras",
    statsTitle: "Un equipo pequeño que sí puedes costear.",
    statsLede:
      "Sin salarios, sin beneficios, sin equipo. Elige las horas que necesitas y ajústalas según crezca el trabajo.",
    howItWorks: "Cómo Funciona",
    howItWorksDesc:
      "Comienza con tu asistente virtual dedicado en pocos pasos. La mayoría de los clientes están completamente operativos en 5 a 7 días hábiles.",
    processEyebrow: "Cómo funciona",
    steps: [
      {
        title: "Consulta Gratuita",
        desc: "Agenda una llamada de descubrimiento para discutir tus necesidades, objetivos y el tipo de apoyo que más beneficiaría a tu negocio.",
      },
      {
        title: "Emparejamiento Perfecto",
        desc: "Te emparejamos cuidadosamente con un asistente virtual cuyas habilidades, experiencia y personalidad se alinean con tus requisitos.",
      },
      {
        title: "Comienza a Crecer",
        desc: "Tu AV comienza a trabajar de inmediato. Proporcionamos soporte de incorporación y gestión continua para asegurar el éxito.",
      },
    ],
    compareEyebrow: "La comparación honesta",
    compareTitle: "Tres formas de sacar el trabajo adelante.",
    compareLede:
      "Aquí no hay magia. La diferencia está en quién hace el trabajo, cuánto cuesta y qué tan rápido empieza.",
    compareBadge: "Empieza aquí",
    compareResultLabel: "Resultado:",
    compareColumns: [
      {
        label: "Hacerlo tú mismo",
        points: [
          "Tus propias horas marcan el límite de lo que el negocio puede asumir",
          "Nada queda documentado, así que nada se puede delegar después",
          "Cada tarea nueva compite con el trabajo que genera ingresos",
        ],
        result: "tu agenda decide cuánto puedes crecer.",
      },
      {
        label: "Contratar internamente",
        points: [
          "Salario, beneficios, equipo y espacio de oficina",
          "Impuestos patronales, declaraciones W-2 y 1099, seguro laboral",
          "Reclutar y capacitar toma semanas antes de ver resultados",
          "Una persona cubre un conjunto de habilidades, en horario fijo",
        ],
        result: "una carga laboral completa, no solo un salario.",
      },
      {
        label: "Trabajar con Creeda",
        points: [
          "Un asistente bilingüe dedicado, asignado a tus necesidades",
          "Una tarifa mensual fija — sin nómina, impuestos ni trámites de beneficios",
          "Incorporado y trabajando en 5–7 días hábiles",
          "NDA y flujos documentados desde el primer día",
        ],
        result: "apoyo y un equipo que puedes costear.",
      },
    ],
    dayEyebrow: "Un día con tu asistente",
    dayTitle: "De 8:00 a 5:00. Tú no estás en nada de eso.",
    dayLede:
      "Así se ve un día normal cuando la entrega ya está hecha. Tu asistente trabaja tu cola, tus herramientas y tus estándares —y te envía un resumen al final.",
    dayPoints: [
      "El trabajo llega a tu correo ya clasificado y priorizado",
      "Las tareas recurrentes corren según un calendario que apruebas",
      "Revisas resultados, no procesos",
    ],
    dayTimelineLabel: "Martes",
    dayTimelineBadge: "Día de ejemplo",
    dayTimeline: [
      { time: "08:05", task: "Correo clasificado, cuatro respuestas redactadas", tag: "Admin" },
      { time: "09:20", task: "Tres reuniones confirmadas, una reprogramada", tag: "Agenda" },
      { time: "11:40", task: "CRM actualizado con nuevos prospectos", tag: "Datos" },
      { time: "14:00", task: "Informe semanal enviado al equipo", tag: "Reportes" },
      { time: "16:30", task: "Seguimientos programados para mañana", tag: "Clientes" },
    ],
    humanEyebrow: "Personas reales, no software",
    humanTitle: "La tecnología ayuda a avanzar. Las personas marcan la diferencia.",
    humanLede:
      "Creeda no es un chatbot ni una plantilla. Tienes un asistente humano con nombre que aprende tu negocio, trabaja en tus herramientas y responde por el resultado.",
    humanPoints: [
      "Asistentes verificados y profesionalmente bilingües, no trabajadores anónimos",
      "Capacitados en tus flujos, tu tono y tus herramientas antes de la primera tarea",
      "Respaldados por un equipo, para que la cobertura no desaparezca cuando alguien descansa",
    ],
    humanChatLabel: "creedava · mensajes",
    humanChatStatus: "En línea ahora",
    humanChatFooter: "Tarea completada y registrada",
    humanChat: [
      { from: "client", text: "¿Puedes mover mi cita de las 2:30 y enviar la invitación actualizada?" },
      {
        from: "assistant",
        text: "Listo: la moví al jueves a las 10:00. Invitación enviada a los dos invitados.",
      },
      { from: "client", text: "Perfecto, gracias." },
    ],
    handoffEyebrow: "Empieza por algo",
    handoffTitle: "¿Qué delegarías primero?",
    handoffLede:
      "Elige las tareas que te consumen la semana. No se envía nada a ninguna parte hasta que decidas hablar con nosotros.",
    handoffTasks: [
      "Cobro de pagos atrasados",
      "Seguimiento de prospectos",
      "Atención telefónica",
      "Gestión del correo",
      "Agenda y citas",
      "Recordatorios de citas",
      "Respuestas a clientes",
      "Datos y CRM",
      "Notas y seguimiento de reuniones",
      "Facturas y gastos",
    ],
    handoffEmpty: "Selecciona las tareas que delegarías primero.",
    handoffSelectedSuffix: "tareas recurrentes listas para delegar",
    handoffSelectedSuffixOne: "tarea recurrente lista para delegar",
    handoffClear: "Limpiar",
    handoffCta: "Conversemos",
    faqEyebrow: "Preguntas",
    faqTitle: "Lo que la gente pregunta antes de empezar.",
    faqLede:
      "Si falta algo, pregúntanos directamente: respondemos todas las consultas en 24 horas.",
    finalEyebrow: "Siguiente paso",
    finalTitle: "¿Listo para avanzar más sin hacerlo todo tú mismo?",
    finalLede:
      "Agenda una consulta gratuita. Cuéntanos qué te está frenando y te diremos con honestidad si un asistente virtual es la solución correcta.",
    finalPrimary: "Agendar consulta",
    finalSecondary: "Ver paquetes",
    finalTrust: [
      "Consulta gratuita de 30 minutos",
      "Respuesta en 24 horas",
      "Soporte en inglés y español",
    ],
  },

  // ─── Services ──────────────────────────────────
  services: {
    directoryTitle: "Una mirada de cerca a lo que hacemos.",
    directoryDesc:
      "Cada servicio por separado: qu\u00e9 cubre, por qu\u00e9 ayuda y c\u00f3mo se ve el trabajo. L\u00e9elo completo o ve directo al que necesitas.",
    detailIncludes: "Lo que cubre",
    detailWhy: "Por qu\u00e9 importa",
    detailStart: "Empezar por este",
    detailMockupNote: "Una ilustraci\u00f3n del trabajo, no una captura real.",
    mockup: {
      inbox: {
        label: "Bandeja de entrada",
        search: "Buscar correo",
        from: ["Marisol R.", "A. Grant", "D. Osei", "Priya N."],
        subject: [
          "Re: factura de marzo del proveedor",
          "Renovaci\u00f3n de contrato \u2014 firma",
          "Fechas de viaje confirmadas",
          "Informe Q2, primer borrador",
        ],
        replied: "Respondido",
        caption: "Nada pendiente en la bandeja",
      },
      calendar: {
        label: "Esta semana",
        days: ["L", "M", "X", "J", "V"],
        events: [
          { time: "09:00", title: "Comit\u00e9 directivo" },
          { time: "11:30", title: "1:1 con operaciones" },
          { time: "14:00", title: "Llamada con inversores" },
          { time: "Todo el d\u00eda", title: "Vuelo a Atlanta" },
        ],
        caption: "Plazos y reuniones en un solo calendario",
      },
      hiring: {
        label: "Vacante abierta",
        live: "Activa",
        role: "Coordinador de Operaciones",
        meta: "Remoto \u00b7 Tiempo completo",
        stages: ["Postulados", "Filtro", "Entrevista"],
        counts: ["24", "8", "3"],
        caption: "Preselecci\u00f3n lista para entrevista",
      },
      documents: {
        label: "Documentos",
        matter: "Expediente 2026-014",
        files: [
          "Moci\u00f3n de requerimiento",
          "Anexo A \u2014 Bates 001-148",
          "Carta de contrataci\u00f3n",
          "Ficha de admisi\u00f3n del cliente",
        ],
        stamp: "Archivado",
        caption: "Archivado antes del plazo",
      },
      conversation: {
        label: "Conversaci\u00f3n",
        customer: "Cliente",
        agent: "Asistente",
        message: [
          "Mi pedido deb\u00eda llegar el lunes y nadie me ha respondido.",
          "Disculpa la espera: el mensajero lo entrega hoy. Ya te devolv\u00ed el costo de env\u00edo.",
        ],
        typing: "escribiendo",
        resolved: "Resuelto",
      },
      published: {
        label: "Publicado",
        posts: [
          "Nueva temporada, nuevo men\u00fa.",
          "As\u00ed se ve el estudio por dentro.",
          "Puertas abiertas el s\u00e1bado \u2014 ven.",
        ],
        caption: "Programado y publicado en horas",
      },
      report: {
        label: "Informe",
        title: "Rendimiento por canal \u2014 Q2",
        findings: [
          "La b\u00fasqueda org\u00e1nica trae la mayor\u00eda de los registros",
          "La baja se concentra en el segundo mes",
          "Dos segmentos explican casi todos los ingresos",
        ],
        caption: "Hallazgos, no datos crudos",
      },
      invoices: {
        label: "Facturas",
        outstanding: "Pendiente",
        paidThisMonth: "Pagado este mes",
        rows: [
          { id: "INV-1042", client: "Acme Ltd", amount: "$2,400", paid: true },
          { id: "INV-1039", client: "Northwind", amount: "$1,150", paid: true },
          { id: "INV-1045", client: "Bell & Co", amount: "$3,600", paid: false },
        ],
        paid: "Pagada",
        overdue: "Vencida",
        caption: "Facturas cobradas",
      },
      draft: {
        label: "Borrador",
        title: "Cinco formas de recortar el trabajo administrativo",
        body: "La mayor\u00eda de los due\u00f1os pierde la semana en las mismas tres tareas. Aqu\u00ed est\u00e1 por d\u00f3nde empezar.",
        publish: "Publicar",
        caption: "Escrito, formateado y listo",
      },
      listing: {
        label: "Propiedad",
        address: "18 Harbour View, Unidad 4",
        price: "$325,000",
        meta: "3 hab \u00b7 2 ba\u00f1os",
        badge: "En contrato",
        caption: "Open house agendado",
      },
      claim: {
        label: "Reclamo",
        id: "Reclamo #4471",
        policy: "P\u00f3liza HO-88213",
        badge: "Reclamo presentado",
        files: [
          "Fotos de da\u00f1os",
          "Presupuesto de reparaci\u00f3n",
          "Declaraci\u00f3n de p\u00f3liza",
          "Declaraci\u00f3n firmada",
        ],
        caption: "Documentos adjuntos, nada pendiente",
      },
      process: {
        label: "Proceso",
        steps: [
          "Ingreso de cliente nuevo",
          "Llamada inicial y notas",
          "Entrega al equipo",
        ],
        caption: "Escrito y repetible",
      },
    },
    detailPricingLink: "Ver cu\u00e1nto cuesta",
    detail: {
      administrative: {
        headline: "Tu correo, tu calendario y el papeleo, resueltos antes de que lleguen a ti.",
        why: [
          "Un asistente que aprende tus prioridades, no una cola compartida",
          "Trabaja en las herramientas que ya usas, sin sistemas nuevos",
          "Hace las mismas tareas en ingl\u00e9s y en espa\u00f1ol",
        ],
      },
      executive: {
        headline: "Apoyo s\u00e9nior que protege tu calendario y prepara tus reuniones.",
        why: [
          "Filtra lo que llega a ti, para que el d\u00eda no lo marque el \u00faltimo correo",
          "Tiene el resumen listo antes de que empiece la reuni\u00f3n, no despu\u00e9s",
          "Trata el material de junta e inversores con discreci\u00f3n",
        ],
      },
      "hr-recruiting": {
        headline: "Vacantes publicadas, candidatos filtrados y papeleo de ingreso resuelto.",
        why: [
          "Una contrataci\u00f3n avanza sin llevarse tu atenci\u00f3n con ella",
          "Cada candidato recibe respuesta en lugar de silencio",
          "Los expedientes quedan al d\u00eda para cumplimiento, sin d\u00edas de recuperaci\u00f3n",
        ],
      },
      legal: {
        headline: "Archivos organizados, plazos controlados y documentos listos para revisi\u00f3n.",
        why: [
          "El trabajo administrativo sigue siendo administrativo; el tiempo del abogado va a la ley",
          "Cada plazo vive en un calendario, no en tres",
          "Indexaci\u00f3n y numeraci\u00f3n Bates con un est\u00e1ndar, no sobre la marcha",
        ],
      },
      customer: {
        headline: "Cada llamada, chat y ticket respondido antes de que el cliente pregunte dos veces.",
        why: [
          "Cobertura de una persona en tu horario, no un bucle de bot",
          "Las escalaciones llegan con el contexto ya adjunto",
          "Los clientes en ingl\u00e9s y espa\u00f1ol reciben el mismo nivel de servicio",
        ],
      },
      social: {
        headline: "Publicaciones programadas, comentarios respondidos y resultados reportados.",
        why: [
          "El contenido se produce dentro de tus horas mensuales, no se cobra por publicaci\u00f3n",
          "Una persona es due\u00f1a del calendario de principio a fin, sin cabos sueltos",
          "Ves qu\u00e9 se public\u00f3 y qu\u00e9 resultado dio",
        ],
      },
      data: {
        headline: "Registros limpios y respuestas claras, listos para decidir.",
        why: [
          "Las listas se construyen y se depuran, no se raspan y se vuelcan",
          "El CRM se mantiene al d\u00eda como h\u00e1bito, no como limpieza trimestral",
          "La investigaci\u00f3n llega resumida y con las fuentes guardadas",
        ],
      },
      bookkeeping: {
        headline: "Cuentas al d\u00eda y papeleo listo, cada mes.",
        why: [
          "Las facturas salen y se reclaman con calendario, no cuando hay tiempo",
          "La conciliaci\u00f3n termina antes de que tu contador la pida",
          "Los documentos se entregan en el formato que de verdad necesitan",
        ],
      },
      web: {
        headline: "Sitio web y email marketing al d\u00eda.",
        why: [
          "Publicar deja de esperar a quien tenga una hora libre",
          "El SEO se vigila y se reporta, no se da por hecho",
          "Las landing pages y los formularios se montan y se prueban, no quedan a medias",
        ],
      },
      "real-estate": {
        headline: "Propiedades publicadas, leads atendidos y transacciones en marcha.",
        why: [
          "Las consultas nuevas se responden el mismo d\u00eda, mientras el inter\u00e9s est\u00e1 caliente",
          "Las entradas MLS se mantienen exactas, sin listados mal puestos",
          "El papeleo de la transacci\u00f3n se sigue hasta el cierre",
        ],
      },
      insurance: {
        headline: "P\u00f3lizas registradas, certificados emitidos y renovaciones controladas.",
        why: [
          "Los certificados salen el mismo d\u00eda en que se piden",
          "Las renovaciones aparecen antes de vencer, no despu\u00e9s",
          "Los archivos de cumplimiento quedan completos para auditor\u00eda",
        ],
      },
      "workflow-optimization": {
        headline: "Tus procesos por escrito, para poder delegar.",
        why: [
          "Una p\u00e1gina que una persona nueva puede seguir sin preguntarte",
          "Las herramientas se configuran y se prueban, no solo se recomiendan",
          "Los manuales de delegaci\u00f3n se quedan contigo, pase lo que pase",
        ],
      },
    },
    industriesEyebrow: "Nuestros servicios",
    industriesTitle: "Dise\u00f1ado para tu sector,",
    industriesTitleHighlight: "no una lista gen\u00e9rica.",
    industriesDesc:
      "Casi todo lo que necesita un negocio es igual en todas partes. El vocabulario, los tr\u00e1mites y los plazos no lo son. Elige tu sector y ve directo al trabajo que encaja contigo.",
    industries: [
      {
        title: "Agencias y marketing",
        desc: "Estudios y equipos de marketing que manejan varios canales a la vez.",
      },
      {
        title: "Peque\u00f1os negocios",
        desc: "Negocios dirigidos por su due\u00f1o, donde la misma persona contesta el tel\u00e9fono, env\u00eda la factura y hace el trabajo.",
      },
      {
        title: "Recursos Humanos",
        desc: "Equipos que contratan por tandas y necesitan publicaciones, filtrado y papeleo de ingreso en movimiento.",
      },
      {
        title: "Seguros",
        desc: "Corredores y agencias donde la entrada de p\u00f3lizas, los certificados y las renovaciones no pueden fallar.",
      },
      {
        title: "Bienes ra\u00edces",
        desc: "Agentes y equipos peque\u00f1os con listings, prospectos y transacciones que mantener en marcha.",
      },
      {
        title: "Despachos legales",
        desc: "Bufetes peque\u00f1os que necesitan el archivo, el calendario de plazos y los documentos al d\u00eda.",
      },
    ],
    groupIndustryTitle: "Servicios por industria",
    groupIndustryDesc:
      "Apoyo espec\u00edfico del sector, con el vocabulario y las costumbres de archivo ya incorporados.",
    groupFunctionTitle: "Servicios por funci\u00f3n",
    groupFunctionDesc: "El trabajo del d\u00eda a d\u00eda, sea cual sea tu negocio.",
    categories: [
      {
        title: "Soporte Administrativo",
        desc: "Nos encargamos de la administraci\u00f3n diaria \u2014 correo, calendario, documentos y entrada de datos \u2014 para que nada se escape y tu semana quede libre.",
        features: [
          "Gesti\u00f3n de correo y bandeja de entrada",
          "Calendario y programaci\u00f3n de citas",
          "Entrada de datos y actualizaci\u00f3n de CRM",
          "Preparaci\u00f3n y formato de documentos",
          "Reserva de viajes e itinerarios",
          "Organizaci\u00f3n de archivos y almacenamiento en la nube",
        ],
      },
      {
        title: "Soporte Ejecutivo y para Alta Direcci\u00f3n",
        desc: "Un asistente de nivel s\u00e9nior para fundadores y ejecutivos: tu correo filtrado, tu calendario protegido y tus reuniones preparadas.",
        features: [
          "Triaje de correo y filtrado de prioridades",
          "Coordinaci\u00f3n de calendario complejo y reuniones",
          "Preparaci\u00f3n de reuniones de junta e inversores",
          "Planificaci\u00f3n de viajes e itinerarios",
          "Informes de gastos y seguimiento de recibos",
          "Manejo de documentos confidenciales",
        ],
      },
      {
        title: "Soporte de RR. HH. y Reclutamiento",
        desc: "Cubre vacantes m\u00e1s r\u00e1pido y mant\u00e9n la administraci\u00f3n del personal al d\u00eda: b\u00fasqueda, entrevistas e incorporaci\u00f3n de principio a fin.",
        features: [
          "Publicaci\u00f3n de vacantes y b\u00fasqueda de candidatos",
          "Filtrado y preselecci\u00f3n de curr\u00edculos",
          "Programaci\u00f3n y coordinaci\u00f3n de entrevistas",
          "Cartas de oferta y tr\u00e1mites de incorporaci\u00f3n",
          "Soporte en inscripci\u00f3n de beneficios",
          "Expedientes de empleados y archivos de cumplimiento",
        ],
      },
      {
        title: "Soporte Administrativo Legal",
        desc: "Apoyo administrativo para despachos peque\u00f1os: archivos organizados, plazos controlados y documentos listos para revisi\u00f3n del abogado.",
        features: [
          "Recepci\u00f3n de clientes y datos de conflicto",
          "Armado y formato de documentos",
          "Indexaci\u00f3n de descubrimiento y numeraci\u00f3n Bates",
          "Gesti\u00f3n de expedientes y calendario de plazos",
          "Preparaci\u00f3n de presentaciones y log\u00edstica judicial",
          "Registro de horas y soporte de facturaci\u00f3n",
        ],
      },
      {
        title: "Servicio al Cliente",
        desc: "Responde cada llamada, chat y ticket \u2014 y mant\u00e9n informados a tus clientes antes de que tengan que preguntar.",
        features: [
          "Respuesta por correo y tickets de soporte",
          "Cobertura de chat en vivo y tel\u00e9fono",
          "Estado de pedidos y soporte de devoluciones",
          "Resoluci\u00f3n de quejas y escalamiento",
          "Soporte de citas y reservas",
          "Seguimiento de satisfacci\u00f3n del cliente",
        ],
      },
      {
        title: "Gesti\u00f3n de Redes Sociales",
        desc: "Mant\u00e9n presencia constante en las plataformas que importan: publicaciones programadas, comentarios respondidos y resultados reportados.",
        features: [
          "Calendario de contenido y programaci\u00f3n",
          "Respuesta a comentarios y mensajes",
          "Moderaci\u00f3n de la comunidad",
          "Coordinaci\u00f3n de campa\u00f1as publicitarias",
          "Informes mensuales de rendimiento",
          "Alcance con influencers y alianzas",
        ],
      },
      {
        title: "Datos e Investigaci\u00f3n",
        desc: "Obt\u00e9n datos limpios y respuestas claras: listas de leads creadas, registros depurados e investigaci\u00f3n resumida para decidir.",
        features: [
          "Creaci\u00f3n y enriquecimiento de listas de leads",
          "Entrada, depuraci\u00f3n y validaci\u00f3n de datos",
          "Mantenimiento y actualizaci\u00f3n de CRM",
          "Investigaci\u00f3n de mercado y competencia",
          "Preparaci\u00f3n de informes y tableros",
          "Monitoreo continuo de la industria",
        ],
      },
      {
        title: "Contabilidad",
        desc: "Mant\u00e9n las cuentas al d\u00eda y el papeleo listo: facturaci\u00f3n, gastos y conciliaci\u00f3n resueltos cada mes.",
        features: [
          "Emisi\u00f3n de facturas y seguimiento de cobros",
          "Registro de gastos y captura de recibos",
          "Conciliaci\u00f3n bancaria y de tarjetas",
          "Soporte de cuentas por pagar",
          "Preparaci\u00f3n de informes financieros mensuales",
          "Documentos listos para tu contador",
        ],
      },
      {
        title: "Soporte Web y Digital",
        desc: "Mant\u00e9n tu sitio web y tu email marketing al d\u00eda: contenido actualizado, campa\u00f1as creadas y SEO monitoreado.",
        features: [
          "Actualizaci\u00f3n de contenido y gestor (CMS)",
          "Publicaci\u00f3n y formato de blogs",
          "Creaci\u00f3n de boletines por correo",
          "Monitoreo e informes de SEO",
          "Configuraci\u00f3n de landing pages y formularios",
          "Actualizaci\u00f3n de Google Business Profile",
        ],
      },
      {
        title: "Asistente Virtual de Bienes Ra\u00edces",
        desc: "Apoyo para agentes y equipos peque\u00f1os: propiedades publicadas, leads atendidos y transacciones en movimiento.",
        features: [
          "Creaci\u00f3n y coordinaci\u00f3n de listados",
          "Seguimiento y calificaci\u00f3n de leads",
          "Entrada de datos y actualizaciones MLS",
          "Coordinaci\u00f3n de transacciones",
          "Programaci\u00f3n y promoci\u00f3n de open house",
          "Comunicaci\u00f3n y seguimiento de clientes",
        ],
      },
      {
        title: "Procesamiento de Seguros",
        desc: "Apoyo administrativo para equipos de seguros: p\u00f3lizas registradas, certificados emitidos y renovaciones al d\u00eda.",
        features: [
          "Entrada y actualizaci\u00f3n de datos de p\u00f3lizas",
          "Emisi\u00f3n de certificados de seguro",
          "Documentaci\u00f3n y seguimiento de reclamos",
          "Seguimiento de renovaciones y recordatorios",
          "Comunicaci\u00f3n y soporte al cliente",
          "Mantenimiento de archivos de cumplimiento",
        ],
      },
      {
        title: "Optimizaci\u00f3n de Procesos y Flujos de Trabajo",
        desc: "Documenta c\u00f3mo funciona tu negocio para delegar sin fricci\u00f3n: por escrito, con herramientas y repetible.",
        features: [
          "Mapeo y documentaci\u00f3n de flujos de trabajo",
          "Redacci\u00f3n de SOPs y gu\u00edas de proceso",
          "Configuraci\u00f3n e integraci\u00f3n de herramientas",
          "Manuales de delegaci\u00f3n de tareas",
          "Documentos de incorporaci\u00f3n para nuevos",
          "Capacitaci\u00f3n del equipo en nuevos procesos",
        ],
      },
    ],
    packages: {
      title: "Paquetes de Servicios",
      description:
        "Tres formas de trabajar con nosotros. Cada paquete incluye un asistente biling\u00fce dedicado \u2014 cu\u00e9ntanos qu\u00e9 necesitas y te enviaremos una cotizaci\u00f3n a medida.",
      ctaButton: "Solicitar cotizaci\u00f3n",
      items: [
        {
          id: "starter",
          name: "Inicial",
          hours: "80 horas/mes",
          desc: "Soporte dedicado de medio tiempo para empresas que necesitan asistencia consistente",
          features: [
            "AV dedicado de medio tiempo",
            "Soporte biling\u00fce disponible",
            "Respuesta prioritaria",
            "Gesti\u00f3n avanzada de tareas",
            "Informes semanales de progreso",
            "Documentaci\u00f3n de procesos",
            "Herramientas de colaboraci\u00f3n en equipo",
          ],
        },
        {
          id: "professional",
          badge: "M\u00e1s Popular",
          name: "Profesional",
          hours: "160 horas/mes",
          desc: "Soporte premium de tiempo completo con AVs senior y experiencia especializada",
          features: [
            "AV senior dedicado",
            "Soporte biling\u00fce disponible",
            "Soporte prioritario 24/7",
            "Reuniones semanales de sincronizaci\u00f3n",
            "An\u00e1lisis e informes avanzados",
            "Optimizaci\u00f3n de procesos",
            "Habilidades y capacitaci\u00f3n especializada",
            "Gerente de cuenta",
          ],
        },
        {
          id: "enterprise",
          name: "Empresarial",
          hours: "Horas personalizadas",
          desc: "Soluciones a medida para organizaciones con necesidades complejas",
          features: [
            "M\u00faltiples AVs y especialistas",
            "Soporte biling\u00fce y multiling\u00fce",
            "Soporte prioritario 24/7",
            "Gerente de cuenta dedicado",
            "Flujos de trabajo e integraciones personalizados",
            "Coordinaci\u00f3n de l\u00edder de equipo",
            "Garant\u00edas SLA",
            "Soporte de incorporaci\u00f3n y capacitaci\u00f3n",
          ],
        },
      ],
    },
    ctaTitle: "\u00bfNecesitas una Soluci\u00f3n Personalizada?",
    ctaDesc:
      "Podemos adaptar nuestros servicios para cumplir con los requisitos espec\u00edficos de tu negocio. Hablemos de lo que necesitas.",
    ctaButton: "Cont\u00e1ctanos Hoy",
    ctaSecondary: "Ver cu\u00e1nto cuesta",
  },

  // ─── Pricing ───────────────────────────────
  pricing: {
    eyebrow: "Precios",
    heroTitle: "La ayuda que necesitas,",
    heroTitleHighlight: "sin contratar.",
    heroDesc:
      "Cada plan cuenta con un asistente biling\u00fce dedicado y se cotiza para tu negocio \u2014 as\u00ed sabes el costo antes de comprometerte, no despu\u00e9s.",
    heroCtaPrimary: "Agenda una consulta gratuita",
    heroCtaSecondary: "Comparar los planes",
    closingTitle: "\u00bfNo sabes qu\u00e9 plan te conviene?",
    closingDesc:
      "Cu\u00e9ntanos c\u00f3mo transcurre tu semana y te recomendamos las horas. Sin presi\u00f3n ni compromiso.",
    closingCta: "Agenda una consulta gratuita",
    plansEyebrow: "Planes",
    plansNote: "Las horas las define el plan que elijas.",
    extrasTitle: "Todos los planes se integran con el flujo de trabajo que ya usas.",
    extras: [
      "Gmail",
      "Outlook",
      "Google Calendar",
      "Shopify",
      "WooCommerce",
      "Salesforce",
      "HubSpot",
      "Slack",
      "Notion",
      "Asana",
    ],
    includedEyebrow: "Lo que recibes",
    includedTitle: "Todos los planes incluyen",
    includedDesc:
      "La misma base tanto si tomas ochenta horas al mes como un equipo completo.",
    includedItems: [
      "Un asistente dedicado asignado a tu negocio",
      "Ingl\u00e9s y espa\u00f1ol, sin capa de traducci\u00f3n",
      "Procesos documentados, para que el trabajo sobreviva a un cambio de manos",
      "Horas seg\u00fan tu plan: 80, 160 o personalizadas",
      "La instalaci\u00f3n se cotiza antes de empezar",
    ],
    includedMockupLabel: "tu-mes.creedava.com",
    hoursTitle: "Un mes de horas",
    hoursPlanLabel: "Professional \u00b7 160 horas",
    hoursTotalLabel: "Asignadas",
    hoursUnit: "h",
    hoursBreakdown: [
      { label: "Correo y calendario", hours: 48 },
      { label: "Atenci\u00f3n al cliente", hours: 40 },
      { label: "Datos y administraci\u00f3n", hours: 40 },
      { label: "Proyectos e informes", hours: 32 },
    ],
    hoursFootnote:
      "Distribuci\u00f3n ilustrativa. Tu mezcla se acuerda con tu asistente en la primera semana y puede cambiar mes a mes.",
    termsEyebrow: "Por qu\u00e9 es diferente",
    termsTitle: "Lo que no est\u00e1s pagando.",
    termsDesc:
      "Contratar a alguien, un servicio de contestaci\u00f3n y un freelancer cobran por cosas que esto no. Esto es lo que no aparece en tu factura.",
    termsItems: [
      {
        title: "Una persona responde, no un bot",
        desc: "Sin respuestas autom\u00e1ticas de IA ni men\u00fas telef\u00f3nicos. Tus clientes llegan a un asistente con nombre que ya conoce tu negocio.",
      },
      {
        title: "Sin medidores por minuto",
        desc: "Compras horas dentro de un plan, no un reloj corriendo. Nadie cuenta los segundos de una llamada.",
      },
      {
        title: "Un plan, una factura",
        desc: "Horas, herramientas y supervisi\u00f3n en un solo precio. Sin cargos por tarea a fin de mes.",
      },
      {
        title: "Sin costos de empleador",
        desc: "Sin impuestos de n\u00f3mina, beneficios, equipo ni reclutamiento. Pagas por el trabajo, no por la plantilla.",
      },
      {
        title: "Sin proceso de contrataci\u00f3n",
        desc: "La capacidad se ajusta cambiando de plan, no escribiendo una vacante y esperando meses.",
      },
      {
        title: "La instalaci\u00f3n se cotiza, no se impone",
        desc: "Cuando un flujo de trabajo requiere instalaci\u00f3n, ves la cifra por escrito y la apruebas antes de empezar.",
      },
    ],
  },

  // ─── About ─────────────────────────────────────
  about: {
    eyebrow: "Sobre Creeda",
    heroTitle: "Un pa\u00eds. Dos idiomas.",
    heroTitleHighlight: "Toda tu operaci\u00f3n.",
    heroDesc:
      "Fundada en 2023, Creeda Virtual Assistants (CreedaVA) es una agencia de asistentes virtuales con sede en Belice, creada para conectar talento excepcional con oportunidades globales.",
    heroFacts: ["Fundada en 2023", "Ingl\u00e9s y espa\u00f1ol", "Belice, Centroam\u00e9rica"],
    heroCtaPrimary: "Trabajar con Creeda",
    heroCtaSecondary: "Ver servicios",
    mapCaptionLabel: "Belice \u00b7 Centroam\u00e9rica",
    mapCaptionMeta: "UTC\u22126 \u00b7 Ingl\u00e9s y espa\u00f1ol",
    whyEyebrow: "Por qu\u00e9 Belice",
    whyTitle: "El \u00fanico pa\u00eds de habla inglesa en Centroam\u00e9rica.",
    whyP1:
      "La fuerza laboral altamente educada y profesionalmente biling\u00fce de Belice representa un nuevo est\u00e1ndar en el soporte profesional remoto \u2014 y estamos orgullosos de llevar ese talento a empresas de todo el mundo.",
    whyP2:
      "Belice est\u00e1 en la encrucijada de culturas. Nuestro equipo es fluido en ingl\u00e9s y espa\u00f1ol, y rico en adaptabilidad, comunicaci\u00f3n y profesionalismo \u2014 ofreciendo soporte virtual de clase mundial en todas las industrias.",
    whyFacts: [
      {
        title: "Ingl\u00e9s por defecto",
        desc: "Belice es el \u00fanico pa\u00eds de habla inglesa en Centroam\u00e9rica, as\u00ed que tu equipo escribe y llama en tu idioma sin costos de traducci\u00f3n.",
      },
      {
        title: "Espa\u00f1ol sin traspasos",
        desc: "El biling\u00fcismo es la norma aqu\u00ed, no un extra. El mismo asistente puede atender a ambas audiencias.",
      },
      {
        title: "Tu jornada laboral",
        desc: "Belice opera en horario central todo el a\u00f1o, as\u00ed que tu asistente est\u00e1 en l\u00ednea mientras tus clientes lo est\u00e1n.",
      },
    ],
    approachEyebrow: "C\u00f3mo trabajamos",
    approachTitle: "Una sociedad, no una cola de tareas.",
    approachDesc:
      "Adoptamos un enfoque de asociaci\u00f3n con cada cliente. Desde nuestra llamada inicial de descubrimiento hasta el soporte continuo, invertimos tiempo en comprender tu negocio, tus desaf\u00edos y tus objetivos. Esto nos permite emparejarte con el asistente virtual perfecto y crear flujos de trabajo que realmente mejoren tu productividad. No solo completamos tareas \u2014 te ayudamos a construir sistemas que escalen.",
    standards: [
      {
        title: "SOP documentados",
        desc: "Cada tarea recurrente se documenta antes de delegarse, para que nada dependa de la memoria.",
      },
      {
        title: "Un responsable claro",
        desc: "Cada flujo de trabajo tiene una persona responsable \u2014 sin bandejas compartidas ni \u201calguien lo har\u00e1\u201d.",
      },
      {
        title: "Revisiones peri\u00f3dicas",
        desc: "El desempe\u00f1o se revisa seg\u00fan un calendario, no solo cuando algo sale mal.",
      },
      {
        title: "Servicio medido",
        desc: "Los tiempos de respuesta, las tasas de finalizaci\u00f3n y los comentarios de los clientes se miden y se reportan.",
      },
    ],
    purposeEyebrow: "Misi\u00f3n y visi\u00f3n",
    missionTitle: "Nuestra Misi\u00f3n",
    missionDesc:
      "Conectar oportunidad y talento vinculando la fuerza laboral altamente calificada de Belice con empresas globales, creando caminos profesionales remotos sostenibles mientras ofrecemos servicios excepcionales de asistentes virtuales que empoderan a las empresas para lograr m\u00e1s.",
    visionTitle: "Nuestra Visi\u00f3n",
    visionDesc:
      "Creeda es m\u00e1s que un servicio \u2014 es un movimiento para empoderar la fuerza laboral de Belice, fomentar el crecimiento profesional remoto y crear caminos sostenibles para la colaboraci\u00f3n global. Al contratar a trav\u00e9s de Creeda, las empresas no solo obtienen talento excepcional \u2014 invierten en una visi\u00f3n de progreso, prop\u00f3sito y asociaci\u00f3n.",
    valuesEyebrow: "Lo que nos sostiene",
    valuesTitle: "Nuestros Valores",
    valuesDesc: "Los principios que gu\u00edan todo lo que hacemos.",
    values: [
      { title: "Excelencia", desc: "Nos exigimos los m\u00e1s altos est\u00e1ndares en cada tarea, sin importar cu\u00e1n peque\u00f1a sea." },
      { title: "Confiabilidad", desc: "Tus fechas l\u00edmite son nuestras fechas l\u00edmite. Entregamos consistentemente, a tiempo, siempre." },
      { title: "Transparencia", desc: "Comunicaci\u00f3n clara, precios honestos y sin sorpresas. Siempre sabes d\u00f3nde est\u00e1s." },
      { title: "Crecimiento", desc: "Estamos comprometidos a ayudar a tu negocio a crecer mientras mejoramos continuamente nuestras propias habilidades." },
    ],
    ctaTitle: "Trabajemos Juntos",
    ctaDesc: "\u00bfListo para llevar tu negocio al siguiente nivel? Nos encantar\u00eda saber de ti.",
    ctaButton: "Ponte en Contacto",
  },

  // ─── Contact ───────────────────────────────────
  contact: {
    heroTitle: "Ponte en Contacto",
    heroDesc:
      "\u00bfTienes una pregunta o est\u00e1s listo para comenzar? Nos encantar\u00eda saber de ti. Completa el formulario a continuaci\u00f3n y te responderemos dentro de 24 horas.",
    firstName: "Nombre",
    lastName: "Apellido",
    email: "Correo Electr\u00f3nico",
    company: "Empresa",
    message: "Mensaje",
    firstNamePlaceholder: "Juan",
    lastNamePlaceholder: "P\u00e9rez",
    emailPlaceholder: "juan@empresa.com",
    companyPlaceholder: "Nombre de la Empresa",
    messagePlaceholder: "Cu\u00e9ntanos sobre tus necesidades...",
    sendMessage: "Enviar Mensaje",
    sending: "Enviando...",
    successTitle: "\u00a1Mensaje Enviado!",
    successDesc: "Gracias por comunicarte. Te responderemos dentro de 24 horas.",
    sendAnother: "Enviar Otro Mensaje",
    contactInfoTitle: "Informaci\u00f3n de Contacto",
    contactInfoDesc:
      "\u00bfPrefieres contactarnos directamente? Comun\u00edcate con nosotros a trav\u00e9s de cualquiera de los canales a continuaci\u00f3n. Nuestro equipo est\u00e1 disponible de lunes a viernes, de 9am a 6pm EST.",
    emailLabel: "Correo",
    emailValue: "contact@creedava.com",
    phoneLabel: "Teléfono",
    phoneValue: "+1 844-702-2202",
    hoursLabel: "Horario de Atenci\u00f3n",
    hoursValue: "Lunes - Viernes, 9:00 AM - 6:00 PM EST",
    responseLabel: "Tiempo de Respuesta",
    responseValue: "Respondemos a todas las consultas dentro de 24 horas",
    bookTitle: "\u00bfQuieres agendar una llamada?",
    bookDesc: "Agenda una consulta gratuita de 30 minutos para discutir tus necesidades.",
    bookLink: "Agendar una Consulta",
  },

  // ─── FAQ ───────────────────────────────────────
  faq: {
    heroTitle: "Preguntas Frecuentes",
    heroDesc: "Todo lo que necesitas saber sobre nuestros servicios de asistentes virtuales. \u00bfNo encuentras lo que buscas?",
    heroLink: "Cont\u00e1ctanos",
    categories: [
      {
        name: "General",
        questions: [
          {
            q: "\u00bfQu\u00e9 es un asistente virtual?",
            a: "Un asistente virtual (AV) es un profesional remoto capacitado que brinda soporte administrativo, t\u00e9cnico o especializado a empresas. Trabajan desde una ubicaci\u00f3n remota y manejan tareas que van desde la gesti\u00f3n de correo electr\u00f3nico hasta servicio al cliente, contabilidad y m\u00e1s.",
          },
          {
            q: "\u00bfC\u00f3mo es Creeda diferente de otras empresas de AV?",
            a: "Creeda proporciona asistentes virtuales biling\u00fces (ingl\u00e9s/espa\u00f1ol) que se emparejan cuidadosamente con las necesidades de tu negocio. Ofrecemos soporte dedicado, gesti\u00f3n de calidad continua y planes flexibles \u2014 ya sea que necesites unas pocas horas a la semana o un equipo de tiempo completo.",
          },
          {
            q: "\u00bfQu\u00e9 industrias atienden?",
            a: "Trabajamos con empresas en muchas industrias incluyendo bienes ra\u00edces, seguros, comercio electr\u00f3nico, salud, legal, finanzas y m\u00e1s. Nuestros AVs est\u00e1n capacitados para adaptarse a los requisitos espec\u00edficos de tu industria.",
          },
        ],
      },
      {
        name: "Servicios",
        questions: [
          {
            q: "\u00bfQu\u00e9 tareas puede manejar un asistente virtual?",
            a: "Nuestros AVs pueden manejar soporte administrativo, servicio al cliente, gesti\u00f3n de redes sociales, entrada de datos e investigaci\u00f3n, contabilidad, soporte inmobiliario, procesamiento de seguros y tareas web/digitales. Tambi\u00e9n podemos capacitar AVs en flujos de trabajo personalizados espec\u00edficos para tu negocio.",
          },
          {
            q: "\u00bfPuedo obtener un AV para un proyecto espec\u00edfico?",
            a: "\u00a1S\u00ed! Ofrecemos arreglos flexibles \u2014 desde soporte continuo hasta trabajo basado en proyectos. Ya sea que necesites ayuda con una migraci\u00f3n de datos \u00fanica o un horario semanal recurrente, podemos adaptarnos a tus necesidades.",
          },
          {
            q: "\u00bfOfrecen servicios biling\u00fces?",
            a: "Absolutamente. Nuestro equipo incluye asistentes virtuales biling\u00fces fluidos en ingl\u00e9s y espa\u00f1ol, lo que nos convierte en una excelente opci\u00f3n para empresas que atienden mercados diversos.",
          },
        ],
      },
      {
        name: "C\u00f3mo Empezar",
        questions: [
          {
            q: "\u00bfC\u00f3mo empiezo?",
            a: "Es simple: agenda una consulta gratuita a trav\u00e9s de nuestra p\u00e1gina de Contacto. Discutiremos tus necesidades, te emparejaremos con el AV adecuado y te incorporaremos \u2014 t\u00edpicamente en 5 a 7 d\u00edas h\u00e1biles.",
          },
          {
            q: "\u00bfHay un compromiso m\u00ednimo?",
            a: "Se requiere un compromiso inicial de un a\u00f1o para garantizar un soporte consistente y de alta calidad. Despu\u00e9s del primer a\u00f1o, los servicios contin\u00faan bajo el mismo acuerdo con 30 d\u00edas de aviso por escrito para finalizarlo. Si tus necesidades cambian, puedes pasar de un plan a otro \u2014 las horas las define el plan que tienes, no se ajustan dentro de \u00e9l.",
          },
          {
            q: "\u00bfCu\u00e1nto tiempo toma la incorporaci\u00f3n?",
            a: "La mayor\u00eda de los clientes est\u00e1n completamente incorporados en 5 a 7 d\u00edas h\u00e1biles. Esto incluye emparejarte con el AV adecuado, adaptar su capacitaci\u00f3n a tu marca y configurar todos los canales de comunicaci\u00f3n y flujo de trabajo.",
          },
        ],
      },
      {
        name: "Precios y Facturaci\u00f3n",
        questions: [
          {
            q: "\u00bfCu\u00e1nto cuestan sus servicios?",
            a: "Nuestros precios dependen del paquete y las horas que necesites. Consulta los paquetes de servicios en nuestra p\u00e1gina de Servicios, o cont\u00e1ctanos para una cotizaci\u00f3n personalizada adaptada a tus requisitos.",
          },
          {
            q: "\u00bfHay cargos de configuraci\u00f3n?",
            a: "A veces, pero nunca por sorpresa. La mayor\u00eda de los clientes no necesita ning\u00fan trabajo de instalaci\u00f3n. Cuando un flujo de trabajo s\u00ed lo requiere \u2014 migraciones, integraciones, herramientas a medida \u2014 lo cotizamos por escrito y lo apruebas antes de empezar.",
          },
          {
            q: "\u00bfQu\u00e9 m\u00e9todos de pago aceptan?",
            a: "Aceptamos tarjetas de cr\u00e9dito principales, transferencias bancarias y podemos configurar facturaci\u00f3n recurrente para tu conveniencia.",
          },
        ],
      },
      {
        name: "Calidad y Seguridad",
        questions: [
          {
            q: "\u00bfC\u00f3mo aseguran la calidad?",
            a: "Cada AV pasa por un riguroso proceso de selecci\u00f3n. Proporcionamos capacitaci\u00f3n continua, evaluaciones regulares de desempe\u00f1o y un gerente de cuenta dedicado para asegurar calidad consistente. Si alguna vez no est\u00e1s satisfecho, encontraremos un reemplazo sin costo adicional.",
          },
          {
            q: "\u00bfMis datos est\u00e1n seguros?",
            a: "S\u00ed. Todos nuestros AVs firman acuerdos de confidencialidad y siguen estrictos protocolos de seguridad de datos. Usamos canales de comunicaci\u00f3n encriptados y podemos cumplir con los requisitos de seguridad espec\u00edficos de tu organizaci\u00f3n.",
          },
          {
            q: "\u00bfQu\u00e9 pasa si mi AV no est\u00e1 disponible?",
            a: "Tenemos sistemas de respaldo. Si tu AV no est\u00e1 disponible por enfermedad o tiempo libre, proporcionaremos un reemplazo capacitado para asegurar la continuidad del servicio.",
          },
        ],
      },
    ],
    ctaTitle: "\u00bfA\u00fan Tienes Preguntas?",
    ctaDesc: "Nuestro equipo est\u00e1 listo para ayudar. Comun\u00edcate y te responderemos dentro de 24 horas.",
    ctaButton: "Cont\u00e1ctanos",
  },

  // ─── Footer ────────────────────────────────────
  footer: {
    tagline: "Servicios profesionales de asistentes virtuales que ayudan a las empresas a ahorrar tiempo, reducir costos y escalar operaciones.",
    servicesCol: "Servicios",
    companyCol: "Empresa",
    supportCol: "Soporte",
    serviceLinks: [
      "Soporte Administrativo",
      "Soporte Ejecutivo y Alta Direcci\u00f3n",
      "Soporte de RR. HH. y Reclutamiento",
      "Soporte Administrativo Legal",
      "Servicio al Cliente",
      "Gesti\u00f3n de Redes Sociales",
      "Entrada de Datos e Investigaci\u00f3n",
      "Contabilidad",
      "Soporte Web y Digital",
      "AV de Bienes Ra\u00edces",
      "Procesamiento de Seguros",
      "Optimizaci\u00f3n de Procesos y Flujos",
    ],
    companyLinks: {
      about: "Nosotros",
      news: "Noticias y Blog",
      contact: "Contacto",
    },
    supportLinks: {
      faq: "Preguntas Frecuentes",
      forum: "Foro",
      privacy: "Pol\u00edtica de Privacidad",
      terms: "T\u00e9rminos de Servicio",
    },
    copyright: "Creeda Virtual Assistants. Todos los derechos reservados.",
    followLinkedIn: "S\u00edguenos en LinkedIn",
  },

  // ─── News ──────────────────────────────────────
  news: {
    heroTitle: "Noticias y Perspectivas",
    heroDesc: "Consejos, tendencias y perspectivas para ayudarte a aprovechar al m\u00e1ximo los servicios de asistentes virtuales.",
    postCountLabel: "publicaciones",
    readArticle: "Leer art\u00edculo",
    morePosts: "M\u00e1s publicaciones",
    byAuthor: "Por",
    noPostsYet: "A\u00fan no hay publicaciones. Vuelve pronto.",
    minRead: "min de lectura",
    backToNews: "Volver a Noticias",
    postNotFound: "Publicaci\u00f3n No Encontrada",
    postNotFoundDesc: "Esta publicaci\u00f3n puede haber sido eliminada o ya no est\u00e1 disponible.",
    ctaTitle: "\u00bfListo para Comenzar?",
    ctaDesc: "Deja que Creeda se encargue de las tareas que te frenan para que puedas enfocarte en hacer crecer tu negocio.",
    ctaButton: "Cont\u00e1ctanos",
    stayConnected: "Mantente Conectado",
    stayConnectedDesc: "S\u00edguenos en LinkedIn para perspectivas de la industria, consejos y actualizaciones de la empresa.",
    inThisArticle: "En este art\u00edculo",
    share: "Compartir",
    copyLink: "Copiar enlace",
    linkCopied: "Enlace copiado",
    relatedPosts: "Lecturas relacionadas",
  },

  // ─── Forum ─────────────────────────────────────
  forum: {
    title: "Foro",
    subtitle: "Haz preguntas, comparte ideas, discute.",
    noThreads: "\u00a1A\u00fan no hay publicaciones. S\u00e9 el primero!",
    newPost: "Nueva Publicaci\u00f3n",
    replies: "respuestas",
    reply: "respuesta",
    comments: "comentarios",
    comment: "comentario",
    open: "Abierto",
    closed: "Cerrado",
    by: "por",
    postedBy: "Publicado por",
    ago: "hace",
    justNow: "ahora mismo",
    minutesAgo: "min",
    hoursAgo: "h",
    daysAgo: "d",
    backToForum: "\u2190 Todas las Publicaciones",
    threadNotFound: "Publicaci\u00f3n No Encontrada",
    threadNotFoundDesc: "Esta publicaci\u00f3n puede haber sido eliminada.",
    like: "Me gusta",
    liked: "Gustado",
    addComment: "A\u00f1adir un comentario",
    writeReply: "\u00bfQu\u00e9 piensas?",
    postReply: "Responder",
    deleteConfirm: "\u00bfEliminar esto?",
    deleted: "[eliminado]",
    sortNew: "Nuevo",
    sortTop: "Top",
    sortOld: "Antiguo",
    signIn: "Iniciar Sesi\u00f3n",
    signUp: "Registrarse",
    logOut: "Cerrar Sesi\u00f3n",
    email: "Correo electr\u00f3nico",
    password: "Contrase\u00f1a",
    confirmPassword: "Confirmar Contrase\u00f1a",
    displayName: "Nombre para mostrar",
    firstName: "Nombre",
    lastName: "Apellido",
    company: "Empresa (opcional)",
    country: "Pa\u00eds",
    phone: "Tel\u00e9fono (opcional)",
    share: "Compartir",
    linkCopied: "\u00a1Enlace copiado!",
    signInToReply: "Inicia sesi\u00f3n para responder",
    signInToPost: "Inicia sesi\u00f3n para publicar",
    signInToLike: "Inicia sesi\u00f3n para dar me gusta",
    noAccount: "\u00bfNo tienes cuenta?",
    hasAccount: "\u00bfYa tienes una cuenta?",
    createAccount: "Crea una",
    signInHere: "Inicia sesi\u00f3n",
    passwordMismatch: "Las contrase\u00f1as no coinciden",
    passwordTooShort: "La contrase\u00f1a debe tener al menos 6 caracteres",
    authError: "Error de autenticaci\u00f3n. Int\u00e9ntalo de nuevo.",
    postTitle: "T\u00edtulo",
    postTitlePlaceholder: "\u00bfQu\u00e9 tienes en mente?",
    postContent: "Contenido",
    postContentPlaceholder: "Comparte detalles, haz una pregunta o inicia una discusi\u00f3n...",
    postTags: "Etiquetas (separadas por coma)",
    postTagsPlaceholder: "ej. asistente-virtual, negocios, consejos",
    submitPost: "Publicar",
    cancel: "Cancelar",
    // Media
    images: "Im\u00e1genes",
    upload: "Subir",
    noImages: "Sin im\u00e1genes",
    links: "Enlaces",
    addLink: "+ A\u00f1adir",
    noLinks: "Sin enlaces",
    signUpSubtitle: "Crea una cuenta gratuita para publicar, responder y dar me gusta.",
    autoTranslated: "Traducido automáticamente",
    profile: "Perfil",
    editProfile: "Editar Perfil",
    bio: "Biograf\u00eda",
    posts: "publicaciones",
    joined: "Se uni\u00f3",
    save: "Guardar",
  },

  // ─── Join / Book ───────────────────────────────
  join: {
    heroTitle: "Agenda una Consulta Gratuita",
    heroDesc: "Elige una fecha y hora, completa tus datos y te enviaremos una invitaci\u00f3n de calendario.",
    step1: "Elige un Horario",
    step2: "Tus Datos",
    selectDateTime: "Selecciona Fecha y Hora",
    timezoneNote: "Todos los horarios en hora de Belice (CST). Lunes\u2013Viernes, 9 AM\u20135 PM.",
    noTimesAvailable: "No hay horarios disponibles",
    selectDatePrompt: "Selecciona una fecha para ver los horarios disponibles",
    continue: "Continuar",
    retry: "Reintentar",
    slotsError: "No se pudo cargar la disponibilidad del calendario. Int\u00e9ntalo de nuevo m\u00e1s tarde.",
    yourDetails: "Tus Datos",
    change: "Cambiar",
    atTime: "a las",
    belizeTime: "(Hora de Belice)",
    firstName: "Nombre",
    lastName: "Apellido",
    email: "Correo",
    phone: "Tel\u00e9fono",
    company: "Empresa",
    service: "Servicio",
    notes: "Notas (opcional)",
    notesPlaceholder: "\u00bfAlgo que quieras que sepamos antes de la llamada?",
    back: "Volver",
    bookConsultation: "Agendar Consulta",
    submitError: "Algo sali\u00f3 mal. Por favor int\u00e9ntalo de nuevo.",
    successTitle: "\u00a1Todo Listo!",
    successBooked: "Tu consulta est\u00e1 agendada para el",
    successInvite: "Recibir\u00e1s una invitaci\u00f3n de calendario en",
    successShortly: "en breve.",
    backToHome: "Volver al Inicio",
    generalConsultation: "Consulta General",
    days: ["Dom", "Lun", "Mar", "Mi\u00e9", "Jue", "Vie", "S\u00e1b"] as const,
    months: [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
    ] as const,
  },

  // ─── Privacy Policy ─────────────────────────────
  privacy: {
    heroTitle: "Pol\u00edtica de Privacidad",
    lastUpdated: "\u00daltima actualizaci\u00f3n: 14 de febrero de 2026",
    sections: [
      {
        title: "1. Informaci\u00f3n que Recopilamos",
        paragraphs: [
          "Recopilamos la informaci\u00f3n que nos proporcionas directamente, como cuando llenas un formulario de contacto, solicitas una consulta o creas una cuenta. Esto puede incluir:",
        ],
        list: [
          "Nombre, direcci\u00f3n de correo electr\u00f3nico y n\u00famero de tel\u00e9fono",
          "Nombre de la empresa y cargo",
          "Informaci\u00f3n de facturaci\u00f3n y pago",
          "Cualquier otra informaci\u00f3n que elijas proporcionar",
        ],
      },
      {
        title: "2. C\u00f3mo Usamos Tu Informaci\u00f3n",
        paragraphs: [
          "Usamos la informaci\u00f3n que recopilamos para:",
        ],
        list: [
          "Proporcionar, mantener y mejorar nuestros servicios",
          "Procesar transacciones y enviar informaci\u00f3n relacionada",
          "Enviar comunicaciones promocionales (puedes cancelar en cualquier momento)",
          "Responder a tus comentarios, preguntas y solicitudes de servicio al cliente",
          "Monitorear y analizar tendencias, uso y actividades en relaci\u00f3n con nuestros servicios",
        ],
      },
      {
        title: "3. Compartir Informaci\u00f3n",
        paragraphs: [
          "No vendemos, intercambiamos ni transferimos tu informaci\u00f3n personal a terceros sin tu consentimiento, excepto cuando sea necesario para proporcionar nuestros servicios o seg\u00fan lo requiera la ley. Podemos compartir informaci\u00f3n con proveedores de servicios de confianza que nos ayudan a operar nuestro negocio, siempre que acepten mantener tu informaci\u00f3n confidencial.",
        ],
      },
      {
        title: "4. Seguridad de Datos",
        paragraphs: [
          "Implementamos medidas de seguridad apropiadas para proteger tu informaci\u00f3n personal contra acceso no autorizado, alteraci\u00f3n, divulgaci\u00f3n o destrucci\u00f3n. Todos los asistentes virtuales firman acuerdos de confidencialidad (NDAs), y utilizamos canales de comunicaci\u00f3n encriptados para todas las interacciones con clientes.",
        ],
      },
      {
        title: "5. Cookies y Rastreo",
        paragraphs: [
          "Nuestro sitio web puede usar cookies y tecnolog\u00edas de rastreo similares para mejorar tu experiencia, analizar el tr\u00e1fico del sitio y comprender de d\u00f3nde provienen nuestros visitantes. Puedes controlar las preferencias de cookies a trav\u00e9s de la configuraci\u00f3n de tu navegador.",
        ],
      },
      {
        title: "6. Tus Derechos",
        paragraphs: [
          "Tienes derecho a acceder, corregir o eliminar tu informaci\u00f3n personal en cualquier momento. Tambi\u00e9n puedes optar por no recibir comunicaciones de marketing de nuestra parte. Para ejercer cualquiera de estos derechos, cont\u00e1ctanos en",
        ],
        contactEmail: "privacy@creedava.com",
      },
      {
        title: "7. Cambios a Esta Pol\u00edtica",
        paragraphs: [
          "Podemos actualizar esta pol\u00edtica de privacidad de vez en cuando. Te notificaremos de cualquier cambio publicando la nueva pol\u00edtica en esta p\u00e1gina y actualizando la fecha de \"\u00daltima actualizaci\u00f3n\". Te recomendamos revisar esta p\u00e1gina peri\u00f3dicamente para ver cualquier cambio.",
        ],
      },
      {
        title: "8. Cont\u00e1ctanos",
        paragraphs: [
          "Si tienes preguntas o inquietudes sobre esta pol\u00edtica de privacidad, cont\u00e1ctanos en",
        ],
        contactEmail: "privacy@creedava.com",
      },
    ],
  },

  // ─── Terms of Service ─────────────────────────
  terms: {
    heroTitle: "T\u00e9rminos de Servicio",
    lastUpdated: "\u00daltima actualizaci\u00f3n: 14 de febrero de 2026",
    sections: [
      {
        title: "1. Aceptaci\u00f3n de T\u00e9rminos",
        paragraphs: [
          "Al acceder o usar los servicios de CreedaVA, aceptas estar sujeto a estos T\u00e9rminos de Servicio. Si no est\u00e1s de acuerdo con estos t\u00e9rminos, por favor no uses nuestros servicios. Nos reservamos el derecho de modificar estos t\u00e9rminos en cualquier momento, y tu uso continuado de nuestros servicios constituye la aceptaci\u00f3n de cualquier cambio.",
        ],
      },
      {
        title: "2. Servicios",
        paragraphs: [
          "CreedaVA proporciona servicios de asistentes virtuales que incluyen, entre otros, soporte administrativo, servicio al cliente, gesti\u00f3n de redes sociales, entrada de datos, contabilidad, soporte inmobiliario, procesamiento de seguros y soluciones empresariales. El alcance espec\u00edfico de los servicios se definir\u00e1 en tu acuerdo de servicio.",
        ],
      },
      {
        title: "3. Responsabilidades del Cliente",
        paragraphs: [
          "Como cliente, aceptas:",
        ],
        list: [
          "Proporcionar instrucciones claras y los recursos necesarios para completar las tareas",
          "Responder a las comunicaciones de manera oportuna",
          "Realizar los pagos seg\u00fan el calendario acordado",
          "No solicitar a nuestros AVs que realicen actividades ilegales o no \u00e9ticas",
          "Mantener la confidencialidad de cualquier credencial de acceso compartida",
        ],
      },
      {
        title: "4. T\u00e9rminos de Pago",
        paragraphs: [
          "El pago se debe realizar seg\u00fan los t\u00e9rminos especificados en tu plan de servicio. Aceptamos tarjetas de cr\u00e9dito principales y transferencias bancarias. Los pagos atrasados pueden resultar en la suspensi\u00f3n de servicios. Todas las tarifas no son reembolsables a menos que se indique lo contrario en tu acuerdo de servicio.",
        ],
      },
      {
        title: "5. Confidencialidad",
        paragraphs: [
          "Todos los asistentes virtuales firman acuerdos de confidencialidad (NDAs) para proteger la informaci\u00f3n de tu negocio. Tratamos todos los datos de los clientes como confidenciales y no los compartiremos con terceros sin tu consentimiento expl\u00edcito, excepto seg\u00fan lo requiera la ley.",
        ],
      },
      {
        title: "6. Propiedad Intelectual",
        paragraphs: [
          "Todo el trabajo creado por nuestros asistentes virtuales en tu nombre se convierte en tu propiedad intelectual una vez realizado el pago. CreedaVA no retiene ning\u00fan derecho sobre el trabajo creado espec\u00edficamente para los clientes.",
        ],
      },
      {
        title: "7. Limitaci\u00f3n de Responsabilidad",
        paragraphs: [
          "La responsabilidad de CreedaVA se limita al monto pagado por los servicios en el per\u00edodo de 30 d\u00edas anterior. No somos responsables por da\u00f1os indirectos, incidentales, consecuentes o punitivos que surjan del uso de nuestros servicios. Haremos esfuerzos razonables para garantizar la calidad y precisi\u00f3n, pero no podemos garantizar un servicio libre de errores.",
        ],
      },
      {
        title: "8. Terminaci\u00f3n",
        paragraphs: [
          "Cualquiera de las partes puede terminar los servicios con 14 d\u00edas de aviso por escrito. CreedaVA se reserva el derecho de terminar los servicios inmediatamente si el cliente viola estos t\u00e9rminos. Al terminar, cualquier saldo pendiente se vuelve inmediatamente exigible, y devolveremos todos los materiales y datos del cliente.",
        ],
      },
      {
        title: "9. Resoluci\u00f3n de Disputas",
        paragraphs: [
          "Cualquier disputa que surja de estos t\u00e9rminos o nuestros servicios se abordar\u00e1 primero a trav\u00e9s de negociaci\u00f3n de buena fe. Si no se puede llegar a una resoluci\u00f3n, el asunto se someter\u00e1 a arbitraje vinculante de acuerdo con las leyes aplicables.",
        ],
      },
      {
        title: "10. Contacto",
        paragraphs: [
          "Para preguntas sobre estos T\u00e9rminos de Servicio, cont\u00e1ctanos en",
        ],
        contactEmail: "legal@creedava.com",
      },
    ],
  },

  // ─── Common ────────────────────────────────────
  common: {
    contactUs: "Cont\u00e1ctanos",
    learnMore: "M\u00e1s Informaci\u00f3n",
    backToTop: "Volver arriba",
  },
} as const;

export default es;
