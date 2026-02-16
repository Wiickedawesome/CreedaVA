import type { Dictionary } from "./en";

const es: Dictionary = {
  // ─── Nav ───────────────────────────────────────
  nav: {
    home: "Inicio",
    services: "Servicios",
    about: "Nosotros",
    pricing: "Precios",
    news: "Noticias",
    contact: "Contacto",
    signIn: "Iniciar Sesi\u00f3n",
    getStarted: "Empezar",
  },

  // ─── Home ──────────────────────────────────────
  home: {
    heroBadge: "Asistentes Virtuales Profesionales",
    heroTitle: "Enf\u00f3cate en Lo Que",
    heroTitleHighlight: "M\u00e1s Importa",
    heroDesc:
      "Delega tus tareas administrativas a asistentes virtuales calificados. Ahorra tiempo, reduce costos y escala tu negocio con los servicios de soporte profesional de CreedaVA.",
    heroCtaPrimary: "Empezar",
    heroCtaSecondary: "Ver Servicios",
    stats: {
      tasksCompleted: "Tareas Completadas",
      clientSatisfaction: "Satisfacci\u00f3n del Cliente",
      availability: "Disponibilidad",
      happyClients: "Clientes Satisfechos",
    },
    howItWorks: "C\u00f3mo Funciona",
    howItWorksDesc:
      "Comienza con tu asistente virtual dedicado en solo unos simples pasos.",
    steps: [
      {
        title: "Consulta Gratuita",
        desc: "Agenda una llamada de descubrimiento para discutir tus necesidades, objetivos y el tipo de apoyo que m\u00e1s beneficiar\u00eda a tu negocio.",
      },
      {
        title: "Emparejamiento Perfecto",
        desc: "Te emparejamos cuidadosamente con un asistente virtual cuyas habilidades, experiencia y personalidad se alinean con tus requisitos.",
      },
      {
        title: "Comienza a Crecer",
        desc: "Tu AV comienza a trabajar de inmediato. Proporcionamos soporte de incorporaci\u00f3n y gesti\u00f3n continua para asegurar el \u00e9xito.",
      },
    ],
    getStartedToday: "Comienza Hoy",
    whyChoose: "\u00bfPor Qu\u00e9 Elegir CreedaVA?",
    whyChooseDesc:
      "Combinamos experiencia, confiabilidad y servicio personalizado para ayudar a tu negocio a prosperar.",
    whyItems: [
      {
        title: "Profesionales Experimentados",
        desc: "Nuestros AV son expertos verificados con a\u00f1os de experiencia en m\u00faltiples industrias.",
      },
      {
        title: "Flexible y Escalable",
        desc: "Escala seg\u00fan las necesidades de tu negocio. Sin compromisos a largo plazo.",
      },
      {
        title: "Rentable",
        desc: "Ahorra hasta un 70% en comparaci\u00f3n con empleados de tiempo completo. Paga solo por lo que necesitas.",
      },
      {
        title: "Datos Seguros",
        desc: "Seguridad de nivel empresarial y acuerdos de confidencialidad estrictos para proteger tu informaci\u00f3n.",
      },
    ],
    whySteps: [
      { title: "Cu\u00e9ntanos tus necesidades", desc: "Describe las tareas con las que necesitas ayuda" },
      { title: "Encuentra tu match", desc: "Te emparejamos con el AV perfecto" },
      { title: "Comienza a delegar", desc: "Enf\u00f3cate en crecer mientras nosotros nos encargamos del resto" },
    ],
    ctaTitle: "\u00bfListo para Comenzar?",
    ctaDesc:
      "\u00danete a las empresas que conf\u00edan en CreedaVA para manejar sus operaciones. Agenda una consulta gratuita hoy.",
    ctaBookConsultation: "Agendar Consulta",
    ctaViewPricing: "Ver Precios",
  },

  // ─── Services ──────────────────────────────────
  services: {
    heroTitle: "Nuestros Servicios",
    heroDesc:
      "Desde tareas administrativas hasta soporte especializado, nuestros asistentes virtuales est\u00e1n capacitados para manejar las necesidades \u00fanicas de tu negocio con profesionalismo y experiencia. Ya sea que necesites ayuda para escalar operaciones o liberar tu tiempo, tenemos la soluci\u00f3n adecuada \u2014 con soporte biling\u00fce disponible.",
    categories: [
      {
        title: "Soporte Administrativo",
        desc: "Mant\u00e9n tu negocio organizado y funcionando eficientemente con asistencia administrativa profesional.",
        features: [
          "Gesti\u00f3n de correo electr\u00f3nico",
          "Programaci\u00f3n de calendario y coordinaci\u00f3n",
          "Preparaci\u00f3n y formato de documentos",
          "Entrada de datos y gesti\u00f3n de bases de datos",
          "Reservas de viaje y log\u00edstica",
          "Organizaci\u00f3n de archivos y gesti\u00f3n en la nube",
        ],
      },
      {
        title: "Servicio al Cliente",
        desc: "Ofrece experiencias excepcionales al cliente en todos los canales con profesionales de soporte capacitados.",
        features: [
          "Soporte por correo electr\u00f3nico y tickets",
          "Gesti\u00f3n de chat en vivo",
          "Atenci\u00f3n de llamadas telef\u00f3nicas",
          "Resoluci\u00f3n de quejas de clientes",
          "Desarrollo y actualizaci\u00f3n de FAQ",
          "Encuestas de satisfacci\u00f3n del cliente",
        ],
      },
      {
        title: "Gesti\u00f3n de Redes Sociales",
        desc: "Haz crecer tu presencia en l\u00ednea con creaci\u00f3n de contenido estrat\u00e9gico y compromiso comunitario.",
        features: [
          "Creaci\u00f3n y programaci\u00f3n de contenido",
          "Compromiso y moderaci\u00f3n comunitaria",
          "An\u00e1lisis e informes de rendimiento",
          "Gesti\u00f3n de campa\u00f1as publicitarias",
          "Alcance y coordinaci\u00f3n de influencers",
          "Monitoreo de marca y gesti\u00f3n de reputaci\u00f3n",
        ],
      },
      {
        title: "Datos e Investigaci\u00f3n",
        desc: "Toma decisiones basadas en datos con investigaci\u00f3n integral y gesti\u00f3n organizada de datos.",
        features: [
          "Investigaci\u00f3n de mercado y competencia",
          "Entrada y validaci\u00f3n de datos",
          "Gesti\u00f3n y actualizaci\u00f3n de CRM",
          "Generaci\u00f3n y an\u00e1lisis de informes",
          "Generaci\u00f3n y calificaci\u00f3n de leads",
          "Monitoreo de tendencias de la industria",
        ],
      },
      {
        title: "Contabilidad",
        desc: "Mant\u00e9n registros financieros precisos y obt\u00e9n una visi\u00f3n clara de las finanzas de tu negocio.",
        features: [
          "Creaci\u00f3n y gesti\u00f3n de facturas",
          "Seguimiento y categorizaci\u00f3n de gastos",
          "Conciliaci\u00f3n bancaria",
          "Preparaci\u00f3n de informes financieros",
          "Cuentas por pagar/cobrar",
          "Soporte de preparaci\u00f3n de impuestos",
        ],
      },
      {
        title: "Soporte Web y Digital",
        desc: "Mant\u00e9n tu presencia digital pulida y funcionando al m\u00e1ximo.",
        features: [
          "Actualizaciones de contenido web",
          "Optimizaci\u00f3n y monitoreo SEO",
          "Redacci\u00f3n y publicaci\u00f3n de blogs",
          "Campa\u00f1as de email marketing",
          "Creaci\u00f3n de landing pages",
          "Gesti\u00f3n de activos digitales",
        ],
      },
      {
        title: "Asistente Virtual de Bienes Ra\u00edces",
        desc: "Soporte dedicado para profesionales de bienes ra\u00edces para gestionar listados, leads y comunicaciones con clientes.",
        features: [
          "Coordinaci\u00f3n y gesti\u00f3n de listados",
          "Seguimiento y calificaci\u00f3n de leads",
          "Entrada de datos y actualizaciones MLS",
          "Coordinaci\u00f3n de transacciones",
          "Programaci\u00f3n y promoci\u00f3n de open house",
          "Comunicaci\u00f3n y seguimiento de clientes",
        ],
      },
      {
        title: "Procesamiento de Seguros",
        desc: "Optimiza tus operaciones de seguros con asistentes virtuales experimentados en gesti\u00f3n de p\u00f3lizas y procesamiento de reclamos.",
        features: [
          "Entrada y gesti\u00f3n de datos de p\u00f3lizas",
          "Procesamiento y seguimiento de reclamos",
          "Emisi\u00f3n de certificados de seguro",
          "Seguimiento de renovaciones y notificaciones",
          "Comunicaci\u00f3n y soporte al cliente",
          "Gesti\u00f3n de documentaci\u00f3n de cumplimiento",
        ],
      },
      {
        title: "IA y Optimizaci\u00f3n",
        desc: "Aprovecha herramientas impulsadas por IA y automatizaci\u00f3n para optimizar tus flujos de trabajo y maximizar la eficiencia.",
        features: [
          "Automatizaci\u00f3n de tareas asistida por IA",
          "Optimizaci\u00f3n y dise\u00f1o de flujos de trabajo",
          "Documentaci\u00f3n de procesos y SOPs",
          "Integraci\u00f3n y configuraci\u00f3n de herramientas",
          "An\u00e1lisis de datos e informes",
          "Soluciones de automatizaci\u00f3n personalizadas",
        ],
      },
    ],
    ctaTitle: "\u00bfNecesitas una Soluci\u00f3n Personalizada?",
    ctaDesc:
      "Podemos adaptar nuestros servicios para cumplir con los requisitos espec\u00edficos de tu negocio. Hablemos de lo que necesitas.",
    ctaButton: "Cont\u00e1ctanos Hoy",
  },

  // ─── About ─────────────────────────────────────
  about: {
    heroTitle: "Sobre",
    heroTitleHighlight: "CreedaVA",
    heroP1:
      "Fundada en 2023, CreedaVA es una agencia de asistentes virtuales con sede en Belice con la misi\u00f3n de conectar oportunidad y talento. En una naci\u00f3n donde la educaci\u00f3n sigue en ascenso pero el empleo sigue siendo escaso, servimos como un puente digital \u2014 conectando a los profesionales altamente capacitados y biling\u00fces de Belice con empresas globales.",
    heroP2:
      "Belice, el \u00fanico pa\u00eds de habla inglesa en Centroam\u00e9rica, est\u00e1 posicionado de manera \u00fanica en la encrucijada de culturas. Nuestro equipo es fluido en ingl\u00e9s y espa\u00f1ol, y rico en adaptabilidad, comunicaci\u00f3n y profesionalismo \u2014 ofreciendo soporte virtual de clase mundial en todas las industrias.",
    missionTitle: "Nuestra Misi\u00f3n",
    missionDesc:
      "Conectar oportunidad y talento vinculando la fuerza laboral altamente calificada de Belice con empresas globales, creando caminos profesionales remotos sostenibles mientras ofrecemos servicios excepcionales de asistentes virtuales que empoderan a las empresas para lograr m\u00e1s.",
    visionTitle: "Nuestra Visi\u00f3n",
    visionDesc:
      "CreedaVA es m\u00e1s que un servicio \u2014 es un movimiento para empoderar la fuerza laboral de Belice, fomentar el crecimiento profesional remoto y crear caminos sostenibles para la colaboraci\u00f3n global. Al contratar a trav\u00e9s de CreedaVA, las empresas no solo obtienen talento excepcional \u2014 invierten en una visi\u00f3n de progreso, prop\u00f3sito y asociaci\u00f3n.",
    approachTitle: "Nuestro Enfoque",
    approachDesc:
      "Adoptamos un enfoque de asociaci\u00f3n con cada cliente. Desde nuestra llamada inicial de descubrimiento hasta el soporte continuo, invertimos tiempo en comprender tu negocio, tus desaf\u00edos y tus objetivos. Esto nos permite emparejarte con el asistente virtual perfecto y crear flujos de trabajo que realmente mejoren tu productividad. No solo completamos tareas \u2014 te ayudamos a construir sistemas que escalen.",
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

  // ─── Pricing ───────────────────────────────────
  pricing: {
    heroTitle: "Precios Simples y Transparentes",
    heroDesc: "Sin cargos ocultos. Sin contratos a largo plazo. Elige el plan que funcione para tu negocio y escala a medida que creces.",
    plans: [
      {
        name: "Inicial",
        price: "$1,499/mes",
        hours: "160 horas/mes",
        desc: "Soporte dedicado de tiempo completo para empresas que necesitan asistencia consistente",
        features: [
          "AV dedicado de tiempo completo",
          "Soporte biling\u00fce disponible",
          "Respuesta prioritaria",
          "Gesti\u00f3n avanzada de tareas",
          "Informes semanales de progreso",
          "Documentaci\u00f3n de procesos",
          "Herramientas de colaboraci\u00f3n en equipo",
        ],
      },
      {
        name: "Profesional",
        badge: "M\u00e1s Popular",
        price: "$1,799/mes",
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
        name: "Empresarial",
        price: "Personalizado",
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
    ctaButton: "Empezar",
    customTitle: "\u00bfNecesitas Establecer un Negocio?",
    customDesc:
      "Desde el registro de EIN y licencias comerciales hasta la creaci\u00f3n de tu sitio web y m\u00e1s \u2014 nos encargamos del trabajo administrativo para que lances tu negocio con confianza.",
    customButton: "Habla con Nosotros Hoy",
    faqTitle: "Preguntas Frecuentes",
    faqs: [
      { q: "\u00bfPuedo cambiar de plan?", a: "S\u00ed, puedes mejorar o reducir tu plan en cualquier momento. Los cambios toman efecto al inicio de tu pr\u00f3ximo ciclo de facturaci\u00f3n." },
      { q: "\u00bfQu\u00e9 pasa si necesito m\u00e1s horas?", a: "Se pueden comprar horas adicionales en cualquier momento. Tambi\u00e9n ofrecemos rollover de horas no utilizadas para suscriptores del plan Profesional." },
      { q: "\u00bfHay contrato?", a: "No se requieren contratos a largo plazo. Todos los planes son mes a mes y se pueden cancelar en cualquier momento." },
      { q: "\u00bfC\u00f3mo me emparejan con un AV?", a: "Despu\u00e9s de registrarte, evaluamos tus necesidades y te emparejamos con un AV cuyas habilidades y experiencia coincidan con tus requisitos." },
    ],
    seeMore: "Ver m\u00e1s",
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
    howWeWorkTitle: "C\u00f3mo Trabajamos Juntos",
    howWeWorkDesc: "Un proceso simple y transparente dise\u00f1ado para prepararte para el \u00e9xito.",
    howWeWorkSteps: [
      {
        title: "Consulta Inicial",
        desc: "Comenzamos con una llamada de descubrimiento gratuita para entender tu negocio, desaf\u00edos y el tipo de soporte que necesitas.",
      },
      {
        title: "Propuesta Personalizada",
        desc: "Basado en tus necesidades, creamos un plan a medida con el emparejamiento de AV correcto, alcance de trabajo y precios \u2014 sin soluciones gen\u00e9ricas.",
      },
      {
        title: "Seguimientos Programados",
        desc: "Programamos seguimientos regulares para revisar el progreso, recopilar comentarios y ajustar flujos de trabajo \u2014 manteniendo todo en orden.",
      },
    ],
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
            q: "\u00bfC\u00f3mo es CreedaVA diferente de otras empresas de AV?",
            a: "CreedaVA proporciona asistentes virtuales biling\u00fces (ingl\u00e9s/espa\u00f1ol) que se emparejan cuidadosamente con las necesidades de tu negocio. Ofrecemos soporte dedicado, gesti\u00f3n de calidad continua y planes flexibles \u2014 ya sea que necesites unas pocas horas a la semana o un equipo de tiempo completo.",
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
            a: "Es simple: agenda una consulta gratuita a trav\u00e9s de nuestra p\u00e1gina de Contacto. Discutiremos tus necesidades, te emparejaremos con el AV adecuado y te incorporaremos \u2014 generalmente en unos pocos d\u00edas h\u00e1biles.",
          },
          {
            q: "\u00bfHay un compromiso m\u00ednimo?",
            a: "Ofrecemos planes flexibles sin contratos a largo plazo. Puedes escalar hacia arriba o hacia abajo seg\u00fan tus necesidades. Recomendamos comenzar con al menos 20 horas por mes para ver resultados significativos.",
          },
          {
            q: "\u00bfCu\u00e1nto tiempo toma la incorporaci\u00f3n?",
            a: "La mayor\u00eda de los clientes est\u00e1n completamente incorporados en 3\u20135 d\u00edas h\u00e1biles. Esto incluye emparejarte con un AV, proporcionar capacitaci\u00f3n espec\u00edfica de marca y configurar canales de comunicaci\u00f3n.",
          },
        ],
      },
      {
        name: "Precios y Facturaci\u00f3n",
        questions: [
          {
            q: "\u00bfCu\u00e1nto cuestan sus servicios?",
            a: "Nuestros precios dependen del plan y las horas que necesites. Visita nuestra p\u00e1gina de Precios para opciones detalladas de planes, o cont\u00e1ctanos para una cotizaci\u00f3n personalizada adaptada a tus requisitos.",
          },
          {
            q: "\u00bfHay cargos de configuraci\u00f3n?",
            a: "No. No hay cargos ocultos ni cargos de configuraci\u00f3n. Solo pagas por el plan que elijas.",
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
      "Servicio al Cliente",
      "Gesti\u00f3n de Redes Sociales",
      "Entrada de Datos e Investigaci\u00f3n",
      "Contabilidad",
      "Soporte Web y Digital",
      "AV de Bienes Ra\u00edces",
      "Procesamiento de Seguros",
      "IA y Optimizaci\u00f3n",
    ],
    companyLinks: {
      about: "Nosotros",
      news: "Noticias y Blog",
      pricing: "Precios",
      contact: "Contacto",
    },
    supportLinks: {
      faq: "Preguntas Frecuentes",
      forum: "Foro",
      privacy: "Pol\u00edtica de Privacidad",
      terms: "T\u00e9rminos de Servicio",
    },
    copyright: "CreedaVA. Todos los derechos reservados.",
    followLinkedIn: "S\u00edguenos en LinkedIn",
  },

  // ─── News ──────────────────────────────────────
  news: {
    heroTitle: "Noticias y Perspectivas",
    heroDesc: "Consejos, tendencias y perspectivas para ayudarte a aprovechar al m\u00e1ximo los servicios de asistentes virtuales.",
    noPostsYet: "A\u00fan no hay publicaciones. Vuelve pronto.",
    minRead: "min de lectura",
    backToNews: "Volver a Noticias",
    postNotFound: "Publicaci\u00f3n No Encontrada",
    postNotFoundDesc: "Esta publicaci\u00f3n puede haber sido eliminada o ya no est\u00e1 disponible.",
    ctaTitle: "\u00bfListo para Comenzar?",
    ctaDesc: "Deja que CreedaVA se encargue de las tareas que te frenan para que puedas enfocarte en hacer crecer tu negocio.",
    ctaButton: "Cont\u00e1ctanos",
    stayConnected: "Mantente Conectado",
    stayConnectedDesc: "S\u00edguenos en LinkedIn para perspectivas de la industria, consejos y actualizaciones de la empresa.",
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
    services: [
      "Consulta General",
      "Asistente Ejecutivo",
      "Gesti\u00f3n de Redes Sociales",
      "Gesti\u00f3n de Correo y Calendario",
      "Atenci\u00f3n al Cliente",
      "Entrada de Datos e Investigaci\u00f3n",
      "Gesti\u00f3n de Proyectos",
    ] as const,
    days: ["Dom", "Lun", "Mar", "Mi\u00e9", "Jue", "Vie", "S\u00e1b"] as const,
    months: [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
    ] as const,
  },

  // ─── Common ────────────────────────────────────
  common: {
    contactUs: "Cont\u00e1ctanos",
    learnMore: "M\u00e1s Informaci\u00f3n",
  },
} as const;

export default es;
