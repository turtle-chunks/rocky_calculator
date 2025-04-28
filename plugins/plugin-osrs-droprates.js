// osrs_drop_rate_calculator.js

(function(window, jsPsych) {
  /**
   * Injects all required CSS once, then builds and runs
   * the OSRS drop‐rate calculator timeline.
   *
   * @param {object} jsPsychInstance - the jsPsych instance
   * @param {HTMLElement} display_element - container for rendering
   */
  function osrsDropRateCalculator(jsPsychInstance, display_element) {
    // 1) Inject CSS once
    if (!document.getElementById('osrs-style')) {
      const style = document.createElement('style');
      style.id = 'osrs-style';
      style.innerHTML = `
        html, body {
          margin: 0; padding: 0; height: 100%;
        }
        body {
          background: url('imgs/old-school-runescape-map.jpg') no-repeat center center fixed;
          background-size: cover;
        }
        #jspsych-target {
          position: relative; height: 100%;
        }
        .instruction-dialog {
          background-color: rgba(255,255,255,0.9);
          padding: 20px; border-radius: 10px;
          max-width: 800px; margin: 40px auto;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        .side-image { width:200px; height:auto; }
        .left-image { transform: scaleX(-1); margin-right:20px; }
        .right-image { margin-left:20px; }
        .instruction-content {
          font-size:1.1em; text-align:center; color:#000;
        }
        .instruction-dialog p { margin:0.8em 0; }
        .instruction-dialog input,
        .instruction-dialog select {
          padding:5px; font-size:1em; margin-top:5px;
          width:100%; max-width:200px;
        }
        .item-entry {
          display:flex; align-items:center;
          justify-content:center; gap:10px;
          margin-bottom:10px;
        }
        .item-label {
          display:flex; align-items:center;
          gap:6px; min-width:200px;
          text-align:right; justify-content:flex-end;
        }
        .item-icon {
          width:32px; height:32px; object-fit:contain;
        }
        .results-table {
          width:100%; border-collapse:collapse; margin-top:1em;
        }
        .results-table th,
        .results-table td {
          border:1px solid #bbb; padding:6px; font-size:0.95em;
        }
        .results-table th { background:#eee; }
      `;
      document.head.appendChild(style);
    }

    // 2) Dialog helper
    const createInstructionDialog = content => `
      <div style="display:flex; align-items:center; justify-content:center;">
        <img class="side-image left-image" src="imgs/darkwizard.png" alt="Dark Wizard">
        <div class="instruction-dialog"><div class="instruction-content">
          ${content}
        </div></div>
        <img class="side-image right-image" src="imgs/darkwizard.png" alt="Dark Wizard">
      </div>
    `;

    // 3) Data
    const averageDropRates = {
      "Air rune": 0.515606691,
      "Beginner clue": 0.02,
      "Blood rune": 0.03125,
      "Body rune": 0.515606691,
      "Bones": 1,
      "Chaos rune": 0.234411627,
      "Coins": 1.51552791,
      "Cosmic rune": 0.015625,
      "Earth rune": 1.640606691,
      "Fire rune": 0.515606691,
      "Fire Talisman": 0.0078125,
      "Law rune": 0.0234375,
      "Mind rune": 0.515606691,
      "Staff": 0.0625,
      "Water rune": 0.515606691,
      "Water Talisman": 0.0078125,
      "Wizard hat (black)": 0.007575758,
      "Wizard robe (black)": 0.023435669
    };
    const sortedItems = Object.keys(averageDropRates).sort();
    let calculationResults;

    // 4) Trials
    const combined_input_trial = {
      type: jsPsychInstance.plugins['survey-html-form'].plugin,
      html: createInstructionDialog(`
        <p><strong>Welcome to the Kill & Drop Rate Calculator.</strong></p>
        <p>Enter your overall kills and how many of each item you obtained.</p>
        <div class="item-entry">
          <strong>Overall Kills:</strong>
          <input name="kills" type="number" step="1" min="1" placeholder="e.g. 1000" required>
        </div>
        ${sortedItems.map(item => `
          <div class="item-entry">
            <span class="item-label">
              <img class="item-icon" src="imgs/${item}.png" alt="${item}"> ${item}:
            </span>
            <input name="${item}" type="number" step="1" min="0" placeholder="0">
          </div>
        `).join('')}
      `),
      button_label: 'Submit'
    };

    const calculate_trial = {
      type: jsPsychInstance.plugins['call-function'].plugin,
      func: () => {
        const raw = jsPsychInstance.data.get().last(1).values()[0].response;
        const resp = (typeof raw==='string') ? JSON.parse(raw) : raw;
        const kills = parseFloat(resp.kills);
        if (isNaN(kills) || kills <= 0) {
          calculationResults = { error: 'Please enter a valid positive number of kills.' };
          return;
        }
        calculationResults = {};
        sortedItems.forEach(item => {
          const c = parseFloat(resp[item])||0;
          const dr = c/kills;
          const pd = c>0 ? kills/c : Infinity;
          const rel = dr/averageDropRates[item];
          calculationResults[item] = { count:c, dropRate:dr, perDrop:pd, relative:rel };
        });
      }
    };

    const feedback_trial = {
      type: jsPsychInstance.plugins['html-keyboard-response'].plugin,
      choices: [],
      stimulus: () => {
        if (calculationResults.error) {
          return createInstructionDialog(`
            <p>${calculationResults.error}</p>
            <p><strong>To restart, press F5.</strong></p>
          `);
        }
        let table = `<table class="results-table">
          <tr><th>Item</th><th>Drop Rate</th><th>Kills/Item</th><th>Relative</th><th>Δ%</th></tr>`;
        sortedItems.forEach(item => {
          const s = calculationResults[item];
          const dr = s.dropRate.toFixed(4);
          const kd = s.perDrop===Infinity?'∞':s.perDrop.toFixed(2);
          const rr = s.relative.toFixed(4);
          let cmp='–';
          if(s.relative>1) cmp=`${((s.relative-1)*100).toFixed(1)}% ↑`;
          else if(s.relative<1) cmp=`${((1-s.relative)*100).toFixed(1)}% ↓`;
          table+=`
            <tr>
              <td><span class="item-label">
                    <img class="item-icon" src="imgs/${item}.png" alt="${item}"> ${item}
                  </span></td>
              <td>${dr}</td><td>${kd}</td><td>${rr}</td><td>${cmp}</td>
            </tr>`;
        });
        table+=`</table>`;
        return createInstructionDialog(`
          <p><strong>Here are your results:</strong></p>
          ${table}
          <p><strong>To calculate again, press F5.</strong></p>
        `);
      }
    };

    // 5) Run timeline
    jsPsychInstance.run(
      [ combined_input_trial, calculate_trial, feedback_trial ],
      { display_element }
    );
  }

  // Expose globally
  window.osrsDropRateCalculator = osrsDropRateCalculator;

})(window, jsPsych);
