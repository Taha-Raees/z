"use strict";exports.id=617,exports.ids=[617],exports.modules={6563:(a,b,c)=>{c.d(b,{NI:()=>g,P1:()=>e,Vf:()=>v,Xf:()=>h,ep:()=>t,lG:()=>i,s1:()=>w,vr:()=>x});var d=c(40197);let e=d.Ik({topic:d.Yj().describe("The subject/topic the student wants to learn"),currentLevel:d.Yj().describe("Current proficiency level (e.g., A1, beginner, intermediate)"),goalLevel:d.Yj().describe("Target proficiency level (e.g., B1, advanced)"),targetDate:d.Yj().describe("Target completion date (ISO format)"),contentLanguage:d.Yj().default("English").describe("Target language used for learner-facing generated content"),instructionLanguage:d.Yj().default("English").describe("Language used for UI/system instruction text"),strictTargetLanguage:d.zM().default(!0).describe("When true, generated learner content must remain in contentLanguage"),hoursPerDay:d.ai().min(.5).max(12).describe("Available hours per day"),hoursPerWeek:d.ai().min(1).max(84).describe("Available hours per week"),pacePreference:d.k5(["intensive","normal","light"]).describe("Preferred learning pace"),learningPreferences:d.Ik({videoPreference:d.ai().min(0).max(100).describe("Percentage of video content preferred"),readingPreference:d.ai().min(0).max(100).describe("Percentage of reading content preferred"),speakingFocus:d.zM().describe("Whether to focus on speaking practice"),writingFocus:d.zM().describe("Whether to focus on writing practice"),listeningFocus:d.zM().describe("Whether to focus on listening practice")}),constraints:d.Ik({device:d.Yj().optional().describe("Device constraints (mobile, desktop, etc.)"),accessibility:d.Yj().optional().describe("Accessibility requirements"),examFormat:d.Yj().optional().describe("Target exam format if any")}),additionalNotes:d.Yj().optional().describe("Any additional notes or requirements")}),f=d.Ik({index:d.ai(),title:d.Yj(),description:d.Yj(),outcomes:d.YO(d.Yj()),estimatedHours:d.ai(),lessonsCount:d.ai()});d.Ik({index:d.ai(),title:d.Yj(),description:d.Yj(),objectives:d.YO(d.Yj()),estimatedMinutes:d.ai(),keyTopics:d.YO(d.Yj()),prerequisites:d.YO(d.Yj()).optional()});let g=d.Ik({title:d.Yj(),description:d.Yj(),modules:d.YO(f),totalLessons:d.ai(),totalHours:d.ai(),estimatedWeeks:d.ai(),milestones:d.YO(d.Ik({title:d.Yj(),week:d.ai(),description:d.Yj()}))}),h=d.Ik({type:d.k5(["youtube","article","book","podcast","other"]),title:d.Yj(),url:d.Yj().url(),description:d.Yj(),durationSeconds:d.ai().nullable().optional(),channel:d.Yj().nullable().optional(),qualityScore:d.ai().min(0).max(1),relevanceScore:d.ai().min(0).max(1),reason:d.Yj().describe("Why this resource was selected")}),i=d.Ik({summary:d.Yj(),keyPoints:d.YO(d.Yj()),glossary:d.YO(d.Ik({term:d.Yj(),definition:d.Yj(),example:d.Yj().optional()})),guidedNotes:d.YO(d.Ik({section:d.Yj(),content:d.Yj(),questions:d.YO(d.Yj()).optional()})),additionalResources:d.YO(d.Ik({title:d.Yj(),url:d.Yj(),description:d.Yj().optional()})).optional()}),j=d.Ik({type:d.eu("mcq"),question:d.Yj(),options:d.YO(d.Yj()),correctAnswer:d.ai(),explanation:d.Yj(),difficulty:d.k5(["beginner","intermediate","advanced"])}),k=d.Ik({type:d.eu("true_false"),question:d.Yj(),correctAnswer:d.zM(),explanation:d.Yj(),difficulty:d.k5(["beginner","intermediate","advanced"])}),l=d.Ik({type:d.eu("matching"),question:d.Yj(),pairs:d.YO(d.Ik({left:d.Yj(),right:d.Yj()})),explanation:d.Yj(),difficulty:d.k5(["beginner","intermediate","advanced"])}),m=d.Ik({type:d.eu("cloze"),question:d.Yj(),blanks:d.YO(d.Ik({index:d.ai(),answer:d.Yj(),alternatives:d.YO(d.Yj()).optional()})),explanation:d.Yj(),difficulty:d.k5(["beginner","intermediate","advanced"])}),n=d.Ik({type:d.eu("short_answer"),question:d.Yj(),expectedAnswer:d.Yj(),keywords:d.YO(d.Yj()),explanation:d.Yj(),difficulty:d.k5(["beginner","intermediate","advanced"])}),o=d.Ik({type:d.eu("listening"),question:d.Yj(),audioUrl:d.Yj().url().optional(),transcript:d.Yj().optional(),correctAnswer:d.Yj(),explanation:d.Yj(),difficulty:d.k5(["beginner","intermediate","advanced"])}),p=d.Ik({type:d.eu("reading"),passage:d.Yj(),question:d.Yj(),correctAnswer:d.Yj(),explanation:d.Yj(),difficulty:d.k5(["beginner","intermediate","advanced"])}),q=d.Ik({type:d.eu("speaking"),prompt:d.Yj(),rubric:d.Ik({criteria:d.YO(d.Ik({name:d.Yj(),description:d.Yj(),maxPoints:d.ai()}))}),timeLimitSeconds:d.ai().optional(),difficulty:d.k5(["beginner","intermediate","advanced"])}),r=d.Ik({type:d.eu("writing"),prompt:d.Yj(),rubric:d.Ik({criteria:d.YO(d.Ik({name:d.Yj(),description:d.Yj(),maxPoints:d.ai()}))}),wordLimit:d.Ik({min:d.ai(),max:d.ai()}).optional(),difficulty:d.k5(["beginner","intermediate","advanced"])}),s=d.gM("type",[j,k,l,m,n,o,p,q,r]),t=d.Ik({title:d.Yj(),description:d.Yj(),difficulty:d.k5(["beginner","intermediate","advanced"]),type:d.k5(["mixed","reading","listening","speaking","writing","grammar","vocabulary"]),estimatedMinutes:d.ai(),questions:d.YO(s),instructions:d.Yj().optional()}),u=d.Ik({name:d.Yj(),description:d.Yj(),maxPoints:d.ai(),levels:d.YO(d.Ik({score:d.ai(),description:d.Yj()}))}),v=d.Ik({criteria:d.YO(u),totalPoints:d.ai(),passingScore:d.ai()}),w=d.Ik({type:d.k5(["quiz","test","exam"]),title:d.Yj(),description:d.Yj(),timeLimitMinutes:d.ai().optional(),questions:d.YO(s),rubric:v.optional(),passingScore:d.ai(),instructions:d.Yj().optional()}),x=d.Ik({score:d.ai().min(0).max(100),passed:d.zM(),feedback:d.Yj(),detailedFeedback:d.YO(d.Ik({questionIndex:d.ai(),score:d.ai(),feedback:d.Yj(),correctAnswer:d.Yj().optional()})),improvementPlan:d.YO(d.Ik({topic:d.Yj(),action:d.Yj(),resources:d.YO(d.Yj()).optional()}))}),y=d.Ik({type:d.k5(["lesson","exercise","quiz","test","exam","review","break"]),title:d.Yj(),description:d.Yj(),estimatedMinutes:d.ai(),priority:d.k5(["high","medium","low"]),completed:d.zM().default(!1),refId:d.Yj().optional()});d.Ik({date:d.Yj(),totalEstimatedMinutes:d.ai(),items:d.YO(y),notes:d.Yj().optional(),focusAreas:d.YO(d.Yj()).optional()}),d.Ik({agentName:d.Yj(),timestamp:d.Yj(),success:d.zM(),data:d.bz().optional(),error:d.Yj().optional(),metadata:d.g1(d.Yj(),d.bz()).optional()})},22617:(a,b,c)=>{c.d(b,{SE:()=>z,NS:()=>O});var d=c(40197),e=c(96798),f=c(42082),g=c(6563),h=c(23080);class i{async generateProgram(a,b){let c=(0,h.RZ)({contentLanguage:a.contentLanguage,instructionLanguage:a.instructionLanguage,strictTargetLanguage:a.strictTargetLanguage,...b}),d=[{role:"system",content:`You are an expert curriculum architect at a prestigious educational institution. Your task is to design a comprehensive learning program that takes a student from their current level to their goal level.

Key requirements:
1. Create a logical progression of modules that build upon each other
2. Each module should have clear, measurable learning outcomes
3. Estimate realistic time requirements based on the student's availability
4. Include milestones to track progress
5. Ensure the program fits within the target timeline

The program should feel like a real academic course, not just a list of topics.

${(0,h.mJ)(c)}

All learner-facing fields must be in ${c.contentLanguage}: title, description, module titles/descriptions, outcomes, milestones.

IMPORTANT: Return ONLY valid JSON. Do not use markdown code blocks. Do not include any text outside the JSON.

CRITICAL: You MUST use these EXACT field names in your JSON response:

For modules array:
- index (number): The module's position in the sequence (0, 1, 2, ...)
- title (string): The module's title
- description (string): A detailed description of what this module covers
- outcomes (array of strings): Learning outcomes for this module
- estimatedHours (number): Estimated hours to complete this module
- lessonsCount (number): Number of lessons in this module

For milestones array:
- title (string): The milestone's title
- week (number): The week number when this milestone occurs
- description (string): Description of what this milestone represents

Example of correct JSON structure:
{
  "title": "Program Title",
  "description": "Program description",
  "modules": [
    {
      "index": 0,
      "title": "Module 1 Title",
      "description": "Module description",
      "outcomes": ["Outcome 1", "Outcome 2"],
      "estimatedHours": 50,
      "lessonsCount": 10
    }
  ],
  "totalLessons": 10,
  "totalHours": 50,
  "estimatedWeeks": 4,
  "milestones": [
    {
      "title": "Milestone 1",
      "week": 2,
      "description": "Milestone description"
    }
  ]
}`},{role:"user",content:`Design a learning program for this student:

Topic: ${a.topic}
Current Level: ${a.currentLevel}
Goal Level: ${a.goalLevel}
Target Date: ${a.targetDate}
Available Time: ${a.hoursPerDay} hours/day, ${a.hoursPerWeek} hours/week
Pace Preference: ${a.pacePreference}
Learning Preferences: ${JSON.stringify(a.learningPreferences)}
Constraints: ${JSON.stringify(a.constraints)}
Additional Notes: ${a.additionalNotes||"None"}

Generate a complete program blueprint following the EXACT schema shown in the system message.
Return ONLY valid JSON. Do not use markdown code blocks.`}],e=await this.client.chatCompletionWithSchema({messages:d,task:"reasoning",disableSystemRole:!0,temperature:.7},g.NI);return g.NI.parse(e)}async generateModuleDetails(a,b,c,d=[]){let e=[{role:"system",content:"You are an expert curriculum designer. Create detailed module content that builds logically on previous modules."},{role:"user",content:`Create detailed content for module ${b+1}: "${c}"

Student Profile:
- Topic: ${a.topic}
- Current Level: ${a.currentLevel}
- Goal Level: ${a.goalLevel}
- Pace: ${a.pacePreference}

Previous Modules: ${d.join(", ")||"None (this is the first module)"}

Generate:
1. A detailed description of what this module covers
2. 5-7 specific learning outcomes
3. Key topics that will be covered
4. Estimated hours to complete
5. Number of lessons (typically 5-10)

Return as JSON with these fields: description, outcomes (array), keyTopics (array), estimatedHours, lessonsCount`}],f=await this.client.chatCompletion({messages:e,task:"reasoning",temperature:.7,priority:"reasoning"}),g=f.selectedResult.choices[0]?.message?.content;if(!g)throw Error("No content in response");let h=g,i=g.match(/```(?:json)?\s*([\s\S]*?)```/);return i&&(h=i[1]),JSON.parse(h.trim())}async validateProgram(a,b){let c=[],d=[],e=b.estimatedWeeks,f=a.hoursPerWeek*e,g=b.totalHours;for(let a of(g>f&&(c.push(`Program requires ${g} hours but only ${f} hours are available in the target timeline.`),d.push("Consider extending the target date or reducing the number of modules/lessons.")),b.modules.length<3&&(c.push("Program has fewer than 3 modules, which may not provide comprehensive coverage."),d.push("Consider adding more modules to ensure thorough coverage of the topic.")),b.modules))a.outcomes.length<3&&c.push(`Module "${a.title}" has fewer than 3 learning outcomes.`);return{valid:0===c.length,issues:c,suggestions:d}}async adjustProgram(a,b,c,d){let e=(0,h.RZ)({contentLanguage:a.contentLanguage,instructionLanguage:a.instructionLanguage,strictTargetLanguage:a.strictTargetLanguage,...d}),f=[{role:"system",content:`You are an expert curriculum architect. Adjust a program to address validation issues while maintaining educational quality.

${(0,h.mJ)(e)}

IMPORTANT: Return ONLY valid JSON. Do not use markdown code blocks. Do not include any text outside the JSON.`},{role:"user",content:`Adjust this program to address the following issues:

Issues:
${c.issues.map(a=>`- ${a}`).join("\n")}

Suggestions:
${c.suggestions.map(a=>`- ${a}`).join("\n")}

Current Program:
${JSON.stringify(b,null,2)}

Student Profile:
- Topic: ${a.topic}
- Current Level: ${a.currentLevel}
- Goal Level: ${a.goalLevel}
- Available Time: ${a.hoursPerWeek} hours/week

Return the adjusted program following the same schema. Return ONLY valid JSON. Do not use markdown code blocks.`}],i=await this.client.chatCompletionWithSchema({messages:f,task:"reasoning",disableSystemRole:!0,temperature:.7},g.NI);return g.NI.parse(i)}constructor(){this.client=(0,f.z)()}}let j=null;function k(){return j||(j=new i),j}var l=c(81064);class m{async buildLessonNotes(a,b,c,d){let e=(0,h.RZ)(d),f=b.map(a=>`- ${a.title}: ${a.description}`).join("\n"),i=[{role:"system",content:`You are an expert instructional designer at a prestigious educational institution. Your task is to create comprehensive lesson notes that help students learn effectively.

Lesson notes should include:
1. A clear summary of what students will learn
2. Key points organized logically
3. A glossary of important terms with definitions and examples
4. Guided notes with questions to check understanding
 5. Additional resources for further learning

The content should be:
- Clear and accessible
- Well-structured with headings
- Practical with real-world examples
- Engaging and motivating

${(0,h.mJ)(e)}

CRITICAL OUTPUT RULES:
- Return ONLY a JSON OBJECT, no markdown.
- Do NOT output any Zod/schema metadata (_def, typeName, ~standard, etc.).
- Use exactly these fields and types:
  - summary: string
  - keyPoints: string[]
  - glossary: { term: string; definition: string; example?: string }[]
  - guidedNotes: { section: string; content: string; questions?: string[] }[]
  - additionalResources?: { title: string; url: string; description?: string }[]`},{role:"user",content:`Create lesson notes for:

Module: ${c}
Lesson: ${a.title}
Description: ${a.description}
Objectives: ${a.objectives.join("\n- ")}
Key Topics: ${a.keyTopics.join(", ")}

Available Resources:
${f}

Generate comprehensive lesson notes following this exact JSON shape:
{
  "summary": "string",
  "keyPoints": ["string"],
  "glossary": [
    { "term": "string", "definition": "string", "example": "string (optional)" }
  ],
  "guidedNotes": [
    { "section": "string", "content": "string", "questions": ["string"] }
  ],
  "additionalResources": [
    { "title": "string", "url": "https://...", "description": "string (optional)" }
  ]
}

Return ONLY JSON object.`}],j=await this.client.chatCompletionWithSchema({messages:i,task:"reasoning",disableSystemRole:!0,temperature:.7,priority:"standard"},g.lG);return g.lG.parse(j)}async generateSummary(a,b){let c=[{role:"system",content:"You are an expert educator. Write clear, engaging lesson summaries."},{role:"user",content:`Write a 2-3 paragraph summary for this lesson:

Title: ${a.title}
Description: ${a.description}
Objectives: ${a.objectives.join(", ")}

The summary should:
- Hook the student's interest
- Explain what they'll learn
- Set expectations for the lesson`}],d=await this.client.chatCompletion({messages:c,temperature:.8,priority:"standard"});return d.selectedResult.choices[0]?.message?.content||"Summary unavailable"}async extractKeyPoints(a,b){let c=[{role:"system",content:"You are an expert at identifying the most important concepts in educational content."},{role:"user",content:`Extract 5-7 key points that students should remember from this lesson:

Title: ${a.title}
Objectives: ${a.objectives.join(", ")}

Resources:
${b.map(a=>`- ${a.title}: ${a.description}`).join("\n")}

Return as a JSON array of strings.`}],d=await this.client.chatCompletion({messages:c,temperature:.7,priority:"standard"}),e=d.selectedResult.choices[0]?.message?.content;if(!e)throw Error("No content in response");let f=JSON.parse(e);return Array.isArray(f)?f:[]}async createGlossary(a,b){let c=[{role:"system",content:"You are an expert educator. Create clear, helpful glossaries for students."},{role:"user",content:`Create a glossary of 5-10 important terms for this lesson:

Title: ${a.title}
Key Topics: ${a.keyTopics.join(", ")}

For each term, provide:
- The term
- A clear, simple definition
- An example sentence or context (optional)

Return as JSON array with fields: term, definition, example.`}],d=await this.client.chatCompletion({messages:c,temperature:.7,priority:"standard"}),e=d.selectedResult.choices[0]?.message?.content;if(!e)throw Error("No content in response");let f=JSON.parse(e);return Array.isArray(f)?f:[]}async generateGuidedNotes(a,b){let c=[{role:"system",content:"You are an expert instructional designer. Create guided notes that help students engage with the material."},{role:"user",content:`Create guided notes for this lesson:

Title: ${a.title}
Objectives: ${a.objectives.join(", ")}

Create 3-5 sections, each with:
- A section heading
- Brief content explaining the concept
- 2-3 questions to check understanding

Return as JSON array with fields: section, content, questions.`}],d=await this.client.chatCompletion({messages:c,temperature:.7,priority:"standard"}),e=d.selectedResult.choices[0]?.message?.content;if(!e)throw Error("No content in response");let f=JSON.parse(e);return Array.isArray(f)?f:[]}constructor(){this.client=(0,f.z)()}}let n=null;class o{createFallbackExerciseSet(a,b,c,d=[],e){let f=(0,h.RZ)(e),g=f.contentLanguage.toLowerCase(),i="english"===g||"en"===g,j=a.objectives[0]??`Understand ${a.title}`,k=a.objectives[1]??a.keyTopics[0]??j,l=a.objectives[2]??a.keyTopics[1]??j,m=d[0]??a.keyTopics[0]??"core concept",n=(a,b,c,d)=>i?a:g.includes("german")||g.includes("deutsch")||g.includes("de")?b:g.includes("spanish")||g.includes("espa\xf1ol")||g.includes("es")?c:g.includes("french")||g.includes("fran\xe7ais")||g.includes("fr")?d:a;return{title:i?`${a.title} Practice Set`:`[${f.contentLanguage}] \xdcbungssatz: ${a.title}`,description:i?`Practice set focused on ${a.title}.`:`[${f.contentLanguage}] \xdcbungssatz zum Thema ${a.title}.`,difficulty:b,type:c,estimatedMinutes:25,instructions:i?`Focus carefully on: ${m}. Reattempt incorrect items after reviewing notes.`:`[${f.contentLanguage}] Konzentrieren Sie sich auf: ${m}. Wiederholen Sie falsche Antworten nach dem Nachschlagen.`,questions:[{type:"mcq",question:n(`Which option best matches this lesson objective: "${j}"?`,`Welche Option passt am besten zu diesem Lernziel: "${j}"?`,`\xbfQu\xe9 opci\xf3n coincide mejor con este objetivo de aprendizaje: "${j}"?`,`Quelle option correspond le mieux \xe0 cet objectif d'apprentissage: "${j}"?`),options:[n("Core concept","Kernkonzept","Concepto central","Concept central"),n("Unrelated concept","Unzusammenh\xe4ngendes Konzept","Concepto no relacionado","Concept non li\xe9"),n("Opposite concept","Gegenteiliges Konzept","Concepto opuesto","Concept oppos\xe9"),n("Unsure","Unsicher","Inseguro","Incertain")],correctAnswer:0,explanation:n("The first option is intentionally aligned with the lesson objective.","Die erste Option ist absichtlich auf das Lernziel ausgerichtet.","La primera opci\xf3n est\xe1 intencionalmente alineada con el objetivo de aprendizaje.","La premi\xe8re option est intentionnellement align\xe9e sur l'objectif d'apprentissage."),difficulty:b},{type:"true_false",question:n(`True or False: "${k}" should be practiced using short examples before complex tasks.`,`Richtig oder Falsch: "${k}" sollte mit kurzen Beispielen ge\xfcbt werden, bevor komplexe Aufgaben folgen.`,`Verdadero o Falso: "${k}" debe practicarse usando ejemplos cortos antes de tareas complejas.`,`Vrai ou Faux: "${k}" doit \xeatre pratiqu\xe9 en utilisant des exemples courts avant des t\xe2ches complexes.`),correctAnswer:!0,explanation:n("Scaffolded practice is usually the fastest route to retention.","Gestuftes \xdcben ist normalerweise der schnellste Weg zur Behaltensleistung.","La pr\xe1ctica graduada suele ser la ruta m\xe1s r\xe1pida hacia la retenci\xf3n.","La pratique \xe9chafaud\xe9e est g\xe9n\xe9ralement le moyen le plus rapide de m\xe9morisation."),difficulty:b},{type:"matching",question:n("Match each study action to the expected learning outcome.","Ordnen Sie jede Lernaktion dem erwarteten Lernergebnis zu.","Empareje cada acci\xf3n de estudio con el resultado de aprendizaje esperado.","Associez chaque action d'\xe9tude au r\xe9sultat d'apprentissage attendu."),pairs:[{left:n("Review glossary","Glossar wiederholen","Repasar glosario","R\xe9viser le glossaire"),right:n("Improve term recognition","Begriffserkennung verbessern","Mejorar reconocimiento de t\xe9rminos","Am\xe9liorer la reconnaissance des termes")},{left:n("Do workbook drills","Arbeitsbuch\xfcbungen machen","Hacer ejercicios del libro","Faire des exercices de cahier"),right:n("Improve response speed","Reaktionsgeschwindigkeit verbessern","Mejorar velocidad de respuesta","Am\xe9liorer la vitesse de r\xe9ponse")},{left:n("Explain concept aloud","Konzept laut erkl\xe4ren","Explicar concepto en voz alta","Expliquer le concept \xe0 voix haute"),right:n("Improve recall depth","Erinnerungstiefe verbessern","Mejorar profundidad de recuerdo","Am\xe9liorer la profondeur du rappel")}],explanation:n("Each action maps to a specific cognitive gain.","Jede Aktion f\xfchrt zu einem spezifischen kognitiven Gewinn.","Cada acci\xf3n corresponde a una ganancia cognitiva espec\xedfica.","Chaque action correspond \xe0 un gain cognitif sp\xe9cifique."),difficulty:b},{type:"cloze",question:n('Complete the statement: "Today I practiced [blank0] and improved in [blank1]."','Vervollst\xe4ndigen Sie den Satz: "Heute habe ich [blank0] ge\xfcbt und mich in [blank1] verbessert."','Complete la afirmaci\xf3n: "Hoy practiqu\xe9 [blank0] y mejor\xe9 en [blank1]."',"Compl\xe9tez l'\xe9nonc\xe9: \"Aujourd'hui j'ai pratiqu\xe9 [blank0] et je me suis am\xe9lior\xe9 en [blank1].\""),blanks:[{index:0,answer:j,alternatives:[k,l]},{index:1,answer:m,alternatives:[k,l]}],explanation:n("Use the most relevant objective and weak area for full credit.","Verwenden Sie das relevanteste Ziel und Schw\xe4chengebiet f\xfcr volle Punkte.","Use el objetivo m\xe1s relevante y el \xe1rea d\xe9bil para obtener la calificaci\xf3n completa.","Utilisez l'objectif le plus pertinent et le point faible pour obtenir tous les points."),difficulty:b},{type:"short_answer",question:n(`In 1-2 lines, explain how "${l}" connects to this lesson.`,`Erkl\xe4ren Sie in 1-2 Zeilen, wie "${l}" mit dieser Lektion zusammenh\xe4ngt.`,`En 1-2 l\xedneas, explique c\xf3mo "${l}" se conecta a esta lecci\xf3n.`,`En 1-2 lignes, explique comment "${l}" se connecte \xe0 cette le\xe7on.`),expectedAnswer:n(`${l} connects to the lesson by reinforcing the core objective in practical use.`,`${l} verbindet sich mit der Lektion, indem es das Kernziel in der praktischen Anwendung verst\xe4rkt.`,`${l} se conecta a la lecci\xf3n al reforzar el objetivo central en uso pr\xe1ctico.`,`${l} se connecte \xe0 la le\xe7on en renfor\xe7ant l'objectif central dans l'utilisation pratique.`),keywords:l.split(" ").filter(Boolean).slice(0,3),explanation:n("Include the objective term and one practical connection.","F\xfcgen Sie den Zielbegriff und eine praktische Verbindung hinzu.","Incluya el t\xe9rmino objetivo y una conexi\xf3n pr\xe1ctica.","Incluez le terme objectif et une connexion pratique."),difficulty:b},{type:"reading",passage:n(`A student completed a lesson on "${a.title}" and then revised three ideas: ${j}; ${k}; ${l}. The student identified "${m}" as the weakest area and scheduled extra practice.`,`Ein Student hat eine Lektion \xfcber "${a.title}" abgeschlossen und dann drei Ideen wiederholt: ${j}; ${k}; ${l}. Der Student identifizierte "${m}" als schw\xe4chsten Bereich und plante zus\xe4tzliches \xdcben.`,`Un estudiante complet\xf3 una lecci\xf3n sobre "${a.title}" y luego revis\xf3 tres ideas: ${j}; ${k}; ${l}. El estudiante identific\xf3 "${m}" como el \xe1rea m\xe1s d\xe9bil y program\xf3 pr\xe1ctica adicional.`,`Un \xe9tudiant a termin\xe9 une le\xe7on sur "${a.title}" puis a r\xe9vis\xe9 trois id\xe9es: ${j}; ${k}; ${l}. L'\xe9tudiant a identifi\xe9 "${m}" comme le point faible et a programm\xe9 une pratique suppl\xe9mentaire.`),question:n("What did the student mark as the weakest area?","Welchen Bereich markierte der Student als schw\xe4chsten?","\xbfQu\xe9 \xe1rea marc\xf3 el estudiante como la m\xe1s d\xe9bil?","Quelle zone l'\xe9tudiant a-t-il identifi\xe9e comme la plus faible ?"),correctAnswer:m,explanation:n("The passage explicitly identifies the weak area near the end.","Der Text identifiziert den schwachen Bereich explizit gegen Ende.","El pasaje identifica expl\xedcitamente el \xe1rea d\xe9bil cerca del final.","Le passage identifie explicitement le point faible vers la fin."),difficulty:b}]}}ensureQuestionCoverage(a,b,c,d,e=[],f){let h=this.createFallbackExerciseSet(b,c,d,e,f),i=[...a.questions,...h.questions].slice(0,10);return g.ep.parse({...a,title:a.title||h.title,description:a.description||h.description,difficulty:c,type:d,estimatedMinutes:Math.max(15,Math.min(90,a.estimatedMinutes||h.estimatedMinutes)),instructions:a.instructions||h.instructions,questions:i})}async generateExerciseSet(a,b,c,d=[],e){let f=(0,h.RZ)(e),i=[{role:"system",content:`You are an expert exercise designer.

Return ONLY valid JSON object matching this exact contract:
- Top-level fields: title, description, difficulty, type, estimatedMinutes, questions, instructions?
- Use ONLY these question "type" discriminator values:
  mcq | true_false | matching | cloze | short_answer | listening | reading | speaking | writing

Per-question required fields:
- mcq: question, options(string[]), correctAnswer(number index), explanation, difficulty
- true_false: question, correctAnswer(boolean), explanation, difficulty
- matching: question, pairs([{left,right}]), explanation, difficulty
- cloze: question, blanks([{index,answer,alternatives?}]), explanation, difficulty
- short_answer: question, expectedAnswer, keywords(string[]), explanation, difficulty
- listening: question, correctAnswer, explanation, difficulty, audioUrl?/transcript?
- reading: passage, question, correctAnswer, explanation, difficulty
- speaking: prompt, rubric({criteria:[{name,description,maxPoints}]}), difficulty, timeLimitSeconds?
- writing: prompt, rubric({criteria:[{name,description,maxPoints}]}), difficulty, wordLimit({min,max})?

CRITICAL: wordLimit MUST be an OBJECT with min and max properties, NOT a number.
Example: "wordLimit": {"min": 100, "max": 200}
WRONG: "wordLimit": 200

Strict rules:
- Never use markdown/code fences.
- Never invent schema metadata keys.
- Keep question count 8-10.
- Keep all discriminator strings lowercase exactly as listed.

${(0,h.mJ)(f)}`},{role:"user",content:`Generate an exercise set for this lesson:

Lesson: ${a.title}
Description: ${a.description}
Objectives: ${a.objectives.join("\n- ")}
Key Topics: ${a.keyTopics.join(", ")}

Exercise Parameters:
- Difficulty: ${b}
- Type: ${c}
- Previous mistakes to address: ${d.join(", ")||"None"}

Generate 8-10 questions.
If type is "mixed", include at least 5 distinct question types.
Keep content practical and concise.

Return ONLY valid JSON object.`}];try{let e=await this.client.chatCompletionWithSchema({messages:i,task:"reasoning",disableSystemRole:!0,temperature:.35,priority:"standard"},g.ep,2);return this.ensureQuestionCoverage(g.ep.parse(e),a,b,c,d,f)}catch{return this.createFallbackExerciseSet(a,b,c,d,f)}}async regenerateExercises(a,b=5){let c=[{role:"system",content:"You are an expert exercise designer. Create similar exercises to existing ones with new content."},{role:"user",content:`Generate ${b} new exercises similar to these:

Existing Exercises:
${JSON.stringify(a.questions,null,2)}

Create new exercises that:
- Test the same learning objectives
- Have the same difficulty level (${a.difficulty})
- Use different content/examples
- Follow the same question types

Return as a new ExerciseSet with the same structure.`}],d=await this.client.chatCompletionWithSchema({messages:c,task:"reasoning",disableSystemRole:!0,temperature:.8,priority:"standard"},g.ep);return g.ep.parse(d)}async generateTargetedPractice(a,b,c){let d=[{role:"system",content:"You are an expert educator. Create focused practice exercises for specific weak areas."},{role:"user",content:`Generate targeted practice exercises for these weak areas:

Weak Topics: ${a.join(", ")}
Difficulty: ${b}
Context: ${c}

Create 6-10 exercises that specifically address these weak areas.
Include a variety of question types and provide clear explanations.

Return as an ExerciseSet.`}],e=await this.client.chatCompletionWithSchema({messages:d,task:"reasoning",disableSystemRole:!0,temperature:.7,priority:"standard"},g.ep);return g.ep.parse(e)}async adjustDifficulty(a,b){let c=[{role:"system",content:"You are an expert educator. Adjust exercise difficulty while maintaining learning objectives."},{role:"user",content:`Adjust these exercises to ${b} difficulty:

Current Exercises:
${JSON.stringify(a.questions,null,2)}

Adjustments:
- For beginner: Make questions simpler, more direct, with clearer hints
- For intermediate: Add some complexity, require deeper understanding
- For advanced: Include nuanced scenarios, require synthesis of concepts

Return as a new ExerciseSet with adjusted difficulty.`}],d=await this.client.chatCompletionWithSchema({messages:c,task:"reasoning",disableSystemRole:!0,temperature:.7,priority:"standard"},g.ep);return g.ep.parse(d)}async generateSpacedRepetition(a,b){let c=[{role:"system",content:"You are an expert educator. Create spaced repetition exercises to reinforce learning."},{role:"user",content:`Generate spaced repetition exercises based on previous work:

Days since last review: ${b}

Previous Exercise Topics:
${a.map(a=>a.title).join(", ")}

Create 5-8 exercises that:
- Review key concepts from previous lessons
- Test retention of important material
- Include some new variations to keep it engaging
- Are appropriate for the time elapsed (more review if longer gap)

Return as an ExerciseSet.`}],d=await this.client.chatCompletionWithSchema({messages:c,task:"reasoning",disableSystemRole:!0,temperature:.7,priority:"standard"},g.ep);return g.ep.parse(d)}constructor(){this.client=(0,f.z)()}}let p=null;function q(){return p||(p=new o),p}class r{assessmentSchemaHint(a,b){return`Return ONLY a valid JSON object.

Required top-level fields:
- type: "${a}"
- title: string
- description: string
- timeLimitMinutes?: number
- questions: array (exactly ${b} items)
- passingScore: number
- instructions?: string
- rubric?: { criteria: [{ name, description, maxPoints, levels: [{ score, description }] }], totalPoints, passingScore }

Allowed question types ONLY:
- mcq
- true_false
- matching
- cloze
- short_answer

Question requirements:
- Every question MUST include: explanation, difficulty
- difficulty must be one of: beginner | intermediate | advanced
- mcq must include: question, options (>=2), correctAnswer (number index)
- true_false must include: question, correctAnswer (boolean)
- matching must include: question, pairs [{ left, right }]
- cloze must include: question, blanks [{ index, answer, alternatives? }]
- short_answer must include: question, expectedAnswer, keywords

Critical constraints:
- Do NOT output schema metadata such as _def, typeName, ~standard.
- Do NOT wrap JSON in markdown.
- Output JSON only.`}async generateQuiz(a,b=10,c){let d=(0,h.RZ)(c),e=[{role:"system",content:`You are an expert assessment designer at a prestigious educational institution. Create valid, high-quality, auto-gradable assessments.

${(0,h.mJ)(d)}`},{role:"user",content:`Generate a lesson quiz.

Lesson: ${a.title}
Description: ${a.description}
Objectives:
- ${a.objectives.join("\n- ")}
Key Topics: ${a.keyTopics.join(", ")}

${this.assessmentSchemaHint("quiz",b)}

Additional rules:
- Keep difficulty balanced around lesson objectives.
- Passing score should be 70.
- Prefer concrete, unambiguous wording.`}],f=await this.client.chatCompletionWithSchema({messages:e,task:"reasoning",disableSystemRole:!0,temperature:.5,priority:"reasoning"},g.s1,2);return g.s1.parse(f)}async generateTest(a,b,c=20,d){let e=(0,h.RZ)(d),f=b.map(a=>`- ${a.title}: ${a.description}`).join("\n"),i=[{role:"system",content:`You are an expert assessment designer. Create comprehensive module tests that measure learning outcomes.

${(0,h.mJ)(e)}`},{role:"user",content:`Generate a module test.

Module: ${a.title}
Description: ${a.description}
Outcomes:
- ${a.outcomes.join("\n- ")}

Lessons in this module:
${f}

${this.assessmentSchemaHint("test",c)}

Additional rules:
- Cover all major outcomes.
- Passing score should be 70.
- Time limit should be realistic for the number of questions (typically 45-60 minutes).`}],j=await this.client.chatCompletionWithSchema({messages:i,task:"reasoning",disableSystemRole:!0,temperature:.5,priority:"reasoning"},g.s1,2);return g.s1.parse(j)}async generateFinalExam(a,b,c=40,d){let e=(0,h.RZ)(d),f=b.map(a=>`- ${a.title}: ${a.description}`).join("\n"),i=[{role:"system",content:`You are an expert assessment designer. Create comprehensive final exams that measure program-level mastery.

${(0,h.mJ)(e)}`},{role:"user",content:`Generate a final exam.

Program: ${a}
Modules covered:
${f}

${this.assessmentSchemaHint("exam",c)}

Additional rules:
- Ensure broad coverage across modules.
- Include some synthesis/application questions.
- Passing score should be 70.
- Time limit should usually be 90-120 minutes.`}],j=await this.client.chatCompletionWithSchema({messages:i,task:"reasoning",disableSystemRole:!0,temperature:.5,priority:"reasoning"},g.s1,2);return g.s1.parse(j)}async generateRubric(a,b,c,d){let e=(0,h.RZ)(d),f=[{role:"system",content:`You are an expert assessment designer. Create clear, fair rubrics for subjective assessments and return strict JSON.

${(0,h.mJ)(e)}`},{role:"user",content:`Create a ${a} rubric.

Topic: ${b}
Objectives:
- ${c.join("\n- ")}

Return ONLY JSON object with:
- criteria: array of 4-6 items
  - name: string
  - description: string
  - maxPoints: number
  - levels: exactly 4 levels [{ score, description }]
- totalPoints: number
- passingScore: number

Do not output markdown or schema metadata.`}],i=await this.client.chatCompletionWithSchema({messages:f,task:"reasoning",disableSystemRole:!0,temperature:.4,priority:"reasoning"},g.Vf,2);return g.Vf.parse(i)}async generateMidtermExam(a,b,c=30,d){let e=(0,h.RZ)(d),f=b.map(a=>`- ${a.title}: ${a.description}`).join("\n"),i=[{role:"system",content:`You are an expert assessment designer. Create robust midterm exams that validate progress so far.

${(0,h.mJ)(e)}`},{role:"user",content:`Generate a midterm exam.

Program: ${a}
Modules covered so far:
${f}

${this.assessmentSchemaHint("exam",c)}

Additional rules:
- Focus on already-covered modules.
- Passing score should be 70.
- Time limit should usually be 60-90 minutes.`}],j=await this.client.chatCompletionWithSchema({messages:i,task:"reasoning",disableSystemRole:!0,temperature:.5,priority:"reasoning"},g.s1,2);return g.s1.parse(j)}constructor(){this.client=(0,f.z)()}}let s=null;function t(){return s||(s=new r),s}var u=c(58237),v=c(59500),w=c(44287);let x=new Set,y=d.Ik({lessons:d.YO(d.Ik({title:d.Yj(),objectives:d.YO(d.Yj()).min(1).max(5),estimatedMinutes:d.ai().min(20).max(120).optional()}))});async function z(a){x.has(a)||(x.add(a),A(a).catch(b=>{console.error(`Program build job ${a} crashed`,b)}).finally(()=>{x.delete(a)}))}async function A(a){let b=await (0,v.MD)(a);if("claimed"!==b){"already_running"===b&&await (0,v.cU)(a);return}let c=await (0,v.hJ)(a),d=O(c.inputProfileJson);if(!d){await (0,v.kD)(a,{status:"FAILED",error:"Invalid onboarding profile payload in job",finishedAt:new Date,currentPhase:"failed"}),await (0,v.zn)(a,{type:"job.failed",step:"Initialize",status:"FAILED",level:"ERROR",message:"Invalid onboarding profile payload in job"});return}let f=await (0,v.B3)(a),g=c.retryCount>0,i=0,j=(0,h.RZ)({contentLanguage:d.contentLanguage,instructionLanguage:d.instructionLanguage,strictTargetLanguage:d.strictTargetLanguage});try{let b;if(await (0,v.zn)(a,{type:"job.started",step:"Initialize",status:"IN_PROGRESS",message:g?`Program build worker started (retry #${c.retryCount}, resuming from: ${f.stepKey||"start"})`:"Program build worker started",payload:{programId:c.programId,isRetry:g,checkpoint:f}}),await (0,v.kD)(a,{status:"RUNNING",currentPhase:"plan",currentItem:"program-blueprint",startedAt:c.startedAt??new Date,lastHeartbeatAt:new Date,error:null}),"plan"!==f.stepKey&&c.planJson)b=O(c.planJson)||{title:d.topic,description:`Learning path for ${d.topic}`,modules:[],totalLessons:0,totalHours:0,estimatedWeeks:0,milestones:[]},await (0,v.zn)(a,{type:"phase.plan.skipped",step:"Plan",status:"SKIPPED",message:"Using existing blueprint from previous run"});else{let e=k(),f=await e.generateProgram(d,j),h=await K(d,f,j);b=function(a){let b=a.modules.slice(0,6).map((a,b)=>({...a,index:b,lessonsCount:Math.max(1,Math.min(a.lessonsCount,12)),outcomes:a.outcomes.slice(0,6)})),c=b.reduce((a,b)=>a+b.lessonsCount,0);return{...a,modules:b,totalLessons:c,totalHours:b.reduce((a,b)=>a+b.estimatedHours,0)}}(h),await (0,v.C2)(a,b,g),await (0,w.d2)(c.programId,d,b),await (0,v.zn)(a,{type:"phase.plan.completed",step:"Plan",status:"COMPLETED",message:"Program blueprint planned and persisted",payload:{moduleCount:b.modules.length,lessonCount:b.modules.reduce((a,b)=>a+b.lessonsCount,0)}})}let h=null!==f.moduleIndex?f.moduleIndex+1:0;for(let f=h;f<b.modules.length;f++){let g=b.modules[f];(await B(a,d,g,j,f)).success||(i+=1),await (0,v._Z)(a,{moduleIndex:f,stepKey:`module_${f}`}),await (0,v.kD)(a,{completedModules:await e.z.module.count({where:{programId:c.programId,buildStatus:"COMPLETED"}}),completedLessons:await e.z.lesson.count({where:{module:{programId:c.programId},buildStatus:"COMPLETED"}}),lastHeartbeatAt:new Date})}await (0,v.kD)(a,{currentPhase:"assessments",currentItem:"final-exam",lastHeartbeatAt:new Date}),await (0,v.zn)(a,{type:"phase.assessments.started",step:"Assessments",status:"IN_PROGRESS",message:"Generating cross-module final assessment artifacts"}),await F(a,b,j),await (0,v.zn)(a,{type:"phase.assessments.completed",step:"Assessments",status:"COMPLETED",message:"Assessment generation completed"}),await (0,v.kD)(a,{currentPhase:"schedule",currentItem:"build-calendar",lastHeartbeatAt:new Date}),await (0,v.zn)(a,{type:"phase.schedule.started",step:"Schedule",status:"IN_PROGRESS",message:"Building deterministic schedule"}),await G(c.programId,b,d),await (0,v.zn)(a,{type:"phase.schedule.completed",step:"Schedule",status:"COMPLETED",message:"Schedule generated and persisted"}),await e.z.program.update({where:{id:c.programId},data:{status:"ACTIVE"}}),await (0,v.kD)(a,{status:"COMPLETED",currentPhase:"completed",currentItem:null,finishedAt:new Date,error:i>0?`Completed with ${i} module(s) having failures. Check event log.`:null,completedModules:await e.z.module.count({where:{programId:c.programId,buildStatus:"COMPLETED"}}),completedLessons:await e.z.lesson.count({where:{module:{programId:c.programId},buildStatus:"COMPLETED"}})}),await (0,v.zn)(a,{type:"job.completed",step:"Complete",status:"COMPLETED",level:i>0?"WARN":"INFO",message:i>0?`Program build finished with partial failures (${i} modules).`:"Program build finished successfully.",payload:{failedModules:i}})}catch(c){let b=c instanceof Error?c.message:"Unknown build error";await (0,v.kD)(a,{status:"FAILED",currentPhase:"failed",error:b,finishedAt:new Date,lastHeartbeatAt:new Date}),await (0,v.zn)(a,{type:"job.failed",step:"Complete",status:"FAILED",level:"ERROR",message:b})}}async function B(a,b,c,d,f){let g=await (0,v.hJ)(a),h=await (0,v.B3)(a),i=await e.z.module.findFirst({where:{programId:g.programId,index:c.index},include:{lessons:{orderBy:{index:"asc"}}}});if(!i)return await (0,v.zn)(a,{type:"module.failed",step:`Module ${c.index+1}`,status:"FAILED",level:"ERROR",message:`Module record not found for index ${c.index}`}),{success:!1};if("COMPLETED"===i.buildStatus)return await (0,v.zn)(a,{type:"module.skipped",step:`Module ${c.index+1}`,status:"SKIPPED",message:`Module already completed: ${i.title}`}),{success:!0};await e.z.module.update({where:{id:i.id},data:{buildStatus:"IN_PROGRESS",buildError:null}}),await (0,v.kD)(a,{currentPhase:"module",currentItem:i.title,lastHeartbeatAt:new Date}),await (0,v.zn)(a,{type:"module.started",step:`Module ${c.index+1}`,status:"IN_PROGRESS",message:`Starting module: ${i.title}`,payload:{moduleId:i.id,moduleIndex:c.index,moduleTitle:i.title}});try{let j=await C(a,b,c,i.id,d),k=h.moduleIndex===f&&null!==h.lessonIndex?h.lessonIndex+1:0;for(let e=k;e<j.length;e++){let h=j[e];await D(a,b,c,i.id,e,h.lesson,d,g.programId),await (0,v._Z)(a,{moduleIndex:f,lessonIndex:e,stepKey:`module_${f}_lesson_${e}`})}return await E(a,c,i.id,d),await e.z.module.update({where:{id:i.id},data:{buildStatus:"COMPLETED",buildError:null}}),await (0,v.zn)(a,{type:"module.completed",step:`Module ${c.index+1}`,status:"COMPLETED",message:`Completed module: ${i.title}`,payload:{moduleId:i.id}}),{success:!0}}catch(d){let b=d instanceof Error?d.message:"Module processing failed";return await e.z.module.update({where:{id:i.id},data:{buildStatus:"FAILED",buildError:b}}),await (0,v.zn)(a,{type:"module.failed",step:`Module ${c.index+1}`,status:"FAILED",level:"ERROR",message:b,payload:{moduleId:i.id}}),{success:!1}}}async function C(a,b,c,d,f){let g=await e.z.lesson.findMany({where:{moduleId:d},orderBy:{index:"asc"}}),h=Math.max(1,Math.min(c.lessonsCount,12));if(g.length>=h)return g.slice(0,h).map(a=>({index:a.index,lesson:{title:a.title,objectives:O(a.objectivesJson)??c.outcomes.slice(0,3),estimatedMinutes:a.estimatedMinutes}}));await (0,v.zn)(a,{type:"module.plan_lessons.started",step:`Module ${c.index+1}`,status:"IN_PROGRESS",message:`Planning ${h} lessons for ${c.title}`});let i=await H(b,c,h,f);for(let a=0;a<h;a++){let b=i[a]??{title:`Lesson ${a+1}: ${c.title}`,objectives:c.outcomes.slice(0,3),estimatedMinutes:45};await e.z.lesson.upsert({where:{moduleId_index:{moduleId:d,index:a}},create:{moduleId:d,index:a,title:b.title,objectivesJson:JSON.stringify(b.objectives),estimatedMinutes:b.estimatedMinutes??45,buildStatus:"PENDING"},update:{title:b.title,objectivesJson:JSON.stringify(b.objectives),estimatedMinutes:b.estimatedMinutes??45}})}return await (0,v.zn)(a,{type:"module.plan_lessons.completed",step:`Module ${c.index+1}`,status:"COMPLETED",message:`Lesson plan generated for ${c.title}`,payload:{lessonCount:h}}),(await e.z.lesson.findMany({where:{moduleId:d},orderBy:{index:"asc"},take:h})).map(a=>({index:a.index,lesson:{title:a.title,objectives:O(a.objectivesJson)??c.outcomes.slice(0,3),estimatedMinutes:a.estimatedMinutes}}))}async function D(a,b,c,d,f,g,i,j){let k,o,p=async()=>{await (0,v.kD)(a,{lastHeartbeatAt:new Date})},r=async b=>{await p();let c=setInterval(()=>{(0,v.kD)(a,{lastHeartbeatAt:new Date}).catch(()=>{})},12e3);try{return await b()}finally{clearInterval(c),await p()}},s=await e.z.lesson.findFirst({where:{moduleId:d,index:f},include:{resources:!0,notes:!0,exerciseSets:!0,context:!0}});if(!s||"COMPLETED"===s.buildStatus)return;let t={index:f,title:g.title,description:`${g.title} in ${c.title}`,objectives:g.objectives,estimatedMinutes:g.estimatedMinutes??s.estimatedMinutes??45,keyTopics:g.objectives.slice(0,3)},u=s.context?.resourcePlanJson?JSON.parse(s.context.resourcePlanJson):null;if(!u){let a=await e.z.programContext.findUnique({where:{programId:j}}),b=a?{profileSummary:a.profileSummary,planSummary:a.planSummary,moduleOutlines:JSON.parse(a.moduleOutlinesJson||"[]"),constraints:JSON.parse(a.constraintsJson||"{}"),languagePolicy:JSON.parse(a.languagePolicyJson||"{}")}:null;u=await (0,w.Jq)(t,c.title,b)}await e.z.lesson.update({where:{id:s.id},data:{buildStatus:"IN_PROGRESS",buildError:null,title:t.title,objectivesJson:JSON.stringify(t.objectives),estimatedMinutes:t.estimatedMinutes}}),await (0,v.zn)(a,{type:"lesson.started",step:`Module ${c.index+1} / Lesson ${f+1}`,status:"IN_PROGRESS",message:`Building lesson: ${t.title}`,payload:{moduleId:d,lessonId:s.id,lessonIndex:f,lessonTitle:t.title}});let x=[];try{await (0,v.zn)(a,{type:"lesson.gather_context.started",step:`Module ${c.index+1} / Lesson ${f+1}`,status:"IN_PROGRESS",message:"Gathering learning resources"});let d=(0,l.C)();x=await r(()=>d.findResources(b.topic,t,c.title,b.learningPreferences,i)),await (0,v.zn)(a,{type:"lesson.gather_context.completed",step:`Module ${c.index+1} / Lesson ${f+1}`,status:"COMPLETED",message:`Gathered ${x.length} resources`})}catch(b){await (0,v.zn)(a,{type:"lesson.gather_context.failed",step:`Module ${c.index+1} / Lesson ${f+1}`,status:"FAILED",level:"WARN",message:b instanceof Error?b.message:"Resource curation failed"}),x=[]}let y=(n||(n=new m),n),z=q();try{await (0,v.zn)(a,{type:"lesson.draft.started",step:`Module ${c.index+1} / Lesson ${f+1}`,status:"IN_PROGRESS",message:"Drafting lesson notes and practice content"}),k=await r(()=>y.buildLessonNotes(t,x,c.title,i)),(0,h.N6)(k,i)&&(k=await L(t,k,i))}catch(b){await (0,v.zn)(a,{type:"lesson.draft.failed",step:`Module ${c.index+1} / Lesson ${f+1}`,status:"FAILED",level:"WARN",message:b instanceof Error?b.message:"Lesson draft failed"}),k=function(a,b){let c=a=>"english"===b.contentLanguage.toLowerCase()?a:`[${b.contentLanguage}] ${a}`;return{summary:c(`This lesson covers ${a.title}. Use the objectives below to guide study and revision.`),keyPoints:a.objectives.slice(0,5).map(c),glossary:a.objectives.slice(0,3).map(a=>({term:a.split(" ").slice(0,3).join(" "),definition:c(a)})),guidedNotes:[{section:c("Core Objectives"),content:c(a.objectives.join("; ")),questions:[c("What concept in this lesson feels hardest?"),c("How will you practice this objective today?")]}],additionalResources:[]}}(t,i)}try{o=await r(()=>z.generateExerciseSet(t,"intermediate","mixed",[],i)),(0,h.N6)(o,i)&&(o=await M(t,o,"intermediate","mixed",i))}catch(b){await (0,v.zn)(a,{type:"lesson.exercises.failed",step:`Module ${c.index+1} / Lesson ${f+1}`,status:"FAILED",level:"WARN",message:b instanceof Error?b.message:"Exercise generation failed"}),o=function(a,b){let c=a=>"english"===b.contentLanguage.toLowerCase()?a:`[${b.contentLanguage}] ${a}`;return{title:c(`${a.title} Practice Set`),description:c("Fallback practice set generated after exercise pipeline error."),difficulty:"intermediate",type:"mixed",estimatedMinutes:20,questions:[],instructions:c("Regenerate this practice set from the Practice Lab for expanded questions.")}}(t,i)}await (0,v.zn)(a,{type:"lesson.review.started",step:`Module ${c.index+1} / Lesson ${f+1}`,status:"IN_PROGRESS",message:"Reviewing and refining draft artifacts"});let A=await r(()=>I(t,k,i)),B=await r(()=>J(t,o));await (0,v.zn)(a,{type:"lesson.review.completed",step:`Module ${c.index+1} / Lesson ${f+1}`,status:"COMPLETED",message:"Chunk review completed"}),await e.z.$transaction(async a=>{for(let b of(await a.resource.deleteMany({where:{lessonId:s.id}}),x))await a.resource.create({data:{lessonId:s.id,type:b.type.toUpperCase(),title:b.title,url:b.url,durationSeconds:b.durationSeconds??null,sourceMetaJson:JSON.stringify({channel:b.channel,reason:b.reason,relevanceScore:b.relevanceScore}),qualityScore:b.qualityScore}});await a.lessonNote.upsert({where:{lessonId:s.id},create:{lessonId:s.id,contentMarkdown:A.summary,glossaryJson:JSON.stringify(A.glossary)},update:{contentMarkdown:A.summary,glossaryJson:JSON.stringify(A.glossary)}}),await a.exerciseSet.deleteMany({where:{lessonId:s.id}}),await a.exerciseSet.create({data:{lessonId:s.id,difficulty:"INTERMEDIATE",type:"MIXED",schemaVersion:"2.0-iterative",contentJson:JSON.stringify(B)}}),await a.lesson.update({where:{id:s.id},data:{buildStatus:"COMPLETED",buildError:null}})});let C=await e.z.lesson.count({where:{moduleId:d,buildStatus:"COMPLETED"}});await (0,v.zn)(a,{type:"lesson.completed",step:`Module ${c.index+1} / Lesson ${f+1}`,status:"COMPLETED",message:`Lesson ready: ${t.title}`,payload:{lessonId:s.id,moduleId:d,moduleProgress:C,summary:A.summary}}),await (0,w.f9)(s.id,t,A.summary,u)}async function E(a,b,c,d){let f=await (0,v.hJ)(a);if(!await e.z.assessment.findFirst({where:{programId:f.programId,moduleId:c,type:"QUIZ"}}))try{let g=t(),h=await g.generateQuiz({index:0,title:`${b.title} Quiz`,description:`Coverage quiz for ${b.title}`,objectives:b.outcomes,estimatedMinutes:20,keyTopics:b.outcomes},10,d),i=await N({...h,type:"quiz"},{index:0,title:`${b.title} Quiz`,description:`Coverage quiz for ${b.title}`,objectives:b.outcomes,estimatedMinutes:20,keyTopics:b.outcomes},d);await e.z.assessment.create({data:{programId:f.programId,moduleId:c,type:"QUIZ",title:i.title,rubricJson:JSON.stringify(i.rubric??null),contentJson:JSON.stringify(i.questions)}}),await (0,v.zn)(a,{type:"module.quiz.completed",step:`Module ${b.index+1}`,status:"COMPLETED",message:`Quiz generated for ${b.title}`})}catch(d){await e.z.assessment.create({data:{programId:f.programId,moduleId:c,type:"QUIZ",title:`${b.title} Quiz (Fallback)`,rubricJson:JSON.stringify(null),contentJson:JSON.stringify([])}}),await (0,v.zn)(a,{type:"module.quiz.failed",step:`Module ${b.index+1}`,status:"FAILED",level:"WARN",message:d instanceof Error?d.message:"Quiz generation failed, fallback created"})}}async function F(a,b,c){let d=await (0,v.hJ)(a);if(await e.z.assessment.findFirst({where:{programId:d.programId,moduleId:null,type:"EXAM",title:"Final Exam"}}))return;let f=t();try{let a=await f.generateFinalExam(b.title,b.modules,40,c),g=await N({...a,type:"exam"},{index:0,title:"Final Exam",description:`Program final assessment for ${b.title}`,objectives:b.modules.flatMap(a=>a.outcomes).slice(0,12),estimatedMinutes:90,keyTopics:b.modules.map(a=>a.title).slice(0,10)},c);await e.z.assessment.create({data:{programId:d.programId,type:"EXAM",title:"Final Exam",rubricJson:JSON.stringify(g.rubric??null),contentJson:JSON.stringify(g.questions)}})}catch(b){await e.z.assessment.create({data:{programId:d.programId,type:"EXAM",title:"Final Exam (Fallback)",rubricJson:JSON.stringify(null),contentJson:JSON.stringify([])}}),await (0,v.zn)(a,{type:"final_exam.failed",step:"Assessments",status:"FAILED",level:"WARN",message:b instanceof Error?b.message:"Final exam generation failed, fallback created"})}}async function G(a,b,c){await e.z.schedule.deleteMany({where:{programId:a}});let d=new Date,f=new Date(c.targetDate),g=await e.z.schedule.create({data:{programId:a,timezone:"UTC",startDate:d,endDate:f}}),h=await e.z.lesson.findMany({where:{module:{programId:a}},include:{module:!0},orderBy:[{module:{index:"asc"}},{index:"asc"}]}),i=Math.max(60,Math.min(600,60*c.hoursPerDay)),j=new Date(d),k=0,l=async a=>{k+a.estimatedMinutes>i&&(j=function(a,b){let c=new Date(a);return c.setDate(c.getDate()+1),c}(j,1),k=0),await e.z.scheduleItem.create({data:{scheduleId:g.id,date:new Date(j),type:a.type,refId:a.refId??null,estimatedMinutes:a.estimatedMinutes,status:"PENDING"}}),k+=a.estimatedMinutes};for(let a=0;a<h.length;a++){let b=h[a];await l({type:"LESSON",refId:b.id,estimatedMinutes:Math.max(25,Math.min(120,b.estimatedMinutes))}),await l({type:"EXERCISE",refId:b.id,estimatedMinutes:30}),(a+1)%4==0&&await l({type:"REVIEW",estimatedMinutes:35})}for(let b of(await e.z.module.findMany({where:{programId:a},orderBy:{index:"asc"}}))){let c=await e.z.assessment.findFirst({where:{programId:a,moduleId:b.id,type:"QUIZ"},orderBy:{createdAt:"asc"}});c&&await l({type:"QUIZ",refId:c.id,estimatedMinutes:30})}let m=await e.z.assessment.findFirst({where:{programId:a,type:"EXAM"},orderBy:{createdAt:"asc"}});m&&await l({type:"EXAM",refId:m.id,estimatedMinutes:90})}async function H(a,b,c,d){let e=(0,u.getOpenRouterClient)();try{return(await e.chatCompletionWithSchema({task:"reasoning",disableSystemRole:!0,temperature:.4,messages:[{role:"system",content:`You are a curriculum planning assistant. Create concise lesson chunks for one module. Return strict JSON only.

${(0,h.mJ)(d)}`},{role:"user",content:`Plan ${c} lessons for this module.

Topic: ${a.topic}
Current level: ${a.currentLevel}
Goal level: ${a.goalLevel}
Module title: ${b.title}
Module outcomes:
- ${b.outcomes.join("\n- ")}

Return JSON object with:
{
  "lessons": [
    {
      "title": "string",
      "objectives": ["string"],
      "estimatedMinutes": 45
    }
  ]
}

Rules:
- exactly ${c} lessons
- objectives per lesson: 2-4 bullet items
- realistic titles, no generic numbering-only titles`}]},y)).lessons.slice(0,c)}catch{return Array.from({length:c}).map((a,c)=>({title:`${b.title} — Lesson ${c+1}`,objectives:b.outcomes.slice(0,3),estimatedMinutes:45}))}}async function I(a,b,c){let d=(0,u.getOpenRouterClient)();try{let e=await d.chatCompletionWithSchema({task:"reasoning",disableSystemRole:!0,temperature:.3,messages:[{role:"system",content:`You are a lesson QA reviewer. Refine lesson notes for clarity and coverage while preserving schema. Return JSON only.

${(0,h.mJ)(c)}`},{role:"user",content:`Refine this lesson notes chunk.

Lesson: ${a.title}
Objectives:
- ${a.objectives.join("\n- ")}

Current notes JSON:
${JSON.stringify(b)}`}]},g.lG,2);return g.lG.parse(e)}catch{return b}}async function J(a,b){return g.ep.parse(b)}async function K(a,b,c){return(0,h.N6)(b,c)?k().generateProgram(a,c):b}async function L(a,b,c){let d=(0,u.getOpenRouterClient)();try{let e=await d.chatCompletionWithSchema({task:"reasoning",disableSystemRole:!0,temperature:.2,messages:[{role:"system",content:`You repair lesson notes language compliance while preserving meaning and structure.

${(0,h.mJ)(c)}`},{role:"user",content:`Rewrite this lesson notes payload to fully comply with language policy.

Lesson: ${a.title}
Objectives:
- ${a.objectives.join("\n- ")}

JSON:
${JSON.stringify(b)}`}]},g.lG,2);return g.lG.parse(e)}catch{return b}}async function M(a,b,c,d,e){let f=q();try{let b=await f.generateExerciseSet(a,c,d,[],e);if(!(0,h.N6)(b,e))return b}catch{}return b}async function N(a,b,c){if(!(0,h.N6)(a,c))return a;let d=t();return"quiz"===a.type?d.generateQuiz(b,a.questions.length||10,c):a}function O(a){try{return JSON.parse(a)}catch{return null}}},23080:(a,b,c)=>{c.d(b,{N6:()=>i,RZ:()=>g,mJ:()=>h});let d="English",e=new Set(["the","and","is","are","to","of","in","for","with","that","this","you","your","from","what","when","where","which","how","why","can","could","should","will","would","about","into","through","between","because","more","most","than","then","very","also","only","not","true","false"]);function f(a,b=d){if("string"!=typeof a)return b;let c=a.trim();return c||b}function g(a){return{contentLanguage:f(a?.contentLanguage,d),instructionLanguage:f(a?.instructionLanguage,"English"),strictTargetLanguage:a?.strictTargetLanguage??!0}}function h(a){let b=a.contentLanguage.toLowerCase();return"english"===b||"en"===b?`
Language policy:
- All content must be in English
- This includes questions, answers, explanations, and all learner-facing text
`.trim():`
CRITICAL LANGUAGE REQUIREMENT - YOU MUST FOLLOW THIS:
- Target language: ${a.contentLanguage}
- ALL content MUST be written in ${a.contentLanguage}
- This includes: questions, answers, options, explanations, passages, prompts, and all learner-facing text
- ZERO English words allowed except proper nouns/names
- If the target language is German: write everything in German
- If the target language is Spanish: write everything in Spanish
- If the target language is French: write everything in French
- Before responding, verify every sentence is in ${a.contentLanguage}
- DO NOT output any English except in code/technical terms if absolutely necessary
- Content in wrong language will be rejected
`.trim()}function i(a,b){if(!b.strictTargetLanguage)return!1;let c=b.contentLanguage.toLowerCase();if("english"===c||"en"===c)return!1;let d=[];return!function a(b,c,d){if(!(c.length>=d)){if("string"==typeof b){let a=b.trim();a.length>1&&c.push(a);return}if(Array.isArray(b)){for(let e of b)if(a(e,c,d),c.length>=d)break;return}if(b&&"object"==typeof b){for(let e of Object.values(b))if(a(e,c,d),c.length>=d)return}}}(a,d,500),0!==d.length&&function(a){let b=0,c=0;for(let d of a){let a=d.toLowerCase().match(/[a-zA-Z][a-zA-Z'-]*/g);if(a)for(let d of a)b+=1,e.has(d)&&(c+=1)}return 0===b?0:c/b}(d)>.2}},44287:(a,b,c)=>{c.d(b,{Jq:()=>k,d2:()=>e,f9:()=>f,x7:()=>i});var d=c(96798);async function e(a,b,c){let e=`Student wants to learn ${b.topic} from ${b.currentLevel} to ${b.goalLevel}. 
    Target: ${b.targetDate}. 
    Pace: ${b.pacePreference} (${b.hoursPerDay}h/day). 
    Preferences: Video ${b.learningPreferences.videoPreference}%, Reading ${b.learningPreferences.readingPreference}%.`,f=`Program: ${c.title}. ${c.description}. 
    ${c.modules.length} modules, ${c.totalLessons} lessons, 
    ${c.totalHours} hours total, ${c.estimatedWeeks} weeks.`,g=c.modules.map(a=>({index:a.index,title:a.title,outcomes:a.outcomes})),h={targetDate:b.targetDate,hoursPerDay:b.hoursPerDay,currentLevel:b.currentLevel,goalLevel:b.goalLevel},i={contentLanguage:b.contentLanguage,instructionLanguage:b.instructionLanguage,strictTargetLanguage:b.strictTargetLanguage};await d.z.programContext.upsert({where:{programId:a},create:{programId:a,profileSummary:e,planSummary:f,moduleOutlinesJson:JSON.stringify(g),constraintsJson:JSON.stringify(h),languagePolicyJson:JSON.stringify(i)},update:{profileSummary:e,planSummary:f,moduleOutlinesJson:JSON.stringify(g),constraintsJson:JSON.stringify(h),languagePolicyJson:JSON.stringify(i)}})}async function f(a,b,c="",e){let g=b.objectives,h=b.keyTopics,i=function(a){let b=a.estimatedMinutes||30,c=a.objectives.length;return b<30||c<=2?"beginner":b>60||c>=5?"advanced":"intermediate"}(b),j=b.estimatedMinutes;await d.z.lessonContext.upsert({where:{lessonId:a},create:{lessonId:a,objectivesJson:JSON.stringify(g),notesSummary:c,keyTopicsJson:JSON.stringify(h),difficultyLevel:i,expectedMinutes:j,resourcePlanJson:e?JSON.stringify(e):"{}"},update:{objectivesJson:JSON.stringify(g),notesSummary:c,keyTopicsJson:JSON.stringify(h),difficultyLevel:i,expectedMinutes:j,resourcePlanJson:e?JSON.stringify(e):"{}"}})}async function g(a){let b=await d.z.programContext.findUnique({where:{programId:a}});if(!b)return null;let c=j(b.constraintsJson),e=j(b.languagePolicyJson);return{profileSummary:b.profileSummary,planSummary:b.planSummary,moduleOutlines:j(b.moduleOutlinesJson)??[],constraints:c??{targetDate:"",hoursPerDay:1,currentLevel:"beginner",goalLevel:"intermediate"},languagePolicy:e??{contentLanguage:"en",instructionLanguage:"en",strictTargetLanguage:!1}}}async function h(a){let b=await d.z.lessonContext.findUnique({where:{lessonId:a}});return b?{objectives:j(b.objectivesJson)??[],notesSummary:b.notesSummary,keyTopics:j(b.keyTopicsJson)??[],difficultyLevel:b.difficultyLevel??"intermediate",expectedMinutes:b.expectedMinutes??30}:null}async function i(a){let{programId:b,lessonId:c,moduleId:e}=a,f=await g(b),i=null,k=null;if(c&&(i=await h(c)),e){let a=await d.z.module.findUnique({where:{id:e}});a&&(k={index:a.index,title:a.title,outcomes:j(a.outcomesJson)??[]})}let l=function(a){let b=[];if(a.programContext){let c=a.programContext;b.push("=== PROGRAM CONTEXT ==="),b.push(`Topic: ${c.profileSummary}`),b.push(`Plan: ${c.planSummary}`),b.push(`Target: ${c.constraints.currentLevel} → ${c.constraints.goalLevel}`),b.push(`Language: ${c.languagePolicy.contentLanguage} (content), ${c.languagePolicy.instructionLanguage} (instruction)`),b.push(`Strict language: ${c.languagePolicy.strictTargetLanguage}`)}if(a.moduleContext){let c=a.moduleContext;b.push(`
=== MODULE CONTEXT ===`),b.push(`Module ${c.index+1}: ${c.title}`),b.push(`Outcomes:
${c.outcomes.map(a=>`  - ${a}`).join("\n")}`)}if(a.lessonContext){let c=a.lessonContext;b.push(`
=== LESSON CONTEXT ===`),b.push(`Objectives:
${c.objectives.map(a=>`  - ${a}`).join("\n")}`),b.push(`Key Topics: ${c.keyTopics.join(", ")}`),b.push(`Difficulty: ${c.difficultyLevel}, Duration: ${c.expectedMinutes}min`),c.notesSummary&&b.push(`Notes Summary: ${c.notesSummary}`)}return b.join("\n")}({programContext:f,lessonContext:i,moduleContext:k});return{programContext:f,lessonContext:i,moduleContext:k,formattedPrompt:l}}function j(a){if(!a)return null;try{return JSON.parse(a)}catch{return null}}async function k(a,b,d){let{getOpenRouterClient:e}=await Promise.resolve().then(c.bind(c,58237)),{z:f}=await c.e(966).then(c.bind(c,40966)),g=f.object({targetVideoCount:f.number().min(2).max(10),targetReadingCount:f.number().min(0).max(5).optional(),preferredFormat:f.enum(["tutorial","playlist","lecture","mixed"]).optional(),rationale:f.string().min(10).max(200)}),h=a.estimatedMinutes||30,i=a.objectives.length,j=`You are a curriculum planner. Decide how many learning resources this lesson needs.

Lesson: ${a.title}
Module: ${b}
Estimated duration: ${h} minutes
Objectives (${i}):
${a.objectives.map((a,b)=>`${b+1}. ${a}`).join("\n")}

${d?`Program context: ${d.profileSummary}`:""}

Return a JSON object with:
{
  "targetVideoCount": number (2-10, based on lesson complexity),
  "targetReadingCount": number (0-5, optional),
  "preferredFormat": "tutorial" | "playlist" | "lecture" | "mixed" (optional),
  "rationale": "brief explanation of your decision"
}

Guidelines:
- Longer lessons (60+ min) need more videos (6-10)
- Shorter lessons (30-45 min) need fewer videos (2-5)
- Complex topics benefit from playlists
- Practical skills benefit from tutorials
- Theory-heavy topics benefit from lectures`;try{let a=e();return await a.chatCompletionWithSchema({task:"reasoning",disableSystemRole:!0,temperature:.4,messages:[{role:"system",content:"You are a curriculum planning assistant. Return strict JSON only."},{role:"user",content:j}]},g,2)}catch(a){return{targetVideoCount:Math.min(10,Math.max(2,(h>60?6:h>45?4:3)+Math.floor(i/2))),targetReadingCount:Math.floor(i/2),preferredFormat:"mixed",rationale:"Fallback heuristic based on lesson duration and objectives count."}}}},59500:(a,b,c)=>{c.d(b,{B3:()=>r,C2:()=>p,GH:()=>o,MD:()=>h,Qs:()=>e,Vp:()=>f,_Z:()=>q,cU:()=>i,gO:()=>j,hJ:()=>g,k4:()=>n,kD:()=>l,qo:()=>k,zn:()=>m});var d=c(96798);async function e(a){return await d.z.$transaction(async b=>{let c=await b.program.create({data:{userId:a.userId,topic:a.topic,goal:a.goalLevel,targetDate:new Date(a.targetDate),hoursPerDay:a.hoursPerDay,currentLevel:a.currentLevel,contentLanguage:a.contentLanguage,instructionLanguage:a.instructionLanguage,strictTargetLanguage:a.strictTargetLanguage,status:"DRAFT",version:1}});return{jobId:(await b.programBuildJob.create({data:{userId:a.userId,programId:c.id,status:"QUEUED",inputProfileJson:JSON.stringify(a.profile),currentPhase:"queued",currentItem:null}})).id,programId:c.id}})}async function f(a){return d.z.programBuildJob.findFirst({where:{userId:a,status:{in:["QUEUED","RUNNING"]}},orderBy:{createdAt:"desc"}})}async function g(a){let b=await d.z.programBuildJob.findUnique({where:{id:a}});if(!b)throw Error(`Build job not found: ${a}`);return b}async function h(a,b={allowStealStaleRunning:!1,staleMs:18e4}){let c=await g(a);if("RUNNING"===c.status){let a=b.staleMs??18e4,d=c.lastHeartbeatAt?.getTime()??c.updatedAt.getTime(),e=Date.now()-d>a;if(!b.allowStealStaleRunning||!e)return"already_running"}return"COMPLETED"===c.status||"CANCELED"===c.status?"already_finished":(await d.z.programBuildJob.update({where:{id:a},data:{status:"RUNNING",startedAt:c.startedAt??new Date,lastHeartbeatAt:new Date,error:null}}),"claimed")}async function i(a,b=18e4){let c=await d.z.programBuildJob.findUnique({where:{id:a}});if(!c||"RUNNING"!==c.status)return!1;let e=c.lastHeartbeatAt?.getTime()??c.updatedAt.getTime();return Date.now()-e>b&&(await d.z.programBuildJob.update({where:{id:a},data:{status:"FAILED",currentPhase:"failed",error:`Build heartbeat stale for more than ${Math.floor(b/1e3)}s`,finishedAt:new Date,lastHeartbeatAt:new Date}}),await m(a,{type:"job.failed.stale_heartbeat",step:"Recovery",status:"FAILED",level:"ERROR",message:`Build marked as failed due to stale heartbeat (${Math.floor(b/1e3)}s timeout).`}),!0)}async function j(a){return d.z.programBuildJob.findFirst({where:{programId:a},orderBy:{createdAt:"desc"}})}async function k(a){let b=await d.z.programBuildJob.findUnique({where:{id:a}});if(!b)return{ok:!1,reason:"not_found"};if("FAILED"!==b.status)return{ok:!1,reason:"invalid_status"};if(b.retryCount>=b.maxRetries)return{ok:!1,reason:"max_retries_reached"};let c=b.lastCompletedStepKey??"plan";return{ok:!0,retryCount:(await d.z.programBuildJob.update({where:{id:a},data:{status:"QUEUED",currentPhase:"queued",currentItem:null,error:null,startedAt:null,finishedAt:null,lastHeartbeatAt:null,retryCount:{increment:1}}})).retryCount,resumeFrom:c}}async function l(a,b){let c={};void 0!==b.status&&(c.status=b.status),void 0!==b.currentPhase&&(c.currentPhase=b.currentPhase),void 0!==b.currentItem&&(c.currentItem=b.currentItem),void 0!==b.totalModules&&(c.totalModules=b.totalModules),void 0!==b.completedModules&&(c.completedModules=b.completedModules),void 0!==b.totalLessons&&(c.totalLessons=b.totalLessons),void 0!==b.completedLessons&&(c.completedLessons=b.completedLessons),void 0!==b.retryCount&&(c.retryCount=b.retryCount),void 0!==b.planJson&&(c.planJson=JSON.stringify(b.planJson)),void 0!==b.error&&(c.error=b.error),void 0!==b.startedAt&&(c.startedAt=b.startedAt),void 0!==b.finishedAt&&(c.finishedAt=b.finishedAt),void 0!==b.lastHeartbeatAt&&(c.lastHeartbeatAt=b.lastHeartbeatAt),0!==Object.keys(c).length&&await d.z.programBuildJob.update({where:{id:a},data:c})}async function m(a,b){let c=(await g(a)).lastEventIndex+1;return await d.z.$transaction([d.z.programBuildEvent.create({data:{jobId:a,index:c,type:b.type,step:b.step,status:b.status,level:b.level??"INFO",message:b.message,payloadJson:JSON.stringify(b.payload??{})}}),d.z.programBuildJob.update({where:{id:a},data:{lastEventIndex:c,lastHeartbeatAt:new Date}})]),c}async function n(a,b){return(await d.z.programBuildEvent.findMany({where:{jobId:a,index:{gt:b}},orderBy:{index:"asc"}})).map(a=>({...a,payload:s(a.payloadJson)}))}async function o(a){let b=await d.z.programBuildJob.findUnique({where:{id:a},include:{program:{include:{modules:{orderBy:{index:"asc"},include:{lessons:{orderBy:{index:"asc"},include:{resources:!0,notes:!0,exerciseSets:{orderBy:{createdAt:"desc"},take:1}}}}}}}}});return b?{job:{...b,inputProfile:s(b.inputProfileJson),plan:s(b.planJson)},program:{...b.program,modules:b.program.modules.map(a=>({...a,outcomes:s(a.outcomesJson)??[],lessons:a.lessons.map(a=>({...a,objectives:s(a.objectivesJson)??[],latestExerciseSet:a.exerciseSets[0]?{...a.exerciseSets[0],content:s(a.exerciseSets[0].contentJson)}:null}))}))}}:null}async function p(a,b,c=!1){let e=await g(a);await d.z.$transaction(async d=>{for(let a of(c||await d.module.deleteMany({where:{programId:e.programId}}),b.modules))await d.module.upsert({where:{programId_index:{programId:e.programId,index:a.index}},create:{programId:e.programId,index:a.index,title:a.title,outcomesJson:JSON.stringify(a.outcomes),buildStatus:"PENDING"},update:{title:a.title,outcomesJson:JSON.stringify(a.outcomes)}});await d.programBuildJob.update({where:{id:a},data:{totalModules:b.modules.length,completedModules:c?e.completedModules:0,totalLessons:b.modules.reduce((a,b)=>a+b.lessonsCount,0),completedLessons:c?e.completedLessons:0,planJson:JSON.stringify(b),lastCompletedStepKey:"plan"}})})}async function q(a,b){let c={lastCompletedStepKey:b.stepKey};void 0!==b.moduleIndex&&(c.lastCompletedModuleIndex=b.moduleIndex),void 0!==b.lessonIndex&&(c.lastCompletedLessonIndex=b.lessonIndex),b.data&&(c.checkpointDataJson=JSON.stringify(b.data)),await d.z.programBuildJob.update({where:{id:a},data:c})}async function r(a){let b=await g(a);return{moduleIndex:b.lastCompletedModuleIndex??null,lessonIndex:b.lastCompletedLessonIndex??null,stepKey:b.lastCompletedStepKey??null,data:b.checkpointDataJson?JSON.parse(b.checkpointDataJson):{}}}function s(a){if(!a)return null;try{return JSON.parse(a)}catch{return null}}},81064:(a,b,c)=>{c.d(b,{C:()=>v});var d=c(6563),e=c(23080);let f="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",g=new Map,h=new Map,i=new Set(["example.com","www.example.com","localhost","127.0.0.1","0.0.0.0"]),j=["youtube.com","youtu.be","wikipedia.org","khanacademy.org","coursera.org","edx.org","udemy.com","futurelearn.com","open.edu","mit.edu","stanford.edu","harvard.edu","thoughtco.com","bbc.co.uk","medium.com","dev.to","github.com"],k=new Set(["khanacademy","crashcourse","ted-ed","veritasium","3blue1brown","computerphile","numberphile","freecodecamp","thecodingtrain","fireship","traversymedia","academind","programmingwithmosh","codewithharry","brocodez","amigoscode","techworldwithnana","husseinnasser","systemdesignprimer","mitocw","stanfordonline","yalecourses","nptelhrd","coursera","edx","udacity","pluralsight","laracasts","wesbos","leveluptuts","netninja","derekbanas","thenewboston","programmingknowledge","telusko","javabrains","koushik_kotha","codecourse","learncodeacademy","coreyms","techwithtim","florinpop","kevinpowell","jamesqquick","benawad","fireshipio","webdevsimplified","traversymedia","academind","designcourse","garysimon","chriscourses","coltsteele","andrewneville","jonasschmedtmann","bradtraversy","wesbos","kylecookdev","netninja","davegray","johnsmilga","pedrotech","codedamn","fastcode","anujkumarsharma","apnacollege","takeuforward","striver_79","lovebabbar","codestorywithmik","pepcoding","ladder","gate","gate smashers","knowledge gate","unacademy","byju","vedantu","physics wallah","magnet brains","learn engineering","real engineering","practical engineering","branch education","kurzgesagt","minutephysics","veritasium","smartereveryday","markrober","stuffmadehere","tom scott","linus tech tips","jerryrig everything","gamers nexus","hardware unboxed","techaltar","thiojoe","techquickie","techlinked","short circuit","bitwit","jays two cents","hardware canucks","reviewtechusa","urbanist media","not just bikes","city nerd","oh the urbanity","strong towns","climate town","our changing climate","the climate reality project","project drawdown","climate action tracker","carbon brief","climate central","noaa","nasa","esa","jpl","cern","fermilab","slac","bnl","anl","ornl","nrel","sandia","los alamos","lawrence livermore","jet propulsion laboratory","goddard space flight center","marshall space flight center","johnson space center","kennedy space center","ames research center","langley research center","glenn research center","dryden flight research center","stennis space center","wallops flight facility","white sands test facility","plum brook station","neil a armstrong test facility","langley research center","ames research center","glenn research center","dryden flight research center","stennis space center","wallops flight facility","white sands test facility","plum brook station","neil a armstrong test facility"]);class l{async findResources(a,b,c,d,f,g){let h=(0,e.RZ)(f),i=JSON.stringify({topic:a,moduleTitle:c,lesson:b.title,objectives:b.objectives,keyTopics:b.keyTopics,contentLanguage:h.contentLanguage,contextHash:g?.formattedPrompt?.slice(0,100)||""}),j=this.cache.get(i);if(j&&Date.now()-j.timestamp<18e5)return j.resources;let k=this.calculateTargetResourceCount(b,d,g?.lessonContext?.resourcePlan),l=this.generateSearchQueries(a,b,c,h,g),m=await this.searchBackedDiscovery(l),n=this.mapHitsToCandidates(m,b,d,g),o=await this.validateResourceUrls(n),p=this.enforceDiversity(o,k);return this.cache.set(i,{resources:p,timestamp:Date.now()}),p}calculateTargetResourceCount(a,b,c){if(c?.targetVideoCount){let a=Number(b?.videoPreference)||50;return Math.max(2,Math.min(10,a>70?Math.min(10,c.targetVideoCount+1):a<30?Math.max(2,c.targetVideoCount-1):c.targetVideoCount))}let d=a.estimatedMinutes||30,e=a.objectives.length,f=a.keyTopics.length,g=4;d>60&&(g+=1),d>90&&(g+=1),e>4&&(g+=1),f>4&&(g+=1);let h=Number(b?.videoPreference)||50;return h>70&&(g+=1),h<30&&(g-=1),Math.max(2,Math.min(10,g))}async validateResourceUrls(a){let b=function(a){let b=new Set,c=[];for(let d of a){let a=o(d.url);a&&(b.has(a)||(b.add(a),c.push({...d,url:a})))}return c}(a),c=[];for(let a of b){if(c.length>=10)break;let b=p(a.url);if(!b||i.has(b.hostname.toLowerCase()))continue;if(m(b.hostname)){let b=await this.validateYouTubeUrl(a.url);if(!b.ok||!b.canonicalUrl)continue;let e=await this.extractYouTubeDuration(a.url);if(e.isShort)continue;let f=b.channel&&k.has(b.channel.toLowerCase().replace(/\s+/g,""))?.15:0,g=e.durationSeconds&&e.durationSeconds>=480&&e.durationSeconds<=3600?.1:0,h=d.Xf.parse({...a,type:"youtube",url:b.canonicalUrl,channel:b.channel??a.channel??null,durationSeconds:e.durationSeconds,qualityScore:q(a.qualityScore+.03+f+g,0,1)});c.push(h);continue}let e=await this.checkReachableUrl(a.url);if(!e.ok)continue;let f=d.Xf.parse({...a,url:e.finalUrl??a.url,durationSeconds:a.durationSeconds??null,qualityScore:q(a.qualityScore,0,1)});c.push(f)}return c.sort((a,b)=>{let c=.6*a.qualityScore+.4*a.relevanceScore;return .6*b.qualityScore+.4*b.relevanceScore-c})}async extractYouTubeDuration(a){let b=n(a);if(!b)return{durationSeconds:null,isShort:!1};let c=g.get(b);if(c&&Date.now()-c.timestamp<36e5)return{durationSeconds:c.durationSeconds,isShort:null!==c.durationSeconds&&c.durationSeconds<240};for(;h.size>=3;)await new Promise(a=>setTimeout(a,100));let d=this.fetchDurationInternal(b,a);h.set(b,d);try{let a=await d;return g.set(b,{durationSeconds:a.durationSeconds,timestamp:Date.now()}),a}finally{h.delete(b)}}async fetchDurationInternal(a,b){try{let c=`https://www.youtube.com/watch?v=${a}`,d=await this.fetchText(c);if(!d)return{durationSeconds:null,isShort:!1};let e=d.match(/var ytInitialPlayerResponse = ({.+?});/);if(e)try{let a=JSON.parse(e[1]),b=a?.videoDetails?.lengthSeconds;if(b){let a=parseInt(b,10);return{durationSeconds:a,isShort:a<240}}}catch{}let f=d.match(/"ytInitialPlayerResponse":({.+?}),"ytInitialData"/);if(f)try{let a=JSON.parse(f[1]),b=a?.videoDetails?.lengthSeconds;if(b){let a=parseInt(b,10);return{durationSeconds:a,isShort:a<240}}}catch{}if(b.includes("/shorts/"))return{durationSeconds:null,isShort:!0};return{durationSeconds:null,isShort:!1}}catch{return{durationSeconds:null,isShort:!1}}}generateSearchQueries(a,b,c,d,f){let g=(0,e.RZ)(d),h=b.objectives.slice(0,2).join(" "),i=b.keyTopics.slice(0,2).join(" "),j=g.contentLanguage,k="-shorts -tiktok -reels -viral -meme -funny -prank",l=[];if(l.push(`${a} ${b.title} tutorial full course lecture playlist series ${k}`),l.push(`${a} ${c} ${b.title} lecture ${k}`),b.objectives.length>0&&l.push(`${a} ${h} explained ${k}`),b.keyTopics.length>0&&l.push(`${a} ${i} complete guide ${k}`),(b.estimatedMinutes>45||b.objectives.length>3)&&(l.push(`"${b.title}" ${a} youtube playlist ${k}`),l.push(`${a} ${c} complete series ${k}`)),j&&"en"!==j&&l.push(`${a} ${b.title} ${j} tutorial ${k}`),f?.programContext){let c=f.programContext;c.constraints.goalLevel&&l.push(`${a} ${b.title} ${c.constraints.goalLevel} tutorial ${k}`)}if(f?.moduleContext){let c=f.moduleContext;if(c.outcomes.length>0){let d=c.outcomes.slice(0,1).join(" ");l.push(`${a} ${d} ${b.title} ${k}`)}}if(f?.lessonContext?.difficultyLevel){let c=f.lessonContext.difficultyLevel;"beginner"===c?l.push(`${a} ${b.title} for beginners tutorial ${k}`):"advanced"===c&&l.push(`${a} ${b.title} advanced tutorial ${k}`)}return l.map(a=>a.trim().replace(/\s+/g," ")).filter((a,b,c)=>a.length>0&&c.indexOf(a)===b).slice(0,8)}scoreResource(a,b,c){let d=.6*a.qualityScore+.4*a.relevanceScore;"youtube"===a.type&&Number(c?.videoPreference)>50&&(d+=.08),"article"===a.type&&Number(c?.readingPreference)>50&&(d+=.08);let e=`${a.title} ${a.description}`.toLowerCase();return q(d+=Math.min(.12,.03*b.filter(a=>{let b=a.toLowerCase().split(/\s+/).slice(0,3).join(" ");return b.length>2&&e.includes(b)}).length),0,1)}async getResourceMetadata(a){let b=p(a);if(!b)return{type:"unknown",url:a};if(m(b.hostname)){let b=n(a),c=await this.validateYouTubeUrl(a);return{type:"youtube",videoId:b,url:c.canonicalUrl??a,durationSeconds:null,channel:c.channel??null,valid:c.ok}}let c=await this.checkReachableUrl(a);return{type:"other",url:c.finalUrl??a,valid:c.ok}}async searchBackedDiscovery(a){let b=[];for(let c of a.slice(0,5))try{let[a,d]=await Promise.allSettled([this.searchDuckDuckGo(c),this.searchYouTube(c)]);"fulfilled"===a.status&&b.push(...a.value),"fulfilled"===d.status&&b.push(...d.value)}catch{}return(function(a){let b=new Set,c=[];for(let d of a){let a=o(d.url);a&&(b.has(a)||(b.add(a),c.push({...d,url:a})))}return c})(b).slice(0,50)}async searchDuckDuckGo(a){let b=`https://html.duckduckgo.com/html/?q=${encodeURIComponent(a)}`;try{let a=await this.fetchText(b);if(!a)return[];let c=[];for(let b of[/<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,/<a[^>]*rel="nofollow"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi]){let d;for(;null!==(d=b.exec(a))&&c.length<10;){let a=d[1],b=function(a){if(a.startsWith("/l/?")){let b=new URLSearchParams(a.split("?")[1]??"").get("uddg");if(b)try{return decodeURIComponent(b)}catch{return b}}return a.startsWith("//")?`https:${a}`:a}(a),e=o(b);if(!e)continue;let f=d[2].replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim().replace(/&/g,"&").replace(/"/g,'"').replace(/&#39;/g,"'").replace(/</g,"<").replace(/>/g,">")||"Untitled resource";(!f.toLowerCase().includes("pdf")||e.endsWith(".pdf"))&&c.push({title:f,url:e,snippet:"",source:m(new URL(e).hostname)?"youtube":"web"})}}return c}catch{return[]}}async searchYouTube(a){let b=`${a} -shorts -tiktok -reels -viral -meme -funny -prank`,c=`https://www.youtube.com/results?search_query=${encodeURIComponent(b)}`;try{let b,d=await this.fetchText(c);if(!d)return[];let e=/"videoId":"([a-zA-Z0-9_-]{11})"/g,f=new Set;for(;null!==(b=e.exec(d))&&f.size<10;)f.add(b[1]);let g=/watch\?v=([a-zA-Z0-9_-]{11})/g;for(;null!==(b=g.exec(d))&&f.size<10;)f.add(b[1]);return Array.from(f).map((b,c)=>({title:`YouTube: ${a.slice(0,40)}...`,url:`https://www.youtube.com/watch?v=${b}`,snippet:a,source:"youtube"}))}catch{return[]}}mapHitsToCandidates(a,b,c,e){let f=r([b.title,...b.objectives,...b.keyTopics,...e?.moduleContext?.outcomes||[],...e?.programContext?.moduleOutlines?.flatMap(a=>a.outcomes)||[]].join(" ")),g=[];for(let k of a){var h;let a=p(k.url);if(!a||i.has(a.hostname.toLowerCase()))continue;let l=`${k.title} ${k.snippet}`.toLowerCase(),n=s(f,r(l)),o=q(.35+.65*n,0,1),t=m((h=a).hostname)?"youtube":h.pathname.toLowerCase().endsWith(".pdf")?"book":"article",u=function(a){let b=a.toLowerCase();return j.some(a=>b.includes(a))?.22:b.endsWith(".edu")?.2:b.endsWith(".org")?.12:b.endsWith(".gov")?.15:.04}(a.hostname),v="youtube"===t?.08*(Number(c?.videoPreference)>50):"article"===t?.08*(Number(c?.readingPreference)>50):0,w=k.title.toLowerCase(),x=w.includes("tutorial")||w.includes("course")||w.includes("lecture")||w.includes("complete")||w.includes("full")||w.includes("series")||w.includes("playlist")?.12:0,y=0;if(e?.programContext){let a=e.programContext;y+=Math.min(.08,.2*s(r(a.profileSummary+" "+a.planSummary),r(l)))}e?.moduleContext&&(y+=Math.min(.08,.2*s(r(e.moduleContext.outcomes.join(" ")),r(l))));let z=q(.45+u+.3*n+v+x+y,0,1),A=k.title&&k.title.trim().length>0?k.title.trim():a.hostname,B=k.snippet&&k.snippet.trim().length>0?k.snippet.trim():`Educational resource for ${b.title}`,C=d.Xf.safeParse({type:t,title:A,url:k.url,description:B,durationSeconds:null,channel:null,qualityScore:z,relevanceScore:o,reason:n>0?"Selected from search results matching lesson objectives.":"Selected from verified educational sources."});C.success&&g.push(C.data)}return g.sort((a,d)=>{let e=this.scoreResource(a,b.objectives,c);return this.scoreResource(d,b.objectives,c)-e}).slice(0,20)}enforceDiversity(a,b=4){if(a.length<=2)return a;let c=[...a].sort((a,b)=>{let c=.6*a.qualityScore+.4*a.relevanceScore;return .6*b.qualityScore+.4*b.relevanceScore-c}),d=[],e=c.find(a=>"youtube"===a.type),f=c.find(a=>"article"===a.type),g=c.find(a=>"book"===a.type);for(let a of(e&&d.push(e),f&&!d.some(a=>a.url===f.url)&&d.push(f),g&&!d.some(a=>a.url===g.url)&&d.push(g),c)){if(d.length>=b)break;d.some(b=>b.url===a.url)||d.push(a)}return d}async validateYouTubeUrl(a){let b=n(a);if(!b)return{ok:!1};let c=`https://www.youtube.com/watch?v=${b}`,d=`https://www.youtube.com/oembed?url=${encodeURIComponent(c)}&format=json`;try{let a=await t(d,{method:"GET",headers:{"User-Agent":f,Accept:"application/json"}},5e3);if(a.ok){let b=await a.json();if(b.title&&"Private video"!==b.title&&"Deleted video"!==b.title)return{ok:!0,canonicalUrl:c,channel:b.author_name??void 0}}}catch{}try{let a=await t(c,{method:"HEAD",headers:{"User-Agent":f}},5e3);if(a.ok&&!a.url.includes("login")&&!a.url.includes("unavailable"))return{ok:!0,canonicalUrl:c}}catch{}return{ok:!1}}async checkReachableUrl(a){if(!p(a))return{ok:!1};try{let b=await t(a,{method:"HEAD",redirect:"follow",headers:{"User-Agent":f}},5e3);if(b.ok){let c=o(b.url||a);return c?{ok:!0,finalUrl:c}:{ok:!1}}}catch{}try{let b=await t(a,{method:"GET",redirect:"follow",headers:{"User-Agent":f,Range:"bytes=0-2048"}},5e3);if(!b.ok)return{ok:!1};let c=o(b.url||a);return c?{ok:!0,finalUrl:c}:{ok:!1}}catch{return{ok:!1}}}async fetchText(a){try{let b=await t(a,{method:"GET",headers:{"User-Agent":f,Accept:"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8","Accept-Language":"en-US,en;q=0.5","Accept-Encoding":"gzip, deflate, br",Connection:"keep-alive"}},8e3);if(!b.ok)return null;return await b.text()}catch{return null}}constructor(){this.cache=new Map}}function m(a){let b=a.toLowerCase();return b.includes("youtube.com")||b.includes("youtu.be")}function n(a){let b=p(a);if(!b)return null;if(b.hostname.includes("youtu.be")){let a=b.pathname.replace(/^\//,"");return/^[a-zA-Z0-9_-]{11}$/.test(a)?a:null}let c=b.searchParams.get("v");if(c&&/^[a-zA-Z0-9_-]{11}$/.test(c))return c;let d=b.pathname.split("/").filter(Boolean),e=d.findIndex(a=>"embed"===a||"shorts"===a||"live"===a);if(e>=0&&d[e+1]){let a=d[e+1];return/^[a-zA-Z0-9_-]{11}$/.test(a)?a:null}return null}function o(a){let b=p(a);if(!b||!["http:","https:"].includes(b.protocol)||i.has(b.hostname.toLowerCase()))return null;for(let a of["utm_source","utm_medium","utm_campaign","utm_term","utm_content","si","fbclid"])b.searchParams.delete(a);return b.toString()}function p(a){try{return new URL(a)}catch{return null}}function q(a,b,c){return Math.min(c,Math.max(b,a))}function r(a){return new Set(a.toLowerCase().replace(/[^a-z0-9\s]/gi," ").split(/\s+/).map(a=>a.trim()).filter(a=>a.length>=3))}function s(a,b){if(0===a.size||0===b.size)return 0;let c=0;for(let d of a)b.has(d)&&(c+=1);return c/a.size}async function t(a,b,c=7e3){let d=new AbortController,e=setTimeout(()=>d.abort(),c);try{return await fetch(a,{...b,signal:d.signal})}finally{clearTimeout(e)}}let u=null;function v(){return u||(u=new l),u}}};