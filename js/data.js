// Game content. Each scenario has 5 seats; with 4 players, Seat 2 is dropped.
// Seats with a `piece` hold hidden information the team needs.

window.SCENARIOS = {
  gym: {
    id: 'gym',
    letter: 'G',
    short: 'Gym launch',
    title: 'Launch a new 24-hour gym in Parramatta',
    team: 'You are a marketing agency team.',
    asks: [
      'Who the target customers are',
      'Which channels and messages you’ll use',
      'One launch offer or event',
    ],
    fullPicture:
      'Ads and messaging in several languages (Hindi, Arabic, Mandarin), women-only training sessions, and flexible weekly memberships alongside the standard deal.',
    roles: [
      {
        seat: 1,
        name: 'Account Director',
        blurb: 'Senior. You own the client relationship and have the final say.',
        info: 'You already have a plan the client loves: a Friday-night launch party with a DJ, free 7-day trial passes for everyone who attends, and a standard 12-month membership deal on sign-up. You’re confident it will work.',
        rule: { type: 'free' },
      },
      {
        seat: 2,
        name: 'Social Media Lead',
        blurb: 'You run the agency’s social media campaigns.',
        info: 'You’ve mapped out a 4-week Instagram and TikTok ad campaign in English, targeting 18–35 year olds across Western Sydney, using fitness influencers to promote the launch party. It uses the whole budget.',
        rule: { type: 'free' },
      },
      {
        seat: 3,
        name: 'Junior Designer',
        blurb: 'You grew up in Parramatta. You’re new and don’t like interrupting.',
        info: 'Many locals speak Hindi, Arabic or Mandarin at home. English-only ads miss a large group.',
        rule: { type: 'ask', topic: 'the local community or who lives in Parramatta' },
        piece: {
          label: 'Ads in several languages',
          unlock: '“Who actually lives around Parramatta?”',
        },
      },
      {
        seat: 4,
        name: 'Data Analyst',
        blurb: 'You’re quiet and spend most of your time with survey results.',
        info: 'Survey result: the top barrier to joining a gym locally is no women-only training times.',
        rule: { type: 'ask', topic: 'customer research or why people don’t join gyms' },
        piece: {
          label: 'Women-only training times',
          unlock: '“What does the research say stops people joining?”',
        },
      },
      {
        seat: 5,
        name: 'Intern',
        blurb: 'It’s your second week. You’re not sure your view counts.',
        info: 'Local uni students prefer flexible weekly memberships over 12-month contracts.',
        rule: { type: 'ask', topic: 'students, pricing or membership options' },
        piece: {
          label: 'Flexible weekly memberships',
          unlock: '“Is a 12-month contract right for everyone?”',
        },
      },
    ],
  },

  welcome: {
    id: 'welcome',
    letter: 'W',
    short: 'Welcome Week',
    title: 'Plan Welcome Week for new students',
    team: 'You are the student experience team at a Western Sydney university.',
    asks: [
      'Who the event is for',
      'The time, venue and activities',
      'How you’ll promote it',
    ],
    fullPicture:
      'An alcohol-free daytime event (or a choice of times), in an accessible venue with captioned or looped speeches, promoted in several languages, on more than one channel, well ahead of time.',
    roles: [
      {
        seat: 1,
        name: 'Events Manager',
        blurb: 'Senior. You have the final say on events.',
        info: 'You’ve booked the Thursday-night campus bar for a welcome party: free drink tokens, a DJ, and speeches from the Dean on the main stage.',
        rule: { type: 'free' },
      },
      {
        seat: 2,
        name: 'Marketing Coordinator',
        blurb: 'You run the student comms channels.',
        info: 'An English-only Instagram campaign and one all-student email sent 2 days before. It’s ready to go and uses the whole promotion budget.',
        rule: { type: 'free' },
      },
      {
        seat: 3,
        name: 'International Student Ambassador',
        blurb: 'You arrived from overseas last year. You’re new to the team and don’t like to interrupt.',
        info: 'Many new students don’t drink alcohol for religious or cultural reasons. A bar-based event signals “not for you”.',
        rule: { type: 'ask', topic: 'who the students are or their backgrounds' },
        piece: {
          label: 'An alcohol-free event',
          unlock: '“Who are our new students, and where are they from?”',
        },
      },
      {
        seat: 4,
        name: 'Accessibility Officer',
        blurb: 'You’re quiet and work behind the scenes.',
        info: 'The bar’s stage has no ramp and no hearing loop. About 1 in 5 students have registered a disability or health condition.',
        rule: { type: 'ask', topic: 'the venue or access needs' },
        piece: {
          label: 'An accessible venue, captioned speeches',
          unlock: '“Can everyone get into and follow the event?”',
        },
      },
      {
        seat: 5,
        name: 'Mature-Age Student Rep',
        blurb: 'You study part-time. You’re not sure the team takes your view seriously.',
        info: 'Many commencing students work evenings or have caring responsibilities. A Thursday-night event shuts them out.',
        rule: { type: 'ask', topic: 'timing or students’ other commitments' },
        piece: {
          label: 'A daytime slot, or a choice of times',
          unlock: '“When can our students actually come?”',
        },
      },
    ],
  },
};
