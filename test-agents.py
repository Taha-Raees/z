#!/usr/bin/env python3
import urllib.request, json, sys, time

def post(path,payload=None):
    base='http://localhost:3000'
    data=None if payload is None else json.dumps(payload).encode()
    headers={'Content-Type':'application/json'} if payload is not None else {}
    req=urllib.request.Request(base+path,data=data,headers=headers,method='POST')
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read().decode())

print("Starting admissions session...")
s=post('/api/admissions/start')
sid=s['sessionId']
q=s['currentQuestion']
print(f"Session ID: {sid}")

answers={
'topic':'French language',
'contentLanguage':'French',
'currentLevel':'Complete Beginner',
'goalLevel':'Intermediate (B1)',
'targetDate':'2026-07-01',
'hoursPerDay':'2-3 hours',
'pacePreference':'Normal (balanced pace)',
'instructionLanguage':'English',
'strictTargetLanguage':'Yes, strict target-language mode',
'learningPreferences':'More videos, speaking and listening',
'constraints':'Laptop preferred',
'additionalNotes':'Focus on conversation',
}

print("Answering questions...")
for i in range(30):
    key=q['questionKey']
    ans=answers.get(key, (q.get('options') or ['N/A'])[0])
    print(f"  Question {i+1}: {key} -> {ans}")
    r=post('/api/admissions/answer', {'sessionId':sid,'questionKey':key,'answer':ans})
    if r.get('isComplete'):
        profile=r['profile']
        print("Profile complete!")
        break
    q=r['nextQuestion']
else:
    raise SystemExit('incomplete')

print("\nProfile created:")
print(json.dumps(profile, indent=2))

print("\nGenerating program...")
req=urllib.request.Request('http://localhost:3000/api/programs/generate', data=json.dumps({'profile':profile}).encode(), headers={'Content-Type':'application/json'}, method='POST')
try:
    with urllib.request.urlopen(req, timeout=120) as resp:
        print(f"Status: {resp.status}")
        result=resp.read().decode()
        print(result)
except urllib.error.HTTPError as e:
    body=e.read().decode()
    print(f"Error {e.code}:")
    print(body)
