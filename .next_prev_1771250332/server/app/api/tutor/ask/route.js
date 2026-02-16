"use strict";(()=>{var a={};a.id=20,a.ids=[20],a.modules={261:a=>{a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:a=>{a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},19121:a=>{a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},23080:(a,b,c)=>{c.d(b,{N6:()=>i,RZ:()=>g,mJ:()=>h});let d="English",e=new Set(["the","and","is","are","to","of","in","for","with","that","this","you","your","from","what","when","where","which","how","why","can","could","should","will","would","about","into","through","between","because","more","most","than","then","very","also","only","not","true","false"]);function f(a,b=d){if("string"!=typeof a)return b;let c=a.trim();return c||b}function g(a){return{contentLanguage:f(a?.contentLanguage,d),instructionLanguage:f(a?.instructionLanguage,"English"),strictTargetLanguage:a?.strictTargetLanguage??!0}}function h(a){let b=a.contentLanguage.toLowerCase();return"english"===b||"en"===b?`
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
`.trim()}function i(a,b){if(!b.strictTargetLanguage)return!1;let c=b.contentLanguage.toLowerCase();if("english"===c||"en"===c)return!1;let d=[];return!function a(b,c,d){if(!(c.length>=d)){if("string"==typeof b){let a=b.trim();a.length>1&&c.push(a);return}if(Array.isArray(b)){for(let e of b)if(a(e,c,d),c.length>=d)break;return}if(b&&"object"==typeof b){for(let e of Object.values(b))if(a(e,c,d),c.length>=d)return}}}(a,d,500),0!==d.length&&function(a){let b=0,c=0;for(let d of a){let a=d.toLowerCase().match(/[a-zA-Z][a-zA-Z'-]*/g);if(a)for(let d of a)b+=1,e.has(d)&&(c+=1)}return 0===b?0:c/b}(d)>.2}},29294:a=>{a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},35517:(a,b,c)=>{c.d(b,{m:()=>e});var d=c(96798);async function e(){let a=await d.z.user.findFirst({orderBy:{createdAt:"asc"}});return a||d.z.user.create({data:{email:function(){let a=Date.now(),b=Math.random().toString(36).slice(2,8);return`local-${a}-${b}@local.school`}(),name:"Student"}})}},44870:a=>{a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},63033:a=>{a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},63112:(a,b,c)=>{c.r(b),c.d(b,{handler:()=>H,patchFetch:()=>G,routeModule:()=>C,serverHooks:()=>F,workAsyncStorage:()=>D,workUnitAsyncStorage:()=>E});var d={};c.r(d),c.d(d,{POST:()=>B});var e=c(95736),f=c(9117),g=c(4044),h=c(39326),i=c(32324),j=c(261),k=c(54290),l=c(85328),m=c(38928),n=c(46595),o=c(3421),p=c(17679),q=c(41681),r=c(63446),s=c(86439),t=c(51356),u=c(10641),v=c(96798),w=c(42082),x=c(23080);class y{async provideLessonHelp(a,b,c,d,e){let f=(0,x.RZ)(e),g=[{role:"system",content:`You are a helpful tutor at a prestigious educational institution. Your role is to guide students to understanding without giving away answers.

Tutoring principles:
1. Be encouraging and supportive
2. Ask guiding questions to help students think through problems
3. Provide hints rather than direct answers
4. Explain concepts in multiple ways if needed
5. Connect to real-world examples when possible
6. Reference the lesson objectives to stay focused

${(0,x.mJ)(f)}`},{role:"user",content:`A student needs help with this lesson:

Lesson: ${a}
Objectives: ${b.join(", ")}
${d?`Lesson Context: ${d}`:""}

Student's Question: ${c}

Provide helpful guidance that:
1. Addresses their question directly
2. Helps them understand the underlying concept
3. Encourages them to try solving it themselves
4. References the lesson objectives where relevant`}],h=await this.client.chatCompletion({messages:g,temperature:.8,priority:"fast"});return h.selectedResult.choices[0]?.message?.content||"I apologize, but I'm unable to provide help at this moment."}async explainConcept(a,b,c="intermediate",d){let e=(0,x.RZ)(d),f=[{role:"system",content:`You are an expert educator who excels at explaining complex concepts clearly and simply.

Explanation principles:
1. Start with a simple, relatable analogy
2. Build up to the formal definition
3. Provide concrete examples
4. Use clear, accessible language
5. Check for understanding with a simple question
6. Adjust complexity based on the specified difficulty level

${(0,x.mJ)(e)}`},{role:"user",content:`Explain this concept for a ${c} level student:

Concept: ${a}
Context: ${b}

Provide an explanation that:
1. Starts with an analogy or real-world example
2. Clearly defines the concept
3. Gives 2-3 concrete examples
4. Explains why it matters in the context
5. Is appropriate for the specified difficulty level`}],g=await this.client.chatCompletion({messages:f,temperature:.8,priority:"fast"});return g.selectedResult.choices[0]?.message?.content||"I apologize, but I'm unable to explain this concept at this moment."}async provideExerciseFeedback(a,b,c,d,e){let f=(0,x.RZ)(e),g=[{role:"system",content:`You are a supportive tutor who helps students learn from their mistakes.

${(0,x.mJ)(f)}`},{role:"user",content:`Provide helpful feedback for this exercise:

Question: ${a}
Student's Answer: ${b}
Correct Answer: ${c}
Explanation: ${d}

Provide feedback that:
1. Acknowledges what they did right (if anything)
2. Gently explains why their answer is incorrect
3. Helps them understand the correct approach
4. Encourages them to try similar problems
5. Is supportive and motivating`}],h=await this.client.chatCompletion({messages:g,temperature:.8,priority:"fast"});return h.selectedResult.choices[0]?.message?.content||"Keep practicing and you'll get it!"}async suggestResources(a,b,c,d){let e=(0,x.RZ)(d),f=[{role:"system",content:`You are a helpful tutor who can recommend additional learning resources.

${(0,x.mJ)(e)}`},{role:"user",content:`Suggest additional resources for this topic:

Topic: ${a}
Current Resources: ${b.join(", ")||"None"}
Learning Preferences:
- Video preference: ${c.videoPreference}%
- Reading preference: ${c.readingPreference}%
- Speaking focus: ${c.speakingFocus}
- Writing focus: ${c.writingFocus}
- Listening focus: ${c.listeningFocus}

Suggest 3-5 additional resources that:
1. Complement the current materials
2. Match the student's learning preferences
3. Are high-quality and reputable
4. Provide different perspectives or approaches
5. Are freely available when possible

For each resource, provide:
- Title
- Type (video, article, practice, etc.)
- Brief description
- Why it's helpful`}],g=await this.client.chatCompletion({messages:f,temperature:.8,priority:"fast"});return g.selectedResult.choices[0]?.message?.content||"I recommend reviewing the lesson materials again."}async provideStudyTips(a,b="intermediate",c=60,d){let e=(0,x.RZ)(d),f=[{role:"system",content:`You are an expert study skills coach who helps students learn effectively.

${(0,x.mJ)(e)}`},{role:"user",content:`Provide study tips for this topic:

Topic: ${a}
Difficulty Level: ${b}
Time Available: ${c} minutes

Provide 5-7 study tips that:
1. Are specific to this topic
2. Are appropriate for the difficulty level
3. Can be done in the available time
4. Use evidence-based learning techniques
5. Include a mix of preparation, active learning, and review strategies

Format as a numbered list with brief explanations.`}],g=await this.client.chatCompletion({messages:f,temperature:.8,priority:"fast"});return g.selectedResult.choices[0]?.message?.content||"Focus on understanding the key concepts and practice regularly."}async answerQuestion(a,b,c){let d=(0,x.RZ)(c),e=[{role:"system",content:`You are a knowledgeable tutor who provides clear, accurate answers to student questions.

Answering principles:
1. Be direct and concise
2. Provide accurate information
3. Give examples when helpful
4. Suggest related topics for further learning
5. Encourage curiosity and deeper understanding

${(0,x.mJ)(d)}`},{role:"user",content:`Answer this student's question:

Question: ${a}
${b?`Context: ${b}`:""}

Provide an answer that:
1. Directly addresses the question
2. Is clear and easy to understand
3. Includes relevant examples if helpful
4. Suggests related topics they might want to explore`}],f=await this.client.chatCompletion({messages:e,temperature:.7,priority:"fast"});return f.selectedResult.choices[0]?.message?.content||"I'm not sure about that. Let me look into it and get back to you."}constructor(){this.client=(0,w.z)()}}let z=null;var A=c(35517);async function B(a){try{let b=await a.json(),c="string"==typeof b.question?b.question.trim():"",d="string"==typeof b.lessonId?b.lessonId:null,e="string"==typeof b.context?b.context:void 0;if(!c)return u.NextResponse.json({error:"question is required"},{status:400});let f=await (0,A.m)(),g=(z||(z=new y),z),h="",i={lessonId:null,lessonTitle:null,objectives:[]};if(d){let a=await v.z.lesson.findUnique({where:{id:d},include:{module:{include:{program:!0}},notes:!0}});if(a){let b=function(a){if(!a)return null;try{return JSON.parse(a)}catch{return null}}(a.objectivesJson)??[],d=(0,x.RZ)({contentLanguage:a.module.program.contentLanguage,instructionLanguage:a.module.program.instructionLanguage,strictTargetLanguage:a.module.program.strictTargetLanguage});i={lessonId:a.id,lessonTitle:a.title,objectives:b},h=await g.provideLessonHelp(`${a.module.program.topic} / ${a.title}`,b,c,e??a.notes?.contentMarkdown??void 0,d)}else h=await g.answerQuestion(c,e,{contentLanguage:"English",instructionLanguage:"English",strictTargetLanguage:!1})}else h=await g.answerQuestion(c,e,{contentLanguage:"English",instructionLanguage:"English",strictTargetLanguage:!1});return await v.z.agentRun.create({data:{userId:f.id,agentName:"Tutor",status:"COMPLETED",inputJson:JSON.stringify({question:c,lessonId:d,context:e}),outputJson:JSON.stringify({response:h,grounding:i}),finishedAt:new Date,traceId:`tutor-${Date.now()}`}}),u.NextResponse.json({success:!0,response:h,grounding:i})}catch(a){return u.NextResponse.json({error:a instanceof Error?a.message:"Failed to ask tutor"},{status:500})}}let C=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/tutor/ask/route",pathname:"/api/tutor/ask",filename:"route",bundlePath:"app/api/tutor/ask/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"/home/muhammad-taha/Downloads/work/school/ai-education-system/src/app/api/tutor/ask/route.ts",nextConfigOutput:"",userland:d}),{workAsyncStorage:D,workUnitAsyncStorage:E,serverHooks:F}=C;function G(){return(0,g.patchFetch)({workAsyncStorage:D,workUnitAsyncStorage:E})}async function H(a,b,c){var d;let e="/api/tutor/ask/route";"/index"===e&&(e="/");let g=await C.prepare(a,b,{srcPage:e,multiZoneDraftMode:!1});if(!g)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:u,params:v,nextConfig:w,isDraftMode:x,prerenderManifest:y,routerServerContext:z,isOnDemandRevalidate:A,revalidateOnlyGenerated:B,resolvedPathname:D}=g,E=(0,j.normalizeAppPath)(e),F=!!(y.dynamicRoutes[E]||y.routes[D]);if(F&&!x){let a=!!y.routes[D],b=y.dynamicRoutes[E];if(b&&!1===b.fallback&&!a)throw new s.NoFallbackError}let G=null;!F||C.isDev||x||(G="/index"===(G=D)?"/":G);let H=!0===C.isDev||!F,I=F&&!H,J=a.method||"GET",K=(0,i.getTracer)(),L=K.getActiveScopeSpan(),M={params:v,prerenderManifest:y,renderOpts:{experimental:{cacheComponents:!!w.experimental.cacheComponents,authInterrupts:!!w.experimental.authInterrupts},supportsDynamicResponse:H,incrementalCache:(0,h.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:null==(d=w.experimental)?void 0:d.cacheLife,isRevalidate:I,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d)=>C.onRequestError(a,b,d,z)},sharedContext:{buildId:u}},N=new k.NodeNextRequest(a),O=new k.NodeNextResponse(b),P=l.NextRequestAdapter.fromNodeNextRequest(N,(0,l.signalFromNodeResponse)(b));try{let d=async c=>C.handle(P,M).finally(()=>{if(!c)return;c.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let d=K.getRootSpanAttributes();if(!d)return;if(d.get("next.span_type")!==m.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${d.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=d.get("next.route");if(e){let a=`${J} ${e}`;c.setAttributes({"next.route":e,"http.route":e,"next.span_name":a}),c.updateName(a)}else c.updateName(`${J} ${a.url}`)}),g=async g=>{var i,j;let k=async({previousCacheEntry:f})=>{try{if(!(0,h.getRequestMeta)(a,"minimalMode")&&A&&B&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let e=await d(g);a.fetchMetrics=M.renderOpts.fetchMetrics;let i=M.renderOpts.pendingWaitUntil;i&&c.waitUntil&&(c.waitUntil(i),i=void 0);let j=M.renderOpts.collectedTags;if(!F)return await (0,o.I)(N,O,e,M.renderOpts.pendingWaitUntil),null;{let a=await e.blob(),b=(0,p.toNodeOutgoingHttpHeaders)(e.headers);j&&(b[r.NEXT_CACHE_TAGS_HEADER]=j),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==M.renderOpts.collectedRevalidate&&!(M.renderOpts.collectedRevalidate>=r.INFINITE_CACHE)&&M.renderOpts.collectedRevalidate,d=void 0===M.renderOpts.collectedExpire||M.renderOpts.collectedExpire>=r.INFINITE_CACHE?void 0:M.renderOpts.collectedExpire;return{value:{kind:t.CachedRouteKind.APP_ROUTE,status:e.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:d}}}}catch(b){throw(null==f?void 0:f.isStale)&&await C.onRequestError(a,b,{routerKind:"App Router",routePath:e,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:A})},z),b}},l=await C.handleResponse({req:a,nextConfig:w,cacheKey:G,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:y,isRoutePPREnabled:!1,isOnDemandRevalidate:A,revalidateOnlyGenerated:B,responseGenerator:k,waitUntil:c.waitUntil});if(!F)return null;if((null==l||null==(i=l.value)?void 0:i.kind)!==t.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==l||null==(j=l.value)?void 0:j.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});(0,h.getRequestMeta)(a,"minimalMode")||b.setHeader("x-nextjs-cache",A?"REVALIDATED":l.isMiss?"MISS":l.isStale?"STALE":"HIT"),x&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let m=(0,p.fromNodeOutgoingHttpHeaders)(l.value.headers);return(0,h.getRequestMeta)(a,"minimalMode")&&F||m.delete(r.NEXT_CACHE_TAGS_HEADER),!l.cacheControl||b.getHeader("Cache-Control")||m.get("Cache-Control")||m.set("Cache-Control",(0,q.getCacheControlHeader)(l.cacheControl)),await (0,o.I)(N,O,new Response(l.value.body,{headers:m,status:l.value.status||200})),null};L?await g(L):await K.withPropagatedContext(a.headers,()=>K.trace(m.BaseServerSpan.handleRequest,{spanName:`${J} ${a.url}`,kind:i.SpanKind.SERVER,attributes:{"http.method":J,"http.target":a.url}},g))}catch(b){if(b instanceof s.NoFallbackError||await C.onRequestError(a,b,{routerKind:"App Router",routePath:E,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:A})}),F)throw b;return await (0,o.I)(N,O,new Response(null,{status:500})),null}}},86439:a=>{a.exports=require("next/dist/shared/lib/no-fallback-error.external")},96330:a=>{a.exports=require("@prisma/client")}};var b=require("../../../../webpack-runtime.js");b.C(a);var c=b.X(0,[873,692,787],()=>b(b.s=63112));module.exports=c})();