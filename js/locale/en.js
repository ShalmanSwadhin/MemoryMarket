/* MEMORY MARKET — English locale. This mirrors the game's original text
   exactly, so selecting English is a guaranteed no-regression baseline. */
window.MM = window.MM || {}; window.MM.Locale = window.MM.Locale || {};
window.MM.Locale.en = {
  lang: { name: 'English', choose: 'Choose Your Language' },

  ui: {
    title: 'MEMORY MARKET', titleBn: 'স্মৃতি বাজার',
    tag: 'Every memory has a price. Forgetting costs more.',
    footer: 'GameJamPlus Bangladesh 2026/27 · 12–20 minutes · headphones recommended',
    begin: 'Begin', continueChapter: 'Continue · Chapter {n}', newGame: 'New game',
    options: 'Options', controls: 'Controls', back: 'Back',
    endingsFound: 'Endings found: {n} of 4',
    volume: 'Master volume', musicVolume: 'Music volume', ambienceVolume: 'Ambience volume',
    sfxVolume: 'SFX volume', dialogueVolume: 'Dialogue volume',
    ttsToggle: 'MNEMOS spoken voice', language: 'Language',
    keys: { move: 'Move', moveK: 'W A S D', look: 'Look', lookK: 'Mouse',
      lookDesc: 'Look (click the view to capture the pointer; drag also works)',
      sprint: 'Walk faster', sprintK: 'Shift', interact: 'Interact / advance dialogue', interactK: 'E',
      journal: 'Evidence journal', journalK: 'Tab', analyzer: 'Memory Analyzer (once unlocked)', analyzerK: 'Q',
      choice: 'Choose a dialogue option', choiceK: '1 – 4', pauseK: 'Esc', pauseDesc: 'Release the pointer / pause' },
    confirmNewGame: 'Start a new game? Your saved progress will be lost.',
    startNewGame: 'Start new game', cancel: 'Cancel',
    paused: 'PAUSED', pausedSub: 'Your pointer was released.', resume: 'Resume', quitTitle: 'Quit to title',
    lockHint: 'Click to look around', objective: 'Objective',
    evidenceCollected: 'Evidence collected', tabToReview: 'Tab to review',
    journalTitle: 'Evidence journal — {n} of 15 fragments',
    journalEmpty: 'Nothing collected yet. Investigate objects, people and terminals.',
    fragment: 'Memory fragment #{n}', evidenceChip: '{n} evidence', contradictionsChip: '{n}/3 contradictions',
    close: 'Close', loading: 'Loading…',
    somethingWrong: 'Something went wrong: {msg}',
    recordsUnread: 'Records unread: {n} of 5', registryReviewed: 'Registry fully reviewed. Close the terminal to continue.',
    chamberUnlocked: 'The chamber door has unlocked'
  },

  auth: {
    saveTitle: 'Save your progress', saveSub: 'Play as a guest, or create a free account to keep your progress across devices.',
    continueGuest: 'Continue as Guest', createAccount: 'Create Demo Account', haveAccount: 'Already have an account? Log in',
    createAccountTitle: 'Create Demo Account', loginTitle: 'Log In',
    username: 'Display name', email: 'Email', password: 'Password',
    emailHint: 'A real inbox is not required — any valid-looking address works, e.g. player123@example.com.',
    createBtn: 'Create account', loginBtn: 'Log in', backToGuest: 'Continue as guest instead',
    noAccount: "Don't have an account? Create one",
    loggingIn: 'Logging in…', creating: 'Creating account…',
    accountCreated: 'Account created. Your guest progress has been saved to your account.',
    loggedIn: 'Logged in as {name}.', loggedOut: 'Logged out. Playing as guest.',
    logout: 'Log out', loggedInAs: 'Signed in as {name}',
    errCreate: 'Unable to create account. Please try again.',
    errLogin: 'Incorrect email or password.',
    errNetwork: 'Your local progress is still available. Cloud synchronization could not be completed.',
    invalidUsername: 'Display name must be 2–40 characters.',
    invalidEmail: 'That does not look like a valid email address.',
    invalidPassword: 'Password must be at least 8 characters.',
    emailTaken: 'An account with that email already exists.',
    progressMerged: 'Your account already had more advanced progress (Chapter {n}). That was kept.',
    rateLimited: 'Too many attempts. Please wait a few minutes.'
  },

  bug: {
    reportBug: 'Report a Bug', whatHappened: 'What happened?', whatHappenedPh: 'Describe what you saw — the more detail, the better.',
    whatDoing: 'What were you doing?', whatDoingPh: 'The steps that led up to it, if you remember them.',
    severity: 'Severity', low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical',
    device: 'Device', browser: 'Browser', os: 'Operating System', gameVersion: 'Game Version',
    currentChapter: 'Current Chapter', language: 'Language', optionalEmail: 'Optional email',
    optionalEmailPh: 'Only if you want a reply (not required)',
    submit: 'Submit Bug Report', submitting: 'Submitting…',
    submitted: 'Thank you — your report was submitted.', submitError: 'Your report could not be submitted. Please try again.',
    tooLong: 'Please keep your description under 4000 characters.',
    tooSoon: 'Please wait a moment before submitting another report.'
  },

  admin: {
    title: 'Bug Reports — Admin', login: 'Admin Login', email: 'Admin email', password: 'Password', loginBtn: 'Log in',
    logout: 'Log out', wrongCreds: 'Incorrect admin email or password.', notConfigured: 'Admin access has not been configured on this deployment yet.',
    filters: 'Filters', status: 'Status', all: 'All', open: 'Open', investigating: 'Investigating', fixed: 'Fixed', closed: 'Closed',
    severityLabel: 'Severity', chapterLabel: 'Chapter', languageLabel: 'Language', apply: 'Apply', clear: 'Clear',
    noReports: 'No bug reports match these filters.', createdOn: 'Created', updatedOn: 'Updated',
    steps: 'Steps to reproduce', details: 'Details', developerNotes: 'Developer note', saveNotes: 'Save',
    saved: 'Saved.', loadFailed: 'Could not load bug reports.'
  },

  settings: { title: 'Settings' },

  endings: { found: 'Endings found: {n} of 4' }
};
