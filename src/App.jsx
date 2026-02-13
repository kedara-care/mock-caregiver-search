import { useMemo, useRef, useState } from 'react'
import './App.css'

const SENIOR_CARE_NEEDS = [
  'Companionship',
  'Post-surgery support',
  'Mobility assistance',
  'Medication reminders',
  'Memory care',
]

const CONDITIONS = [
  'Dementia',
  "Parkinson's",
  'Diabetes',
  'Stroke recovery',
  'Arthritis',
  "Alzheimer's",
]

const BACKGROUNDS = [
  'Certified Nursing Assistant',
  'Home Health Aide',
  'Registered Nurse',
  'Occupational Therapy Assistant',
  'Medical Assistant',
  'Gerontology Student',
  'Hospice Volunteer',
  'Family Care Specialist',
]

const CAPABILITIES = [
  'Meal prep',
  'Transportation',
  'Light housekeeping',
  'Medication management',
  'Bathing & hygiene',
  'Mobility transfer support',
  'Companionship activities',
  'Vitals monitoring',
  'Overnight care',
]

const CITIES = [
  'San Jose',
  'Santa Clara',
  'Sunnyvale',
  'Cupertino',
  'Campbell',
  'Los Gatos',
  'Mountain View',
  'Milpitas',
  'Palo Alto',
  'Saratoga',
]

const FIRST_NAMES = [
  'Ava',
  'Noah',
  'Olivia',
  'Liam',
  'Emma',
  'Mason',
  'Sophia',
  'Lucas',
  'Isabella',
  'Ethan',
  'Mia',
  'Benjamin',
  'Amelia',
  'Daniel',
  'Harper',
  'Elijah',
  'Charlotte',
  'James',
  'Evelyn',
  'Logan',
]

const LAST_NAMES = [
  'Rivera',
  'Chen',
  'Patel',
  'Nguyen',
  'Smith',
  'Kim',
  'Martinez',
  'Lopez',
  'Walker',
  'Singh',
  'Brown',
  'Johnson',
  'Garcia',
  'Thompson',
  'Anderson',
  'Wilson',
  'Wright',
  'Hernandez',
  'Lee',
  'Clark',
]

function seeded(index, max) {
  return (index * 37 + 19) % max
}

function formatZip(baseZip, delta) {
  const zip = Number.parseInt(baseZip || '95126', 10)
  const sanitized = Number.isNaN(zip) ? 95126 : zip
  return String(Math.max(10000, Math.min(99999, sanitized + delta))).padStart(5, '0')
}

function buildCaregivers(baseZip) {
  return Array.from({ length: 100 }, (_, idx) => {
    const id = idx + 1
    const first = FIRST_NAMES[seeded(idx + 1, FIRST_NAMES.length)]
    const last = LAST_NAMES[seeded(idx + 3, LAST_NAMES.length)]
    const background = BACKGROUNDS[seeded(idx + 5, BACKGROUNDS.length)]
    const city = CITIES[seeded(idx + 7, CITIES.length)]

    const conditionStart = seeded(idx + 2, CONDITIONS.length)
    const conditionCount = 2 + (idx % 3)
    const conditions = Array.from(
      { length: conditionCount },
      (_, cIdx) => CONDITIONS[(conditionStart + cIdx) % CONDITIONS.length],
    )

    const capabilityStart = seeded(idx + 8, CAPABILITIES.length)
    const capabilityCount = 3 + (idx % 4)
    const capabilities = Array.from(
      { length: capabilityCount },
      (_, cIdx) => CAPABILITIES[(capabilityStart + cIdx) % CAPABILITIES.length],
    )

    const yearsExperience = 2 + (idx % 17)
    const hourlyRate = 20 + (idx % 16)
    const distanceMiles = Number((1.2 + (idx % 24) * 0.8).toFixed(1))
    const zipcode = formatZip(baseZip, (idx % 25) - 12)

    const availability =
      idx % 4 === 0
        ? 'Weekdays, mornings and afternoons'
        : idx % 4 === 1
          ? 'Tue/Thu + occasional weekends'
          : idx % 4 === 2
            ? 'Flexible, 2-3 days per week'
            : 'Mon/Wed/Fri with evening options'

    return {
      id,
      fullName: `${first} ${last}`,
      age: 24 + (idx % 31),
      rating: Number((4.2 + (idx % 8) * 0.1).toFixed(1)),
      hourlyRate,
      yearsExperience,
      background,
      city,
      zipcode,
      distanceMiles,
      conditions,
      capabilities,
      availability,
      bio: `${first} has ${yearsExperience} years supporting seniors and focuses on ${conditions.join(', ').toLowerCase()}.`,
    }
  })
}

function computeMatch(caregiver, searchNeed, selectedConditions) {
  let score = 45

  if (
    searchNeed.toLowerCase().includes('memory') &&
    caregiver.conditions.some((c) => c === 'Dementia' || c === "Alzheimer's")
  ) {
    score += 25
  }

  if (
    searchNeed.toLowerCase().includes('mobility') &&
    caregiver.capabilities.includes('Mobility transfer support')
  ) {
    score += 18
  }

  const matchedConditions = selectedConditions.filter((c) => caregiver.conditions.includes(c)).length
  score += matchedConditions * 10

  if (caregiver.yearsExperience >= 8) score += 8
  if (caregiver.rating >= 4.8) score += 5

  return Math.min(99, score)
}

function App() {
  const [step, setStep] = useState('landing')
  const [searchNeed, setSearchNeed] = useState(SENIOR_CARE_NEEDS[0])
  const [zipcode, setZipcode] = useState('')
  const [maxRate, setMaxRate] = useState(40)
  const [selectedConditions, setSelectedConditions] = useState([])
  const [selectedCaregiverId, setSelectedCaregiverId] = useState(null)
  const [screeningNotes, setScreeningNotes] = useState('')
  const [chatByCaregiver, setChatByCaregiver] = useState({})
  const [demoRunning, setDemoRunning] = useState(false)
  const runIdRef = useRef(0)

  const caregivers = useMemo(() => buildCaregivers(zipcode), [zipcode])

  const filtered = useMemo(
    () =>
      caregivers.filter((caregiver) => {
        const ratePass = caregiver.hourlyRate <= maxRate
        const conditionsPass =
          selectedConditions.length === 0 ||
          selectedConditions.every((condition) => caregiver.conditions.includes(condition))
        return ratePass && conditionsPass
      }),
    [caregivers, maxRate, selectedConditions],
  )

  const rankedMatches = useMemo(
    () =>
      filtered
        .map((caregiver) => ({
          ...caregiver,
          matchScore: computeMatch(caregiver, searchNeed, selectedConditions),
        }))
        .sort((a, b) => b.matchScore - a.matchScore),
    [filtered, searchNeed, selectedConditions],
  )

  const selectedCaregiver = useMemo(
    () => rankedMatches.find((caregiver) => caregiver.id === selectedCaregiverId) ?? null,
    [rankedMatches, selectedCaregiverId],
  )

  const messages = selectedCaregiver ? chatByCaregiver[selectedCaregiver.id] ?? [] : []

  function toggleCondition(condition) {
    setSelectedConditions((prev) =>
      prev.includes(condition) ? prev.filter((item) => item !== condition) : [...prev, condition],
    )
  }

  function startSearch(event) {
    event.preventDefault()
    setStep('results')
  }

  function openProfile(caregiverId) {
    setSelectedCaregiverId(caregiverId)
    setStep('profile')
  }

  function addMessage(caregiverId, sender, text) {
    setChatByCaregiver((prev) => {
      const existing = prev[caregiverId] ?? []
      return {
        ...prev,
        [caregiverId]: [...existing, { sender, text }],
      }
    })
  }

  function waitOneSecond() {
    return new Promise((resolve) => {
      window.setTimeout(resolve, 1000)
    })
  }

  async function runSilviaAutomationDemo() {
    if (demoRunning) return
    const runId = runIdRef.current + 1
    runIdRef.current = runId
    setDemoRunning(true)
    setChatByCaregiver({})
    setSelectedCaregiverId(null)
    setScreeningNotes('')
    setStep('landing')

    const isCurrentRun = () => runIdRef.current === runId
    const continueIfCurrent = async () => {
      if (!isCurrentRun()) return false
      await waitOneSecond()
      return isCurrentRun()
    }

    if (!(await continueIfCurrent())) return

    setSearchNeed('Memory care')
    if (!(await continueIfCurrent())) return

    setZipcode('95126')
    if (!(await continueIfCurrent())) return

    setStep('results')
    if (!(await continueIfCurrent())) return

    setMaxRate(30)
    if (!(await continueIfCurrent())) return

    setSelectedConditions(['Dementia'])
    if (!(await continueIfCurrent())) return

    setStep('refined')
    if (!(await continueIfCurrent())) return

    const simulatedRanked = buildCaregivers('95126')
      .filter((caregiver) => caregiver.hourlyRate <= 30 && caregiver.conditions.includes('Dementia'))
      .map((caregiver) => ({
        ...caregiver,
        matchScore: computeMatch(caregiver, 'Memory care', ['Dementia']),
      }))
      .sort((a, b) => b.matchScore - a.matchScore)

    const firstCaregiver = simulatedRanked[0]
    const secondCaregiver = simulatedRanked[1]

    if (!firstCaregiver || !secondCaregiver) {
      setDemoRunning(false)
      return
    }

    setSelectedCaregiverId(firstCaregiver.id)
    setStep('profile')
    if (!(await continueIfCurrent())) return

    addMessage(firstCaregiver.id, 'System', 'Hi! Are you available to care for Silvia two days per week?')
    if (!(await continueIfCurrent())) return

    addMessage(
      firstCaregiver.id,
      firstCaregiver.fullName,
      "Thanks for reaching out. I am currently employed full-time and not available for a new position.",
    )
    if (!(await continueIfCurrent())) return

    setScreeningNotes('First ranked caregiver is currently employed and unavailable. Moving to the next match.')
    if (!(await continueIfCurrent())) return

    setSelectedCaregiverId(secondCaregiver.id)
    setStep('profile')
    if (!(await continueIfCurrent())) return

    addMessage(secondCaregiver.id, 'System', 'Hi! Are you available for ongoing care for Silvia two days per week?')
    if (!(await continueIfCurrent())) return

    addMessage(
      secondCaregiver.id,
      secondCaregiver.fullName,
      'Yes, I have availability on weekdays and I am interested in interviewing for Silvia.',
    )
    if (!(await continueIfCurrent())) return

    addMessage(
      secondCaregiver.id,
      'System',
      'Great. We would like to schedule an interview and email you the details this afternoon.',
    )
    if (!(await continueIfCurrent())) return

    addMessage(
      secondCaregiver.id,
      secondCaregiver.fullName,
      'That sounds perfect. Please send the interview details by email and I will confirm right away.',
    )
    setScreeningNotes(
      `Second caregiver (${secondCaregiver.fullName}) is available and interested. Next step: schedule interview and send email with details.`,
    )
    setDemoRunning(false)
    return
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>SilverBridge Care Match</h1>
        <p>Mock caregiver search and screening demo for Silvia.</p>
        <button type="button" onClick={runSilviaAutomationDemo} disabled={demoRunning}>
          {demoRunning ? 'Running Silvia Automation...' : 'Run Silvia Automation Demo'}
        </button>
      </header>

      {step === 'landing' && (
        <section className="card">
          <h2>Find senior caregivers near Silvia</h2>
          <form className="search-form" onSubmit={startSearch}>
            <label>
              Senior care need
              <select value={searchNeed} onChange={(event) => setSearchNeed(event.target.value)}>
                {SENIOR_CARE_NEEDS.map((need) => (
                  <option value={need} key={need}>
                    {need}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Zipcode
              <input
                value={zipcode}
                onChange={(event) => setZipcode(event.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="e.g. 95126"
                required
              />
            </label>

            <button type="submit">Search Local Caregivers</button>
            <button type="button" className="ghost" onClick={runSilviaAutomationDemo} disabled={demoRunning}>
              Run automated Silvia flow
            </button>
          </form>
        </section>
      )}

      {step === 'results' && (
        <section className="card">
          <div className="section-header">
            <h2>Caregivers near {zipcode}</h2>
            <button className="ghost" onClick={() => setStep('landing')}>
              Edit search
            </button>
          </div>

          <div className="filters">
            <label>
              Max hourly rate
              <select value={maxRate} onChange={(event) => setMaxRate(Number(event.target.value))}>
                {[25, 30, 35, 40].map((rate) => (
                  <option key={rate} value={rate}>
                    Up to ${rate}/hr
                  </option>
                ))}
              </select>
            </label>

            <div>
              <span className="filter-label">Condition experience</span>
              <div className="chip-row">
                {CONDITIONS.map((condition) => (
                  <button
                    key={condition}
                    type="button"
                    className={selectedConditions.includes(condition) ? 'chip active' : 'chip'}
                    onClick={() => toggleCondition(condition)}
                  >
                    {condition}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid">
            {filtered.map((caregiver) => (
              <article key={caregiver.id} className="caregiver-card">
                <h3>{caregiver.fullName}</h3>
                <p>{caregiver.background}</p>
                <p>
                  ${caregiver.hourlyRate}/hr • {caregiver.city} ({caregiver.distanceMiles} mi)
                </p>
                <p>Conditions: {caregiver.conditions.join(', ')}</p>
              </article>
            ))}
          </div>

          <div className="actions">
            <button onClick={() => setStep('refined')}>See refined matches</button>
          </div>
        </section>
      )}

      {step === 'refined' && (
        <section className="card">
          <div className="section-header">
            <h2>Refined matches for {searchNeed}</h2>
            <button className="ghost" onClick={() => setStep('results')}>
              Back to filters
            </button>
          </div>

          <div className="grid">
            {rankedMatches.map((caregiver) => (
              <article key={caregiver.id} className="caregiver-card">
                <div className="row-between">
                  <h3>{caregiver.fullName}</h3>
                  <span className="match">{caregiver.matchScore}% match</span>
                </div>
                <p>{caregiver.bio}</p>
                <p>
                  {caregiver.yearsExperience} yrs exp • ${caregiver.hourlyRate}/hr • {caregiver.rating}★
                </p>
                <button type="button" onClick={() => openProfile(caregiver.id)}>
                  Open profile + chat
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {step === 'profile' && selectedCaregiver && (
        <section className="card">
          <div className="section-header">
            <h2>{selectedCaregiver.fullName}</h2>
            <button className="ghost" onClick={() => setStep('refined')}>
              Back to refined matches
            </button>
          </div>

          <div className="profile-layout">
            <div className="profile-panel">
              <h3>Profile details</h3>
              <p>
                {selectedCaregiver.background} • Age {selectedCaregiver.age}
              </p>
              <p>
                {selectedCaregiver.city}, {selectedCaregiver.zipcode} • {selectedCaregiver.distanceMiles} miles away
              </p>
              <p>
                Rate: ${selectedCaregiver.hourlyRate}/hr • Availability: {selectedCaregiver.availability}
              </p>
              <p>Capabilities: {selectedCaregiver.capabilities.join(', ')}</p>
              <p>Condition experience: {selectedCaregiver.conditions.join(', ')}</p>

              <h4>Screening notes for Silvia</h4>
              <textarea
                value={screeningNotes}
                onChange={(event) => setScreeningNotes(event.target.value)}
                placeholder="Track interview notes, concerns, and next steps..."
              />
            </div>

            <div className="chat-panel">
              <h3>Automated conversation with {selectedCaregiver.fullName}</h3>
              <div className="messages">
                {messages.length === 0 ? (
                  <p className="placeholder">
                    The automation will ask about availability when this caregiver is selected.
                  </p>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={`${message.sender}-${index}`}
                      className={message.sender === 'You' ? 'message you' : 'message bot'}
                    >
                      <strong>{message.sender}: </strong>
                      {message.text}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default App
