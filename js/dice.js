// ============================================================
// Bot / Dice Engine
// Parses [command] syntax in post content and renders results
// ============================================================

const Dice = (() => {

  // Roll a single die with N sides
  function rollDie(sides) {
    return Math.floor(Math.random() * sides) + 1;
  }

  // Parse and roll standard XdY notation (e.g. "2d6", "1d20", "4d6drop1")
  function rollDice(notation) {
    const match = notation.match(/^(\d+)d(\d+)(?:drop(\d+))?$/i);
    if (!match) return null;

    const count = parseInt(match[1]);
    const sides = parseInt(match[2]);
    const dropLowest = match[3] ? parseInt(match[3]) : 0;

    if (count < 1 || count > 100 || sides < 2 || sides > 10000) return null;

    const rolls = Array.from({ length: count }, () => rollDie(sides));
    let kept = [...rolls].sort((a, b) => a - b);
    if (dropLowest > 0) kept = kept.slice(dropLowest);

    const total = kept.reduce((a, b) => a + b, 0);
    return { notation, rolls, kept, total, sides, count, dropLowest };
  }

  // Roll gacha from item pool
  function rollGacha(items) {
    if (!items || !items.length) return null;
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const item of items) {
      rand -= item.weight;
      if (rand <= 0) return item;
    }
    return items[items.length - 1];
  }

  // Parse combat roll using character stats
  function rollCombat(attackerStats, defenderStats) {
    if (!attackerStats || !defenderStats) return null;

    const initiative = rollDie(20) + Math.floor((attackerStats.dex - 10) / 2);
    const attackRoll = rollDie(20);
    const strMod = Math.floor((attackerStats.str - 10) / 2);
    const attackTotal = attackRoll + strMod;

    const defense = 10 + Math.floor((defenderStats.dex - 10) / 2);
    const hit = attackTotal >= defense;

    let damage = 0;
    let damageRolls = [];
    if (hit) {
      const isCrit = attackRoll >= 20;
      const diceCount = isCrit ? 2 : 1;
      damageRolls = Array.from({ length: diceCount }, () => rollDie(6));
      damage = damageRolls.reduce((a, b) => a + b, 0) + Math.max(0, strMod);
    }

    return { initiative, attackRoll, attackTotal, defense, hit, damage, damageRolls, isCrit: attackRoll >= 20 };
  }

  // ── BOT COMMAND REGISTRY ──────────────────────────────────

  let _botConfigs = [];

  async function loadBotConfigs() {
    try {
      _botConfigs = await API.getBotConfigs();
    } catch (e) {
      console.warn('Failed to load bot configs:', e);
    }
  }

  // Parse all [commands] in a post content string
  // Returns array of { command, result, html } objects
  function parseCommands(content, senderStats = null) {
    const results = [];
    const regex = /\[([^\]]+)\]/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const cmd = match[1].trim();
      const result = executeCommand(cmd, senderStats);
      if (result) results.push({ command: cmd, ...result });
    }

    return results;
  }

  function executeCommand(cmd, senderStats = null) {
    // Standard dice: 1d10, 2d6, 4d6drop1, etc.
    if (/^\d+d\d+(drop\d+)?$/i.test(cmd)) {
      const result = rollDice(cmd);
      if (!result) return null;
      return {
        type: 'dice',
        result,
        html: renderDiceResult(result),
      };
    }

    // Look up bot config commands
    const botCfg = _botConfigs.find(c => c.command === cmd && c.is_active);
    if (!botCfg) return null;

    if (botCfg.type === 'dice') {
      const notation = `${botCfg.config.count || 1}d${botCfg.config.sides || 6}`;
      const result = rollDice(notation);
      if (!result) return null;
      return { type: 'dice', result, html: renderDiceResult(result) };
    }

    if (botCfg.type === 'combat') {
      return {
        type: 'combat',
        result: { note: '전투 명령어 — 상대 태그 필요' },
        html: `<div class="bot-result bot-combat"><span class="bot-icon">⚔️</span> 전투 명령어는 상대방을 멘션하여 사용하세요.</div>`,
      };
    }

    return null;
  }

  function renderDiceResult(result) {
    const rollsHtml = result.rolls
      .map((r, i) => {
        const dropped = result.dropLowest > 0 && i < result.dropLowest;
        return `<span class="die${dropped ? ' dropped' : ''}">${r}</span>`;
      })
      .join('');
    return `
      <div class="bot-result bot-dice">
        <span class="bot-icon">🎲</span>
        <span class="dice-notation">${result.notation}</span>
        <span class="dice-rolls">${rollsHtml}</span>
        <span class="dice-total">= <strong>${result.total}</strong></span>
      </div>`;
  }

  // Render bot results into post content HTML
  function renderPostContent(content) {
    if (!content) return '';

    // Escape HTML first
    const escaped = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    // Convert @mentions to links
    const withMentions = escaped.replace(/@([a-zA-Z0-9_]+)/g,
      '<a href="#" class="mention" data-handle="$1">@$1</a>');

    // Convert newlines
    const withNewlines = withMentions.replace(/\n/g, '<br>');

    return withNewlines;
  }

  return { rollDie, rollDice, rollGacha, rollCombat, loadBotConfigs, parseCommands, executeCommand, renderPostContent };
})();
