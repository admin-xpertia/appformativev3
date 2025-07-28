// packages/database/seedAll.ts
import 'dotenv/config';
import { Surreal, RecordId } from 'surrealdb';
import { CaseSlug, CompetencyLevel } from '@espacio-formativo/types';

// 1) Casos con descripción
const casesToSeed = [
  {
    slug: CaseSlug.SOBRECONSUMO,
    title: 'Sobreconsumo',
    description: `El sobreconsumo es una tarifa especial más elevada que se aplica únicamente durante el período punta (diciembre, enero, febrero y marzo) cuando el consumo del cliente supera su límite individual establecido. Este mecanismo tarifario tiene como objetivo cubrir los costos adicionales asociados al aumento significativo de la demanda de agua durante los meses de mayor consumo, incentivando un uso racional del recurso hídrico. El límite de sobreconsumo se calcula tomando el mayor valor entre dos opciones: el consumo promedio del cliente durante el período no-punta inmediatamente anterior (abril a noviembre) y el límite mínimo establecido en el decreto tarifario (generalmente 40 m³). Para el caso específico de Aguas Araucanía, si el límite calculado resulta inferior a 40 m³, automáticamente se fija en 40 m³, mientras que si es superior, se mantiene el valor calculado.
En la práctica, el sobreconsumo se refleja en la boleta como metros cúbicos adicionales facturados a una tarifa superior durante los meses de diciembre a marzo. La empresa debe informar al cliente sobre su límite de sobreconsumo en la boleta anterior al inicio del período punta, incluyendo mensajes como "Próxima facturación período punta" en la última boleta del período no-punta y "Fin período punta" en la última boleta del período punta. El cobro se aplica únicamente sobre los metros cúbicos que excedan el límite establecido; por ejemplo, si un cliente tiene un límite de 45 m³ y consume 60 m³ en enero, solo los 15 m³ de exceso se facturarán a tarifa de sobreconsumo, mientras que los primeros 45 m³ se cobran a tarifa normal. Este sistema permite una facturación más justa que refleja los costos reales de atender la mayor demanda estacional.`
  },
  {
    slug: CaseSlug.LA_BOLETA,
    title: 'La Boleta',
    description: `La boleta es el documento oficial mensualmente emitido por la concesionaria de distribución de agua potable, con mérito ejecutivo, que detalla todos los cargos por los servicios prestados a cada cliente, incluyendo el consumo de agua potable, alcantarillado, tratamiento de aguas servidas y otros cargos asociados. Este documento debe contener información mínima obligatoria establecida por la normativa, como la identificación completa del cliente, el número de servicio, la identificación del medidor (al menos los últimos 3 dígitos), las lecturas anterior y actual con sus respectivas fechas, el total de metros cúbicos facturados diferenciando entre tarifa normal y sobreconsumo (cuando aplique), los montos detallados por cada concepto, la fecha de vencimiento, y debe ser entregado en el domicilio del servicio salvo que el cliente solicite expresamente una dirección alternativa. La boleta también debe indicar claramente si se aplicó "Promedio descontable" o "Promedio no descontable" cuando corresponda, explicando estos conceptos al dorso del documento.
En situaciones especiales, la boleta presenta características particulares que frecuentemente generan consultas de los clientes. Cuando hay un aumento superior al 20% en la cuenta final, debe adjuntarse una carta explicativa detallando las razones del incremento. Si se aplica término medio, la boleta debe especificar si es descontable o no descontable, indicando los metros cúbicos por abonar en futuras facturaciones cuando corresponda. En casos de emisión con aviso de corte, se reemplaza la fecha de vencimiento por "Corte en Trámite". Para clientes con remarcadores y prorrateo, la boleta debe desglosar claramente el consumo propio y el consumo adicional por prorrateo, especificando el método utilizado (proporcional al consumo, superficie, etc.). Adicionalmente, la boleta debe incluir información educativa básica que permita al cliente verificar el buen funcionamiento de su medidor y detectar posibles fugas, cumpliendo así con su función informativa y de transparencia hacia el usuario del servicio sanitario.ReintentarClaude puede cometer errores. Verifique las respuestas.`
  },
  {
    slug: CaseSlug.TERMINO_MEDIO,
    title: 'Término Medio',
    description: `El Término Medio es un método de facturación excepcional y temporal que se utiliza cuando no es posible determinar el consumo real de agua potable de un cliente debido a problemas con el medidor o la imposibilidad de acceder a él para realizar la lectura programada. Este consumo promedio se calcula basándose en los últimos seis meses de consumo efectivo, excluyendo aquellos períodos con consumo cero o que hayan sido facturados previamente mediante Términos Medios Descontables. Si no hay seis meses de historial disponible, se utiliza el promedio de los meses que cumplan las condiciones, y si no existe ningún registro válido, el término medio será equivalente a cero, pudiendo facturarse únicamente el cargo fijo. El objetivo es asegurar que el cliente pague por un consumo estimado justo en lugar de uno basado en suposiciones arbitrarias, manteniendo la continuidad del servicio de facturación.
Existen dos tipos de Término Medio que se diferencian según la causa que impidió la lectura efectiva. El Término Medio Descontable se aplica cuando la imposibilidad de lectura se debe a causas ajenas al funcionamiento del medidor, como casa cerrada, nicho con llave o medidor empañado, y este consumo se acumula como abono para ser descontado automáticamente en futuras facturaciones basadas en lecturas efectivas. El Término Medio No Descontable se utiliza cuando el problema radica en el propio medidor (detenido, destruido, deteriorado, retirado sin justificación o intervenido), y este consumo no se abona a futuros períodos, considerándose un cobro definitivo. En la boleta, debe especificarse claramente cuál tipo se aplicó mediante las leyendas "Promedio descontable" o "Promedio no descontable", explicando el concepto al dorso del documento. Cuando se aplica término medio descontable, la boleta también debe indicar los metros cúbicos que serán abonados en la próxima facturación con lectura efectiva, y una vez obtenida esta lectura real, se debe ajustar la cuenta en la facturación siguiente, pudiendo resultar en rebajas significativas si el consumo real fue menor al promedio facturado.`
  },
  {
    slug: CaseSlug.PRORRATEO,
    title: 'Prorrateo',
    description: `El prorrateo es el mecanismo mediante el cual se distribuye entre los copropietarios de conjuntos residenciales y edificios con un arranque común la diferencia entre el consumo total registrado por el medidor general y la suma de los consumos individuales registrados por los remarcadores (medidores individuales). Este proceso se realiza según lo establecido en el reglamento de copropiedad o, en su defecto, por determinación de la junta de administración, pudiendo aplicarse de tres formas: proporcional al consumo individual de cada vivienda, proporcional a la superficie de cada unidad, o mediante la emisión de una boleta única dirigida a la administración del conjunto. La diferencia a prorratear, denominada "q", puede ser tanto positiva (cuando el medidor general registra más consumo que la suma de remarcadores) como negativa (cuando la suma de remarcadores supera al medidor general), y se distribuye calculando un factor individual de prorrateo (Pi) para cada vivienda según el método acordado.
En la boleta, el prorrateo se refleja mediante el desglose claro del consumo propio (registrado por el remarcador individual) y el consumo adicional por prorrateo (Qai), sumándose ambos para obtener el consumo total a facturar a cada vivienda. Cuando el prorrateo es negativo, el consumo adicional se resta del consumo individual, pudiendo resultar en una reducción de la facturación. La boleta debe especificar el método de prorrateo utilizado y, en casos de incremento del consumo a prorratear del 20% o más respecto al período anterior, se debe informar a cada inmueble las causas del incremento. Es importante destacar que si no se puede obtener lectura del medidor general, no se aplica término medio a este medidor, sino que se utiliza la suma de las lecturas de los remarcadores como lectura efectiva para la facturación del condominio, asegurando así la continuidad y precisión en la distribución de costos entre los copropietarios.`
  },
  {
    slug: CaseSlug.CORTE_Y_REPOSICION,
    title: 'Corte y Reposición',
    description: `El Corte y Reposición es el procedimiento regulado mediante el cual un prestador de servicios sanitarios puede suspender el suministro de agua potable a un cliente que no ha pagado su cuenta, y posteriormente restablecerlo una vez que la deuda ha sido saldada. Este proceso debe iniciarse con un aviso de suspensión notificado al cliente con al menos 15 días de anticipación, el cual debe indicar el monto de la deuda impaga, el tipo de corte que se realizará, las tarifas asociadas de corte y reposición, y la fecha a partir de la cual se puede ejecutar la suspensión. El corte debe seguir una secuencia específica ascendente según las instancias definidas: llave de paso, retiro de pieza llave de paso, cañería vereda sin rotura de pavimento, cañería vereda con rotura de pavimento, cañería calzada sin rotura de pavimento, y cañería calzada con rotura de pavimento, no pudiendo saltarse instancias salvo excepciones justificadas como la negativa del cliente al corte tras carta certificada.
En las boletas emitidas después de la notificación de corte, se debe reemplazar la fecha de vencimiento por la leyenda "Corte en Trámite", lo que indica al cliente que el proceso de suspensión está en curso. Una vez que el cliente regulariza su deuda, la empresa tiene la obligación de reponer el servicio a más tardar dentro del día hábil siguiente al pago si este se efectúa antes de las 15:00 horas, debiendo documentar la reposición con la firma del cliente o un representante, o mediante otros medios de prueba como fotografías con fecha y hora. El procedimiento también contempla situaciones especiales como la suspensión de la relación comercial en casos de autoreposición reiterada o manipulación del medidor debidamente comprobada, requiriendo la apertura de un expediente con todas las pruebas que acrediten la irregularidad, incluyendo informes de funcionarios, medios de prueba, historial de consumos y del medidor. Este sistema busca equilibrar el derecho de la empresa a cobrar por sus servicios con la protección del derecho básico al agua del usuario.`
  },
];

// 2) Niveles pedagógicos por caso
const levelsToSeed = casesToSeed.flatMap(({ slug }) => {
  return [
    {
      caseSlug: slug,
      level: CompetencyLevel.BRONCE,
      objectives: [
        'El ejecutivo debe demostrar dominio de los conceptos fundamentales y procedimientos básicos establecidos en el manual, siendo capaz de identificar, definir y explicar correctamente los elementos centrales de cada tema sin ambigüedades.'
      ],
      taxonomy: 'Niveles 1 y 2, Recordar: Identificar, listar, nombrar, reconocer, recuperar, definir , Comprender: Explicar, describir, interpretar, resumir, clasificar, comparar, ejemplificar',
      metrics: ['Precisión Conceptual: Identifica y define correctamente los conceptos según el manual', 
        'Completitud de Información: Incluye todos los elementos obligatorios de la definición/procedimiento',
        'Claridad en la Explicación: Explica los conceptos de manera clara y comprensible']
    },
    {
      caseSlug: slug,
      level: CompetencyLevel.PLATA,
      objectives: [
        'El ejecutivo debe aplicar correctamente los conocimientos teóricos a situaciones concretas y estandarizadas, realizando cálculos, siguiendo procedimientos establecidos y proporcionando soluciones precisas a casos típicos.'
      ],
      taxonomy: 'Nivel 3: Aplicar: Calcular, ejecutar, implementar, demostrar, operar, resolver, usar, aplicar procedimientos',
      metrics: ['Exactitud en Cálculos: Realiza correctamente todas las operaciones matemáticas requeridas ', 
        'Adherencia a Procedimientos: Sigue paso a paso los procesos establecidos en el manual', 
        'Soluciones Correctas: Resuelve totalmente el caso planteado sin dejar cabos sueltos']
    },
    {
      caseSlug: slug,
      level: CompetencyLevel.ORO,
      objectives: [
        'El ejecutivo debe descomponer situaciones complejas en sus elementos constitutivos, identificar relaciones entre diferentes aspectos del problema, priorizar asuntos múltiples y estructurar soluciones organizadas mientras maneja información desordenada y emociones del cliente.',
      ],
      taxonomy: 'Nivel 4: Analizar: Descomponer, identificar relaciones, priorizar, estructurar, organizar, manejar información desordenada',
      metrics: ['Identificación de Problemas Múltiples: Reconoce y separa todos los aspectos del caso complejo ', 
        'Priorización Efectiva: Ordena los asuntos según urgencia/importancia normativa',
        'Estructuración de Respuesta:Presenta soluciones de manera lógica y organizada',
        'Integración de Información: Conecta diferentes elementos normativos y situacionales']
    },
    {
      caseSlug: slug,
      level: CompetencyLevel.PLATINO,
      objectives: [
        '+El ejecutivo debe emitir juicios profesionales en escenarios ambiguos, crear soluciones personalizadas que equilibren normativa y satisfacción del cliente, y demostrar liderazgo proactivo en la resolución de conflictos complejos con alta carga emocional.'
      ],
      taxonomy: 'Nivel 5: Evaluar:  Juzgar, valorar, criticar, justificar, evaluar, contrastar criterios, recomendar',
      metrics: ['Equilibrio Normativo-Humano: Balancea cumplimiento de procedimientos con satisfacción del cliente ', 
        'Gestión de Conflictos Complejos: Resuelve situaciones de alta tensión emocional',
        ' Justificación de Decisiones: Fundamenta sólidamente sus recomendaciones y acciones',
        'Impacto en Satisfacción: Logra que el cliente se sienta escuchado y valorado']
    },
  ];
});

async function main() {
  const db = new Surreal();
  await db.connect(process.env.DB_URL!, {
    namespace: process.env.DB_NAMESPACE!,
    database:  process.env.DB_DATABASE!,
    auth:       process.env.DB_TOKEN!,
  });
  await db.ready;

  console.log('🗑  Limpiando tablas antiguas…');
  await db.query(`DELETE FROM level;`);
  await db.query(`DELETE FROM case;`);

  console.log('🌱 Sembrando casos con descripción…');
  for (const c of casesToSeed) {
    // Usamos RecordId para que todos queden en la tabla 'case'
    await db.create(new RecordId('case', c.slug), {
      slug:        c.slug,
      title:       c.title,
      description: c.description,
    });
    console.log(`  • case:${c.slug}`);
  }

  console.log('🌱 Sembrando niveles pedagógicos…');
  for (const lvl of levelsToSeed) {
    await db.create('level', lvl);
    console.log(`  • level ${lvl.caseSlug}@${lvl.level}`);
  }

  console.log('✅ seedAll completado.');
  await db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});