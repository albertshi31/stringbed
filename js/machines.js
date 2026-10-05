/* Buyer's guide content: machine types, clamp types, how to choose. */
const MachineGuide = (function () {

  const TYPES = [
    {
      id: 'drop',
      name: 'Dropweight',
      price: '$150 to $600',
      job: 'dropweight',
      how: 'Affordable, and gravity keeps it pulling the whole time. It depends on your technique more than the other two.',
      physics: 'A weighted bar hangs on a ratchet, so the tension comes from a known weight at a known distance. There is no spring or load cell to wear out. Lift the bar slightly above level and let go. Gravity lowers it, the ratchet holds what it gains, and it comes to rest level, which is where the tension is correct. The pull follows the cosine of the bar angle, so a bar 20° off level is pulling about 6% under. A small angle means a small error. Friction in the drum and ratchet takes a little more off, so you still need a calibrator.',
      pros: [
        'Cheapest way into real stringing',
        'The tension comes from a weight on a lever, with nothing inside that wears out',
        'Gravity does the pulling, so the tension does not depend on how hard you work',
        'Almost nothing to break'
      ],
      cons: [
        'Slow, because you reset the bar for every single string',
        'The tension is only right while the bar is level, and you are the one judging level',
        'If it settles off level, you have to lift it and let go again, or release it and pull again',
        'Cheaper models usually come with flying clamps',
        'Tedious on a dense 18x20 pattern'
      ],
      who: 'Buy this if you string your own rackets a few times a month, care more about cost than speed, and are willing to be careful on every single string. It is the cheapest way to get a trustworthy tension, but it is not the machine that makes consistency easy.'
    },
    {
      id: 'crank',
      name: 'Crank (lockout)',
      price: '$400 to $1,200',
      job: 'crank',
      how: 'Fast, mechanical and easy to live with. The classic club machine.',
      physics: 'You turn a crank until the mechanism trips and locks at the set tension. Once it locks, it stops pulling, so any tension the string loses in the next few seconds stays lost. That is why the same number on a lockout usually plays a little softer than on a constant-pull machine. The spring that trips is what sets the tension, and springs age, so check it with a tension calibrator every few months.',
      pros: [
        'Much faster than a dropweight',
        'Usually comes with fixed clamps and a proper turntable',
        'Mechanically simple and easy to service',
        'A well-kept crank is plenty accurate for club stringing'
      ],
      cons: [
        'It stops pulling once it locks, so polyester strings can end up slightly under the set tension',
        'The spring sets the tension, and springs age, so check it with a tension calibrator every few months',
        'How fast you crank changes the pull speed, which affects the result'
      ],
      who: 'The classic club and pro-shop machine. Buy this if you string for a team or a few friends and want speed without paying for an electronic machine.'
    },
    {
      id: 'electric',
      name: 'Electronic constant-pull',
      price: '$800 to $6,000+',
      job: 'electronic',
      how: 'A motor holds the tension for you. It is the fastest, and it depends the least on your technique.',
      physics: 'A motor pulls to the set tension and keeps pulling as the string slowly stretches, holding that tension right up to the moment you clamp. Most let you choose the pull speed and pre-stretch the string. The tension is measured by a load cell, which is a force sensor. It is accurate when calibrated, but it does drift, so it needs checking like any other machine.',
      pros: [
        'Because it keeps pulling, clamp timing matters much less, though pausing the same way each time still helps',
        'Fastest and least tiring, which matters when you string a lot',
        'Repeatable racket to racket, which is what a customer is paying for',
        'Extras like pre-stretch, knot mode, pull speed and memory'
      ],
      cons: [
        'Expensive',
        'More parts that can go wrong, like the electronics, load cell and motor',
        'Still needs periodic calibration',
        'More machine than one player needs'
      ],
      who: 'Buy this if you string for money or for a club at volume. Below roughly ten rackets a week it is hard to justify.'
    }
  ];

  const CLAMPS = [
    {
      name: 'Flying clamps',
      body: 'These are not attached to the machine. They sit on the strings and grip against the string next to them. They are cheap and they work, but they can slip, and they lose a bit of tension on every pull because the string they grip against gives a little.',
      tag: 'Budget'
    },
    {
      name: 'Fixed clamps',
      body: 'Mounted on a glide bar on the turntable, so the clamp holds against the machine instead of another string. More accurate, faster, and far less tension loss. This is the single biggest upgrade on a machine, worth more than the type of tension head.',
      tag: 'Worth paying for'
    },
    {
      name: 'Mounting system',
      body: 'Six-point mounting holds the hoop in six places and bends the frame the least. Two-point is faster to set up. A cheap two-point mount without side supports stresses the frame, but a good one with side supports is fine. Whatever the system, the frame should not move at all once it is mounted.',
      tag: 'Check before buying'
    }
  ];

  const TIPS = [
    'Used crank machines hold value and are usually a better buy than a new machine at the same price.',
    'Practice on an old frame with cheap synthetic gut before you touch anything you care about.',
    'Moving between a lockout and a constant-pull machine? The same setting will not play the same. Expect the constant-pull machine to give firmer strings, so find your number again rather than trusting the old one.'
  ];

  /* names, pull behaviour and clamp guidance come from Job.MACHINES so this
     page cannot drift away from the trainer and the guide */
  const J = t => Job.machine(t.job);

  function html() {
    return `
      <details class="why mg-compare">
        <summary>How to compare these machines</summary>
        <p class="mg-note">${Job.MACHINE_NOTE}</p>
      </details>
      <div class="mg-grid">
        ${TYPES.map(t => `
          <article class="mg-card">
            <header><h3>${J(t).name}</h3><span class="mg-price">${t.price}</span></header>
            <p class="mg-how">${t.how}</p>
            <p class="mg-clamp"><b>When to clamp:</b> ${J(t).clamp}</p>
            <details class="why">
              <summary>How the reference works</summary>
              <p class="mg-ref"><b>The reference:</b> ${J(t).reference}</p>
              <p class="mg-phys">${t.physics}</p>
              <p class="mg-phys"><b>Repeatability:</b> ${J(t).repeat}.</p>
            </details>
            <details class="why">
              <summary>Pros, cons and who it suits</summary>
              <div class="mg-pc">
                <ul class="pros">${t.pros.map(p => `<li>${p}</li>`).join('')}</ul>
                <ul class="cons">${t.cons.map(p => `<li>${p}</li>`).join('')}</ul>
              </div>
              <p class="mg-who">${t.who}</p>
            </details>
          </article>`).join('')}
      </div>
      <h3 class="sec-h">Clamps and mounting matter more than the tension head</h3>
      <div class="mg-row">
        ${CLAMPS.map(c => `<div class="mg-mini"><span class="tag">${c.tag}</span><h4>${c.name}</h4><p>${c.body}</p></div>`).join('')}
      </div>
      <details class="why">
        <summary>Before you buy</summary>
        <ul class="mg-tips">${TIPS.map(t => `<li>${t}</li>`).join('')}</ul>
      </details>`;
  }

  return { html, TYPES, CLAMPS };
})();
