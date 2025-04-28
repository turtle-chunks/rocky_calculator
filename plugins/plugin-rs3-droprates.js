function osrs_drop_rate_calculator() {
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

  const combined_input_trial = {
    type: jsPsychSurveyHtmlForm,
    html: `
      <div class="instruction-dialog">
        <h3>OSRS Drop Rate Calculator</h3>
        <div class="item-entry">
          <strong>Overall Kills:</strong>
          <input name="kills" type="number" step="1" min="1" placeholder="e.g. 1000" required>
        </div>
        ${sortedItems.map(item => `
          <div class="item-entry">
            <span class="item-label">
              <img class="item-icon" src="imgs/${item}.png" alt="${item}">
              ${item}:
            </span>
            <input name="${item}" type="number" step="1" min="0" placeholder="0">
          </div>
        `).join('')}
      </div>
    `,
    button_label: 'Submit'
  };

  const calculate_trial = {
    type: jsPsychCallFunction,
    func: () => {
      const raw = jsPsych.data.get().last(1).values()[0].response;
      const resp = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const kills = parseFloat(resp.kills);

      if (isNaN(kills) || kills <= 0) {
        calculationResults = { error: 'Please enter a valid positive number of kills.' };
        return;
      }

      const results = {};
      for (const item of Object.keys(averageDropRates)) {
        const count = parseFloat(resp[item]) || 0;
        const dropRate = count / kills;
        const perDrop = count > 0 ? kills / count : Infinity;
        const relative = dropRate / averageDropRates[item];
        results[item] = { count, dropRate, perDrop, relative };
      }
      calculationResults = results;
    }
  };

  const feedback_trial = {
    type: jsPsychHtmlKeyboardResponse,
    choices: [],
    stimulus: () => {
      if (calculationResults.error) {
        return `<div class="instruction-dialog"><p>${calculationResults.error}</p><p>Press F5 to restart.</p></div>`;
      }

      let table = `<table class="results-table">
        <tr>
          <th>Item</th>
          <th>Your Drop Rate</th>
          <th>Kills per Drop</th>
          <th>Relative Rate</th>
          <th>Comparison</th>
        </tr>`;
      for (const item of sortedItems) {
        const stats = calculationResults[item];
        const dr = stats.dropRate.toFixed(4);
        const kd = stats.perDrop === Infinity ? '∞' : stats.perDrop.toFixed(2);
        const rr = stats.relative.toFixed(4);
        let cmp = '–';
        if (stats.relative > 1) cmp = `${((stats.relative - 1) * 100).toFixed(1)}% ↑`;
        else if (stats.relative < 1) cmp = `${((1 - stats.relative) * 100).toFixed(1)}% ↓`;
        table += `
          <tr>
            <td><span class="item-label"><img class="item-icon" src="imgs/${item}.png" alt="${item}"> ${item}</span></td>
            <td>${dr}</td>
            <td>${kd}</td>
            <td>${rr}</td>
            <td>${cmp}</td>
          </tr>`;
      }
      table += `</table>`;

      return `<div class="instruction-dialog">
        <h3>Your Results</h3>
        ${table}
        <p><strong>Press F5 to restart or choose again.</strong></p>
      </div>`;
    }
  };

  return [combined_input_trial, calculate_trial, feedback_trial];
}
